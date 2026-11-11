export const languages = Object.freeze(["kn", "en"]);

export function routeFor(language, id = null) {
  if (!languages.includes(language)) throw new Error("Unsupported page language.");
  if (id !== null && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error("Invalid tradition identifier.");
  const prefix = language === "en" ? "en/" : "";
  return id ? `${prefix}traditions/${id}/` : prefix;
}

export function pageContext() {
  const html = document.documentElement;
  return { id: html.dataset.traditionId || null, siteURL: html.dataset.siteUrl || "" };
}

export function pageAddress(language, id = pageContext().id) {
  return new URL(routeFor(language, id), new URL("./", import.meta.url));
}

export function languageForLocation() {
  if (typeof document === "undefined") return null;
  const pathname = location.pathname.replace(/index\.html$/, "");
  for (const language of languages)
    if (pathname === pageAddress(language).pathname) return language;
  return null;
}

// History navigation changes document-relative URLs. Freeze loaded and lazy assets
// first, so the same DOM remains valid when / and /en/ have different depths.
export function stabilizeDocumentAssets() {
  const base = location.href;
  for (const image of document.images) {
    if (image.getAttribute("src")) image.src = new URL(image.getAttribute("src"), base).href;
    if (image.hasAttribute("srcset")) image.srcset = image.getAttribute("srcset").replace(/(^|,\s*)(\S+)/g, (_, separator, source) => separator + new URL(source, base).href);
  }
  for (const link of document.querySelectorAll('link[rel="icon"],link[rel="stylesheet"],link[rel="preload"]'))
    if (link.getAttribute("href")) link.href = new URL(link.getAttribute("href"), base).href;
}

export function syncLanguageLinks(language) {
  for (const control of document.querySelectorAll("[data-language]")) {
    const active = control.dataset.language === language;
    if (control.tagName === "A") {
      control.href = pageAddress(control.dataset.language).href + location.hash;
      control.removeAttribute("aria-pressed");
      if (active) control.setAttribute("aria-current", "page");
      else control.removeAttribute("aria-current");
    } else control.setAttribute("aria-pressed", String(active));
  }
  document.documentElement.dataset.pageLanguage = language;
}

export function updateHomeLinks(language) {
  for (const link of document.querySelectorAll("a[data-home-anchor]")) {
    link.href = document.documentElement.dataset.pageKind === "tradition"
      ? pageAddress(language, null).href + link.dataset.homeAnchor
      : link.dataset.homeAnchor;
  }
  for (const link of document.querySelectorAll("a[data-art-open]"))
    link.href = pageAddress(language, link.dataset.artOpen).href;
}
