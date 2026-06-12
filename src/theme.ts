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
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

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
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

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
    path.setAttribute("d", `${d} Z`);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      svg.remove();
      onDone();
    }
  };
  requestAnimationFrame(frame);
}

let animating = false;

/**
 * Flip the theme with the wavy sweep. No-op while a sweep is running.
 * `onApply` fires the moment the new theme hits the DOM (icon swap point).
 */
export function toggleTheme(onApply: (dark: boolean) => void): void {
  if (animating) return;
  const next = !isDark();
  const applyNext = () => {
    apply(next, true);
    onApply(next);
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    applyNext();
    return;
  }

  if (typeof document.startViewTransition !== "function") {
    animating = true;
    curtainWipe(next, applyNext, () => {
      animating = false;
    });
    return;
  }

  animating = true;
  const vt = document.startViewTransition(applyNext);
  vt.ready
    .then(() => {
      const anim = document.documentElement.animate(
        { clipPath: waveFrames() },
        {
          duration: 1100,
          easing: "linear", // easing is baked into the frames
          pseudoElement: "::view-transition-new(root)",
        },
      );
      return anim.finished;
    })
    .catch(() => {})
    .then(() => {
      animating = false;
    });
}
