import type { Audience } from "../audience";
import { AUDIENCE_OVERLAYS } from "./audience-overlays";
import { CANONICAL_EXPERIENCE, CANONICAL_INTRO } from "./canonical";
import type { IntroContent, ResolvedProfile } from "./types";

function mergeIntro(base: IntroContent, overlay: Partial<IntroContent> | undefined): IntroContent {
  if (overlay == null || Object.keys(overlay).length === 0) {
    return base;
  }
  return { ...base, ...overlay };
}

/** Builds the effective profile for rendering: canonical facts + audience overlay. */
export function composeProfile(audience: Audience): ResolvedProfile {
  const overlay = AUDIENCE_OVERLAYS[audience];
  return {
    audience,
    experience: CANONICAL_EXPERIENCE,
    intro: mergeIntro(CANONICAL_INTRO, overlay.intro),
  };
}
