// Theme module — owns preference storage, DOM application and the wavy
// theme-swap transition (View Transitions API with an SVG curtain fallback).
// Callers only see isDark / toggleTheme / onSystemThemeChange.

// localStorage can throw in some private/lockdown modes — never let the
// theme system take the page down over a preference read.
function readStored(): string | null {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function store(value: string) {
  try {
    localStorage.setItem("theme", value);
  } catch {
    /* preference simply won't persist */
  }
}

export function isDark(): boolean {
  return document.documentElement.dataset.theme === "dark";
}

function apply(dark: boolean, persist: boolean) {
  document.documentElement.dataset.theme = dark ? "dark" : "";
  if (persist) store(dark ? "dark" : "light");
}

/** follow OS theme while the user hasn't picked one explicitly */
export function onSystemThemeChange(cb: (dark: boolean) => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = (e: MediaQueryListEvent) => {
    if (!readStored()) {
      apply(e.matches, false);
      cb(e.matches);
    }
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

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
  // ease-out: the sweep must MOVE the instant it starts — a slow-attack ease
  // here reads as input lag, not elegance
  const ease = (t: number) => 1 - (1 - t) ** 3;

  const frames: string[] = [];
  for (let f = 0; f < F; f++) {
    const t = f / (F - 1);
    const e = ease(t);
    // edge starts exactly at the corner (env is 0 at t=0, so no overshoot)
    // — any lead-in past the corner is invisible dead time after the click
    const edgeA = L / 2 - e * (L + pad + amp);
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
function curtainWipe(nextDark: boolean, applyTheme: () => void): () => void {
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
    `translate(${w / 2} ${h / 2}) rotate(${deg}) translate(${-L / 2} ${-L / 2})`,
  );
  const path = document.createElementNS(ns, "path");
  // curtain wears the OLD theme bg — must match --bg in both themes
  path.setAttribute("fill", nextDark ? "#fcfcfc" : "#121211");
  // full cover before the theme flips so there is no flash
  path.setAttribute(
    "d",
    `M ${-pad} ${-pad} L ${-pad} ${L + pad} L ${L + pad} ${L + pad} L ${L + pad} ${-pad} Z`,
  );
  g.appendChild(path);
  svg.appendChild(g);
  document.body.appendChild(svg);
  applyTheme(); // same task as the append — painted together, curtain on top

  const amp = Math.min(110, L * 0.12);
  const dur = 1000;
  const start = performance.now();
  // ease-out to match the view-transition sweep: instant attack, soft landing
  const ease = (t: number) => 1 - (1 - t) ** 3;

  let cancelled = false;

  const frame = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - start) / dur);
    const e = ease(t);
    // edge retreats from the top-right corner (env is 0 at t=0, no overshoot)
    // to beyond bottom-left — no invisible lead-in after the click
    const base = L - e * (L + pad + amp);
    const env = Math.sin(Math.PI * t) * amp; // straight edge at both ends
    const phase = t * Math.PI * 3; // wave flows while sweeping
    let d = `M ${-pad} ${-pad} L ${-pad} ${L + pad}`;
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const y = L + pad - ((L + 2 * pad) / N) * i;
      const x = base + Math.sin((y / L) * Math.PI * 2.2 + phase) * env;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    path.setAttribute("d", `${d} Z`);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      svg.remove();
    }
  };
  requestAnimationFrame(frame);

  // interrupt hook: dropping the curtain reveals the already-applied new
  // theme everywhere — the instant-complete a restarted toggle needs
  return () => {
    cancelled = true;
    svg.remove();
  };
}

// instant-completes a running curtain wipe when the user re-toggles mid-sweep
let cancelCurtain: (() => void) | null = null;

/**
 * Flip the theme with the wavy sweep. Re-toggling mid-sweep restarts: the
 * running sweep instant-completes and a fresh wave launches from the corner.
 * `onApply` fires synchronously on every toggle so the control gives
 * instant feedback — the page theme itself flips inside the transition.
 */
export function toggleTheme(onApply: (dark: boolean) => void): void {
  const next = !isDark();
  onApply(next);
  const applyNext = () => {
    apply(next, true);
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    applyNext();
    return;
  }

  if (typeof document.startViewTransition !== "function") {
    cancelCurtain?.();
    cancelCurtain = curtainWipe(next, applyNext);
    return;
  }

  // a still-running transition is skipped by the browser here: its callback
  // has already applied that theme, so the page pops to it and the new wave
  // sweeps from there — the skipped ready/finished rejections land in catch
  const vt = document.startViewTransition(applyNext);
  vt.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: waveFrames() },
        {
          duration: 1100,
          easing: "linear", // easing is baked into the frames
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
}
