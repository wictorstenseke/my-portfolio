import type { ExperienceEntry, IntroContent } from "./types";

function freezeExperienceEntry(entry: ExperienceEntry): ExperienceEntry {
  return Object.freeze({
    ...entry,
    consulting: entry.consulting
      ? Object.freeze(entry.consulting.map((assignment) => Object.freeze({ ...assignment })))
      : undefined,
  });
}

function freezeExperience(entries: readonly ExperienceEntry[]): readonly ExperienceEntry[] {
  return Object.freeze(entries.map(freezeExperienceEntry));
}

export const CANONICAL_INTRO: IntroContent = Object.freeze({
  bio:
    "UX Designer in Gothenburg, Sweden — bridging users and product through research, prototyping & craft.",
});

export const CANONICAL_EXPERIENCE: readonly ExperienceEntry[] = freezeExperience([
  {
    role: "UX Designer",
    company: "Bonfire Development AB",
    period: "Nov 2021 – Present",
    consulting: [
      { role: "UX Designer", company: "Wolters Kluwer Sverige", period: "Dec 2023 – Present" },
      { role: "Product Owner | UX Designer", company: "iCore Solutions AB", period: "Oct 2022 – Dec 2023" },
      { role: "UX Designer", company: "Polestar", period: "Nov 2021 – Oct 2022" },
    ],
  },
  {
    role: "UX Designer",
    company: "Bokio",
    period: "Sep 2021 – Nov 2021",
  },
  {
    role: "UX Designer",
    company: "Knowit",
    period: "May 2017 – Sep 2021",
    consulting: [
      { role: "UX Designer", company: "SKF Group", period: "Nov 2020 – Sep 2021" },
      { role: "UX Designer", company: "Telia", period: "Aug 2018 – Sep 2020" },
      { role: "UX Designer", company: "Collector Bank", period: "Nov 2017 – Jun 2018" },
    ],
  },
]);
