import {
  BufferAttribute,
  BufferGeometry,
  Color,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

const DOT_SPACING = 28;

const dotsVertex = /* glsl */ `
  uniform vec2 uMouse;
  uniform float uDpr;
  varying float vGlow;

  void main() {
    vec2 toDot = position.xy - uMouse;
    float d = length(toDot);
    float force = exp(-d / 110.0);
    vec2 displaced = position.xy + normalize(toDot + 0.0001) * force * 14.0;
    vGlow = exp(-d / 130.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 0.0, 1.0);
    gl_PointSize = 2.0 * uDpr;
  }
`;

const dotsFragment = /* glsl */ `
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

function buildGrid(w: number, h: number) {
  const margin = DOT_SPACING * 2;
  const cols = Math.ceil((w + margin * 2) / DOT_SPACING);
  const rows = Math.ceil((h + margin * 2) / DOT_SPACING);
  const positions = new Float32Array(cols * rows * 3);
  let i = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      positions[i++] = x * DOT_SPACING - margin;
      positions[i++] = y * DOT_SPACING - margin;
      positions[i++] = 0;
    }
  }
  return positions;
}

export function initScene(canvas: HTMLCanvasElement): () => void {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false });
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  // pixel-space ortho camera: (0,0) top-left, matches client coords
  const camera = new OrthographicCamera(0, 1, 0, 1, -1, 1);

  const isDark = () => document.documentElement.dataset.theme === "dark";

  // --- interactive dot field ---
  const dotsGeo = new BufferGeometry();
  const dotsMat = new ShaderMaterial({
    vertexShader: dotsVertex,
    fragmentShader: dotsFragment,
    uniforms: {
      uMouse: { value: [-9999, -9999] },
      uDpr: { value: dpr },
      uColor: { value: new Color() },
      uOpacity: { value: 0 },
    },
    transparent: true,
    depthTest: false,
  });
  const dots = new Points(dotsGeo, dotsMat);
  dots.renderOrder = 1;
  scene.add(dots);

  const applyTheme = () => {
    const dark = isDark();
    // hex values are converted srgb->linear on upload, which darkens them on
    // screen — the dark value is pre-brightened so it *displays* as ~#56|4e|47
    dotsMat.uniforms.uColor.value.set(dark ? "#9d948c" : "#e5e0de");
    dotsMat.uniforms.uOpacity.value = dark ? 0.6 : 0.52;
  };
  applyTheme();
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.right = w;
    camera.bottom = h;
    camera.updateProjectionMatrix();
    dotsGeo.setAttribute("position", new BufferAttribute(buildGrid(w, h), 3));
  };
  resize();
  window.addEventListener("resize", resize);

  // smoothed cursor
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  const onMove = (e: PointerEvent) => {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
  };
  const onLeave = () => {
    mouse.tx = -9999;
    mouse.ty = -9999;
  };
  window.addEventListener("pointermove", onMove);
  document.documentElement.addEventListener("pointerleave", onLeave);

  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const ease = mouse.tx < -999 ? 1 : 0.12;
    mouse.x += (mouse.tx - mouse.x) * ease;
    mouse.y += (mouse.ty - mouse.y) * ease;
    dotsMat.uniforms.uMouse.value = [mouse.x, mouse.y];
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    themeObserver.disconnect();
    dotsGeo.dispose();
    dotsMat.dispose();
    renderer.dispose();
  };
}
