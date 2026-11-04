import { galleryEntries, categories } from "./content.js";

// Keep local assets inside the site's directory, including on project Pages URLs.
export const assetPath = (value) => value.replace(/^\/(?!\/)/, "./");

export const galleryLabels = {
  en: {
    group: "Choose your interest",
    regionAll: "All regions",
    explore: "Discover story",
    filterLabel: "Filter traditions by theme",
    empty:
      "No traditions match your search and filters. Clear the filters or try another name.",
    reset: "Clear filters",
    searchLabel: "Search Karnataka’s traditions",
    searchPlaceholder: "Search in Kannada or English…",
    clearSearch: "Clear search",
    photoUnavailable: "Photo temporarily unavailable",
    contextPhoto: "Photo context",
    shortcutsTitle: "Find your connection",
    shortcutsIntro: "Four ways to discover Karnataka’s living heritage.",
    traditions: "traditions",
    searchHint: "Try “Yakshagana”, “ಕಿನ್ನಾಳ” or a region",
    activeFilters: "Your filters",
    regionLabel: "Filter traditions by associated region",
  },
  kn: {
    group: "ನಿಮ್ಮ ಆಸಕ್ತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    regionAll: "ಎಲ್ಲ ಪ್ರದೇಶಗಳು",
    explore: "ವಿವರ ತಿಳಿಯಿರಿ",
    filterLabel: "ವಿಷಯದ ಪ್ರಕಾರ ಪರಂಪರೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    empty:
      "ನಿಮ್ಮ ಹುಡುಕಾಟ ಮತ್ತು ಆಯ್ಕೆಗಳಿಗೆ ಹೊಂದುವ ಪರಂಪರೆಗಳಿಲ್ಲ. ಆಯ್ಕೆಗಳನ್ನು ಅಳಿಸಿ ಅಥವಾ ಬೇರೆ ಹೆಸರು ಹುಡುಕಿ.",
    reset: "ಆಯ್ಕೆಗಳನ್ನು ಅಳಿಸಿ",
    searchLabel: "ಕರ್ನಾಟಕದ ಪರಂಪರೆಗಳನ್ನು ಹುಡುಕಿ",
    searchPlaceholder: "ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಹುಡುಕಿ…",
    clearSearch: "ಹುಡುಕಾಟವನ್ನು ಅಳಿಸಿ",
    photoUnavailable: "ಛಾಯಾಚಿತ್ರ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ",
    contextPhoto: "ಛಾಯಾಚಿತ್ರದ ಸಂದರ್ಭ",
    shortcutsTitle: "ನಿಮ್ಮ ಆಸಕ್ತಿಯ ಪರಂಪರೆಯತ್ತ",
    shortcutsIntro: "ಕರ್ನಾಟಕದ ಜೀವಂತ ಪರಂಪರೆಯನ್ನು ಅರಿಯಲು ನಾಲ್ಕು ದಾರಿಗಳು.",
    traditions: "ಪರಂಪರೆಗಳು",
    searchHint: "“ಯಕ್ಷಗಾನ”, “ಕಿನ್ನಾಳ” ಅಥವಾ ಪ್ರದೇಶದ ಹೆಸರು ಹುಡುಕಿ",
    activeFilters: "ನಿಮ್ಮ ಆಯ್ಕೆಗಳು",
    regionLabel: "ಸಂಬಂಧಿತ ಪ್ರದೇಶದ ಪ್ರಕಾರ ಪರಂಪರೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
  },
};
export const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const categoryShort = {
  all: { en: "All", kn: "ಎಲ್ಲ" },
  literature: { en: "Literature", kn: "ಸಾಹಿತ್ಯ" },
  music: { en: "Music", kn: "ಸಂಗೀತ" },
  dance: { en: "Performance", kn: "ರಂಗಕಲೆ" },
  crafts: { en: "Crafts", kn: "ಕರಕುಶಲ" },
};
export function categoryLabel(id, language) {
  return categoryShort[id][language];
}

export function renderGallery(language = "kn") {
  for (const entry of galleryEntries) {
    if (entry.illustrated || !/\.jpe?g$/i.test(entry.imageSrc))
      throw new Error(
        `A reviewed real photograph is required for ${entry.id}.`,
      );
  }
  const labels = galleryLabels[language];
  return `<div class="art-grid">${galleryEntries
    .map((entry) => {
      const copy = entry[language];
      const category = categories.find(
        (category) => category.id === entry.category,
      );
      const responsive = entry.smallImageSrc
        ? `srcset="${escapeHTML(assetPath(entry.smallImageSrc))} 640w, ${escapeHTML(assetPath(entry.imageSrc))} 1200w" sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"`
        : "";
      const photoClass = ` class="art-photo photo-${entry.id}${entry.photoFit === "contain" ? " photo-contain" : ""}"`;
      return `<article class="art-card" data-regions="${entry.regions.join(" ")}" data-category-card="${entry.category}" data-art="${entry.id}"><button type="button" class="art-open" data-art-open="${entry.id}" aria-label="${escapeHTML(language === "kn" ? copy.name + " ಪರಿಚಯ" : "Explore " + copy.name)}"><div class="art-image"><img${photoClass} src="${escapeHTML(assetPath(entry.imageSrc))}" ${responsive} width="1200" height="800" alt="${escapeHTML(copy.alt)}" loading="lazy"><span class="art-category-badge">${escapeHTML(categoryShort[entry.category][language])}</span><span class="art-arrow" aria-hidden="true">↗</span></div><div class="art-body"><p class="art-region">${escapeHTML(copy.region)}</p><h3>${escapeHTML(copy.name)}</h3><p class="art-summary">${escapeHTML(copy.summary)}</p><span class="art-cta">${labels.explore}<span aria-hidden="true">→</span></span></div></button>${entry.photoCaption[language] ? `<p class="art-photo-caption"><span data-i18n="gallery.contextPhoto">${labels.contextPhoto}</span>: <span class="photo-caption-copy">${escapeHTML(entry.photoCaption[language])}</span></p>` : ""}</article>`;
    })
    .join(
      "",
    )}</div><div class="gallery-empty" hidden><span aria-hidden="true">⌕</span><p data-i18n="gallery.empty">${labels.empty}</p></div>`;
}
export function renderCategories(language = "kn") {
  return `<div class="gallery-categories"><p class="gallery-group-label" data-i18n="gallery.themeLabel">${galleryLabels[language].group}</p><div class="category-filters" role="group" aria-label="${galleryLabels[language].filterLabel}" data-i18n-aria-label="gallery.categoryLabel">${categories.map((category) => `<button type="button" class="category-filter${category.id === "all" ? " is-active" : ""}" data-category="${category.id}" aria-pressed="${category.id === "all"}" data-i18n="category.${category.id}" data-i18n-aria-label="categoryLabel.${category.id}" aria-label="${escapeHTML(category[language])}">${escapeHTML(categoryShort[category.id][language])}<span>${galleryEntries.filter((entry) => category.id === "all" || entry.category === category.id).length}</span></button>`).join("")}</div></div>`;
}
export function renderRegions(language = "kn") {
  const regions = [
    { id: "all", en: "All regions", kn: "ಎಲ್ಲ ಪ್ರದೇಶಗಳು" },
    { id: "karavali", en: "Karavali", kn: "ಕರಾವಳಿ" },
    { id: "bayaluseeme", en: "Bayaluseeme", kn: "ಬಯಲುಸೀಮೆ" },
    { id: "malenadu", en: "Malenadu", kn: "ಮಲೆನಾಡು" },
  ];
  return `<div class="region-filters" role="group" aria-label="${galleryLabels[language].regionLabel}" data-i18n-aria-label="heritage.filterLabel">${regions.map((region) => `<button type="button" class="filter${region.id === "all" ? " is-active" : ""}" data-filter="${region.id}" aria-pressed="${region.id === "all"}" data-i18n="filter.${region.id}">${region[language]}</button>`).join("")}</div>`;
}
export function renderExplorerControls(language = "kn") {
  const labels = galleryLabels[language];
  return `<div class="heritage-controls"><div class="heritage-search-bar"><div class="heritage-search" role="search"><label for="heritage-search" data-i18n="gallery.searchLabel">${labels.searchLabel}</label><div class="search-input-wrap"><span class="search-icon" aria-hidden="true">⌕</span><input type="search" id="heritage-search" autocomplete="off" maxlength="120" aria-label="${labels.searchLabel}" placeholder="${labels.searchPlaceholder}" data-i18n-aria-label="gallery.searchLabel" data-i18n-placeholder="gallery.searchPlaceholder"><button type="button" class="search-clear" data-clear-search aria-label="${labels.clearSearch}" data-i18n-aria-label="gallery.clearSearch" hidden>×</button></div></div><button type="button" class="text-button clear-filters" data-reset-gallery data-i18n="gallery.reset" disabled>${labels.reset}</button></div>${renderCategories(language)}<div class="gallery-toolbar">${renderRegions(language)}<p id="gallery-count" class="gallery-count" aria-live="polite" aria-atomic="true">${language === "kn" ? `ಪರಿಚಯಿಸಿಕೊಳ್ಳಲು ${galleryEntries.length} ಕಲಾಪರಂಪರೆಗಳು` : `${galleryEntries.length} traditions to explore`}</p></div><div class="active-filter-list" aria-label="${labels.activeFilters}" data-i18n-aria-label="gallery.activeFilters"></div></div>`;
}
export function renderShortcuts(language = "kn") {
  const labels = galleryLabels[language];
  const samples = {
    literature: "folk-tales",
    music: "sobane",
    dance: "yakshagana",
    crafts: "kinhal",
  };
  return `<section class="category-shortcuts section" aria-labelledby="shortcut-heading"><div class="section-heading-row"><div><p class="eyebrow" data-i18n="shortcuts.eyebrow">${language === "kn" ? "ಒಂದು ನಾಡು. ಹಲವು ಅಭಿವ್ಯಕ್ತಿಗಳು." : "ONE LAND. MANY EXPRESSIONS."}</p><h2 id="shortcut-heading" data-i18n="gallery.shortcutsTitle">${labels.shortcutsTitle}</h2></div><p data-i18n="gallery.shortcutsIntro">${labels.shortcutsIntro}</p></div><div class="shortcut-grid">${categories
    .filter((category) => category.id !== "all")
    .map((category) => {
      const entry = galleryEntries.find(
        (item) => item.id === samples[category.id],
      );
      return `<a class="category-shortcut" href="#heritage" data-browse-category="${category.id}"><img src="${escapeHTML(assetPath(entry.smallImageSrc || entry.imageSrc))}" width="640" height="420" loading="lazy" alt="${escapeHTML(entry[language].alt)}" data-shortcut-photo="${entry.id}"><div><span class="shortcut-count" data-shortcut-count="${category.id}">${galleryEntries.filter((entry) => entry.category === category.id).length} ${labels.traditions}</span><h3 data-i18n="shortcut.${category.id}">${category[language]}</h3><span class="shortcut-arrow" aria-hidden="true">↗</span></div></a>`;
    })
    .join("")}</div></section>`;
}
function replaceBlock(html, start, end, content) {
  const a = html.indexOf(start);
  const b = html.indexOf(end, a + start.length);
  if (a < 0 || b < 0)
    throw new Error(`Missing gallery template marker ${start}`);
  return html.slice(0, a) + start + content + end + html.slice(b + end.length);
}
export function renderHeritageHTML(html) {
  html = replaceBlock(
    html,
    "<!-- heritage-gallery:start -->",
    "<!-- heritage-gallery:end -->",
    renderGallery("kn"),
  );
  if (html.includes("<!-- heritage-controls:start -->"))
    html = replaceBlock(
      html,
      "<!-- heritage-controls:start -->",
      "<!-- heritage-controls:end -->",
      renderExplorerControls("kn"),
    );
  else {
    const a = html.indexOf("<!-- heritage-categories:start -->");
    const b = html.indexOf("<!-- heritage-gallery:start -->", a);
    if (a < 0 || b < 0) throw new Error("Missing legacy gallery controls");
    html =
      html.slice(0, a) +
      "<!-- heritage-controls:start -->" +
      renderExplorerControls("kn") +
      "<!-- heritage-controls:end -->" +
      html.slice(b);
  }
  if (html.includes("<!-- heritage-shortcuts:start -->"))
    html = replaceBlock(
      html,
      "<!-- heritage-shortcuts:start -->",
      "<!-- heritage-shortcuts:end -->",
      renderShortcuts("kn"),
    );
  else
    html = html.replace(
      '<section id="about"',
      "<!-- heritage-shortcuts:start -->" +
        renderShortcuts("kn") +
        '<!-- heritage-shortcuts:end --><section id="about"',
    );
  // The source may have a formatted multi-line opening section tag.
  if (!html.includes("<!-- heritage-shortcuts:start -->"))
    html = html.replace(
      /<section\s+id="about"/,
      "<!-- heritage-shortcuts:start -->" +
        renderShortcuts("kn") +
        '<!-- heritage-shortcuts:end --><section id="about"',
    );
  html = html.replace(
    /<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/,
    `<noscript><p>${galleryEntries.length} ಕಲಾಪರಂಪರೆಗಳನ್ನೂ ಇಲ್ಲಿ ಕಾಣಬಹುದು. ಹುಡುಕಾಟ, ವಿಷಯ ಮತ್ತು ಪ್ರದೇಶದ ಆಯ್ಕೆಗಳಿಗೆ ಜಾವಾಸ್ಕ್ರಿಪ್ಟ್ ಸಕ್ರಿಯಗೊಳಿಸಿ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗೆ <a href="tel:+919902122029">99021 22029</a> ಸಂಖ್ಯೆಗೆ ಕರೆಮಾಡಿ.</p></noscript>`,
  );
  return html;
}
