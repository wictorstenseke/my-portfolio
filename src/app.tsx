export function App() {
  return (
    <div class="page">
      <div class="grain" aria-hidden="true" />

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
        </div>

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
