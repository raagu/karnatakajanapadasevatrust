import { galleryEntries } from "./content.js";
import { messages } from "./translations.js";
import { uiEnglish, uiKannada } from "./ui-messages.js";
import { languages, routeFor, pageContext } from "./routes.js";

export function pageMetadata(language, id = null, siteURL = "") {
  const entry = id ? galleryEntries.find((item) => item.id === id) : null;
  if (id && !entry) throw new Error(`Unknown tradition: ${id}`);
  const copy = entry?.[language];
  const ui = language === "kn" ? uiKannada : uiEnglish;
  const address = (lang) => siteURL ? new URL(routeFor(lang, id), siteURL).href : "";
  return {
    title: copy ? `${copy.name} | ${ui.trustName}` : messages["meta.title"][language],
    description: copy ? `${copy.name} — ${copy.summary}` : messages["meta.description"][language],
    ogTitle: copy ? `${copy.name} | ${ui.trustName}` : messages["meta.ogTitle"][language],
    ogDescription: copy?.summary || messages["meta.ogDescription"][language],
    socialAlt: copy?.alt || messages["meta.socialAlt"][language],
    image: copy ? entry.imageSrc : "/images/social-card.jpg",
    canonical: address(language),
    alternates: siteURL ? [...languages.map((lang) => ({ language: lang, href: address(lang) })), { language: "x-default", href: address("kn") }] : [],
  };
}

export function organizationData(template, language, siteURL = "") {
  const ui = language === "kn" ? uiKannada : uiEnglish;
  const result = {
    ...template,
    name: ui.trustName,
    alternateName: language === "kn" ? uiEnglish.trustName : uiKannada.trustName,
    description: language === "kn"
      ? "ಕರ್ನಾಟಕದ ಜನಪದ ಪರಂಪರೆ, ಸಂಸ್ಕೃತಿ ಸಂರಕ್ಷಣೆ ಮತ್ತು ಸಮಾಜಸೇವೆಗೆ ಮೀಸಲಾದ ಟ್ರಸ್ಟ್."
      : "A trust focused on Karnataka’s folk heritage, cultural preservation and social welfare.",
    knowsAbout: language === "kn"
      ? ["ಕರ್ನಾಟಕ ಜನಪದ ಸಂಸ್ಕೃತಿ", "ಡೊಳ್ಳು ಕುಣಿತ", "ಯಕ್ಷಗಾನ", "ವೀರಗಾಸೆ", "ಜನಪದ ಕಲೆಗಳ ಸಂರಕ್ಷಣೆ"]
      : ["Karnataka Janapada Culture", "Dollu Kunitha", "Yakshagana", "Veeragase", "Folk Art Preservation"],
  };
  if (siteURL) {
    result["@id"] = siteURL + "#organization";
    result.url = siteURL;
    result.image = new URL("images/social-card.jpg", siteURL).href;
    result.logo = new URL("images/emblem.svg", siteURL).href;
  }
  return result;
}

export function pageStructuredData(language, id = null, siteURL = "") {
  const meta = pageMetadata(language, id, siteURL);
  const ui = language === "kn" ? uiKannada : uiEnglish;
  const entry = id && galleryEntries.find((item) => item.id === id);
  const publisher = siteURL ? { "@id": siteURL + "#organization" } : { "@type": "NGO", name: ui.trustName };
  const graph = [
    { "@type": "WebSite", name: ui.trustName, inLanguage: ["kn", "en"], publisher, ...(siteURL ? { "@id": siteURL + "#website", url: siteURL } : {}) },
    { "@type": "WebPage", name: meta.title, description: meta.description, inLanguage: language, ...(siteURL ? { "@id": meta.canonical + "#webpage", url: meta.canonical, isPartOf: { "@id": siteURL + "#website" } } : {}) },
  ];
  if (entry) {
    graph.push({ "@type": "Article", headline: entry[language].name, description: entry[language].summary, inLanguage: language, publisher, citation: entry[language].source || entry.en.source,
      ...(siteURL ? { "@id": meta.canonical + "#article", mainEntityOfPage: { "@id": meta.canonical + "#webpage" }, image: new URL(entry.imageSrc.slice(1), siteURL).href } : {}) });
    if (siteURL) graph.push({ "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: messages["nav.heritage"][language], item: new URL(routeFor(language), siteURL).href + "#heritage" },
      { "@type": "ListItem", position: 2, name: entry[language].name, item: meta.canonical },
    ] });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export const jsonForHTML = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

export function applyPageMetadata(language) {
  const { id, siteURL } = pageContext();
  const meta = pageMetadata(language, id, siteURL);
  document.title = meta.title;
  const values = {
    'meta[name="description"]': meta.description,
    'meta[property="og:type"]': id ? "article" : "website",
    'meta[property="og:title"]': meta.ogTitle,
    'meta[property="og:description"]': meta.ogDescription,
    'meta[property="og:image:alt"]': meta.socialAlt,
    'meta[name="twitter:title"]': meta.title,
    'meta[name="twitter:description"]': meta.description,
    'meta[property="og:locale"]': language === "kn" ? "kn_IN" : "en_IN",
    'meta[property="og:locale:alternate"]': language === "kn" ? "en_IN" : "kn_IN",
  };
  if (siteURL) {
    values['meta[property="og:url"]'] = meta.canonical;
    const image = new URL(meta.image.slice(1), siteURL).href;
    values['meta[property="og:image"]'] = image;
    values['meta[name="twitter:image"]'] = image;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", meta.canonical);
    for (const alternate of meta.alternates)
      document.querySelector(`link[hreflang="${alternate.language}"]`)?.setAttribute("href", alternate.href);
  }
  for (const [selector, value] of Object.entries(values))
    document.querySelector(selector)?.setAttribute("content", value);
  const organization = document.querySelector("#organization-schema");
  if (organization) organization.textContent = jsonForHTML(organizationData(JSON.parse(organization.textContent), language, siteURL));
  const page = document.querySelector("#page-schema");
  if (page) page.textContent = jsonForHTML(pageStructuredData(language, id, siteURL));
}
