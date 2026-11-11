import { arts, kannadaArts, galleryEntries, categories } from "./content.js";
import { galleryLabels, categoryLabel, instrumentLabels } from "./gallery.js";
import { uiEnglish, uiKannada } from "./ui-messages.js";
import { getPageMessages } from "./page-messages.js";
import { syncLanguageLinks, languageForLocation, updateHomeLinks, stabilizeDocumentAssets } from "./routes.js";
import { applyPageMetadata } from "./seo.js";
import { localizeTraditionPage } from "./tradition.js";
const messages = getPageMessages();

// Published URLs define the language; a saved preference never changes a crawlable URL.
let language = languageForLocation() || document.documentElement.lang || "kn";
if (!document.documentElement.dataset.pageKind) {
  try {
    const saved = localStorage.getItem("kjst-language");
    if (saved === "kn" || saved === "en") language = saved;
  } catch {}
}
const originalText = new WeakMap();
const originalAttributes = new WeakMap();
const phrases = new Map();
const normalized = (value) => value.replace(/\s+/g, " ").trim();

for (const [key, en] of Object.entries(uiEnglish)) {
  const kn = uiKannada[key];
  if (!kn) continue;
  const enParts = en.split(/<br\s*\/?>/i);
  const knParts = kn.split(/<br\s*\/?>/i);
  enParts.forEach((part, index) =>
    phrases.set(normalized(part), knParts[index] || kn),
  );
}
phrases.set("(optional)", `(${uiKannada.optional})`);
for (const [id, art] of Object.entries(arts)) {
  for (const [field, value] of Object.entries(kannadaArts[id]))
    phrases.set(normalized(art[field]), value);
}
for (const key of Object.keys(galleryLabels.en))
  phrases.set(normalized(galleryLabels.en[key]), galleryLabels.kn[key]);
for (const category of categories)
  phrases.set(normalized(category.en), category.kn);
for (const entry of galleryEntries) {
  phrases.set(normalized(entry.en.alt), entry.kn.alt);
  if (entry.photoCaption.en)
    phrases.set(normalized(entry.photoCaption.en), entry.photoCaption.kn);
}

export function getLanguage() {
  return language;
}
export function t(key) {
  if (messages[key]) return messages[key][language];
  return language === "kn"
    ? uiKannada[key] || uiEnglish[key] || key
    : uiEnglish[key] || key;
}
function phrase(english) {
  if (language === "en") return english;
  const core = normalized(english);
  if (phrases.has(core)) return phrases.get(core);
  if (core.startsWith(". ") && phrases.has(core.slice(2)))
    return ". " + phrases.get(core.slice(2));
  for (const suffix of [" ↗", " →"])
    if (core.endsWith(suffix) && phrases.has(core.slice(0, -suffix.length)))
      return phrases.get(core.slice(0, -suffix.length)) + suffix;
  if (core.startsWith("Call +91")) return uiKannada.callLabel + core.slice(4);
  return english;
}

// Dynamic dialog copy is translated in place, keeping form controls and values.
export function localizeDynamic(root) {
  for (const element of root.querySelectorAll(
    "[alt], [placeholder], [aria-label]",
  )) {
    const attributes = originalAttributes.get(element) || {};
    for (const name of ["alt", "placeholder", "aria-label"]) {
      if (!element.hasAttribute(name)) continue;
      attributes[name] ??= element.getAttribute(name);
      element.setAttribute(name, phrase(attributes[name]));
    }
    originalAttributes.set(element, attributes);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement?.closest(
        "script,style,textarea,[data-language]",
      ) || !node.textContent.trim()
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!originalText.has(node)) originalText.set(node, node.textContent);
    const original = originalText.get(node);
    const core = original.trim();
    node.textContent = original.replace(core, phrase(core));
  }
  updateFailureAlts(root);
}

export function updateFailureAlts(root = document) {
  for (const image of root.querySelectorAll("img[data-fallback-applied]")) {
    const key = image.getAttribute("data-i18n-alt");
    const card = image.closest(".art-card, .instrument-card");
    const entry =
      card && galleryEntries.find((item) => item.id === (card.dataset.art || card.dataset.instrument));
    const base =
      entry?.[language].alt ||
      messages[key]?.[language] ||
      phrase(
        originalAttributes.get(image)?.alt ||
          image.dataset.fallbackAlt ||
          image.alt,
      );
    image.alt = t("photoUnavailable").replace("{alt}", base);
  }
  for (const status of root.querySelectorAll(".photo-unavailable-text"))
    status.textContent = galleryLabels[language].photoUnavailable;
}

function applyLanguage() {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll("[data-i18n]")) {
    const entry = messages[element.dataset.i18n];
    if (!entry) continue;
    if (entry.html) element.innerHTML = entry[language];
    else element.textContent = entry[language];
  }
  for (const attribute of [
    "alt",
    "aria-label",
    "placeholder",
    "content",
    "title",
  ]) {
    for (const element of document.querySelectorAll(
      `[data-i18n-${attribute}]`,
    )) {
      element.setAttribute(
        attribute,
        t(element.getAttribute(`data-i18n-${attribute}`)),
      );
    }
  }
  syncLanguageLinks(language);
  updateHomeLinks(language);
  for (const entry of galleryEntries) {
    const card = document.querySelector(`.art-card[data-art="${entry.id}"]`);
    if (!card) continue;
    const copy = entry[language];
    card.querySelector("h3").textContent = copy.name;
    card.querySelector(".art-category-badge").textContent = categoryLabel(
      entry.category,
      language,
    );
    card.querySelector(".art-region").textContent = copy.region;
    card.querySelector(".art-summary").textContent = copy.summary;
    card.querySelector("img").alt = copy.alt;
    card
      .querySelector(".art-open")
      .setAttribute(
        "aria-label",
        language === "kn" ? `${copy.name} ಪರಿಚಯ` : `Explore ${copy.name}`,
      );
    card.querySelector(".art-cta").innerHTML =
      `${galleryLabels[language].explore} <span aria-hidden="true">→</span>`;
    const caption = card.querySelector(".photo-caption-copy");
    if (caption) caption.textContent = entry.photoCaption[language];
  }
  for (const card of document.querySelectorAll("[data-instrument]")) {
    const entry = galleryEntries.find((item) => item.id === card.dataset.instrument);
    if (!entry) continue;
    const copy = entry[language];
    card.querySelector("h3").textContent = copy.name;
    card.querySelector(".instrument-family").textContent = copy.tag;
    card.querySelector(".instrument-summary").textContent = copy.summary;
    card.querySelector("img").alt = copy.alt;
    card.querySelector(".instrument-open").setAttribute("aria-label",
      language === "kn" ? `${copy.name} ಪರಿಚಯ` : `Explore ${copy.name}`);
    card.querySelector(".instrument-cta").innerHTML =
      `${instrumentLabels[language].explore}<span aria-hidden="true">↗</span>`;
  }
  for (const image of document.querySelectorAll("[data-shortcut-photo]")) {
    const entry = galleryEntries.find(
      (item) => item.id === image.dataset.shortcutPhoto,
    );
    if (entry) image.alt = entry[language].alt;
  }
  for (const count of document.querySelectorAll("[data-shortcut-count]"))
    count.textContent = `${galleryEntries.filter((entry) => entry.category === count.dataset.shortcutCount).length} ${galleryLabels[language].traditions}`;
  localizeTraditionPage(language);
  applyPageMetadata(language);
  const dialogContent = document.querySelector("#dialog-content");
  if (dialogContent) localizeDynamic(dialogContent);
  updateFailureAlts();
  document.dispatchEvent(
    new CustomEvent("languagechange", { detail: { language } }),
  );
}

export function setLanguage(value, { history = true } = {}) {
  if (value !== "kn" && value !== "en") return;
  language = value;
  if (history && document.documentElement.dataset.pageKind) {
    const link = document.querySelector(`[data-language="${value}"]`);
    if (link?.href) {
      const next = new URL(link.href);
      if (next.pathname !== location.pathname) {
        stabilizeDocumentAssets();
        window.history.pushState({}, "", next.pathname + location.hash);
      }
    }
  }
  try {
    localStorage.setItem("kjst-language", value);
  } catch {}
  applyLanguage();
}

document.addEventListener("click", (event) => {
  const control = event.target.closest("[data-language]");
  if (!control || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  setLanguage(control.dataset.language);
});
addEventListener("hashchange", () => syncLanguageLinks(language));

addEventListener("popstate", () => {
  const next = languageForLocation();
  if (next && next !== language) setLanguage(next, { history: false });
});
// Server-rendered pages already contain the correct copy. Avoid rewriting their
// entire DOM on first load; retain the in-place enhancement for language changes.
if (document.documentElement.dataset.pageKind) {
  syncLanguageLinks(language);
  updateHomeLinks(language);
} else applyLanguage();
