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
  const portfolioAppModule = require(path.join(tempDir, "src/portfolio-app.js"));
  const {
    AUDIENCE_QUERY_PARAM,
    DEFAULT_AUDIENCE,
    SUPPORTED_AUDIENCES,
    audienceFromSearch,
    resolveAudience,
  } = audienceModule;
  const { CANONICAL_EXPERIENCE, CANONICAL_INTRO } = canonicalModule;
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

  const generalHtml = renderToString(createPortfolioApp(""));
  const frontendHtml = renderToString(createPortfolioApp("?audience=frontend-engineer"));
  const fallbackHtml = renderToString(createPortfolioApp("?audience=invalid"));

  assert.match(generalHtml, /data-audience="general"/);
  assert.match(frontendHtml, /data-audience="frontend-engineer"/);
  assert.match(fallbackHtml, /data-audience="general"/);
  assert.match(frontendHtml, /Wictor/);

  assert.equal(Object.isFrozen(CANONICAL_INTRO), true);
  assert.equal(Object.isFrozen(CANONICAL_EXPERIENCE), true);
  assert.equal(Object.isFrozen(CANONICAL_EXPERIENCE[0]), true);
  assert.equal(Object.isFrozen(CANONICAL_EXPERIENCE[0].consulting), true);
  assert.equal(Object.isFrozen(CANONICAL_EXPERIENCE[0].consulting[0]), true);

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

  console.log("audience verification passed");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
