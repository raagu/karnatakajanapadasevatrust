import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { once } from "node:events";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { browserOptions } from "./browser-options.mjs";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const run = (siteURL) =>
  execFileSync(process.execPath, ["scripts/build.mjs"], {
    cwd,
    env: { ...process.env, SITE_URL: siteURL },
    stdio: "pipe",
  });

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
      const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
      const schema = JSON.parse(html.match(/id="organization-schema">(.*?)<\/script>/s)[1]);
      const imageURL = new URL("images/social-card.jpg", siteURL).href;
      assert.equal(schema.url, siteURL);
      assert.equal(schema.image, imageURL);
      assert.ok(html.includes(`rel="canonical" href="${escapedURL}"`));
      assert.ok(html.includes(`property="og:url" content="${escapedURL}"`));
      assert.ok(html.includes(`property="og:image" content="${imageURL.replaceAll("&", "&amp;")}"`));
      assert.ok(html.includes(`name="twitter:image" content="${imageURL.replaceAll("&", "&amp;")}"`));
      const sitemap = await readFile(new URL("../dist/sitemap.xml", import.meta.url), "utf8");
      assert.ok(sitemap.includes(`<loc>${escapedURL}</loc>`));
      const robots = await readFile(new URL("../dist/robots.txt", import.meta.url), "utf8");
      assert.ok(robots.includes(`Sitemap: ${new URL("sitemap.xml", siteURL).href}`));
      await access(new URL("../dist/.nojekyll", import.meta.url));
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
        await expect(page.locator(".art-card")).toHaveCount(20);
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
        await expect(page.locator(".credit-list > li")).toHaveCount(23);
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
