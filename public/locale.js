import { messages, uiKannada } from "./translations.js";
import { arts, kannadaArts, galleryEntries, categories } from "./content.js";
import { galleryLabels, categoryLabel } from "./gallery.js";

messages["filter.all"] = {
  en: "All regions",
  kn: "ಎಲ್ಲ ಪ್ರದೇಶಗಳು",
  html: false,
};
for (const category of categories) {
  const count = galleryEntries.filter(
    (entry) => category.id === "all" || entry.category === category.id,
  ).length;
  messages[`category.${category.id}`] = {
    en: `${categoryLabel(category.id, "en")} <span>${count}</span>`,
    kn: `${categoryLabel(category.id, "kn")} <span>${count}</span>`,
    html: true,
  };
  messages[`categoryLabel.${category.id}`] = {
    en: category.en,
    kn: category.kn,
    html: false,
  };
  if (category.id !== "all")
    messages[`shortcut.${category.id}`] = {
      en: category.en,
      kn: category.kn,
      html: false,
    };
}
for (const key of Object.keys(galleryLabels.en))
  messages[`gallery.${key}`] = {
    en: galleryLabels.en[key],
    kn: galleryLabels.kn[key],
    html: false,
  };
messages["shortcuts.eyebrow"] = {
  en: "ONE LAND. MANY EXPRESSIONS.",
  kn: "ಒಂದು ನಾಡು. ಹಲವು ಅಭಿವ್ಯಕ್ತಿಗಳು.",
  html: false,
};
messages["heritage.filterLabel"] = {
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
  messages[`gallery.${key}`] = {
    en: galleryLabels.en[field],
    kn: galleryLabels.kn[field],
    html: false,
  };
}
uiKannada.originalIllustration = "ಈ ಜಾಲತಾಣಕ್ಕಾಗಿ ರಚಿಸಿದ ಮೂಲ ಪರಿಚಯ ಚಿತ್ರಣ.";
uiKannada.suppliedPortraitNote =
  "ಈ ಜಾಲತಾಣಕ್ಕಾಗಿ ಒದಗಿಸಿದ ಭಾವಚಿತ್ರ; ಛಾಯಾಗ್ರಾಹಕರ ಹೆಸರು ತಿಳಿಸಿಲ್ಲ. ಸಾರ್ವಜನಿಕ ಮರುಬಳಕೆಯ ಪರವಾನಗಿಯನ್ನು ಸೂಚಿಸಲಾಗಿಲ್ಲ.";

const uiEnglish = {
  trustName: "Karnataka Janapada Seva Trust",
  presidentName: "T.A. Narayana Gowda",
  vicePresidentName: "Hayath Kargal",
  closeDialog: "Close dialog",
  rootsHeading: "Roots & region",
  importanceHeading: "Why it matters",
  learnMore: "Learn more:",
  photoAttribution: "Photo attribution:",
  viewCreditRegister: "view the image credit register",
  resizedCreditNote: "Images resized; displayed crops vary by screen.",
  ambassadorEyebrow: "YOUR TIME CAN KEEP A TRADITION ALIVE.",
  ambassadorTitle: "Bring your passion.<br>Find your place.",
  ambassadorIntro:
    "Tell the Trust how you would like to take part. Whether you’re an artist, a storyteller or simply someone who cares, your interest matters.",
  yourName: "Your name",
  yourNamePlaceholder: "How should we address you?",
  yourLocation: "Your town or district",
  optional: "(optional)",
  locationPlaceholder: "Where are you based?",
  interestLabel: "I would like to help with",
  interestVolunteering: "Volunteering at cultural gatherings",
  interestLearning: "Teaching or learning a folk art",
  interestDocumentation: "Documenting stories and traditions",
  interestWelfare: "Supporting artist welfare",
  interestOther: "Discussing another way to contribute",
  aboutYou: "A little more about you",
  messagePlaceholder: "Share your skills, interest or questions.",
  whatsappFormNote:
    "The next step opens WhatsApp with your message. You review and send it there. This website does not store your details or register you automatically.",
  continueWhatsApp: "Continue in WhatsApp",
  preferConversation: "Prefer a conversation?",
  callLabel: "Call",
  nameRequired: "Please enter your name.",
  supportEyebrow: "LET’S KEEP OUR ROOTS ALIVE, TOGETHER.",
  supportTitle: "Make room for<br>a living legacy.",
  supportIntro:
    "You can support the Trust through your time, knowledge, resources or a conversation about artist welfare and cultural preservation.",
  startConversation: "Start a conversation",
  supportDetails:
    "Speak with the Trust to discuss the kind of support you have in mind and request the official contribution details.",
  donationNotice:
    "Online donations are not available on this website. Please confirm any contribution arrangements directly with the Trust before making a payment.",
  callSupport: "Call to discuss support",
  contributeTime: "Want to contribute your time?",
  becomeAmbassador: "Become a cultural ambassador",
  creditsEyebrow: "CREATED BY PEOPLE. SHARED WITH CARE.",
  creditsTitle: "The people behind<br>the pictures.",
  creditsLoading: "Loading image credits…",
  creditsIntro:
    "Folk art photography is shared under the licenses linked below. The original creators retain their rights. Resized files retain their original licenses; display crops vary by screen.",
  creditsArtworkNote:
    "Every tradition uses a real photograph. Image captions identify documentary and representative contexts. Hayath Kargal’s portrait was supplied for this website.",
  creditsError: "Image credits could not be loaded.",
  openCreditRegister: "Open the credit register",
  orTryAgain: "or try again.",
  privacyEyebrow: "A LITTLE CLARITY GOES A LONG WAY.",
  privacyTitle: "Your privacy.",
  privacyIntro:
    "This website has no analytics, advertising cookies, accounts or newsletter tracking. Your language preference is saved only on this device. Enquiry details are not saved by this website.",
  privacyContactHeading: "When you contact the Trust",
  privacyContactText:
    "The ambassador form prepares a WhatsApp message. Choosing “Continue in WhatsApp” passes the details you entered to WhatsApp, where its privacy terms apply. You decide whether to send the message. Phone links open your device’s calling application.",
  privacyDeliveryHeading: "Website delivery",
  privacyDeliveryText:
    "The hosting provider may process standard request information to deliver and protect this website. Fonts and photographs are served with the website. External reference and license links open third-party websites.",
  privacyQuestionsHeading: "Questions or corrections",
  contactTrust: "Contact the Trust on",
  photoUnavailable: "Photograph unavailable: {alt}",
  originalIllustration: "Original illustration created for this website.",
  suppliedPortraitNote:
    "Image supplied for this website; photographer not specified. No public reuse license is asserted.",
  galleryCount: "{count} traditions to explore",
  galleryCountOne: "1 tradition to explore",
  whatsappGreeting: "Namaskara Karnataka Janapada Seva Trust,",
  whatsappIntroduction:
    "I would like to get involved as a cultural ambassador.",
  whatsappName: "Name",
  whatsappLocation: "Location",
  whatsappInterest: "Interest",
  whatsappMessage: "Message",
};

let language = "kn";
try {
  const saved = localStorage.getItem("kjst-language");
  if (saved === "kn" || saved === "en") language = saved;
} catch {}
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
    const card = image.closest(".art-card");
    const entry =
      card && galleryEntries.find((item) => item.id === card.dataset.art);
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
  for (const button of document.querySelectorAll("[data-language]")) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.language === language),
    );
  }
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
  for (const image of document.querySelectorAll("[data-shortcut-photo]")) {
    const entry = galleryEntries.find(
      (item) => item.id === image.dataset.shortcutPhoto,
    );
    if (entry) image.alt = entry[language].alt;
  }
  for (const count of document.querySelectorAll("[data-shortcut-count]"))
    count.textContent = `${galleryEntries.filter((entry) => entry.category === count.dataset.shortcutCount).length} ${galleryLabels[language].traditions}`;
  const schemaNode = document.querySelector("#organization-schema");
  const schema = JSON.parse(schemaNode.textContent);
  schema.name = language === "kn" ? uiKannada.trustName : uiEnglish.trustName;
  schema.alternateName =
    language === "kn" ? uiEnglish.trustName : uiKannada.trustName;
  schema.description =
    language === "kn"
      ? "ಕರ್ನಾಟಕದ ಜನಪದ ಪರಂಪರೆ, ಸಂಸ್ಕೃತಿ ಸಂರಕ್ಷಣೆ ಮತ್ತು ಸಮಾಜಸೇವೆಗೆ ಮೀಸಲಾದ ಟ್ರಸ್ಟ್."
      : "A trust focused on Karnataka’s folk heritage, cultural preservation and social welfare.";
  schema.knowsAbout =
    language === "kn"
      ? [
          "ಕರ್ನಾಟಕ ಜನಪದ ಸಂಸ್ಕೃತಿ",
          "ಡೊಳ್ಳು ಕುಣಿತ",
          "ಯಕ್ಷಗಾನ",
          "ವೀರಗಾಸೆ",
          "ಜನಪದ ಕಲೆಗಳ ಸಂರಕ್ಷಣೆ",
        ]
      : [
          "Karnataka Janapada Culture",
          "Dollu Kunitha",
          "Yakshagana",
          "Veeragase",
          "Folk Art Preservation",
        ];
  schemaNode.textContent = JSON.stringify(schema);
  document
    .querySelector('meta[property="og:locale"]')
    ?.setAttribute("content", language === "kn" ? "kn_IN" : "en_IN");
  document
    .querySelector('meta[property="og:locale:alternate"]')
    ?.setAttribute("content", language === "kn" ? "en_IN" : "kn_IN");
  const dialogContent = document.querySelector("#dialog-content");
  if (dialogContent) localizeDynamic(dialogContent);
  updateFailureAlts();
  document.dispatchEvent(
    new CustomEvent("languagechange", { detail: { language } }),
  );
}

export function setLanguage(value) {
  if (value !== "kn" && value !== "en") return;
  language = value;
  try {
    localStorage.setItem("kjst-language", value);
  } catch {}
  applyLanguage();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-language]");
  if (button) setLanguage(button.dataset.language);
});
applyLanguage();
