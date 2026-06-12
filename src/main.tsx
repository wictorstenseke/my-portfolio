import { render } from "preact";
import { App } from "./app";
// self-hosted variable font (wght 400-700) — no third-party font origins
import "@fontsource-variable/instrument-sans/index.css";
import "./style.css";

// Gate entrance animations behind this class so a no-JS or
// reduced-motion visit gets a fully visible static page.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!reducedMotion.matches) {
  document.documentElement.classList.add("motion");
}

const root = document.getElementById("app");
if (root) render(<App />, root);
