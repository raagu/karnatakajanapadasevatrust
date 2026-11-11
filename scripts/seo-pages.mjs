import { parse, parseFragment, serialize } from "parse5";
import { getPageMessages } from "../public/page-messages.js";
import { renderHeritageHTML, escapeHTML } from "../public/gallery.js";
import { galleryEntries } from "../public/content.js";
import { routeFor } from "../public/routes.js";
import { pageMetadata, organizationData, pageStructuredData, jsonForHTML } from "../public/seo.js";
import { renderTradition } from "../public/tradition.js";

const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
function setAttr(node, name, value) {
  node.attrs ||= [];
  const existing = node.attrs.find((item) => item.name === name);
  if (existing) existing.value = String(value);
  else node.attrs.push({ name, value: String(value) });
}
function nodes(root) {
  const all = [];
  function visit(node) { all.push(node); for (const child of node.childNodes || []) visit(child); }
  visit(root); return all;
}
function content(node, html) {
  node.childNodes = parseFragment(node, html).childNodes;
  for (const child of node.childNodes) child.parentNode = node;
}
function text(node, value) {
  node.childNodes = [{ nodeName: "#text", value: String(value), parentNode: node }];
}
function append(head, html) {
  for (const node of parseFragment(html).childNodes) { node.parentNode = head; head.childNodes.push(node); }
}

export function renderSeoPage(source, language, id, siteURL, media) {
  const doc = parse(renderHeritageHTML(source, language));
  const all = nodes(doc), messages = getPageMessages();
  const html = all.find((node) => node.tagName === "html");
  const head = all.find((node) => node.tagName === "head");
  const main = all.find((node) => node.tagName === "main");
  const route = routeFor(language, id);
  const prefix = route ? "../".repeat(route.split("/").filter(Boolean).length) : "./";
  const meta = pageMetadata(language, id, siteURL);
  setAttr(html, "lang", language);
  setAttr(html, "data-page-language", language);
  setAttr(html, "data-page-kind", id ? "tradition" : "home");
  if (id) setAttr(html, "data-tradition-id", id);
  if (siteURL) setAttr(html, "data-site-url", siteURL);

  for (const node of all) {
    const key = attr(node, "data-i18n");
    const copy = messages[key];
    if (copy) copy.html ? content(node, copy[language]) : text(node, copy[language]);
    for (const name of ["alt", "aria-label", "placeholder", "content", "title"]) {
      const value = messages[attr(node, "data-i18n-" + name)]?.[language];
      if (value !== undefined) setAttr(node, name, value);
    }
  }
  // Rewalk after translating rich text: those nodes may contain links or images.
  for (const node of nodes(doc)) {
    for (const name of ["src", "href"]) {
      const value = attr(node, name);
      if (value?.startsWith("./") && !node.attrs?.some((a) => a.name === "data-art-open"))
        setAttr(node, name, prefix + value.slice(2));
    }
    const srcset = attr(node, "srcset");
    if (srcset) setAttr(node, "srcset", srcset.replace(/\.\//g, prefix));
    const art = attr(node, "data-art-open");
    if (art) setAttr(node, "href", prefix + routeFor(language, art));
    const href = attr(node, "href");
    if (node.tagName === "a" && href?.startsWith("#") && href !== "#main") {
      setAttr(node, "data-home-anchor", href);
      if (id) setAttr(node, "href", prefix + routeFor(language) + href);
    }
    const lang = attr(node, "data-language");
    if (lang) {
      node.nodeName = node.tagName = "a";
      node.attrs = node.attrs.filter((a) => !["type", "aria-pressed"].includes(a.name));
      setAttr(node, "href", prefix + routeFor(lang, id));
      setAttr(node, "hreflang", lang);
      if (lang === language) setAttr(node, "aria-current", "page");
    }
  }
  if (id) {
    const entry = galleryEntries.find((item) => item.id === id);
    const photo = media.find((item) => item.id === entry.mediaId);
    if (!photo) throw new Error(`Missing image provenance for ${id}`);
    content(main, `<div class="tradition-content">${renderTradition(entry, language, photo, (src) => prefix + src.slice(1), prefix + routeFor(language) + "#heritage")}</div>`);
    append(head, `<script type="application/json" id="tradition-media">${jsonForHTML(photo)}</script>`);
  }
  for (const node of nodes(head)) {
    if (node.tagName === "title") text(node, meta.title);
    const key = attr(node, "property") || attr(node, "name");
    const values = { "og:type": id ? "article" : "website", description: meta.description, "og:title": meta.ogTitle, "og:description": meta.ogDescription, "og:image:alt": meta.socialAlt, "twitter:title": meta.title, "twitter:description": meta.description, "og:locale": language === "kn" ? "kn_IN" : "en_IN", "og:locale:alternate": language === "kn" ? "en_IN" : "kn_IN" };
    if (key in values) setAttr(node, "content", values[key]);
    if (["og:image", "twitter:image"].includes(key)) setAttr(node, "content", siteURL ? new URL(meta.image.slice(1), siteURL).href : prefix + meta.image.slice(1));
    if (attr(node, "id") === "organization-schema")
      text(node, jsonForHTML(organizationData(JSON.parse(node.childNodes.map((c) => c.value || "").join("")), language, siteURL)));
  }
  append(head, `<script type="application/ld+json" id="page-schema">${jsonForHTML(pageStructuredData(language, id, siteURL))}</script>`);
  if (siteURL) {
    append(head, `<link rel="canonical" href="${escapeHTML(meta.canonical)}"><meta property="og:url" content="${escapeHTML(meta.canonical)}">`);
    for (const alternate of meta.alternates)
      append(head, `<link rel="alternate" hreflang="${alternate.language}" href="${escapeHTML(alternate.href)}">`);
  }
  return serialize(doc);
}
