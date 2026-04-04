const experience = [
  { role: "UX Designer Consultant", company: "Wolters Kluwer Sverige", period: "Dec 2023 – Present", location: "Gothenburg" },
  { role: "UX Designer", company: "Bonfire Development AB", period: "Nov 2021 – Present", location: "Gothenburg" },
  { role: "Product Owner | UX Designer", company: "iCore Solutions AB", period: "Oct 2022 – Dec 2023", location: "Gothenburg" },
  { role: "UX Designer", company: "Polestar", period: "Nov 2021 – Oct 2022", location: "Gothenburg" },
  { role: "UX Designer", company: "Bokio", period: "Sep 2021 – Nov 2021", location: "Gothenburg" },
  { role: "UX Designer", company: "SKF Group", period: "Nov 2020 – Sep 2021", location: "Gothenburg" },
  { role: "UX Designer", company: "Knowit", period: "May 2017 – Sep 2021", location: "Gothenburg" },
  { role: "UX Designer", company: "Telia", period: "Aug 2018 – Sep 2020", location: "Gothenburg" },
  { role: "UX Designer", company: "Collector Bank", period: "Nov 2017 – Jun 2018", location: "Gothenburg" },
];

export function App() {
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
              <div class="timeline-entry" style={{ animationDelay: `${0.4 + i * 0.06}s` }}>
                <div class="timeline-marker" />
                <div class="timeline-content">
                  <span class="timeline-period">{job.period}</span>
                  <h3 class="timeline-role">{job.role}</h3>
                  <span class="timeline-company">{job.company}</span>
                </div>
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
