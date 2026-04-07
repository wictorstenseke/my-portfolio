import type { Audience } from "../audience";

export type ConsultingAssignment = {
  role: string;
  company: string;
  period: string;
};

export type ExperienceEntry = {
  role: string;
  company: string;
  period: string;
  consulting?: ConsultingAssignment[];
};

export type IntroContent = {
  bio: string;
};

/**
 * Audience-specific deltas applied on top of canonical portfolio facts.
 * Later phases can add fields (e.g. skill highlights) without duplicating full profiles.
 */
export type AudienceOverlay = {
  intro?: Partial<IntroContent>;
};

export type ResolvedProfile = {
  audience: Audience;
  experience: readonly ExperienceEntry[];
  intro: IntroContent;
};
