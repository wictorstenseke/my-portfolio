import { useState, useEffect } from "preact/hooks";

const tenure = [
  {
    company: "Bonfire Development AB",
    role: "UX Designer",
    period: "2021 — Now",
    logo: "/img/logos/bonfire.svg",
    logoBg: "#2c2520",
    engagements: [
      {
        company: "Wolters Kluwer Sverige",
        period: "2023 —",
        logo: "/img/logos/wolters-kluwer.png",
      },
      {
        company: "iCore Solutions AB",
        period: "2022 — 23",
        logo: "/img/logos/icore.png",
        note: "Product Owner & UX",
      },
      {
        company: "Polestar",
        period: "2021 — 22",
        logo: "/img/logos/polestar.png",
      },
    ],
  },
  {
    company: "Knowit",
    role: "UX Designer",
    period: "2017 — 21",
    logo: "/img/logos/knowit.png",
    engagements: [
      {
        company: "SKF Group",
        period: "2020 — 21",
        logo: "/img/logos/skf.png",
      },
      { company: "Telia", period: "2018 — 20", logo: "/img/logos/telia.png" },
      {
        company: "Collector Bank",
        period: "2017 — 18",
        logo: "/img/logos/collector.png",
      },
    ],
  },
];

const instruments = [
  {
    title: "Research",
    items: [
      "User interviews",
      "Diary studies",
      "Workshop facilitation",
      "Usability testing",
      "Field studies",
    ],
  },
  {
    title: "Craft",
    items: [
      "Figma & FigJam",
      "Framer & Spline",
      "HTML / CSS / TypeScript",
      "Preact & React",
      "Motion & Lottie",
    ],
  },
  {
    title: "Systems",
    items: [
      "Design tokens",
      "Component libraries",
      "Documentation",
      "Design operations",
      "Cross-team rituals",
    ],
  },
];

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

type SectionHeadProps = {
  num: string;
  kicker: string;
  title: preact.ComponentChildren;
  meta?: string;
};

function SectionHead({ num, kicker, title, meta }: SectionHeadProps) {
  return (
    <header class="section-head">
      <div class="section-num" aria-hidden="true">
        {num}
      </div>
      <p class="kicker">
        <span class="kicker-bullet">●</span>
        <span class="kicker-text">{kicker}</span>
      </p>
      <h2 class="section-title">{title}</h2>
      {meta && <p class="section-meta">{meta}</p>}
    </header>
  );
}

export function App() {
  const { theme, toggle } = useTheme();

  return (
    <div class="folio">
      <div class="paper-grain" aria-hidden="true" />

      <header class="folio-strip">
        <span class="strip-mark">Vol · I</span>
        <span class="strip-dot" aria-hidden="true">·</span>
        <span class="strip-mark">N° MMXXVI</span>
        <span class="strip-dot" aria-hidden="true">·</span>
        <span class="strip-mark strip-mark--wide">Gothenburg, 57.7°N</span>

        <button
          class="theme-toggle"
          onClick={toggle}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          <span class="toggle-orb" aria-hidden="true" />
          <span class="toggle-label">{theme === "dark" ? "Day" : "Night"}</span>
        </button>
      </header>

      <hr class="rule rule--top" />

      <main class="folio-main">
        <section class="masthead" aria-labelledby="masthead-title">
          <p class="masthead-kicker kicker">
            <span class="kicker-bullet">●</span>
            <span class="kicker-num">§ I</span>
            <span class="kicker-sep">/</span>
            <span class="kicker-text">Portrait of the designer</span>
          </p>

          <h1 id="masthead-title" class="masthead-title">
            <span class="title-line title-line--top">Wictor</span>
            <span class="title-line title-line--bottom">
              <em>Stenseke</em>
            </span>
          </h1>

          <figure class="portrait">
            <div class="portrait-frame">
              <img
                src="/img/avatar.webp"
                alt="Wictor Stenseke"
                width="400"
                height="400"
              />
            </div>
            <figcaption>
              <span class="fig-label">Fig. 1</span>
              <span class="fig-text">The designer, in residence.</span>
            </figcaption>
          </figure>

          <div class="masthead-aside">
            <p class="lede">
              <span class="dropcap">U</span>X Designer working at the seam
              between user and product — through research, prototyping, and a
              stubborn attention to craft. Based in Gothenburg, occupied with
              software that ought to feel inevitable.
            </p>

            <ul class="contact-list">
              <li>
                <a href="mailto:wictorstenseke@gmail.com">
                  <span class="contact-num">01</span>
                  <span class="contact-label">Correspondence</span>
                  <span class="contact-handle">wictorstenseke@gmail.com</span>
                  <span class="contact-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/wictorstenseke/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="contact-num">02</span>
                  <span class="contact-label">LinkedIn</span>
                  <span class="contact-handle">in/wictorstenseke</span>
                  <span class="contact-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </section>

        <hr class="rule" />

        <section class="section section--tenure" aria-labelledby="tenure-title">
          <SectionHead
            num="II"
            kicker="Tenure"
            title={
              <>
                Nine years
                <br />
                <em>at the table</em>.
              </>
            }
            meta="Two employers, six engagements."
          />

          <div class="section-body">
            <ol class="ledger">
              {tenure.map((job) => (
                <li class="ledger-block">
                  <div class="ledger-row ledger-row--employer">
                    <span class="ledger-period">{job.period}</span>
                    <div class="ledger-body">
                      <img
                        class="ledger-logo"
                        src={job.logo}
                        alt=""
                        width="32"
                        height="32"
                        style={
                          job.logoBg ? { background: job.logoBg } : undefined
                        }
                      />
                      <div class="ledger-text">
                        <span class="ledger-name">{job.company}</span>
                        <span class="ledger-role">{job.role}</span>
                      </div>
                    </div>
                  </div>

                  <ol class="ledger-engagements">
                    {job.engagements.map((e) => (
                      <li class="ledger-row ledger-row--engagement">
                        <span class="ledger-period">{e.period}</span>
                        <div class="ledger-body">
                          <span class="ledger-bullet" aria-hidden="true">
                            ↳
                          </span>
                          <img
                            class="ledger-logo ledger-logo--small"
                            src={e.logo}
                            alt=""
                            width="22"
                            height="22"
                          />
                          <div class="ledger-text">
                            <span class="ledger-name ledger-name--engagement">
                              {e.company}
                            </span>
                            {e.note && (
                              <span class="ledger-note">{e.note}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <hr class="rule" />

        <section
          class="section section--instruments"
          aria-labelledby="instruments-title"
        >
          <SectionHead
            num="III"
            kicker="Instruments"
            title={
              <>
                Tools, methods,
                <br />
                <em>minor obsessions</em>.
              </>
            }
          />

          <div class="section-body">
            <div class="instruments-grid">
              {instruments.map((col, i) => (
                <div class="instrument-col">
                  <h3 class="instrument-title">
                    <span class="instrument-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{col.title}</span>
                  </h3>
                  <ul class="instrument-list">
                    {col.items.map((item) => (
                      <li>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr class="rule" />

        <section
          class="section section--currently"
          aria-labelledby="currently-title"
        >
          <SectionHead
            num="IV"
            kicker="Currently"
            title={
              <>
                <em>Presently</em>,<br />
                in the studio.
              </>
            }
          />

          <div class="section-body">
            <dl class="now-list">
              <div class="now-row">
                <dt>Designing</dt>
                <dd>
                  Tax & accounting tools at <em>Wolters Kluwer Sverige</em>,
                  quietly making them feel less like tax & accounting tools.
                </dd>
              </div>
              <div class="now-row">
                <dt>Tinkering</dt>
                <dd>
                  A self-built portfolio in Preact and CSS, at unreasonable
                  hours.
                </dd>
              </div>
              <div class="now-row">
                <dt>Reading</dt>
                <dd>
                  <em>A Philosophy of Software Design</em> — Ousterhout.
                </dd>
              </div>
              <div class="now-row">
                <dt>Listening</dt>
                <dd>Nils Frahm, Bonobo, and the kettle.</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <hr class="rule rule--bottom" />

      <footer class="colophon">
        <p class="colophon-ornament" aria-hidden="true">
          ❦
        </p>
        <p class="colophon-body">
          Set in <em>Fraunces</em>, <em>Geist</em>, & <em>JetBrains Mono</em>.
          Composed in Gothenburg with Preact, Vite, and a steady hand. No
          analytics, no tracking, no cookies — only paper.
        </p>
        <p class="colophon-meta">
          <span>© MMXXVI</span>
          <span class="dot">·</span>
          <span>wictorstenseke.se</span>
          <span class="dot">·</span>
          <span>All rights, mostly reserved.</span>
        </p>
      </footer>
    </div>
  );
}
