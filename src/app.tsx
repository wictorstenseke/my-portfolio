import { useEffect, useRef, useState } from "preact/hooks";
import { type Client, clients } from "./clients";
import { isDark, onSystemThemeChange, toggleTheme } from "./theme";

function ThemeToggle() {
  const [dark, setDark] = useState(isDark);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => onSystemThemeChange(setDark), []);

  // while the theme sweep runs, real clicks hit-test to <html> instead of
  // the button (view-transition snapshots cover the live page), so catch
  // clicks inside the button's rect at the document level to allow
  // rapid re-toggling mid-animation
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const btn = btnRef.current;
      if (!btn || btn.contains(e.target as Node)) return; // normal click path
      const r = btn.getBoundingClientRect();
      if (
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
      ) {
        toggleTheme(setDark);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <button
      type="button"
      ref={btnRef}
      class="theme-toggle"
      onClick={() => toggleTheme(setDark)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 class="section-label">
      <span>{children}</span>
    </h2>
  );
}

// shrink font until the text fits the box
function fitText(box: HTMLElement) {
  const p = box.querySelector("p");
  if (!p) return;
  let fs = 26;
  p.style.fontSize = `${fs}px`;
  while (fs > 11 && box.scrollHeight > box.clientHeight) {
    fs -= 1;
    p.style.fontSize = `${fs}px`;
  }
}

const noteId = (c: Client) => `logo-note-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLQuoteElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [sheet, setSheet] = useState<Client | null>(null);
  const [sheetClosing, setSheetClosing] = useState(false);
  const sheetTimer = useRef<number>();

  // mobile only — desktop has the hover bubble
  const onLogoClick = (c: Client, opener: HTMLElement) => {
    if (!window.matchMedia("(min-width: 36.25rem)").matches) {
      openerRef.current = opener;
      setSheet(c);
    }
  };

  const closeSheet = (viaKeyboard = false) => {
    if (sheetTimer.current !== undefined) return; // already closing
    setSheetClosing(true);
    sheetTimer.current = window.setTimeout(() => {
      sheetTimer.current = undefined;
      setSheet(null);
      setSheetClosing(false);
      // hand focus back to the card that opened the sheet
      const opener = openerRef.current;
      if (opener) {
        if (!viaKeyboard) {
          // mobile browsers treat this scripted .focus() as :focus-visible and
          // paint a ring after a plain tap — mark the card so CSS can mute it
          opener.setAttribute("data-quiet-focus", "");
          opener.addEventListener("blur", () => opener.removeAttribute("data-quiet-focus"), {
            once: true,
          });
        }
        opener.focus();
      }
      openerRef.current = null;
    }, 240);
  };

  // never let the close timer fire into an unmounted component
  useEffect(() => () => window.clearTimeout(sheetTimer.current), []);

  useEffect(() => {
    if (!sheet) return;
    // move focus into the dialog
    sheetRef.current?.querySelector<HTMLElement>(".sheet-close")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSheet(true);
        return;
      }
      // keep Tab inside the dialog while it is open
      if (e.key === "Tab") {
        const focusables = sheetRef.current?.querySelectorAll<HTMLElement>("button, a[href]");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    // lock background scroll while the sheet is open. overflow:hidden keeps
    // layout and scroll position intact (no jump, no resize event for the
    // canvas); touch panning behind the sheet is already blocked by
    // touch-action:none on the full-viewport backdrop
    const root = document.documentElement;
    const body = document.body;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = "";
      body.style.overflow = "";
    };
  }, [sheet]);

  // custom corner-drag resize — native `resize` forces overflow clipping
  // and has a tiny unstylable grip
  const onHandleDown = (e: PointerEvent) => {
    const box = boxRef.current;
    if (!box) return;
    e.preventDefault();
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    const corner = handle.dataset.corner ?? "br";
    // box is centered, so edges follow the cursor at 2x width delta;
    // left/top corners drag outward in the negative direction
    const dirX = corner.includes("l") ? -2 : 2;
    const dirY = corner.includes("t") ? -1 : 1;
    const startX = e.clientX;
    const startY = e.clientY;
    const r = box.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      box.style.width = `${r.width + (ev.clientX - startX) * dirX}px`;
      box.style.height = `${r.height + (ev.clientY - startY) * dirY}px`;
      fitText(box);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // keyboard equivalent of the corner drag (WCAG 2.1.1)
  const onHandleKey = (e: KeyboardEvent) => {
    const box = boxRef.current;
    if (!box) return;
    const step = e.shiftKey ? 24 : 8;
    let dw = 0;
    let dh = 0;
    if (e.key === "ArrowLeft") dw = -step;
    else if (e.key === "ArrowRight") dw = step;
    else if (e.key === "ArrowUp") dh = -step;
    else if (e.key === "ArrowDown") dh = step;
    else return;
    e.preventDefault();
    const r = box.getBoundingClientRect();
    box.style.width = `${r.width + dw}px`;
    box.style.height = `${r.height + dh}px`;
    fitText(box);
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];
    // decorative chunks — a failed load must never break the page
    import("./anim")
      .then((m) => {
        if (disposed) return;
        cleanups.push(m.initAnim());
      })
      .catch(() => {});
    // the canvas scene is the heaviest asset — defer past first paint
    const idle =
      "requestIdleCallback" in window
        ? (cb: () => void) => requestIdleCallback(cb)
        : (cb: () => void) => setTimeout(cb, 400);
    idle(() => {
      if (disposed || !canvasRef.current) return;
      import("./scene")
        .then((m) => {
          if (disposed || !canvasRef.current) return;
          cleanups.push(m.initScene(canvasRef.current));
        })
        .catch(() => {});
    });
    return () => {
      disposed = true;
      for (const fn of cleanups) fn();
    };
  }, []);

  return (
    <div class="page">
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: a canvas without tabindex is not focusable — purely decorative background */}
      <canvas class="bg-canvas" ref={canvasRef} aria-hidden="true" />

      <header class="container header">
        <ThemeToggle />
        <div class="portrait" data-intro>
          <img src="/img/avatar.webp" alt="Wictor Stenseke" width="160" height="160" />
        </div>
        <div>
          <h1 class="txt-xxl hero-title">
            <span class="name-line">
              <span class="name-line-inner">I'm a UX Designer</span>
            </span>
            <span class="name-line">
              <span class="name-line-inner">with 9 years of experience.</span>
            </span>
          </h1>
          <p class="txt-xl hero-sub" data-intro>
            I help teams bridge users and product
            <br class="wide-only" /> through research, prototyping &amp; craft
          </p>
        </div>
      </header>

      <main>
        <section class="container intro-rest" data-intro>
          <SectionLabel>I've worked with.</SectionLabel>
          <div class="logo-wall">
            {clients.map((c) => (
              <button
                type="button"
                class={`logo${c.darkLogo ? " logo--dark" : ""}`}
                key={c.name}
                aria-describedby={noteId(c)}
                onClick={(e) => onLogoClick(c, e.currentTarget as HTMLElement)}
              >
                <span class="logo-img">
                  <img
                    src={c.logo}
                    alt={`${c.name} logo`}
                    style={{ height: `${c.h}px` }}
                    loading="lazy"
                  />
                </span>
                <span class="bubble" role="tooltip" id={noteId(c)}>
                  {c.note}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section class="container" data-scroll-reveal>
          <div class="statement-wrap">
            <span class="statement-label" aria-hidden="true">
              design-philosophy
            </span>
            <blockquote class="statement-box" ref={boxRef}>
              <p>
                From discovery research to polished UI, I cover the full spectrum of the product
                design process.
              </p>
            </blockquote>
            {(["tl", "tr", "bl", "br"] as const).map((corner) => (
              <button
                type="button"
                key={corner}
                class={`statement-handle statement-handle--${corner}`}
                data-corner={corner}
                onPointerDown={onHandleDown}
                onKeyDown={onHandleKey}
                aria-label="Resize quote box (arrow keys)"
              />
            ))}
          </div>
        </section>

        <section class="container" data-scroll-reveal>
          <SectionLabel>Gothenburg based. Remote friendly.</SectionLabel>
          <p class="cta-text">
            I genuinely like connecting with new people.
            <br /> Reach out, I'll reply.
          </p>
          <div class="cta-row">
            <a
              class="btn"
              href="https://www.linkedin.com/in/wictorstenseke/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a class="btn btn--secondary" href="mailto:wictorstenseke@gmail.com">
              Email me
            </a>
          </div>
        </section>
      </main>

      <footer class="container footer txt-sm" data-scroll-reveal>
        <div>
          <p class="footer-line">&copy;2026 — wictorstenseke.se</p>
          <p>Designed by hand in Gothenburg, Sweden</p>
        </div>
      </footer>

      {sheet && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Escape and the Close button provide the keyboard path
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss convention
        <div
          class={`sheet-backdrop${sheetClosing ? " sheet-closing" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <div class="sheet" role="dialog" aria-modal="true" aria-label={sheet.name} ref={sheetRef}>
            {/* detail === 0 means the click came from Enter/Space, not a pointer */}
            <button
              type="button"
              class="sheet-close"
              onClick={(e) => closeSheet(e.detail === 0)}
              aria-label="Close"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
            <div class={`sheet-logo${sheet.darkLogo ? " sheet-logo--dark" : ""}`}>
              <img src={sheet.logo} alt="" style={{ height: `${sheet.h}px` }} />
            </div>
            <p class="sheet-note">{sheet.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
