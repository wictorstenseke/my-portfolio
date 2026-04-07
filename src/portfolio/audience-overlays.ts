import type { Audience } from "../audience";
import { SUPPORTED_AUDIENCES } from "../audience";
import type { AudienceOverlay } from "./types";

/**
 * Overlay registry: one entry per supported audience (exhaustive `Audience` keys).
 */
export const AUDIENCE_OVERLAYS: Record<Audience, AudienceOverlay> = {
  general: {},
  "product-manager": {},
  "frontend-engineer": {},
};

/** Supported audience identities in stable order (alias for extension points / iteration). */
export function listSupportedAudiences(): readonly Audience[] {
  return SUPPORTED_AUDIENCES;
}
