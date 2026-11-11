import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "parse5";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { galleryEntries } from "../public/content.js";
import { messages } from "../public/translations.js";
import { languages, routeFor } from "../public/routes.js";
import { createBuildFixture, serveFixture } from "./site-fixture.mjs";
import { browserOptions } from "./browser-options.mjs";

const fixture = await createBuildFixture();
after(() => fixture.cleanup());
const configuredURL = "https://karnatakajanapadasevatrust.org/";
fixture.build(configuredURL);
const all = (root) => [root, ...(root.childNodes || []).flatMap(all)];
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const text = (node) => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join("");
const normalize = (value) => value.replace(/\s+/g, " ").trim();

test("all 78 eligible pages contain their localized content, canonical and reciprocal language links without JavaScript", async () => {
  const titles = new Set(), descriptions = new Set(), canonicals = new Set();
  for (const language of languages) {
    for (const entry of [null, ...galleryEntries]) {
      const route = routeFor(language, entry?.id);
      const document = parse(await readFile(path.join(fixture.root, "dist", route, "index.html"), "utf8"));
      const nodes = all(document);
      const html = nodes.find((node) => node.tagName === "html");
      const main = nodes.find((node) => node.tagName === "main");
      const title = text(nodes.find((node) => node.tagName === "title"));
      const canonical = nodes.filter((node) => node.tagName === "link" && attr(node, "rel") === "canonical");
      assert.equal(canonical.length, 1, route);
      assert.equal(attr(canonical[0], "href"), new URL(route, configuredURL).href);
      assert.equal(attr(html, "lang"), language);
      assert.equal(nodes.filter((node) => node.tagName === "h1").length, 1, route);
      assert.ok(!nodes.some((node) => node.tagName === "meta" && attr(node, "name") === "robots" && /noindex/.test(attr(node, "content"))), route);
      titles.add(title); canonicals.add(attr(canonical[0], "href"));
      const description = attr(nodes.find((node) => node.tagName === "meta" && attr(node, "name") === "description"), "content");
      assert.ok(description?.trim(), route);
      descriptions.add(description);
      assert.equal(attr(nodes.find((node) => attr(node, "property") === "og:type"), "content"), entry ? "article" : "website");
      const alternates = nodes.filter((node) => node.tagName === "link" && attr(node, "hreflang"));
      assert.equal(alternates.length, 3, route);
      for (const other of languages) {
        assert.equal(attr(alternates.find((node) => attr(node, "hreflang") === other), "href"), new URL(routeFor(other, entry?.id), configuredURL).href);
      }
      assert.equal(attr(alternates.find((node) => attr(node, "hreflang") === "x-default"), "href"), new URL(routeFor("kn", entry?.id), configuredURL).href);
      const organization = JSON.parse(text(nodes.find((node) => attr(node, "id") === "organization-schema")));
      assert.equal(organization.url, configuredURL);
      assert.equal(organization.founder, undefined);
      const graph = JSON.parse(text(nodes.find((node) => attr(node, "id") === "page-schema")))["@graph"];
      assert.ok(graph.some((node) => node["@type"] === "WebPage" && node.inLanguage === language));
      if (entry) {
        assert.equal(text(nodes.find((node) => node.tagName === "h1")), entry[language].name);
        assert.ok(normalize(text(main)).includes(normalize(entry[language].origin)), route);
        assert.ok(normalize(text(main)).includes(normalize(entry[language].importance)), route);
        assert.ok(nodes.some((node) => node.tagName === "a" && attr(node, "href") === (entry[language].source || entry.en.source)), route);
        const article = graph.find((node) => node["@type"] === "Article");
        assert.equal(article.headline, entry[language].name);
        assert.equal(article.citation, entry[language].source || entry.en.source);
        assert.equal(article.datePublished, undefined);
        assert.equal(article.author, undefined);
      } else {
        assert.equal(title, messages["meta.title"][language]);
        const cards = nodes.filter((node) => node.tagName === "a" && attr(node, "data-art-open"));
        assert.equal(cards.length, 46);
        for (const card of cards) assert.equal(new URL(attr(card, "href"), new URL(route, configuredURL)).href, new URL(routeFor(language, attr(card, "data-art-open")), configuredURL).href);
      }
    }
  }
  assert.equal(canonicals.size, 78);
  assert.equal(titles.size, 78, "Each localized page needs its own descriptive title.");
  assert.equal(descriptions.size, 78, "Each localized page needs its own description.");
});

test("the sitemap lists exactly the canonical eligible pages and robots permits their resources", async () => {
  const xml = await readFile(path.join(fixture.root, "dist/sitemap.xml"), "utf8");
  const actual = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expected = languages.flatMap((language) => [null, ...galleryEntries.map((entry) => entry.id)].map((id) => new URL(routeFor(language, id), configuredURL).href));
  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual).size, 78);
  assert.doesNotMatch(xml, /lastmod|localhost|\.example|\.test|#[^<]/);
  const robots = await readFile(path.join(fixture.root, "dist/robots.txt"), "utf8");
  assert.match(robots, /Allow: \//);
  assert.doesNotMatch(robots, /Disallow:/);
  assert.ok(robots.includes("Sitemap: " + configuredURL + "sitemap.xml"));
});

test("language and tradition links work without JavaScript under a GitHub Pages project prefix", async () => {
  const prefix = "/karnatakajanapadasevatrust/";
  fixture.build("https://raagu.github.io" + prefix);
  const server = await serveFixture(path.join(fixture.root, "dist"), prefix);
  const browser = await chromium.launch(browserOptions);
  try {
    for (const language of languages) {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
      try {
        const page = await context.newPage();
        const missing = [];
        page.on("response", (response) => { if (response.status() >= 400) missing.push(response.url()); });
        await page.goto(new URL(routeFor(language), server.baseURL).href, { waitUntil: "load" });
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expect(page.locator(".art-card")).toHaveCount(38);
        await page.locator('.art-card [data-art-open="dollu"]').click();
        await expect(page.locator("h1")).toHaveText(galleryEntries.find((entry) => entry.id === "dollu")[language].name);
        await expect(page.locator("main")).toContainText(galleryEntries.find((entry) => entry.id === "dollu")[language].origin);
        await expect.poll(() => page.locator("main img").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
        const other = language === "kn" ? "en" : "kn";
        await page.locator(`.topline [data-language="${other}"]`).click();
        await expect(page.locator("html")).toHaveAttribute("lang", other);
        await expect(page.locator("h1")).toHaveText(galleryEntries.find((entry) => entry.id === "dollu")[other].name);
        assert.ok(page.url().endsWith(routeFor(other, "dollu")));
        assert.deepEqual(missing, []);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); await server.close(); }
});

test("published URLs override saved preferences and article switching preserves forms and browser history", async () => {
  const server = await serveFixture(path.join(fixture.root, "dist"));
  const browser = await chromium.launch(browserOptions);
  try {
    for (const width of [320, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      try {
        await context.addInitScript(() => localStorage.setItem("kjst-language", "en"));
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(server.baseURL, { waitUntil: "load" });
        await expect(page.locator("html")).toHaveAttribute("lang", "kn");
        await page.goto(new URL(routeFor("en", "instrument-kinnari"), server.baseURL).href, { waitUntil: "load" });
        await expect(page.locator("h1")).toHaveText("Kinnari");
        await page.locator('.nav-support[data-open="support"]').evaluate((element) => element.click());
        await expect(page.locator("#site-dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await page.locator('.mobile-cta [data-open="ambassador"]').evaluate((element) => element.click());
        const input = page.locator('#site-dialog input[name="name"]');
        await input.fill("Asha & Ravi");
        await page.locator('#site-dialog [data-language="kn"]').click();
        await expect(page.locator("html")).toHaveAttribute("lang", "kn");
        await expect(input).toHaveValue("Asha & Ravi");
        assert.ok(page.url().endsWith(routeFor("kn", "instrument-kinnari")));
        await page.goBack();
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        await expect(input).toHaveValue("Asha & Ravi");
        await page.keyboard.press("Escape");
        await expect(page.locator("h1")).toHaveText("Kinnari");
        await page.reload({ waitUntil: "load" });
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); await server.close(); }
});


test("permanent detail pages remain accessible in both languages on phone and desktop", async () => {
  const server = await serveFixture(path.join(fixture.root, "dist"));
  const browser = await chromium.launch(browserOptions);
  try {
    for (const width of [320, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      try {
        const page = await context.newPage();
        for (const language of languages) {
          await page.goto(new URL(routeFor(language, "dollu"), server.baseURL).href, { waitUntil: "load" });
          const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
          assert.deepEqual(result.violations, [], `${language} detail page at ${width}px`);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        }
      } finally { await context.close(); }
    }
  } finally { await browser.close(); await server.close(); }
});
