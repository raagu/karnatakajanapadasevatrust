import { messages } from "./translations.js";
import { galleryEntries, categories } from "./content.js";
import { galleryLabels, categoryLabel, instrumentLabels } from "./gallery.js";

export function getPageMessages() {
  const pageMessages = { ...messages };
  for (const key of Object.keys(instrumentLabels.en))
    pageMessages[`instruments.${key}`] = {
      en: instrumentLabels.en[key],
      kn: instrumentLabels.kn[key],
      html: false,
    };

  pageMessages["filter.all"] = {
    en: "All regions",
    kn: "ಎಲ್ಲ ಪ್ರದೇಶಗಳು",
    html: false,
  };
  for (const category of categories) {
    const count = galleryEntries.filter(
      (entry) => category.id === "all" || entry.category === category.id,
    ).length;
    pageMessages[`category.${category.id}`] = {
      en: `${categoryLabel(category.id, "en")} <span>${count}</span>`,
      kn: `${categoryLabel(category.id, "kn")} <span>${count}</span>`,
      html: true,
    };
    pageMessages[`categoryLabel.${category.id}`] = {
      en: category.en,
      kn: category.kn,
      html: false,
    };
    if (category.id !== "all")
      pageMessages[`shortcut.${category.id}`] = {
        en: category.en,
        kn: category.kn,
        html: false,
      };
  }
  for (const key of Object.keys(galleryLabels.en))
    pageMessages[`gallery.${key}`] = {
      en: galleryLabels.en[key],
      kn: galleryLabels.kn[key],
      html: false,
    };
  pageMessages["shortcuts.eyebrow"] = {
    en: "ONE LAND. MANY EXPRESSIONS.",
    kn: "ಒಂದು ನಾಡು. ಹಲವು ಅಭಿವ್ಯಕ್ತಿಗಳು.",
    html: false,
  };
  pageMessages["heritage.filterLabel"] = {
    en: galleryLabels.en.regionLabel,
    kn: galleryLabels.kn.regionLabel,
    html: false,
  };
  for (const [key, field] of Object.entries({
    themeLabel: "group",
    categoryLabel: "filterLabel",
    empty: "empty",
    reset: "reset",
  })) {
    pageMessages[`gallery.${key}`] = {
      en: galleryLabels.en[field],
      kn: galleryLabels.kn[field],
      html: false,
    };
  }
  return pageMessages;
}
