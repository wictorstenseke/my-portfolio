import { App } from "./app";
import { audienceFromSearch } from "./audience";
import { composeProfile } from "./portfolio/compose-profile";

export function createPortfolioApp(search: string) {
  const audience = audienceFromSearch(search);
  const profile = composeProfile(audience);
  return <App profile={profile} />;
}
