import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { renderHeritageHTML } from "../public/gallery.js";

const root = path.resolve(import.meta.dirname, "..");
let origin = process.env.SITE_URL;
try {
  const hosting = JSON.parse(
    await readFile(path.join(root, ".openai/hosting.json"), "utf8"),
  );
  origin ||= hosting.expected_url;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (origin) {
  const url = new URL(origin);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/"
  )
    throw new Error("SITE_URL must be a plain HTTPS origin.");
  origin = url.origin;
}
await rm(path.join(root, "dist"), { recursive: true, force: true });
await mkdir(path.join(root, "dist"), { recursive: true });
await cp(path.join(root, "public"), path.join(root, "dist"), {
  recursive: true,
});
let html = await readFile(path.join(root, "dist/index.html"), "utf8");
html = renderHeritageHTML(html);
if (origin) {
  html = html
    .replace(
      "</head>",
      `  <link rel="canonical" href="${origin}/">\n  <meta property="og:url" content="${origin}/">\n</head>`,
    )
    .replaceAll(
      'content="/images/social-card.jpg"',
      `content="${origin}/images/social-card.jpg"`,
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
        url: `${origin}/`,
        image: `${origin}/images/social-card.jpg`,
      }) +
      close,
  );
  await writeFile(
    path.join(root, "dist/sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>\n`,
  );
}
await writeFile(path.join(root, "dist/index.html"), html);
await writeFile(
  path.join(root, "dist/robots.txt"),
  `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ""}`,
);
console.log(
  `Built static website in dist/${origin ? ` for ${origin}` : " (set SITE_URL for canonical URL and sitemap)"}.`,
);
