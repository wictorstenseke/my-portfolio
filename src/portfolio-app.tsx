import { App } from "./app";
import { audienceFromSearch } from "./audience";
import { composeProfile } from "./portfolio/personalization";

export function createPortfolioApp(search: string) {
  const audience = audienceFromSearch(search);
  const profile = composeProfile(audience);
  return <App profile={profile} />;
}
