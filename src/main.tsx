import { render } from "preact";
import { createPortfolioApp } from "./portfolio-app";
import "./style.css";

render(createPortfolioApp(window.location.search), document.getElementById("app")!);
