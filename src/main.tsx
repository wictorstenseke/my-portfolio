import { render } from "preact";
import { App } from "./app";
import "./style.css";

// Gate entrance animations behind this class so a no-JS or
// reduced-motion visit gets a fully visible static page.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!reducedMotion.matches) {
  document.documentElement.classList.add("motion");
}

render(<App />, document.getElementById("app")!);
