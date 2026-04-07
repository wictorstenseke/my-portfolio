# Adding an audience flavor

The model is **one canonical profile** plus **per-audience overlays**. You extend the system by adding an id and an overlay entry — no redesign of `ResolvedProfile` is required unless you introduce a genuinely new kind of content.

## Checklist

1. **`src/audience.ts`** — Append the new slug to `SUPPORTED_AUDIENCES` (kebab-case, stable forever once published in links). `resolveAudience` and `audienceFromSearch` pick it up automatically.

2. **`src/portfolio/audience-overlays.ts`** — Add a key to `AUDIENCE_OVERLAYS` for that audience. TypeScript requires `Record<Audience, AudienceOverlay>`, so the table stays exhaustive.

3. **Overlay content** — Use only stable ids from `canonical.ts` for `experiencePresentation` (`jobOrder`, `consultingOrderByJobId`, `emphasizedJobIds`, `emphasizedConsultingIds`). Invalid ids throw at compose time.

4. **`scripts/verify-audience.mjs`** — Extend assertions if you add fixed expectations (e.g. new HTML markers or emphasis counts).

5. **Rendering** — Prefer extending `AudienceOverlay` + `compose-profile.ts` + optional helpers in `profile-view-model.ts`. Keep `app.tsx` focused on layout and mapping `ResolvedProfile` to UI.

## Layer boundaries

| Layer | Responsibility |
|--------|----------------|
| `audience.ts` | Query param, normalization, supported ids |
| `canonical.ts` | Shared facts (frozen) |
| `audience-overlays.ts` | Per-audience deltas |
| `experience-presentation.ts` | Validated ordering and emphasis rules |
| `compose-profile.ts` / `personalization.ts` | Merge → `ResolvedProfile` |
| `profile-view-model.ts` | UI-oriented derivations from `ResolvedProfile` |
| `app.tsx` | JSX only |

## Later: CMS, PDFs, case studies

- **CMS:** Load JSON that matches `IntroContent`, experience rows, and overlay-shaped payloads; run the same `composeProfile` pipeline.
- **Downloads / SSR:** Serialize `composeProfile(audience)`; no dependency on the browser.
- **New sections:** Add optional fields to `AudienceOverlay`, clone/merge in `compose-profile.ts`, then add view-model helpers or props before touching presentational components.
