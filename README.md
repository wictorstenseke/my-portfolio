# My Portfolio

Personal portfolio site for Wictor Stenseke — UX Designer & Developer based in Gothenburg, Sweden.

## Stack

- [Preact](https://preactjs.com/) + TypeScript
- [Vite](https://vitejs.dev/)
- Custom CSS (light/dark theme), self-hosted [Instrument Sans](https://fontsource.org/fonts/instrument-sans-variable)
- Zero-dependency intro animations (Web Animations API) and dot-field background (raw WebGL)
- [Biome](https://biomejs.dev/) for lint + format

## Development

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev        # vite dev server (--host)
npm run build      # typecheck + production build
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # biome check
npm run format     # biome format --write
```

## Deploy

Push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
Old designs live on as static builds in `archive/vN`, copied into the deploy
artifact. Note: `archive/v3` references `public/img` assets root-absolute —
don't delete or rename files under `public/img`.
