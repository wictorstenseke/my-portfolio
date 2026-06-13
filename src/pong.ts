// Pong arena drawn as a figma frame. Two CPU paddles rally on their own;
// grabbing a paddle (or its edge handle) hands that side to the human until
// they let go. The CPU demo keeps no score — once a human takes a paddle, a
// run counter tracks their returns, and finished runs land in a localStorage
// highscore list rendered beneath the arena. Physics run on a fixed 120 Hz
// step with an accumulator and the frame renders an interpolated state, so
// ball speed is identical on 60/120/144 Hz displays.

const STEP = 1 / 120;
const MAX_FRAME = 1 / 20; // clamp post-jank deltas so physics never explode
const FIGMA_BLUE = "#0c8ce9";
const SPEEDUP = 1.13; // per paddle hit — the rally turns hot within a handful of bounces
const GRAB = 32; // px of forgiveness around a paddle column for direct grabs
const SCORES_KEY = "pong-scores";
const SCORES_MAX = 5;

type Side = {
  /** paddle center y */
  y: number;
  prevY: number;
  /** 'ai' plays; 'drag'/'keys' = human input; 'grace' = human idle, AI waits */
  mode: "ai" | "drag" | "keys" | "grace";
  /** seconds left until a quiet human side falls back to the CPU */
  graceT: number;
  /** pointer-to-paddle-center offset while dragging, so the grab doesn't jump */
  grabOffset: number;
  /** held arrow keys, polled in the fixed update for smooth movement */
  keyUp: boolean;
  keyDown: boolean;
  /** where the AI is headed (sampled with human-ish error per approach) */
  aiTarget: number;
  /** error refreshes once per approach, not per step — looks like commitment */
  aiArmed: boolean;
  handle: HTMLElement;
};

type Phase = { kind: "serve"; t: number } | { kind: "play" };

type ScoreEntry = { s: number; t: number };

export function initPong(opts: {
  canvas: HTMLCanvasElement;
  leftHandle: HTMLElement;
  rightHandle: HTMLElement;
  status: HTMLElement | null;
  scores: HTMLElement | null;
}): () => void {
  const { canvas, status } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---- geometry (recomputed on resize, physics in CSS px) ----
  let W = 0;
  let H = 0;
  let padW = 0;
  let padH = 0;
  let padX = 0; // left paddle face inset
  let ballR = 0;
  let serveSpeed = 0;
  let maxSpeed = 0;
  let handleHalf = 14; // half the handle's box, for centering it on the paddle

  const left: Side = side(opts.leftHandle);
  const right: Side = side(opts.rightHandle);
  function side(handle: HTMLElement): Side {
    return {
      y: 0,
      prevY: 0,
      mode: "ai",
      graceT: 0,
      grabOffset: 0,
      keyUp: false,
      keyDown: false,
      aiTarget: 0,
      aiArmed: false,
      handle,
    };
  }

  const ball = { x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0 };
  let phase: Phase = { kind: "serve", t: 0.9 };
  let serveDir = Math.random() < 0.5 ? -1 : 1;
  const trail: Array<{ x: number; y: number }> = [];

  // ---- theme ----
  const colors = { text: "#222", soft: "#636363", border: "#eae6e8", accent: "#ffcebd" };
  const readTheme = () => {
    const s = getComputedStyle(document.documentElement);
    colors.text = s.getPropertyValue("--text").trim() || colors.text;
    colors.soft = s.getPropertyValue("--text-soft").trim() || colors.soft;
    colors.border = s.getPropertyValue("--card-border").trim() || colors.border;
    colors.accent = s.getPropertyValue("--accent").trim() || colors.accent;
  };

  // ---- sizing ----
  // physW/physH: exact device-pixel size when the browser reports it
  // (devicePixelContentBox) — avoids the half-pixel blur of cssW * dpr
  const resize = (cssW: number, cssH: number, physW?: number, physH?: number) => {
    if (cssW <= 0 || cssH <= 0) return;
    const kx = W > 0 ? cssW / W : 0;
    const ky = H > 0 ? cssH / H : 0;
    W = cssW;
    H = cssH;
    canvas.width = physW ?? Math.round(cssW * dpr);
    canvas.height = physH ?? Math.round(cssH * dpr);
    ctx.setTransform(canvas.width / cssW, 0, 0, canvas.height / cssH, 0, 0);
    padW = Math.max(8, Math.round(W * 0.014));
    padH = H * 0.24;
    padX = Math.round(W * 0.05);
    ballR = Math.max(4, H * 0.018);
    serveSpeed = W * 0.45;
    maxSpeed = W * 1.1;
    handleHalf = opts.leftHandle.offsetHeight / 2 || 14;
    if (kx > 0) {
      // carry relative positions and velocity across the resize
      ball.x *= kx;
      ball.prevX *= kx;
      ball.vx *= kx;
      ball.y *= ky;
      ball.prevY *= ky;
      ball.vy *= ky;
      for (const s of [left, right]) {
        s.y *= ky;
        s.prevY *= ky;
        s.aiTarget *= ky;
      }
    } else {
      for (const s of [left, right]) {
        s.y = H / 2;
        s.prevY = H / 2;
        s.aiTarget = H / 2;
      }
      ball.x = W / 2;
      ball.y = H / 2;
      ball.prevX = ball.x;
      ball.prevY = ball.y;
    }
    render(1);
  };

  // ---- game flow ----
  const serve = () => {
    ball.x = W / 2;
    ball.y = H / 2;
    ball.prevX = ball.x;
    ball.prevY = ball.y;
    const angle = (Math.random() * 2 - 1) * ((28 * Math.PI) / 180);
    ball.vx = Math.cos(angle) * serveSpeed * serveDir;
    ball.vy = Math.sin(angle) * serveSpeed;
    trail.length = 0;
    left.aiArmed = false;
    right.aiArmed = false;
    phase = { kind: "serve", t: 0.9 };
  };

  const humanPlaying = () => left.mode !== "ai" || right.mode !== "ai";

  const announce = (msg: string) => {
    // only narrate while a human is in the game — demo points are noise
    if (status && humanPlaying()) status.textContent = msg;
  };

  // ---- highscore runs ----
  // the CPU demo keeps no score. A run starts when a human takes a paddle,
  // counts their returns, and registers on a miss (or when control lapses).
  let runCount = -1; // -1 = no run, demo mode

  // localStorage can throw in private/lockdown modes — scores just won't stick
  const readScores = (): ScoreEntry[] => {
    try {
      const arr: unknown = JSON.parse(localStorage.getItem(SCORES_KEY) ?? "[]");
      if (!Array.isArray(arr)) return [];
      return arr.filter(
        (e): e is ScoreEntry =>
          typeof e === "object" && e !== null && typeof (e as ScoreEntry).s === "number",
      );
    } catch {
      return [];
    }
  };

  const writeScores = (list: ScoreEntry[]) => {
    try {
      localStorage.setItem(SCORES_KEY, JSON.stringify(list));
    } catch {
      /* the list simply won't persist */
    }
  };

  // the list lives beneath the arena and only exists once something scored
  const renderScores = () => {
    const host = opts.scores;
    if (!host) return;
    const list = readScores();
    if (list.length === 0) return; // stays :empty → hidden
    const label = document.createElement("span");
    label.className = "pong-scores-label";
    label.textContent = "best rallies";
    const ol = document.createElement("ol");
    for (const e of list) {
      const li = document.createElement("li");
      const n = document.createElement("b");
      n.textContent = String(e.s);
      const d = document.createElement("span");
      d.textContent = e.t
        ? new Date(e.t).toLocaleDateString(undefined, { day: "numeric", month: "short" })
        : "";
      li.append(n, d);
      ol.appendChild(li);
    }
    host.replaceChildren(label, ol);
  };

  const registerRun = () => {
    if (runCount <= 0) return; // nothing returned, nothing to brag about
    const list = [...readScores(), { s: runCount, t: Date.now() }]
      .sort((a, b) => b.s - a.s)
      .slice(0, SCORES_MAX);
    writeScores(list);
    renderScores();
    const best = list[0]?.s ?? runCount;
    announce(`run over: ${runCount} return${runCount === 1 ? "" : "s"} — best ${best}`);
  };

  // ---- AI ----
  // gauss-ish in [-1, 1], biased to small misses
  const err = () => (Math.random() + Math.random() + Math.random()) / 1.5 - 1;

  const predictY = (faceX: number): number => {
    const t = (faceX - ball.x) / ball.vx;
    if (t <= 0) return H / 2;
    const span = H - 2 * ballR;
    let y = ball.y - ballR + ball.vy * t;
    y = ((y % (2 * span)) + 2 * span) % (2 * span);
    return (y <= span ? y : 2 * span - y) + ballR;
  };

  const stepAI = (s: Side, isLeft: boolean) => {
    const incoming = isLeft ? ball.vx < 0 : ball.vx > 0;
    if (phase.kind === "play" && incoming) {
      if (!s.aiArmed) {
        s.aiArmed = true;
        const faceX = isLeft ? padX + padW : W - padX - padW;
        // misjudge more when the rally is fast — that's where points come from
        const wobble = padH * (0.22 + 0.5 * (speed() / maxSpeed)) * err();
        s.aiTarget = predictY(faceX) + wobble;
      }
    } else {
      s.aiArmed = false;
      s.aiTarget = H / 2;
    }
    const maxV = H * 1.35 * STEP; // beatable: the paddle has a speed limit
    const d = s.aiTarget - s.y;
    if (Math.abs(d) > maxV) s.y += Math.sign(d) * maxV;
    else s.y = s.aiTarget;
    clampPaddle(s);
  };

  const speed = () => Math.hypot(ball.vx, ball.vy);

  const clampPaddle = (s: Side) => {
    s.y = Math.min(H - padH / 2, Math.max(padH / 2, s.y));
  };

  // ---- physics ----
  const bounce = (s: Side, faceX: number, dir: 1 | -1) => {
    // hit offset steers the ball, classic Pong: edge of the paddle = 60°
    const rel = Math.min(1, Math.max(-1, (ball.y - s.y) / (padH / 2)));
    const angle = rel * ((60 * Math.PI) / 180);
    const v = Math.min(maxSpeed, speed() * SPEEDUP);
    ball.vx = Math.cos(angle) * v * dir;
    ball.vy = Math.sin(angle) * v;
    ball.x = faceX + ballR * dir;
    // a human return extends the current run
    if (s.mode !== "ai" && runCount >= 0) runCount += 1;
  };

  const stepBall = () => {
    ball.x += ball.vx * STEP;
    ball.y += ball.vy * STEP;

    // walls
    if (ball.y < ballR && ball.vy < 0) {
      ball.y = ballR + (ballR - ball.y);
      ball.vy = -ball.vy;
    } else if (ball.y > H - ballR && ball.vy > 0) {
      ball.y = H - ballR - (ball.y - (H - ballR));
      ball.vy = -ball.vy;
    }

    // paddle faces — plane-crossing test so a fast ball can't tunnel through
    const lFace = padX + padW;
    if (ball.vx < 0 && ball.prevX - ballR > lFace && ball.x - ballR <= lFace) {
      const t = (ball.prevX - ballR - lFace) / (ball.prevX - ball.x);
      const yAt = ball.prevY + (ball.y - ball.prevY) * t;
      if (Math.abs(yAt - left.y) <= padH / 2 + ballR) bounce(left, lFace, 1);
    }
    const rFace = W - padX - padW;
    if (ball.vx > 0 && ball.prevX + ballR < rFace && ball.x + ballR >= rFace) {
      const t = (rFace - (ball.prevX + ballR)) / (ball.x - ball.prevX);
      const yAt = ball.prevY + (ball.y - ball.prevY) * t;
      if (Math.abs(yAt - right.y) <= padH / 2 + ballR) bounce(right, rFace, -1);
    }

    if (ball.x < -ballR * 4) ballOut(left);
    else if (ball.x > W + ballR * 4) ballOut(right);
  };

  const ballOut = (conceder: Side) => {
    // a human miss ends their run; the rally itself just restarts
    if (conceder.mode !== "ai" && runCount > 0) {
      registerRun();
      runCount = 0;
    }
    serveDir = conceder === left ? -1 : 1; // the side that missed receives
    serve();
  };

  const step = () => {
    left.prevY = left.y;
    right.prevY = right.y;
    ball.prevX = ball.x;
    ball.prevY = ball.y;

    for (const [s, isLeft] of [
      [left, true],
      [right, false],
    ] as const) {
      if (s.mode === "ai") {
        stepAI(s, isLeft);
      } else if (s.mode === "keys") {
        // held keys move smoothly at a fixed rate, like the drag does
        const dir = (s.keyDown ? 1 : 0) - (s.keyUp ? 1 : 0);
        if (dir !== 0) {
          s.y += dir * H * 1.1 * STEP;
          clampPaddle(s);
          s.graceT = 3;
        } else {
          s.graceT -= STEP;
          if (s.graceT <= 0) setMode(s, "ai");
        }
      } else if (s.mode === "grace") {
        s.graceT -= STEP;
        if (s.graceT <= 0) setMode(s, "ai");
      }
    }

    if (phase.kind === "serve") {
      phase.t -= STEP;
      if (phase.t <= 0) phase = { kind: "play" };
    } else {
      stepBall();
      if (!reducedMq.matches) {
        trail.push({ x: ball.x, y: ball.y });
        if (trail.length > 14) trail.shift();
      }
    }
  };

  // ---- modes / input ----
  const setMode = (s: Side, mode: Side["mode"]) => {
    s.mode = mode;
    if (mode === "ai") {
      s.handle.removeAttribute("data-live");
      s.aiArmed = false;
      if (!humanPlaying()) {
        // back to pure demo: a lapsed run still counts, then no more scoring
        registerRun();
        runCount = -1;
        if (status) status.textContent = "";
      }
    } else {
      s.handle.setAttribute("data-live", "");
      if (runCount < 0) runCount = 0; // first human input — the counter begins
      kick();
    }
  };

  const canvasY = (clientY: number) => clientY - canvas.getBoundingClientRect().top;

  // shared drag core — entered from a handle grab or a direct paddle grab
  const startDrag = (s: Side, clientY: number) => {
    s.grabOffset = canvasY(clientY) - s.y;
    // ±half a paddle of slack, else snap to the grab point
    if (Math.abs(s.grabOffset) > padH / 2) s.grabOffset = 0;
    setMode(s, "drag");
  };
  const moveDrag = (s: Side, clientY: number) => {
    if (s.mode !== "drag") return;
    s.y = canvasY(clientY) - s.grabOffset;
    clampPaddle(s);
    s.prevY = s.y; // 1:1 under the finger — never interpolate against the drag
  };
  const endDrag = (s: Side) => {
    if (s.mode !== "drag") return;
    s.graceT = 2.5;
    setMode(s, "grace");
  };

  const attachInput = (s: Side) => {
    const h = s.handle;
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      h.setPointerCapture(e.pointerId);
      startDrag(s, e.clientY);
    };
    const onMove = (e: PointerEvent) => moveDrag(s, e.clientY);
    const onUp = () => endDrag(s);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault(); // the page must not scroll while steering
      if (e.key === "ArrowUp") s.keyUp = true;
      else s.keyDown = true;
      s.graceT = 3;
      setMode(s, "keys");
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") s.keyUp = false;
      else if (e.key === "ArrowDown") s.keyDown = false;
    };
    const onBlur = () => {
      s.keyUp = false;
      s.keyDown = false;
      if (s.mode === "keys") setMode(s, "ai");
    };
    h.addEventListener("pointerdown", onDown);
    h.addEventListener("pointermove", onMove);
    h.addEventListener("pointerup", onUp);
    h.addEventListener("pointercancel", onUp);
    h.addEventListener("keydown", onKeyDown);
    h.addEventListener("keyup", onKeyUp);
    h.addEventListener("blur", onBlur);
    return () => {
      h.removeEventListener("pointerdown", onDown);
      h.removeEventListener("pointermove", onMove);
      h.removeEventListener("pointerup", onUp);
      h.removeEventListener("pointercancel", onUp);
      h.removeEventListener("keydown", onKeyDown);
      h.removeEventListener("keyup", onKeyUp);
      h.removeEventListener("blur", onBlur);
    };
  };

  // the paddle itself is grabbable: a full-height strip around each paddle
  // column, mouse/pen only — a touch there must stay a page scroll, and
  // touch players have the (enlarged) edge handles with touch-action:none
  const sideAt = (x: number): Side | null => {
    if (x <= padX + padW + GRAB) return left;
    if (x >= W - padX - padW - GRAB) return right;
    return null;
  };

  const attachCanvasInput = () => {
    const byPointer = new Map<number, Side>();
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const s = sideAt(e.clientX - canvas.getBoundingClientRect().left);
      if (!s) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      byPointer.set(e.pointerId, s);
      startDrag(s, e.clientY);
    };
    const onMove = (e: PointerEvent) => {
      const dragging = byPointer.get(e.pointerId);
      if (dragging) {
        moveDrag(dragging, e.clientY);
        return;
      }
      if (e.pointerType === "touch") return;
      // hover affordance over the grab strips
      const s = sideAt(e.clientX - canvas.getBoundingClientRect().left);
      canvas.style.cursor = s ? "ns-resize" : "";
    };
    const onUp = (e: PointerEvent) => {
      const s = byPointer.get(e.pointerId);
      if (!s) return;
      byPointer.delete(e.pointerId);
      endDrag(s);
    };
    const onLeave = () => {
      canvas.style.cursor = "";
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  };

  // ---- render ----
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const roundRect = (x: number, y: number, w: number, h2: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h2, r);
    ctx.fill();
  };

  const render = (alpha: number) => {
    ctx.clearRect(0, 0, W, H);

    // center line — dotted, like a figma guide
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 14);
    ctx.lineTo(W / 2, H - 14);
    ctx.stroke();
    ctx.setLineDash([]);

    // ghost run counter — only once a human is in the rally; the demo is scoreless
    if (runCount >= 0) {
      ctx.font = `600 ${Math.round(H * 0.2)}px "Instrument Sans Variable", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = colors.soft;
      ctx.fillText(String(runCount), W / 2, H * 0.07);
      ctx.globalAlpha = 1;
    }

    // layer-name captions, figma blue
    ctx.font = `500 11px "Instrument Sans Variable", sans-serif`;
    ctx.fillStyle = FIGMA_BLUE;
    ctx.globalAlpha = 0.85;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillText(left.mode !== "ai" ? "you" : "cpu", padX, 20);
    ctx.textAlign = "right";
    ctx.fillText(right.mode !== "ai" ? "you" : "cpu", W - padX, 20);
    ctx.globalAlpha = 1;

    // paddles
    const ly = lerp(left.prevY, left.y, alpha);
    const ry = lerp(right.prevY, right.y, alpha);
    ctx.fillStyle = colors.text;
    roundRect(padX, ly - padH / 2, padW, padH, padW / 2);
    roundRect(W - padX - padW, ry - padH / 2, padW, padH, padW / 2);

    // ball trail, peach comet
    if (phase.kind === "play") {
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        if (!p) continue;
        const f = (i + 1) / trail.length;
        ctx.globalAlpha = 0.22 * f * f;
        ctx.fillStyle = colors.accent;
        const r = ballR * (0.45 + 0.55 * f);
        roundRect(p.x - r, p.y - r, r * 2, r * 2, r * 0.45);
      }
      ctx.globalAlpha = 1;
    }

    // ball — peach square with a hairline ink edge, reads in both themes
    const bx = phase.kind === "play" ? lerp(ball.prevX, ball.x, alpha) : W / 2;
    const by = phase.kind === "play" ? lerp(ball.prevY, ball.y, alpha) : H / 2;
    const pulse = phase.kind === "serve" ? 1 + 0.18 * Math.sin((0.9 - phase.t) * 9) : 1;
    const r = ballR * pulse;
    ctx.fillStyle = colors.accent;
    roundRect(bx - r, by - r, r * 2, r * 2, r * 0.45);
    ctx.strokeStyle = colors.text;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - r + 0.5, by - r + 0.5, r * 2 - 1, r * 2 - 1);
    ctx.globalAlpha = 1;

    // edge handles ride their paddles
    left.handle.style.transform = `translate3d(0, ${ly - handleHalf}px, 0)`;
    right.handle.style.transform = `translate3d(0, ${ry - handleHalf}px, 0)`;
  };

  // ---- loop ----
  let raf = 0;
  let running = false;
  let lastTs = 0;
  let acc = 0;

  // reduced motion: no self-playing animation — the sim only runs while a
  // human side is active, otherwise the arena holds a still frame
  const mayRun = () => !document.hidden && (!reducedMq.matches || humanPlaying());

  const loop = (ts: number) => {
    if (!running) return;
    if (lastTs === 0) lastTs = ts;
    acc += Math.min((ts - lastTs) / 1000, MAX_FRAME);
    lastTs = ts;
    while (acc >= STEP) {
      step();
      acc -= STEP;
    }
    render(acc / STEP);
    if (mayRun()) raf = requestAnimationFrame(loop);
    else stop();
  };

  const kick = () => {
    if (running || !mayRun()) return;
    running = true;
    lastTs = 0;
    acc = 0;
    raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  // ---- wiring ----
  readTheme();
  resize(canvas.clientWidth, canvas.clientHeight);
  serve();
  render(1);
  renderScores(); // earlier visits' bests show up right away

  const ro = new ResizeObserver((entries) => {
    const e = entries[0];
    if (!e) return;
    const px = e.devicePixelContentBoxSize?.[0];
    resize(e.contentRect.width, e.contentRect.height, px?.inlineSize, px?.blockSize);
  });
  try {
    // exact physical pixels where supported (Safari throws on the box name)
    ro.observe(canvas, { box: "device-pixel-content-box" });
  } catch {
    ro.observe(canvas);
  }

  const onVisibility = () => {
    if (document.hidden) stop();
    else kick();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onReduced = () => {
    if (mayRun()) kick();
    else {
      stop();
      render(1);
    }
  };
  reducedMq.addEventListener("change", onReduced);

  const themeObserver = new MutationObserver(() => {
    readTheme();
    render(1); // repaint now — a paused arena must still follow the theme
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const detachL = attachInput(left);
  const detachR = attachInput(right);
  const detachCanvas = attachCanvasInput();

  kick(); // playing from page load — the rally is live before anyone scrolls

  return () => {
    stop();
    ro.disconnect();
    themeObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    reducedMq.removeEventListener("change", onReduced);
    detachL();
    detachR();
    detachCanvas();
  };
}
