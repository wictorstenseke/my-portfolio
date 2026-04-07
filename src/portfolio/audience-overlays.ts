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
    experiencePresentation: {
      jobOrder: ["bonfire-development", "bokio", "knowit"],
      emphasizedJobIds: ["knowit"],
      emphasizedConsultingIds: ["icore-solutions", "telia", "skf-group"],
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
    experiencePresentation: {
      consultingOrderByJobId: {
        knowit: ["skf-group", "telia", "collector-bank"],
      },
      emphasizedJobIds: ["bonfire-development"],
      emphasizedConsultingIds: ["wolters-kluwer-sverige", "polestar", "telia"],
    },
  },
};

/** Supported audience identities in stable order (alias for extension points / iteration). */
export function listSupportedAudiences(): readonly Audience[] {
  return SUPPORTED_AUDIENCES;
}
