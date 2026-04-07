import type { ResolvedProfile } from "./types";

/**
 * Precomputed sets for O(1) emphasis lookup in the timeline UI.
 * Keeps JSX free of personalization rule shapes (only consumes {@link ResolvedProfile}).
 */
export type ExperienceEmphasisViewModel = {
  readonly emphasizedJobs: ReadonlySet<string>;
  readonly emphasizedConsulting: ReadonlySet<string>;
};

export function experienceEmphasisViewModel(
  profile: ResolvedProfile,
): ExperienceEmphasisViewModel {
  const { emphasizedJobIds, emphasizedConsultingIds } = profile.experiencePresentation;
  return {
    emphasizedJobs: new Set(emphasizedJobIds),
    emphasizedConsulting: new Set(emphasizedConsultingIds),
  };
}
