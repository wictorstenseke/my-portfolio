import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rmSync, mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import renderToString from "preact-render-to-string";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = mkdtempSync(path.join(repoRoot, ".tmp-audience-verify-"));
const require = createRequire(import.meta.url);

try {
  writeFileSync(path.join(tempDir, "package.json"), '{"type":"commonjs"}\n');

  execFileSync(
    process.execPath,
    [
      "./node_modules/typescript/bin/tsc",
      "--ignoreConfig",
      "--module",
      "CommonJS",
      "--moduleResolution",
      "node",
      "--ignoreDeprecations",
      "6.0",
      "--target",
      "ES2020",
      "--jsx",
      "react-jsx",
      "--jsxImportSource",
      "preact",
      "--outDir",
      tempDir,
      "--rootDir",
      ".",
      "src/audience.ts",
      "src/app.tsx",
      "src/portfolio-app.tsx",
    ],
    { cwd: repoRoot, stdio: "inherit" },
  );

  const audienceModule = require(path.join(tempDir, "src/audience.js"));
  const canonicalModule = require(path.join(tempDir, "src/portfolio/canonical.js"));
  const composeProfileModule = require(path.join(tempDir, "src/portfolio/compose-profile.js"));
  const experiencePresentationModule = require(path.join(tempDir, "src/portfolio/experience-presentation.js"));
  const portfolioAppModule = require(path.join(tempDir, "src/portfolio-app.js"));
  const {
    AUDIENCE_QUERY_PARAM,
    DEFAULT_AUDIENCE,
    SUPPORTED_AUDIENCES,
    audienceFromSearch,
    resolveAudience,
  } = audienceModule;
  const { CANONICAL_EXPERIENCE, CANONICAL_INTRO, CANONICAL_SKILLS_HIGHLIGHTS } = canonicalModule;
  const { composeProfile } = composeProfileModule;
  const { applyExperiencePresentationRules } = experiencePresentationModule;
  const { createPortfolioApp } = portfolioAppModule;

  assert.equal(AUDIENCE_QUERY_PARAM, "audience");
  assert.equal(DEFAULT_AUDIENCE, "general");
  assert.deepEqual(SUPPORTED_AUDIENCES, [
    "general",
    "product-manager",
    "frontend-engineer",
  ]);

  assert.equal(resolveAudience("general"), "general");
  assert.equal(resolveAudience("product-manager"), "product-manager");
  assert.equal(resolveAudience("frontend-engineer"), "frontend-engineer");

  assert.equal(resolveAudience(null), DEFAULT_AUDIENCE);
  assert.equal(resolveAudience(""), DEFAULT_AUDIENCE);
  assert.equal(resolveAudience("   "), DEFAULT_AUDIENCE);
  assert.equal(resolveAudience("nope"), DEFAULT_AUDIENCE);

  assert.equal(resolveAudience(" GENERAL "), "general");
  assert.equal(resolveAudience(" Product-Manager "), "product-manager");
  assert.equal(resolveAudience(" FRONTEND-ENGINEER "), "frontend-engineer");

  assert.equal(audienceFromSearch(""), DEFAULT_AUDIENCE);
  assert.equal(audienceFromSearch("?other=value"), DEFAULT_AUDIENCE);
  assert.equal(audienceFromSearch("?audience=nope"), DEFAULT_AUDIENCE);
  assert.equal(audienceFromSearch("?audience=product-manager"), "product-manager");
  assert.equal(audienceFromSearch("?audience=%20FRONTEND-ENGINEER%20"), "frontend-engineer");

  function normalizedExperienceFacts(entries) {
    return [...entries]
      .map((e) => e.id)
      .sort()
      .map((id) => {
        const e = entries.find((x) => x.id === id);
        return {
          id: e.id,
          role: e.role,
          company: e.company,
          period: e.period,
          consulting: e.consulting
            ? [...e.consulting]
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((c) => ({
                  id: c.id,
                  role: c.role,
                  company: c.company,
                  period: c.period,
                }))
            : undefined,
        };
      });
  }

  function experienceIdOrder(entries) {
    return entries.map((e) => ({
      jobId: e.id,
      consultingIds: e.consulting ? e.consulting.map((c) => c.id) : undefined,
    }));
  }

  function countMatches(text, pattern) {
    return [...text.matchAll(pattern)].length;
  }

  const generalHtml = renderToString(createPortfolioApp(""));
  const pmHtml = renderToString(createPortfolioApp("?audience=product-manager"));
  const frontendHtml = renderToString(createPortfolioApp("?audience=frontend-engineer"));
  const fallbackHtml = renderToString(createPortfolioApp("?audience=invalid"));

  assert.match(generalHtml, /data-audience="general"/);
  assert.match(pmHtml, /data-audience="product-manager"/);
  assert.match(frontendHtml, /data-audience="frontend-engineer"/);
  assert.match(fallbackHtml, /data-audience="general"/);
  assert.match(frontendHtml, /Wictor/);

  assert.match(generalHtml, /skills-highlights/);
  assert.match(generalHtml, /User research/);
  assert.match(pmHtml, /Roadmap/);
  assert.match(frontendHtml, /Component-level/);
  assert.ok(!generalHtml.includes("Roadmap"));
  assert.ok(!generalHtml.includes("Component-level thinking"));

  assert.ok(!generalHtml.includes("data-emphasized"));
  assert.match(pmHtml, /data-emphasized="true"/);
  assert.match(frontendHtml, /data-emphasized="true"/);

  assert.equal(Object.isFrozen(CANONICAL_INTRO), true);
  assert.equal(Object.isFrozen(CANONICAL_EXPERIENCE), true);
  assert.deepEqual(
    CANONICAL_EXPERIENCE.map((entry) => entry.id),
    ["bonfire-development", "bokio", "knowit"],
  );
  assert.deepEqual(
    CANONICAL_EXPERIENCE[0].consulting.map((assignment) => assignment.id),
    ["wolters-kluwer-sverige", "icore-solutions", "polestar"],
  );
  assert.deepEqual(
    CANONICAL_EXPERIENCE[2].consulting.map((assignment) => assignment.id),
    ["skf-group", "telia", "collector-bank"],
  );
  assert.equal(Object.isFrozen(CANONICAL_EXPERIENCE[0]), true);
  assert.equal(Object.isFrozen(CANONICAL_EXPERIENCE[0].consulting), true);
  assert.equal(Object.isFrozen(CANONICAL_EXPERIENCE[0].consulting[0]), true);

  assert.equal(Object.isFrozen(CANONICAL_SKILLS_HIGHLIGHTS), true);
  assert.equal(Object.isFrozen(CANONICAL_SKILLS_HIGHLIGHTS.highlights), true);
  assert.throws(() => {
    CANONICAL_SKILLS_HIGHLIGHTS.highlights.push("mutated");
  }, TypeError);

  assert.throws(() => {
    CANONICAL_INTRO.bio = "mutated";
  }, TypeError);
  assert.throws(() => {
    CANONICAL_EXPERIENCE[0].role = "mutated";
  }, TypeError);
  assert.throws(() => {
    CANONICAL_EXPERIENCE[0].consulting.push({
      role: "mutated",
      company: "mutated",
      period: "mutated",
    });
  }, TypeError);

  const generalProfileA = composeProfile("general");
  const generalProfileB = composeProfile("general");
  const pmProfile = composeProfile("product-manager");
  const feProfile = composeProfile("frontend-engineer");

  assert.notEqual(
    generalProfileA.skillsHighlights.highlights.join("\n"),
    pmProfile.skillsHighlights.highlights.join("\n"),
  );
  assert.notEqual(
    generalProfileA.skillsHighlights.highlights.join("\n"),
    feProfile.skillsHighlights.highlights.join("\n"),
  );
  assert.notEqual(
    pmProfile.skillsHighlights.highlights.join("\n"),
    feProfile.skillsHighlights.highlights.join("\n"),
  );

  assert.notStrictEqual(generalProfileA.intro, CANONICAL_INTRO);
  assert.notStrictEqual(generalProfileA.experience, CANONICAL_EXPERIENCE);
  assert.notStrictEqual(generalProfileA.experience[0], CANONICAL_EXPERIENCE[0]);
  assert.notStrictEqual(generalProfileA.experience[0].consulting, CANONICAL_EXPERIENCE[0].consulting);
  assert.notStrictEqual(generalProfileA.experience[0].consulting[0], CANONICAL_EXPERIENCE[0].consulting[0]);
  assert.equal(generalProfileA.experience[0].id, CANONICAL_EXPERIENCE[0].id);
  assert.equal(generalProfileA.experience[0].consulting[0].id, CANONICAL_EXPERIENCE[0].consulting[0].id);

  assert.notStrictEqual(generalProfileA.intro, generalProfileB.intro);
  assert.notStrictEqual(generalProfileA.experience, generalProfileB.experience);
  assert.notStrictEqual(generalProfileA.experience[0], generalProfileB.experience[0]);
  assert.notStrictEqual(generalProfileA.experience[0].consulting, generalProfileB.experience[0].consulting);
  assert.notStrictEqual(generalProfileA.experience[0].consulting[0], generalProfileB.experience[0].consulting[0]);

  const canonicalFacts = normalizedExperienceFacts(CANONICAL_EXPERIENCE);
  assert.deepEqual(normalizedExperienceFacts(generalProfileA.experience), canonicalFacts);
  assert.deepEqual(normalizedExperienceFacts(pmProfile.experience), canonicalFacts);
  assert.deepEqual(normalizedExperienceFacts(feProfile.experience), canonicalFacts);

  const canonicalIdOrder = experienceIdOrder(CANONICAL_EXPERIENCE);
  assert.deepEqual(experienceIdOrder(generalProfileA.experience), canonicalIdOrder);
  assert.deepEqual(experienceIdOrder(pmProfile.experience), canonicalIdOrder);
  assert.deepEqual(experienceIdOrder(feProfile.experience), canonicalIdOrder);

  assert.deepEqual(generalProfileA.experiencePresentation.emphasizedJobIds, []);
  assert.deepEqual(generalProfileA.experiencePresentation.emphasizedConsultingIds, []);
  assert.deepEqual(pmProfile.experiencePresentation.emphasizedJobIds, ["knowit"]);
  assert.deepEqual(
    pmProfile.experiencePresentation.emphasizedConsultingIds,
    ["icore-solutions", "telia", "skf-group"],
  );
  assert.deepEqual(feProfile.experiencePresentation.emphasizedJobIds, ["bonfire-development"]);
  assert.deepEqual(
    feProfile.experiencePresentation.emphasizedConsultingIds,
    ["wolters-kluwer-sverige", "polestar", "telia"],
  );
  assert.equal(countMatches(generalHtml, /data-emphasized="true"/g), 0);
  assert.equal(countMatches(pmHtml, /data-emphasized="true"/g), 4);
  assert.equal(countMatches(frontendHtml, /data-emphasized="true"/g), 4);

  assert.throws(() => {
    applyExperiencePresentationRules(CANONICAL_EXPERIENCE, {
      consultingOrderByJobId: {
        nope: ["whatever"],
      },
    });
  }, /experience\.consultingOrderByJobId: unknown job id nope/);
  assert.throws(() => {
    applyExperiencePresentationRules(CANONICAL_EXPERIENCE, {
      emphasizedJobIds: ["nope"],
    });
  }, /experience\.emphasizedJobIds: unknown id nope/);
  assert.throws(() => {
    applyExperiencePresentationRules(CANONICAL_EXPERIENCE, {
      emphasizedConsultingIds: ["nope"],
    });
  }, /experience\.emphasizedConsultingIds: unknown id nope/);

  generalProfileA.intro.bio = "Audience-specific bio";
  generalProfileA.experience[0].role = "Reordered Role";
  generalProfileA.experience[0].consulting[0].company = "Mutated Client";
  generalProfileA.skillsHighlights.highlights[0] = "Mutated skill highlight";

  assert.equal(CANONICAL_INTRO.bio, "UX Designer in Gothenburg, Sweden — bridging users and product through research, prototyping & craft.");
  assert.equal(CANONICAL_EXPERIENCE[0].role, "UX Designer");
  assert.equal(CANONICAL_EXPERIENCE[0].consulting[0].company, "Wolters Kluwer Sverige");
  assert.equal(generalProfileB.intro.bio, CANONICAL_INTRO.bio);
  assert.equal(generalProfileB.experience[0].role, CANONICAL_EXPERIENCE[0].role);
  assert.equal(generalProfileB.experience[0].consulting[0].company, CANONICAL_EXPERIENCE[0].consulting[0].company);
  assert.equal(
    generalProfileB.skillsHighlights.highlights[0],
    CANONICAL_SKILLS_HIGHLIGHTS.highlights[0],
  );
  assert.equal(CANONICAL_SKILLS_HIGHLIGHTS.highlights[0], "User research & discovery");

  console.log("audience verification passed");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
