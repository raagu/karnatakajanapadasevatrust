import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { escapeHTML, renderHeritageHTML } from "../public/gallery.js";

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
let html = await readFile(path.join(root, "dist/index.html"), "utf8");
html = renderHeritageHTML(html);
if (siteURL) {
  const socialImageURL = new URL("images/social-card.jpg", siteURL).href;
  html = html
    .replace(
      "</head>",
      `  <link rel="canonical" href="${escapeHTML(siteURL)}">\n  <meta property="og:url" content="${escapeHTML(siteURL)}">\n</head>`,
    )
    .replaceAll(
      'content="./images/social-card.jpg"',
      `content="${escapeHTML(socialImageURL)}"`,
    );
  const schemaPattern =
    /(<script type="application\/ld\+json" id="organization-schema">)(.*?)(<\/script>)/s;
  if (!schemaPattern.test(html)) {
    throw new Error("Organization schema is missing from the source page.");
  }
  html = html.replace(
    schemaPattern,
    (_, open, data, close) =>
      open +
      JSON.stringify({
        ...JSON.parse(data),
        url: siteURL,
        image: socialImageURL,
      }) +
      close,
  );
  await writeFile(
    path.join(root, "dist/sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHTML(siteURL)}</loc></url></urlset>\n`,
  );
}
await writeFile(path.join(root, "dist/index.html"), html);
await writeFile(
  path.join(root, "dist/robots.txt"),
  `User-agent: *\nAllow: /\n${siteURL ? `Sitemap: ${new URL("sitemap.xml", siteURL).href}\n` : ""}`,
);
console.log(
  `Built static website in dist/${siteURL ? ` for ${siteURL}` : " (set SITE_URL for canonical URL and sitemap)"}.`,
);
