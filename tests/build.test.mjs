import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

test("configured and unconfigured builds produce truthful search metadata", async () => {
  const cwd = fileURLToPath(new URL("../", import.meta.url));
  const run = (origin) =>
    execFileSync(process.execPath, ["scripts/build.mjs"], {
      cwd,
      env: { ...process.env, SITE_URL: origin },
      stdio: "pipe",
    });
  try {
    run("https://example.test");
    const html = await readFile(
      new URL("../dist/index.html", import.meta.url),
      "utf8",
    );
    const schema = JSON.parse(
      html.match(/id="organization-schema">(.*?)<\/script>/s)[1],
    );
    assert.equal(schema.url, "https://example.test/");
    assert.equal(schema.image, "https://example.test/images/social-card.jpg");
    assert.match(html, /rel="canonical" href="https:\/\/example.test\/"/);
    assert.match(
      await readFile(new URL("../dist/sitemap.xml", import.meta.url), "utf8"),
      /<loc>https:\/\/example.test\/<\/loc>/,
    );
    assert.throws(() => run("http://example.test"));
  } finally {
    run("");
  }
  const html = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(html, /rel="canonical"/);
  assert.doesNotMatch(html, /example\.test/);
  await assert.rejects(access(new URL("../dist/sitemap.xml", import.meta.url)));
  for (const filename of ["../public/index.html", "../dist/index.html"]) {
    const page = await readFile(new URL(filename, import.meta.url), "utf8");
    const regions = [
      ...page.matchAll(/<button\b[^>]*\bdata-filter="([^"]+)"[^>]*>/g),
    ]
      .map((match) => match[1])
      .sort();
    assert.deepEqual(
      regions,
      ["all", "bayaluseeme", "karavali", "malenadu"],
      `${filename} must retain all four region controls.`,
    );
    assert.equal(
      [...page.matchAll(/\bdata-art="/g)].length,
      20,
      `${filename} must render the full collection without JavaScript.`,
    );
    const noScript = page.match(
      /<noscript\b[^>]*>([\s\S]*?)<\/noscript\s*>/i,
    )?.[1];
    assert.ok(noScript, `${filename} needs its non-JavaScript explanation.`);
    assert.match(noScript, /20/);
    assert.doesNotMatch(noScript, /ಆರು|all six|six traditions/i);
    assert.match(page, /id="heritage-search"/);
    assert.match(page, /type="search"/);
    assert.match(page, /data-clear-search/);
    assert.match(page, /data-browse-category/);
    assert.doesNotMatch(
      page,
      /class="illustration-label"|Illustrated guide|ಪರಿಚಯ ಚಿತ್ರಣ/,
    );
    const gallery = page.match(
      /<!-- heritage-gallery:start -->([\s\S]*?)<!-- heritage-gallery:end -->/,
    )?.[1];
    assert.ok(gallery, "The static gallery must remain present.");
    assert.doesNotMatch(gallery, /<img\b[^>]*src="[^"]+\.svg"/i);
  }
});
