/**
 * Audience personalization (data only — no UI).
 *
 * Pipeline:
 * 1. Resolve `Audience` from the URL/query in `../audience`.
 * 2. Merge frozen canonical content from `canonical.ts` with the audience delta in
 *    `audience-overlays.ts` (`AUDIENCE_OVERLAYS`).
 * 3. Apply timeline ordering and emphasis metadata via `experience-presentation.ts`.
 *
 * The render layer should depend on `ResolvedProfile` and `profile-view-model.ts` helpers,
 * not on overlay tables or composition internals.
 *
 * Extension seams for later work (without changing this contract):
 * - **Summary / case studies:** add optional fields to `AudienceOverlay` and map them in
 *   `compose-profile.ts`; keep rendering behind new view-model shapes if needed.
 * - **Downloads / static export:** build from `composeProfile(audience)` or SSR the same profile.
 * - **CMS:** replace imports of `canonical` / `audience-overlays` with fetched data that still
 *   satisfies the same types before calling `composeProfile`.
 */
export { composeProfile } from "./compose-profile";
export type { AudienceOverlay, ResolvedProfile } from "./types";
