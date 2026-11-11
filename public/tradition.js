import { galleryEntries, categories } from "./content.js";
import { escapeHTML, assetPath, galleryLabels } from "./gallery.js";
import { messages } from "./translations.js";
import { uiEnglish, uiKannada } from "./ui-messages.js";
import { pageAddress } from "./routes.js";

export function renderTradition(entry, language, media, asset = (src) => src.replace(/^\//, "./"), home = "./#heritage") {
  const copy = entry[language];
  const ui = language === "kn" ? uiKannada : uiEnglish;
  const source = copy.source || entry.en.source;
  const category = categories.find((item) => item.id === entry.category);
  const credit = media.rightsType === "user-supplied"
    ? `<a href="${escapeHTML(media.source)}" target="_blank" rel="noopener noreferrer">${escapeHTML(copy.name)}</a> · ${escapeHTML(ui.suppliedPortraitNote)}`
    : `<a href="${escapeHTML(media.source)}" target="_blank" rel="noopener noreferrer">${escapeHTML(media.title)}</a> · ${escapeHTML(media.creator)} · <a href="${escapeHTML(media.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(media.license)}</a>. ${escapeHTML(ui.resizedCreditNote)}`;
  const responsive = entry.smallImageWidth < entry.imageWidth
    ? `srcset="${escapeHTML(asset(entry.smallImageSrc))} ${entry.smallImageWidth}w, ${escapeHTML(asset(entry.imageSrc))} ${entry.imageWidth}w" sizes="(max-width: 760px) 100vw, 960px"` : "";
  return `<nav class="tradition-breadcrumb" aria-label="${language === "kn" ? "ಪುಟದ ಹಾದಿ" : "Breadcrumb"}"><a href="${escapeHTML(home)}">${escapeHTML(messages["nav.heritage"][language])}</a><span aria-hidden="true"> / </span><span aria-current="page">${escapeHTML(copy.name)}</span></nav><article class="tradition-page"><figure class="dialog-media"><img class="dialog-photo photo-${entry.id}${entry.photoFit === "contain" ? " photo-contain" : ""}" data-tradition-photo="${entry.id}" src="${escapeHTML(asset(entry.imageSrc))}" ${responsive} width="${entry.imageWidth}" height="${media.height}" alt="${escapeHTML(copy.alt)}" fetchpriority="high">${entry.photoCaption[language] ? `<figcaption class="dialog-photo-caption"><strong>${galleryLabels[language].contextPhoto}</strong>: ${escapeHTML(entry.photoCaption[language])}</figcaption>` : ""}</figure><div class="dialog-inner"><div class="dialog-category">${escapeHTML(category[language])}</div><p class="eyebrow">${escapeHTML(copy.region)}</p><h1 id="tradition-heading">${escapeHTML(copy.name)}</h1><p class="tradition-summary">${escapeHTML(copy.summary)}</p><h2>${escapeHTML(ui.rootsHeading)}</h2><p>${escapeHTML(copy.origin)}</p><h2>${escapeHTML(ui.importanceHeading)}</h2><p>${escapeHTML(copy.importance)}</p><p class="source-note">${escapeHTML(ui.learnMore)} <a href="${escapeHTML(source)}" target="_blank" rel="noopener noreferrer">${escapeHTML(copy.sourceName)} ↗</a></p><p class="source-note">${escapeHTML(ui.photoAttribution)} ${credit}</p></div></article>`;
}

export function localizeTraditionPage(language) {
  const root = document.querySelector(".tradition-content");
  if (!root) return;
  const entry = galleryEntries.find((item) => item.id === document.documentElement.dataset.traditionId);
  const media = JSON.parse(document.querySelector("#tradition-media").textContent);
  root.innerHTML = renderTradition(entry, language, media, assetPath, pageAddress(language, null).href + "#heritage");
}
