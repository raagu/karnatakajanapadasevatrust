import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { escapeHTML } from "../public/gallery.js";
import { galleryEntries } from "../public/content.js";
import { routeFor, languages } from "../public/routes.js";
import { renderSeoPage } from "./seo-pages.mjs";

const root = path.resolve(import.meta.dirname, "..");
let siteURL = process.env.SITE_URL;
try {
  const hosting = JSON.parse(
    await readFile(path.join(root, ".openai/hosting.json"), "utf8"),
  );
  siteURL ||= hosting.expected_url;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (siteURL) {
  const url = new URL(siteURL);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "SITE_URL must be an HTTPS site URL without credentials, a query or a fragment.",
    );
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  url.search = "";
  url.hash = "";
  siteURL = url.href;
}
await rm(path.join(root, "dist"), { recursive: true, force: true });
await mkdir(path.join(root, "dist"), { recursive: true });
await cp(path.join(root, "public"), path.join(root, "dist"), {
  recursive: true,
});
const template = await readFile(path.join(root, "public/index.html"), "utf8");
const media = JSON.parse(await readFile(path.join(root, "public/media.json"), "utf8"));
const pages = [];
for (const language of languages) {
  for (const id of [null, ...galleryEntries.map((entry) => entry.id)]) {
    const route = routeFor(language, id);
    const destination = path.join(root, "dist", route);
    await mkdir(destination, { recursive: true });
    await writeFile(path.join(destination, "index.html"), renderSeoPage(template, language, id, siteURL, media));
    pages.push(route);
  }
}
if (siteURL) {
  const urls = pages.map((route) => `<url><loc>${escapeHTML(new URL(route, siteURL).href)}</loc></url>`).join("");
  await writeFile(path.join(root, "dist/sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
}
await writeFile(
  path.join(root, "dist/robots.txt"),
  `User-agent: *\nAllow: /\n${siteURL ? `Sitemap: ${new URL("sitemap.xml", siteURL).href}\n` : ""}`,
);
console.log(
  `Built ${pages.length} static pages in dist/${siteURL ? ` for ${siteURL}` : " (set SITE_URL for canonical URL and sitemap)"}.`,
);
