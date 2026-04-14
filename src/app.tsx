import { useState, useEffect } from "preact/hooks";

const experience = [
  {
    role: "UX Designer",
    company: "Bonfire Development AB",
    period: "Nov 2021 – Present",
    logo: "/img/logos/bonfire.svg",
    logoBg: "#2c2520",
    consulting: [
      { role: "UX Designer", company: "Wolters Kluwer Sverige", period: "Dec 2023 – Present", logo: "/img/logos/wolters-kluwer.png" },
      { role: "Product Owner | UX Designer", company: "iCore Solutions AB", period: "Oct 2022 – Dec 2023", logo: "/img/logos/icore.png" },
      { role: "UX Designer", company: "Polestar", period: "Nov 2021 – Oct 2022", logo: "/img/logos/polestar.png" },
    ],
  },
  {
    role: "UX Designer",
    company: "Bokio",
    period: "Sep 2021 – Nov 2021",
    logo: "/img/logos/bokio.png",
  },
  {
    role: "UX Designer",
    company: "Knowit",
    period: "May 2017 – Sep 2021",
    logo: "/img/logos/knowit.png",
    consulting: [
      { role: "UX Designer", company: "SKF Group", period: "Nov 2020 – Sep 2021", logo: "/img/logos/skf.png" },
      { role: "UX Designer", company: "Telia", period: "Aug 2018 – Sep 2020", logo: "/img/logos/telia.png" },
      { role: "UX Designer", company: "Collector Bank", period: "Nov 2017 – Jun 2018", logo: "/img/logos/collector.png" },
    ],
  },
];

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

export function App() {
  const { theme, toggle } = useTheme();

  return (
    <div class="page">
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id="squircle" clipPathUnits="objectBoundingBox">
            <path d="M 0,0.5 C 0,0 0,0 0.5,0 S 1,0 1,0.5 1,1 0.5,1 0,1 0,0.5" />
          </clipPath>
        </defs>
      </svg>
      <div class="bg-grid" aria-hidden="true" />

      <button
        class="theme-toggle"
        onClick={toggle}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      <div class="main-wrapper">
      <main>
        <div class="portrait">
          <div class="portrait-frame">
            <img src="/img/avatar.webp" alt="Wictor Stenseke" width="400" height="400" />
          </div>
        </div>

        <div class="intro">
          <h1>
            <span class="line line-1">Wictor</span>
            <span class="line line-2">Stenseke</span>
          </h1>
          <p class="bio">
            UX Designer in Gothenburg, Sweden — bridging users
            and product through research, prototyping &amp; craft.
          </p>
          <nav class="links">
            <a href="mailto:wictorstenseke@gmail.com" class="link-pill">
              <span class="link-dot" />
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/wictorstenseke/"
              target="_blank"
              rel="noopener noreferrer"
              class="link-pill"
            >
              <span class="link-dot" />
              LinkedIn
            </a>
          </nav>
        </div>

        <section class="experience">
          <h2 class="section-heading">Experience</h2>
          <div class="timeline">
            {experience.map((job, i) => (
              <div class="timeline-group" style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
                <div class="timeline-entry">
                  <div class="timeline-marker" />
                  <img class="timeline-logo" src={job.logo} alt={job.company} width="32" height="32" style={job.logoBg ? { background: job.logoBg } : undefined} />
                  <div class="timeline-content">
                    <div class="timeline-left">
                      <h3 class="timeline-role">{job.role}</h3>
                      <span class="timeline-company">{job.company}</span>
                    </div>
                    <span class="timeline-period">{job.period}</span>
                  </div>
                </div>
                {job.consulting && (
                  <div class="timeline-consulting">

                    {job.consulting.map((c, j) => (
                      <div class="timeline-entry timeline-entry--nested" style={{ animationDelay: `${0.5 + i * 0.12 + j * 0.06}s` }}>
                        <div class="timeline-marker timeline-marker--nested" />
                        <img class="timeline-logo" src={c.logo} alt={c.company} width="32" height="32" />
                        <div class="timeline-content">
                          <div class="timeline-left">
                            <h3 class="timeline-role">{c.role}</h3>
                            <span class="timeline-company">{c.company}</span>
                          </div>
                          <span class="timeline-period">{c.period}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      </div>

      <footer>
        <span>&copy; 2026</span>
        <span class="separator">/</span>
        <span>wictorstenseke.se</span>
      </footer>
    </div>
  );
}
