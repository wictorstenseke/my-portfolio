import { render } from "preact";
import { App } from "./app";
import { audienceFromSearch } from "./audience";
import "./style.css";

const audience = audienceFromSearch(window.location.search);

render(<App audience={audience} />, document.getElementById("app")!);
