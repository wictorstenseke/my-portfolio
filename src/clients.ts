export interface Client {
  name: string;
  logo: string;
  /** render height (px), tuned per logo aspect ratio so all
      wordmarks carry roughly the same visual weight in the wall */
  h: number;
  /** near-black wordmark — needs lightness flip in dark mode */
  darkLogo?: boolean;
  note: string;
}

export const clients: Client[] = [
  {
    name: "Wolters Kluwer",
    logo: "/img/logos/wolters-kluwer.svg",
    h: 28,
    note: "Designing tax & accounting software used by accountants all over Sweden.",
  },
  {
    name: "iCore Solutions",
    logo: "/img/logos/icore.svg",
    h: 22,
    note: "Wore two hats as Product Owner & UX Designer for their integration platform.",
  },
  {
    name: "Polestar",
    logo: "/img/logos/polestar.svg",
    h: 20,
    darkLogo: true,
    note: "Shaped digital experiences for the electric performance car brand.",
  },
  {
    name: "SKF Group",
    logo: "/img/logos/skf.svg",
    h: 19,
    note: "Built digital tools for the world's largest bearing manufacturer.",
  },
  {
    name: "Telia",
    logo: "/img/logos/telia.svg",
    h: 30,
    note: "Two years improving consumer services for Sweden's biggest telco.",
  },
  {
    name: "Collector Bank",
    logo: "/img/logos/collector.svg",
    h: 15,
    darkLogo: true,
    note: "Designed banking products with focus on simplicity and trust.",
  },
  {
    name: "Bonfire Development",
    logo: "/img/logos/bonfire-wordmark.svg",
    h: 30,
    darkLogo: true,
    note: "My home base since 2021 — a small senior consultancy crew.",
  },
  {
    name: "Knowit",
    logo: "/img/logos/knowit.svg",
    h: 24,
    darkLogo: true,
    note: "Where it all started in 2017 — four years of consulting across industries.",
  },
];
