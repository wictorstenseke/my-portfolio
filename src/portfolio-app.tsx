import { App } from "./app";
import { audienceFromSearch } from "./audience";

export function createPortfolioApp(search: string) {
  const audience = audienceFromSearch(search);
  return <App audience={audience} />;
}
