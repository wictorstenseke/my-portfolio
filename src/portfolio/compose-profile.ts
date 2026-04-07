import type { Audience } from "../audience";
import { AUDIENCE_OVERLAYS } from "./audience-overlays";
import {
  CANONICAL_EXPERIENCE,
  CANONICAL_INTRO,
  CANONICAL_SKILLS_HIGHLIGHTS,
} from "./canonical";
import type {
  ConsultingAssignment,
  ExperienceEntry,
  IntroContent,
  ResolvedProfile,
  SkillsHighlightsSection,
} from "./types";

function mergeIntro(base: IntroContent, overlay: Partial<IntroContent> | undefined): IntroContent {
  return { ...base, ...overlay };
}

function cloneSkillsHighlights(section: SkillsHighlightsSection): SkillsHighlightsSection {
  return {
    title: section.title,
    highlights: [...section.highlights],
  };
}

function cloneConsultingAssignment(
  assignment: ConsultingAssignment,
): ConsultingAssignment {
  return { ...assignment };
}

function cloneExperienceEntry(entry: ExperienceEntry): ExperienceEntry {
  return {
    ...entry,
    consulting: entry.consulting?.map(cloneConsultingAssignment),
  };
}

function cloneExperience(
  entries: readonly ExperienceEntry[],
): readonly ExperienceEntry[] {
  return entries.map(cloneExperienceEntry);
}

/** Builds the effective profile for rendering: canonical facts + audience overlay. */
export function composeProfile(audience: Audience): ResolvedProfile {
  const overlay = AUDIENCE_OVERLAYS[audience];
  const skillsHighlights = overlay.skillsHighlights
    ? cloneSkillsHighlights(overlay.skillsHighlights)
    : cloneSkillsHighlights(CANONICAL_SKILLS_HIGHLIGHTS);
  return {
    audience,
    experience: cloneExperience(CANONICAL_EXPERIENCE),
    intro: mergeIntro(CANONICAL_INTRO, overlay.intro),
    skillsHighlights,
  };
}
