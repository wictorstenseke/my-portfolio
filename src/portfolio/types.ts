import type { Audience } from "../audience";

export type ConsultingAssignment = {
  readonly id: string;
  readonly role: string;
  readonly company: string;
  readonly period: string;
};

export type ExperienceEntry = {
  readonly id: string;
  readonly role: string;
  readonly company: string;
  readonly period: string;
  readonly consulting?: readonly ConsultingAssignment[];
};

export type IntroContent = {
  readonly bio: string;
};

/** Short, scannable emphasis lines shown above Experience; tailored per audience. */
export type SkillsHighlightsSection = {
  readonly title: string;
  readonly highlights: readonly string[];
};

/**
 * Audience-specific deltas applied on top of canonical portfolio facts.
 * Later phases can add fields (e.g. skill highlights) without duplicating full profiles.
 */
export type AudienceOverlay = {
  intro?: Partial<IntroContent>;
  /** When set, replaces the canonical skills highlights for this audience. */
  skillsHighlights?: SkillsHighlightsSection;
};

export type ResolvedProfile = {
  readonly audience: Audience;
  readonly experience: readonly ExperienceEntry[];
  readonly intro: IntroContent;
  readonly skillsHighlights: SkillsHighlightsSection;
};
