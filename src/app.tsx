import type { ResolvedProfile } from "./portfolio/types";

export type AppProps = {
  profile: ResolvedProfile;
};

export function App({ profile }: AppProps) {
  const { audience, experience, intro } = profile;

  return (
    <div class="page" data-audience={audience}>
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
          <p class="bio">{intro.bio}</p>
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
              <div key={job.id} class="timeline-group" style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
                <div class="timeline-entry">
                  <div class="timeline-marker" />
                  <div class="timeline-content">
                    <span class="timeline-period">{job.period}</span>
                    <h3 class="timeline-role">{job.role}</h3>
                    <span class="timeline-company">{job.company}</span>
                  </div>
                </div>
                {job.consulting && (
                  <div class="timeline-consulting">
                    <span class="consulting-label">Consulting assignments</span>
                    {job.consulting.map((c, j) => (
                      <div
                        key={c.id}
                        class="timeline-entry timeline-entry--nested"
                        style={{ animationDelay: `${0.5 + i * 0.12 + j * 0.06}s` }}
                      >
                        <div class="timeline-marker timeline-marker--nested" />
                        <div class="timeline-content">
                          <span class="timeline-period">{c.period}</span>
                          <h3 class="timeline-role">{c.role}</h3>
                          <span class="timeline-company">{c.company}</span>
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
