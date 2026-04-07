import type { Audience } from "../audience";
import { SUPPORTED_AUDIENCES } from "../audience";
import type { AudienceOverlay } from "./types";

/**
 * Overlay registry: one entry per supported audience (exhaustive `Audience` keys).
 */
export const AUDIENCE_OVERLAYS: Record<Audience, AudienceOverlay> = {
  general: {},
  "product-manager": {
    skillsHighlights: {
      title: "Skills highlights",
      highlights: [
        "Problem framing, outcomes & opportunity sizing",
        "Discovery alongside PMs — interviews, journeys & hypotheses",
        "Roadmap & backlog collaboration; clear priorities for design",
        "Stakeholder workshops & decision-ready narratives",
        "Acceptance thinking: flows, edge cases & release slices",
        "Iteration guided by usage, feedback & product metrics",
      ],
    },
  },
  "frontend-engineer": {
    skillsHighlights: {
      title: "Skills highlights",
      highlights: [
        "Interaction design & UI craft grounded in systems thinking",
        "Component-level thinking & design-system collaboration",
        "Specs engineers can build from — states, variants & behavior",
        "Prototyping to de-risk UX before implementation",
        "Accessibility & performance as design constraints",
        "Tight iteration with frontend in the delivery loop",
      ],
    },
  },
};

/** Supported audience identities in stable order (alias for extension points / iteration). */
export function listSupportedAudiences(): readonly Audience[] {
  return SUPPORTED_AUDIENCES;
}
