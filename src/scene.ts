// Interactive dot-field background on raw WebGL — a full 3D library is
// ~128 KB gzip of dead weight for one point grid and two tiny shaders.

const DOT_SPACING = 28;

const VERT = /* glsl */ `
  attribute vec2 aPos;
  uniform vec2 uMouse;
  uniform vec2 uRes;
  uniform float uDpr;
  varying float vGlow;

  void main() {
    vec2 toDot = aPos - uMouse;
    float d = length(toDot);
    float force = exp(-d / 110.0);
    vec2 displaced = aPos + normalize(toDot + 0.0001) * force * 14.0;
    vGlow = exp(-d / 130.0);
    // CSS-pixel coords -> clip space, y flipped so (0,0) is top-left
    gl_Position = vec4(
      displaced.x / uRes.x * 2.0 - 1.0,
      1.0 - displaced.y / uRes.y * 2.0,
      0.0,
      1.0
    );
    gl_PointSize = 2.0 * uDpr;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vGlow;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float alpha = smoothstep(0.5, 0.35, length(uv));
    // dots dissolve near the cursor
    float fade = 1.0 - smoothstep(0.1, 0.9, vGlow);
    gl_FragColor = vec4(uColor, alpha * uOpacity * fade);
  }
`;

// same srgb->linear conversion three.js applied to Color uniforms on upload,
// so the displayed values stay identical — the dark hex is pre-brightened
// because this conversion darkens it to the intended ~#56|4e|47 on screen
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [
    srgbToLinear(((n >> 16) & 255) / 255),
    srgbToLinear(((n >> 8) & 255) / 255),
    srgbToLinear((n & 255) / 255),
  ];
}

export function initScene(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true, // three.js context default, keeps compositing identical
  });
  if (!gl) return () => {};

  const dpr = Math.min(window.devicePixelRatio, 2);
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  let raf = 0;
  let running = false;
  let dotCount = 0;
  let prog: WebGLProgram | null = null;
  let buf: WebGLBuffer | null = null;
  let uMouse: WebGLUniformLocation | null = null;
  let uRes: WebGLUniformLocation | null = null;
  let uColor: WebGLUniformLocation | null = null;
  let uOpacity: WebGLUniformLocation | null = null;

  const applyTheme = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    gl.uniform3fv(uColor, hexToLinear(dark ? "#9d948c" : "#e5e0de"));
    gl.uniform1f(uOpacity, dark ? 0.6 : 0.52);
  };

  const buildGrid = (w: number, h: number) => {
    const margin = DOT_SPACING * 2;
    const cols = Math.ceil((w + margin * 2) / DOT_SPACING);
    const rows = Math.ceil((h + margin * 2) / DOT_SPACING);
    const positions = new Float32Array(cols * rows * 2);
    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        positions[i++] = x * DOT_SPACING - margin;
        positions[i++] = y * DOT_SPACING - margin;
      }
    }
    dotCount = cols * rows;
    // one GL buffer reused for life — resizes never leak GPU memory
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
  };

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, w, h);
    buildGrid(w, h);
    // synchronous repaint: setting canvas.width cleared the buffer, and a
    // hidden/occluded tab gets no rAF — never leave the canvas blank
    render();
    kick();
  };

  const setup = (): boolean => {
    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    prog = gl.createProgram();
    if (!vs || !fs || !prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    uMouse = gl.getUniformLocation(prog, "uMouse");
    uRes = gl.getUniformLocation(prog, "uRes");
    uColor = gl.getUniformLocation(prog, "uColor");
    uOpacity = gl.getUniformLocation(prog, "uOpacity");
    gl.uniform1f(gl.getUniformLocation(prog, "uDpr"), dpr);

    gl.enable(gl.BLEND);
    // three.js NormalBlending for transparent materials
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    applyTheme();
    resize();
    return true;
  };

  const render = () => {
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, dotCount);
  };

  const loop = () => {
    // smoothed cursor; snaps instantly when the pointer leaves
    const ease = mouse.tx < -999 ? 1 : 0.12;
    mouse.x += (mouse.tx - mouse.x) * ease;
    mouse.y += (mouse.ty - mouse.y) * ease;
    render();
    // stop burning frames once the cursor has settled — kick() restarts
    // the loop on the next input, resize or theme change
    if (Math.abs(mouse.tx - mouse.x) < 0.05 && Math.abs(mouse.ty - mouse.y) < 0.05) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(loop);
  };

  const kick = () => {
    if (running || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };

  const onMove = (e: PointerEvent) => {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
    kick();
  };
  const onLeave = () => {
    mouse.tx = -9999;
    mouse.ty = -9999;
    kick();
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      running = false;
    } else {
      kick();
    }
  };
  const onContextLost = (e: Event) => {
    e.preventDefault(); // signal that we will restore
    cancelAnimationFrame(raf);
    running = false;
  };
  const onContextRestored = () => {
    setup();
    kick();
  };

  if (!setup()) return () => {};

  window.addEventListener("pointermove", onMove);
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  const themeObserver = new MutationObserver(() => {
    applyTheme();
    render(); // repaint now — a hidden/occluded tab gets no rAF
    kick();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => {
    cancelAnimationFrame(raf);
    running = false;
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    themeObserver.disconnect();
    gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
  };
}
