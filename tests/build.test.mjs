import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createServer } from "node:http";
import { once } from "node:events";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, expect } from "@playwright/test";
import { browserOptions } from "./browser-options.mjs";
import { galleryEntries } from "../public/content.js";
import { createBuildFixture } from "./site-fixture.mjs";

// Build checks use a disposable checkout so they cannot replace the running preview.
const fixture = await createBuildFixture();
const cwd = fixture.root;
const fixtureTestURL = pathToFileURL(path.join(cwd, "tests/build.test.mjs"));
const run = (siteURL) => fixture.build(siteURL);
after(() => fixture.cleanup());

test("configured and unconfigured builds produce truthful search metadata", async () => {
  try {
    for (const input of [
      "https://example.test",
      "https://raagu.github.io/karnatakajanapadasevatrust",
      "https://raagu.github.io/karnatakajanapadasevatrust/",
      "https://example.test/arts&crafts/",
    ]) {
      run(input);
      const siteURL = input.replace(/\/$/, "") + "/";
      const escapedURL = siteURL.replaceAll("&", "&amp;");
      const html = await readFile(new URL("../dist/index.html", fixtureTestURL), "utf8");
      const schema = JSON.parse(html.match(/id="organization-schema">(.*?)<\/script>/s)[1]);
      const imageURL = new URL("images/social-card.jpg", siteURL).href;
      assert.equal(schema.url, siteURL);
      assert.equal(schema.image, imageURL);
      assert.ok(html.includes(`rel="canonical" href="${escapedURL}"`));
      assert.ok(html.includes(`property="og:url" content="${escapedURL}"`));
      assert.ok(html.includes(`property="og:image" content="${imageURL.replaceAll("&", "&amp;")}"`));
      assert.ok(html.includes(`name="twitter:image" content="${imageURL.replaceAll("&", "&amp;")}"`));
      const sitemap = await readFile(new URL("../dist/sitemap.xml", fixtureTestURL), "utf8");
      assert.ok(sitemap.includes(`<loc>${escapedURL}</loc>`));
      const robots = await readFile(new URL("../dist/robots.txt", fixtureTestURL), "utf8");
      assert.ok(robots.includes(`Sitemap: ${new URL("sitemap.xml", siteURL).href}`));
      await access(new URL("../dist/.nojekyll", fixtureTestURL));
    }
    for (const invalid of [
      "http://example.test",
      "https://user:password@example.test/",
      "https://example.test/project/?tracking=yes",
      "https://example.test/project/#heritage",
    ]) assert.throws(() => run(invalid));
  } finally {
    run("");
  }
  const html = await readFile(
    new URL("../dist/index.html", fixtureTestURL),
    "utf8",
  );
  assert.doesNotMatch(html, /rel="canonical"/);
  assert.doesNotMatch(html, /example\.test/);
  await assert.rejects(access(new URL("../dist/sitemap.xml", fixtureTestURL)));
  for (const filename of ["../public/index.html", "../dist/index.html"]) {
    const page = await readFile(new URL(filename, fixtureTestURL), "utf8");
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
      galleryEntries.length,
      `${filename} must render the full collection without JavaScript.`,
    );
    const noScript = page.match(
      /<noscript\b[^>]*>([\s\S]*?)<\/noscript\s*>/i,
    )?.[1];
    assert.ok(noScript, `${filename} needs its non-JavaScript explanation.`);
    assert.ok(noScript.includes(String(galleryEntries.length)));
    assert.doesNotMatch(noScript, /ಆರು|all six|six traditions/i);
    assert.match(page, /id="heritage-search"/);
    assert.match(page, /type="search"/);
    assert.match(page, /data-clear-search/);
    assert.match(page, /data-browse-category/);
    assert.doesNotMatch(page, /\b(?:src|href)="\/(?!\/)/);
    assert.match(page, /http-equiv="Content-Security-Policy"/);
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

test("Pages workflow builds HTTPS metadata when Pages reports HTTP", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/pages.yml", fixtureTestURL),
    "utf8",
  );
  const template = workflow.match(/^\s+SITE_URL:\s*(.+)$/m)?.[1];
  assert.ok(template, "The Pages build must set SITE_URL.");
  const scenarios = [
    {
      base_url: "http://karnatakajanapadasevatrust.org",
      host: "karnatakajanapadasevatrust.org",
      base_path: "",
      expected: "https://karnatakajanapadasevatrust.org/",
    },
    {
      base_url: "https://karnatakajanapadasevatrust.org",
      host: "karnatakajanapadasevatrust.org",
      base_path: "",
      expected: "https://karnatakajanapadasevatrust.org/",
    },
    {
      base_url: "https://raagu.github.io/karnatakajanapadasevatrust",
      host: "raagu.github.io",
      base_path: "/karnatakajanapadasevatrust",
      expected: "https://raagu.github.io/karnatakajanapadasevatrust/",
    },
  ];
  try {
    for (const scenario of scenarios) {
      const siteURL = template.replace(
        /\$\{\{\s*steps\.pages\.outputs\.(\w+)\s*\}\}/g,
        (_, key) => {
          assert.ok(Object.hasOwn(scenario, key), `Unknown Pages output: ${key}`);
          return scenario[key];
        },
      );
      run(siteURL);
      const html = await readFile(new URL("../dist/index.html", fixtureTestURL), "utf8");
      const schema = JSON.parse(html.match(/id="organization-schema">(.*?)<\/script>/s)[1]);
      assert.equal(schema.url, scenario.expected);
      assert.equal(schema.image, new URL("images/social-card.jpg", scenario.expected).href);
      assert.ok(html.includes(`rel="canonical" href="${scenario.expected}"`));
      assert.ok(html.includes(`property="og:url" content="${scenario.expected}"`));
      const sitemap = await readFile(new URL("../dist/sitemap.xml", fixtureTestURL), "utf8");
      assert.ok(sitemap.includes(`<loc>${scenario.expected}</loc>`));
      const robots = await readFile(new URL("../dist/robots.txt", fixtureTestURL), "utf8");
      assert.ok(robots.includes(`Sitemap: ${new URL("sitemap.xml", scenario.expected).href}`));
    }
  } finally {
    run("");
  }
});

test("the production build loads assets, fonts, dialogs and credits inside a Pages project directory", async () => {
  const prefix = "/karnatakajanapadasevatrust/";
  const dist = path.join(cwd, "dist");
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".woff2": "font/woff2",
  };
  // Deliberately do not serve assets at the host root: a stray /images/ URL must fail.
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      if (!pathname.startsWith(prefix)) {
        response.writeHead(404).end();
        return;
      }
      const resource = path.resolve(dist, decodeURIComponent(pathname.slice(prefix.length)) || "index.html");
      if (!resource.startsWith(dist + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      const bytes = await readFile(resource);
      response.writeHead(200, { "Content-Type": contentTypes[path.extname(resource)] || "application/octet-stream" });
      response.end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  let browser;
  try {
    run("https://raagu.github.io" + prefix);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const baseURL = `http://127.0.0.1:${server.address().port}${prefix}`;
    browser = await chromium.launch(browserOptions);
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(5000);
        const errors = [];
        const escapedRequests = [];
        const missingResources = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("request", (request) => {
          const url = new URL(request.url());
          if (url.origin === new URL(baseURL).origin && !url.pathname.startsWith(prefix)) escapedRequests.push(url.pathname);
        });
        page.on("response", (response) => {
          if (response.status() >= 400 && !response.url().endsWith("/intentionally-missing-test-image.jpg")) missingResources.push(response.url());
        });
        await context.addInitScript(() => {
          window.cspViolations = [];
          document.addEventListener("securitypolicyviolation", (event) => window.cspViolations.push(event.violatedDirective));
        });
        await page.goto(baseURL, { waitUntil: "load" });
        await expect(page.locator("html")).toHaveAttribute("lang", "kn");
        await expect(page.locator(".art-card")).toHaveCount(galleryEntries.length);
        for (const image of await page.locator("img").all()) {
          await image.scrollIntoViewIfNeeded();
          await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
        }
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.fonts.check('700 18px "Noto Sans Kannada"')), true);
        const search = page.locator("#heritage-search");
        await search.fill("ಕಿನ್ನಾಳ");
        await expect(page.locator(".art-card:visible")).toHaveCount(1);
        await page.locator('[data-language="en"]').first().click();
        await expect(search).toHaveValue("ಕಿನ್ನಾಳ");
        await page.locator('[data-art-open="kinhal"]').click();
        const photo = page.locator("#site-dialog .dialog-photo");
        await expect(photo).toHaveJSProperty("src", baseURL + "images/kinhal-authentic.jpg");
        await expect.poll(() => photo.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
        await expect(page.locator("#art-credit")).toContainText("CC BY");
        await page.keyboard.press("Escape");
        await page.locator('[data-open="credits"]').first().click();
        const media = await (await page.request.get(baseURL + "media.json")).json();
        await expect(page.locator(".credit-list > li")).toHaveCount(media.length);
        await page.keyboard.press("Escape");
        // Verify image recovery also stays inside the project directory.
        const cardPhoto = page.locator('[data-art="kinhal"] img');
        await cardPhoto.evaluate((element) => {
          element.removeAttribute("srcset");
          element.src = "./images/intentionally-missing-test-image.jpg";
        });
        await expect(cardPhoto).toHaveJSProperty("src", baseURL + "images/kinhal-authentic-640.jpg");
        await expect.poll(() => cardPhoto.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.fonts.check('700 18px "Inter"')), true);
        assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
        assert.deepEqual(errors, []);
        assert.deepEqual(escapedRequests, []);
        assert.deepEqual(missingResources, []);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    run("");
  }
});
