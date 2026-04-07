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
 * Audience-facing presentation rules for the experience timeline.
 * Uses stable entry ids; does not alter factual copy — only display order and emphasis.
 */
export type ExperiencePresentationRules = {
  /**
   * Top-level employer blocks in display order.
   * Must be a permutation of canonical job ids when set; omit for canonical order.
   */
  readonly jobOrder?: readonly string[];
  /**
   * Per employer id, consulting assignment ids in display order.
   * Must be a permutation of that block’s canonical consulting ids when set.
   */
  readonly consultingOrderByJobId?: Readonly<Partial<Record<string, readonly string[]>>>;
  /** Job blocks that receive elevated visual emphasis. */
  readonly emphasizedJobIds?: readonly string[];
  /** Consulting rows that receive elevated visual emphasis. */
  readonly emphasizedConsultingIds?: readonly string[];
};

export type ResolvedExperiencePresentation = {
  readonly emphasizedJobIds: readonly string[];
  readonly emphasizedConsultingIds: readonly string[];
};

/**
 * Audience-specific deltas applied on top of canonical portfolio facts.
 * Later phases can add fields (e.g. skill highlights) without duplicating full profiles.
 */
export type AudienceOverlay = {
  intro?: Partial<IntroContent>;
  /** When set, replaces the canonical skills highlights for this audience. */
  skillsHighlights?: SkillsHighlightsSection;
  /** Optional timeline ordering and emphasis; facts remain in canonical data. */
  experiencePresentation?: ExperiencePresentationRules;
};

export type ResolvedProfile = {
  readonly audience: Audience;
  readonly experience: readonly ExperienceEntry[];
  readonly intro: IntroContent;
  readonly skillsHighlights: SkillsHighlightsSection;
  /** Resolved emphasis sets for rendering (stable ids). */
  readonly experiencePresentation: ResolvedExperiencePresentation;
};
