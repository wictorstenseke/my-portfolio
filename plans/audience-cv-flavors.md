# Plan: Audience CV Flavors

> Source PRD: `docs/prd-audience-cv-flavors.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes**: The portfolio remains a single-page app and uses a query-parameter pattern for audience selection, with links such as `?audience=general`, `?audience=product-manager`, and `?audience=frontend-engineer`.
- **Audience fallback**: Missing or unsupported audience values resolve to the default `general` experience.
- **Content strategy**: The first release keeps content code-managed rather than introducing a CMS or editor.
- **Variation scope**: Only skills highlights and experience ordering or emphasis vary by audience in v1.
- **Canonical facts**: Employment history and consulting history remain shared across all audience flavors.
- **Key models**: The implementation centers on four conceptual models: audience selection, shared portfolio content, audience overlays, and a composed render-ready profile.
- **UI behavior**: The tailored experience is automatic after opening the link; there is no visible audience switcher in v1.
- **Verification**: The plan assumes manual verification rather than introducing automated test infrastructure as part of this feature.
- **Out of scope**: Route-based audience pages, audience-specific social metadata, PDFs, CMS editing, backend services, and fully separate CV narratives.

---

## Phase 1: Audience Link Resolution

**User stories**: 1, 2, 3, 5, 6, 16

### What to build

Add the first complete audience-selection flow so a shared portfolio link can request a supported audience flavor and still load correctly when the audience is missing or invalid. This slice should prove that tailored links work without adding extra navigation or changing the overall site structure.

### Acceptance criteria

- [ ] A receiver can open a link that requests `general`, `product-manager`, or `frontend-engineer`.
- [ ] Missing or unsupported audience values fall back to the default general experience.
- [ ] The page loads normally without requiring a manual audience toggle or extra controls.

---

## Phase 2: Shared Profile Model

**User stories**: 4, 9, 10, 18, 19, 20, 21, 22, 24, 25

### What to build

Introduce a shared portfolio content model that separates canonical career facts from audience-specific overlays. The result should preserve the current general portfolio behavior while establishing the durable structure needed for audience-specific composition and future expansion.

### Acceptance criteria

- [ ] Shared career facts are represented once and reused across all audience flavors.
- [ ] Audience-specific behavior is defined as overlays or rules rather than duplicated full profiles.
- [ ] The system exposes supported audience identities in a predictable way for future extension.

---

## Phase 3: Audience-Specific Skills Highlights

**User stories**: 7, 8, 11, 13, 14, 15, 17

### What to build

Deliver the first visible personalization layer by showing different skills emphasis for each supported audience. This slice should make the PM and frontend links feel intentionally tailored while preserving one coherent visual design.

### Acceptance criteria

- [ ] Each supported audience flavor presents distinct skills highlights on the page.
- [ ] The general flavor remains balanced rather than over-optimized for one audience.
- [ ] The tailored skills presentation fits within the existing portfolio visual language.

---

## Phase 4: Audience-Specific Experience Emphasis

**User stories**: 12, 13, 14, 15, 17

### What to build

Add audience-aware ordering or emphasis for the experience timeline so each tailored link surfaces the most relevant experience more prominently. This slice should change presentation priority without changing the factual underlying work history.

### Acceptance criteria

- [ ] Each supported audience flavor can present experience in a different order or emphasis pattern.
- [ ] The underlying employment and consulting history remains consistent across flavors.
- [ ] The experience section still reads as a coherent timeline to the receiver.

---

## Phase 5: Extensibility Hardening

**User stories**: 18, 20, 21, 23, 25

### What to build

Harden the audience-flavor system so it is straightforward to add future audiences or richer personalization later. This slice should leave the feature in a maintainable state with clear boundaries between audience selection, shared content, overlays, and rendered output.

### Acceptance criteria

- [ ] Adding a future audience does not require redesigning the feature's core model.
- [ ] The implementation leaves a clean path to future summary, case-study, download, or CMS enhancements.
- [ ] The audience-personalization logic is clearly separated from the rendering concerns.
