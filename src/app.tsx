import { useEffect, useRef, useState } from "preact/hooks";

const clients = [
  // h = render height (px), tuned per logo aspect ratio so all
  // wordmarks carry roughly the same visual weight in the wall.
  {
    name: "Wolters Kluwer",
    logo: "/img/logos/wolters-kluwer.svg",
    h: 28,
    note: "Designing tax & accounting software used by accountants all over Sweden.",
  },
  {
    name: "iCore Solutions",
    logo: "/img/logos/icore.svg",
    h: 22,
    note: "Wore two hats as Product Owner & UX Designer for their integration platform.",
  },
  {
    name: "Polestar",
    logo: "/img/logos/polestar.svg",
    h: 24,
    darkLogo: true,
    note: "Shaped digital experiences for the electric performance car brand.",
  },
  {
    name: "SKF Group",
    logo: "/img/logos/skf.svg",
    h: 19,
    note: "Built digital tools for the world's largest bearing manufacturer.",
  },
  {
    name: "Telia",
    logo: "/img/logos/telia.svg",
    h: 30,
    note: "Two years improving consumer services for Sweden's biggest telco.",
  },
  {
    name: "Collector Bank",
    logo: "/img/logos/collector.svg",
    h: 15,
    darkLogo: true,
    note: "Designed banking products with focus on simplicity and trust.",
  },
  {
    name: "Bonfire Development",
    logo: "/img/logos/bonfire-wordmark.svg",
    h: 36,
    darkLogo: true,
    note: "My home base since 2021 — a small senior consultancy crew.",
  },
  {
    name: "Knowit",
    logo: "/img/logos/knowit.svg",
    h: 24,
    darkLogo: true,
    note: "Where it all started in 2017 — four years of consulting across industries.",
  },
];

// wavy clip-path keyframes sweeping the viewport diagonally from top-right
// to bottom-left — used with the View Transitions API so the OLD theme stays
// visible (snapshot) while the NEW theme is gradually revealed under the edge
function waveFrames(): string[] {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const L = Math.hypot(w, h);
  const pad = 150;
  // rotated basis: e1 points from center to the top-right corner, e2 = perp
  const e1 = { x: w / L, y: -h / L };
  const e2 = { x: h / L, y: w / L };
  const cx = w / 2;
  const cy = h / 2;
  const pt = (a: number, b: number) =>
    `${(cx + e1.x * a + e2.x * b).toFixed(1)}px ${(cy + e1.y * a + e2.y * b).toFixed(1)}px`;

  const F = 40; // keyframes
  const N = 24; // wave samples along the edge
  const amp = Math.min(110, L * 0.12);
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const frames: string[] = [];
  for (let f = 0; f < F; f++) {
    const t = f / (F - 1);
    const e = ease(t);
    const edgeA = L / 2 + pad + amp - e * (L + 2 * (pad + amp));
    const env = Math.sin(Math.PI * t) * amp; // straight edge at both ends
    const phase = t * Math.PI * 3; // wave flows while sweeping
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const b = -L / 2 - pad + ((L + 2 * pad) / N) * i;
      const a = edgeA + Math.sin((b / L) * Math.PI * 2.2 + phase) * env;
      pts.push(pt(a, b));
    }
    // close the polygon far beyond the top-right corner (constant vertex
    // count across frames keeps the polygons interpolation-safe)
    pts.push(pt(L, L / 2 + pad));
    pts.push(pt(L, -L / 2 - pad));
    frames.push(`polygon(${pts.join(",")})`);
  }
  return frames;
}

// fallback for browsers without view transitions: solid curtain in the OLD
// theme color sweeps out after the theme flips beneath it
function curtainWipe(nextDark: boolean, applyTheme: () => void, onDone: () => void) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const L = Math.hypot(w, h);
  const pad = 200;
  // rotate the sweep axis so +x points at the top-right corner
  const deg = (-Math.atan2(h, w) * 180) / Math.PI;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    zIndex: "999",
    pointerEvents: "none",
  });
  const g = document.createElementNS(ns, "g");
  g.setAttribute(
    "transform",
    `translate(${w / 2} ${h / 2}) rotate(${deg}) translate(${-L / 2} ${-L / 2})`
  );
  const path = document.createElementNS(ns, "path");
  // curtain wears the OLD theme bg — must match --bg in both themes
  path.setAttribute("fill", nextDark ? "#fcfcfc" : "#121211");
  // full cover before the theme flips so there is no flash
  path.setAttribute(
    "d",
    `M ${-pad} ${-pad} L ${-pad} ${L + pad} L ${L + pad} ${L + pad} L ${L + pad} ${-pad} Z`
  );
  g.appendChild(path);
  svg.appendChild(g);
  document.body.appendChild(svg);
  applyTheme(); // same task as the append — painted together, curtain on top

  const amp = Math.min(110, L * 0.12);
  const dur = 1000;
  const start = performance.now();
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    const e = ease(t);
    // edge retreats from beyond the top-right (+x) to beyond bottom-left (-x)
    const base = L + pad + amp - e * (L + 2 * (pad + amp));
    const env = Math.sin(Math.PI * t) * amp; // straight edge at both ends
    const phase = t * Math.PI * 3; // wave flows while sweeping
    let d = `M ${-pad} ${-pad} L ${-pad} ${L + pad}`;
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const y = L + pad - ((L + 2 * pad) / N) * i;
      const x = base + Math.sin((y / L) * Math.PI * 2.2 + phase) * env;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    path.setAttribute("d", d + " Z");
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      svg.remove();
      onDone();
    }
  };
  requestAnimationFrame(frame);
}

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === "dark"
  );
  const animating = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        document.documentElement.dataset.theme = e.matches ? "dark" : "";
        setDark(e.matches);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const apply = (next: boolean) => {
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "";
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const toggle = () => {
    if (animating.current) return;
    const next = !dark;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      apply(next);
      return;
    }
    const startVT = (
      document as Document & {
        startViewTransition?: (cb: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      }
    ).startViewTransition?.bind(document);
    if (!startVT) {
      animating.current = true;
      curtainWipe(
        next,
        () => apply(next),
        () => {
          animating.current = false;
        }
      );
      return;
    }
    animating.current = true;
    const vt = startVT(() => apply(next));
    vt.ready
      .then(() => {
        const anim = document.documentElement.animate(
          { clipPath: waveFrames() },
          {
            duration: 1100,
            easing: "linear", // easing is baked into the frames
            pseudoElement: "::view-transition-new(root)",
          }
        );
        return anim.finished;
      })
      .catch(() => {})
      .then(() => {
        animating.current = false;
      });
  };

  return (
    <button
      class="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 class="section-label">
      <span>{children}</span>
    </h3>
  );
}

type Client = (typeof clients)[number];

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLQuoteElement>(null);
  const [sheet, setSheet] = useState<Client | null>(null);
  const [sheetClosing, setSheetClosing] = useState(false);

  // mobile only — desktop has the hover bubble
  const onLogoClick = (c: Client) => {
    if (!window.matchMedia("(min-width: 36.25rem)").matches) setSheet(c);
  };

  const closeSheet = () => {
    setSheetClosing(true);
    setTimeout(() => {
      setSheet(null);
      setSheetClosing(false);
    }, 240);
  };

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
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
    const p = box.querySelector("p")!;
    const fit = () => {
      // shrink font until the text fits the box
      let fs = 26;
      p.style.fontSize = `${fs}px`;
      while (fs > 11 && box.scrollHeight > box.clientHeight) {
        fs -= 1;
        p.style.fontSize = `${fs}px`;
      }
    };
    const move = (ev: PointerEvent) => {
      box.style.width = `${r.width + (ev.clientX - startX) * dirX}px`;
      box.style.height = `${r.height + (ev.clientY - startY) * dirY}px`;
      fit();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const cleanups: Array<() => void> = [];
    import("./anim").then((m) => cleanups.push(m.initAnim()));
    // three.js is the heaviest asset — defer past first paint
    const idle =
      "requestIdleCallback" in window
        ? (cb: () => void) => requestIdleCallback(cb)
        : (cb: () => void) => setTimeout(cb, 400);
    idle(() => {
      if (canvasRef.current) {
        import("./scene").then((m) => cleanups.push(m.initScene(canvasRef.current!)));
      }
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div class="page">
      <canvas class="bg-canvas" ref={canvasRef} aria-hidden="true" />
      <ThemeToggle />

      <header class="container header">
        <div class="portrait" data-intro>
          <img src="/img/avatar.webp" alt="Wictor Stenseke" width="160" height="160" />
        </div>
        <div>
          <h1 class="txt-xxl hero-title">
            <span class="name-line"><span class="name-line-inner">I'm a UX Designer</span></span>
            <span class="name-line"><span class="name-line-inner">with 9 years of experience.</span></span>
          </h1>
          <h2 class="txt-xl hero-sub" data-intro>
            I help teams bridge users and product<br class="wide-only" /> through
            research, prototyping &amp; craft
          </h2>
        </div>
      </header>

      <section class="container intro-rest" data-intro>
        <SectionLabel>I've worked with.</SectionLabel>
        <div class="logo-wall">
          {clients.map((c) => (
            <div
              class={`logo${c.darkLogo ? " logo--dark" : ""}`}
              key={c.name}
              tabIndex={0}
              onClick={() => onLogoClick(c)}
            >
              <div class="logo-img">
                <img src={c.logo} alt={`${c.name} logo`} style={{ height: `${c.h}px` }} loading="lazy" />
              </div>
              <div class="bubble" role="tooltip">{c.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section class="container" data-scroll-reveal>
        <div class="statement-wrap">
          <span class="statement-label" aria-hidden="true">design-philosophy</span>
          <blockquote class="statement-box" ref={boxRef}>
            <p>
              From discovery research to polished UI, I cover the full spectrum
              of the product design process.
            </p>
          </blockquote>
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <button
              key={corner}
              class={`statement-handle statement-handle--${corner}`}
              data-corner={corner}
              onPointerDown={onHandleDown}
              aria-label="Resize quote box"
            />
          ))}
        </div>
      </section>

      <section class="container" data-scroll-reveal>
        <SectionLabel>Gothenburg based. Remote friendly.</SectionLabel>
        <p class="cta-text">
          I genuinely like connecting with new people.<br /> Reach out, I'll
          reply.
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

      <footer class="container footer txt-sm" data-scroll-reveal>
        <div>
          <p class="footer-line">&copy;2026 — wictorstenseke.se</p>
          <p>Designed by hand in Gothenburg, Sweden</p>
        </div>
      </footer>

      {sheet && (
        <div class={`sheet-backdrop${sheetClosing ? " sheet-closing" : ""}`} onClick={closeSheet}>
          <div
            class="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={sheet.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              class="sheet-close"
              onClick={closeSheet}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
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
