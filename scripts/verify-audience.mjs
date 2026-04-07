import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = mkdtempSync(path.join(tmpdir(), "portfolio-audience-verify-"));

try {
  execFileSync(
    process.execPath,
    [
      "./node_modules/typescript/bin/tsc",
      "--ignoreConfig",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--target",
      "ES2020",
      "--outDir",
      tempDir,
      "--rootDir",
      ".",
      "src/audience.ts",
    ],
    { cwd: repoRoot, stdio: "inherit" },
  );

  const audienceModule = await import(pathToFileURL(path.join(tempDir, "src/audience.js")).href);
  const {
    AUDIENCE_QUERY_PARAM,
    DEFAULT_AUDIENCE,
    SUPPORTED_AUDIENCES,
    audienceFromSearch,
    resolveAudience,
  } = audienceModule;

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

  console.log("audience verification passed");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
