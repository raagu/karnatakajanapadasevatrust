import { uiKannada, messages, knArts } from "./translations.js";
import { expandedTraditions as originalExpansion } from "./heritage-expansion.js";
import { heritageAdditions } from "./heritage-additions.js";
import { photoAssets } from "./photo-assets.js";
const expandedTraditions = [...originalExpansion, ...heritageAdditions];
export const CONTACT = Object.freeze({
  phone: "+919902122029",
  display: "+91 99021 22029",
  whatsapp: "919902122029",
});

export const arts = {
  dollu: {
    name: "Dollu Kunitha",
    region: "North Karnataka roots · Practised across Karnataka",
    image: "dollu",
    mediaId: "dollu-kunitha",
    origin:
      "Rooted in the Kuruba community and the worship of Beeralingeshwara, Dollu Kunitha is closely associated with North Karnataka. Its powerful rhythms are now heard at celebrations across the state.",
    importance:
      "Large wooden drums, coordinated steps and a shared pulse bring the performers together. The dance carries ritual devotion and expresses the strength of collective participation.",
    source: "https://karnatakatourism.org/en/experiences/dollu-kunitha/",
    sourceName: "Karnataka Tourism",
  },
  yakshagana: {
    name: "Yakshagana",
    region: "Karavali & Malenadu · Coastal Karnataka",
    image: "yakshagana",
    mediaId: "yakshagana",
    origin:
      "Closely associated with coastal Karnataka, including Udupi, Dakshina Kannada and Uttara Kannada, Yakshagana also has strong connections to Malenadu.",
    importance:
      "Music, dance, dialogue and expressive costumes bring epic narratives to the stage. Stories drawn from the Ramayana and Mahabharata become a shared encounter between performers and their audiences.",
    source: "https://karnatakatourism.org/en/experiences/yakshagana/",
    sourceName: "Karnataka Tourism",
  },
  veeragase: {
    name: "Veeragase",
    region: "Central & Southern Karnataka",
    image: "veeragase",
    mediaId: "veeragase",
    origin:
      "A Shaivite performance tradition associated with Veerabhadra, Veeragase is seen in processions and festivals in Karnataka, including Mysuru Dasara.",
    importance:
      "Forceful movements, percussion and ceremonial dress give shape to stories of valour and devotion. The performance carries both spiritual significance and the energy of a community celebration.",
    source: "https://karnatakatourism.org/en/experiences/veeragase/",
    sourceName: "Karnataka Tourism",
  },
  kamsale: {
    name: "Kamsale",
    region: "Old Mysuru · Male Mahadeshwara Hills",
    image: "kamsale",
    mediaId: "kamsale",
    origin:
      "Connected with devotion to Male Mahadeshwara, Kamsale is associated with the Mysuru, Chamarajanagar and Mandya regions and the Male Mahadeshwara Hills.",
    importance:
      "Performers combine singing and movement with paired metal percussion discs. In Beesu Kamsale, rhythmic patterns and skillful movement turn devotional storytelling into a vivid communal experience.",
    source:
      "https://karnatakatourism.org/en/events/kamsale-nrutya-kamsale-dance/",
    sourceName: "Karnataka Tourism",
  },
  puppetry: {
    name: "Togalu Gombeyaata",
    region: "North & Central Karnataka",
    image: "puppetry",
    mediaId: "togalu-gombeyaata",
    origin:
      "Karnataka’s leather shadow-puppet tradition is associated with communities in northern and central districts, including Ballari and Chitradurga.",
    importance:
      "Painted leather figures, a lit screen, music and narration create a theatre of moving shadows. The puppeteers carry stories through both crafted objects and the spoken word.",
    source: "https://ccrtindia.gov.in/wp-content/uploads/2020/09/Pub_AOP1.pdf",
    sourceName: "Centre for Cultural Resources and Training",
  },
  songs: {
    name: "Janapada Geethegalu & Sobane Pada",
    region: "Rural communities across Karnataka",
    image: "songs",
    mediaId: "folk-songs",
    origin:
      "Karnataka’s folk songs grow from the rhythms of everyday life: work, harvest, weddings and family gatherings. Sobane songs are especially connected with wedding traditions, with local variations.",
    importance:
      "Passed from voice to voice, these songs carry memory, feeling and knowledge. They preserve the language and experiences of the people who sing them, and continue to change with each generation.",
    source:
      "https://ichcourier.unesco-ichcap.org/board.es?act=view&bid=A102&list_no=698&mid=a10501000000",
    sourceName: "ICHCAP traditional sound archive",
  },
};

export function matchesRegion(regions, selected) {
  return selected === "all" || regions.split(/\s+/).includes(selected);
}

export const categories = [
  { id: "all", en: "All traditions", kn: "ಎಲ್ಲ ಪರಂಪರೆಗಳು" },
  {
    id: "literature",
    en: "Literature & Oral Traditions",
    kn: "ಸಾಹಿತ್ಯ ಮತ್ತು ಮೌಖಿಕ ಪರಂಪರೆ",
  },
  { id: "music", en: "Folk Music", kn: "ಜನಪದ ಸಂಗೀತ" },
  { id: "dance", en: "Dance & Theatre", kn: "ಕುಣಿತ ಮತ್ತು ರಂಗಕಲೆ" },
  { id: "ritual", en: "Dharmika & Daiva Aradhane", kn: "ಧಾರ್ಮಿಕ ಮತ್ತು ದೈವ ಆರಾಧನೆ" },
  { id: "puppetry", en: "Gombeyata · Folk Puppetry", kn: "ಗೊಂಬೆಯಾಟ" },
  {
    id: "crafts",
    en: "Material Culture & Crafts",
    kn: "ವಸ್ತು ಸಂಸ್ಕೃತಿ ಮತ್ತು ಕರಕುಶಲ",
  },
  { id: "instruments", en: "Folk Musical Instruments", kn: "ಜನಪದ ಸಂಗೀತ ವಾದ್ಯಗಳು" },
];

const existingRegions = {
  dollu: ["bayaluseeme", "malenadu"],
  yakshagana: ["karavali", "malenadu"],
  veeragase: ["bayaluseeme"],
  kamsale: ["bayaluseeme"],
  puppetry: ["bayaluseeme"],
  songs: ["karavali", "bayaluseeme", "malenadu"],
};
const expansionById = Object.fromEntries(
  expandedTraditions.map((entry) => [entry.id, entry]),
);
for (const entry of expandedTraditions) {
  arts[entry.id] = {
    ...arts[entry.id],
    ...entry.en,
    source: entry.source,
    image: entry.image || entry.id,
    imageSrc: entry.imageSrc,
    smallImageSrc: entry.smallImageSrc,
    mediaId: entry.mediaId || null,
    illustrated: entry.illustrated,
  };
}
for (const [id, photo] of Object.entries(photoAssets)) {
  arts[id] = {
    ...arts[id],
    imageSrc: photo.imageSrc,
    smallImageSrc: photo.smallImageSrc,
    mediaId: photo.mediaId,
    illustrated: false,
  };
}
export const kannadaArts = {
  ...knArts,
  ...Object.fromEntries(
    expandedTraditions.map((entry) => [entry.id, entry.kn]),
  ),
};
export const galleryEntries = Object.entries(arts).map(([id, art]) => {
  const expansion = expansionById[id];
  const photo = photoAssets[id];
  const en = {
    ...art,
    summary: expansion?.en.summary || messages[`art.${id}.description`]?.en,
    tag: expansion?.en.tag || messages[`art.${id}.tag`]?.en,
    alt:
      photo?.enAlt ||
      expansion?.en.alt ||
      messages[`art.${id}.alt`]?.en ||
      `${art.name}${art.illustrated ? " — original illustration" : ""}`,
  };
  const kn = {
    ...kannadaArts[id],
    summary: expansion?.kn.summary || messages[`art.${id}.description`]?.kn,
    tag: expansion?.kn.tag || messages[`art.${id}.tag`]?.kn,
    alt:
      photo?.knAlt ||
      expansion?.kn.alt ||
      messages[`art.${id}.alt`]?.kn ||
      `${kannadaArts[id].name}${art.illustrated ? " — ಪರಿಚಯ ಚಿತ್ರಣ" : ""}`,
  };
  return {
    id,
    category: expansion?.category || ({ songs: "music", puppetry: "puppetry" }[id] || "dance"),
    aliases: expansion?.aliases || (id === "puppetry" ? ["Togalu Gombeyata", "Shadow Puppetry", "ತೊಗಲು ಗೊಂಬೆಯಾಟ"] : []),
    instrumentFamily: expansion?.instrumentFamily || null,
    regions: expansion?.regions || existingRegions[id],
    en,
    kn,
    imageSrc: photo?.imageSrc || art.imageSrc || `/images/${art.image}.jpg`,
    smallImageSrc:
      photo?.smallImageSrc ||
      art.smallImageSrc ||
      (art.illustrated ? null : `/images/${art.image}-640.jpg`),
    mediaId: photo?.mediaId || art.mediaId,
    illustrated: photo ? false : Boolean(art.illustrated),
    imageWidth: expansion?.imageWidth || 1200,
    smallImageWidth: expansion?.smallImageWidth || 640,
    photoCaption: {
      en: photo?.enCaption || expansion?.photoCaption?.en || "",
      kn: photo?.knCaption || expansion?.photoCaption?.kn || "",
    },
    captionType: photo?.captionType || expansion?.captionType || "documentary",
    photoFit: photo?.photoFit || expansion?.photoFit || "cover",
    focalPoint: photo?.focalPoint || "50% 50%",
  };
});

export function matchesTradition(
  entry,
  { region = "all", category = "all", query = "" } = {},
) {
  return (
    (category === "all" || entry.category === category) &&
    (region === "all" || entry.regions.includes(region)) &&
    (!query.trim() ||
      query
        .normalize("NFKC")
        .toLocaleLowerCase()
        .trim()
        .split(/\s+/)
        .every((term) =>
          [
            entry.id,
            entry.category,
            ...(entry.aliases || []),
            entry.en.name,
            entry.kn.name,
            entry.en.region,
            entry.kn.region,
            entry.en.summary,
            entry.kn.summary,
            ...entry.regions.flatMap(
              (region) =>
                ({
                  karavali: ["Karavali", "ಕರಾವಳಿ"],
                  bayaluseeme: ["Bayaluseeme", "ಬಯಲುಸೀಮೆ"],
                  malenadu: ["Malenadu", "ಮಲೆನಾಡು"],
                })[region] || [],
            ),
            ...categories
              .filter((c) => c.id === entry.category)
              .flatMap((c) => [c.en, c.kn]),
          ]
            .join(" ")
            .normalize("NFKC")
            .toLocaleLowerCase()
            .includes(term),
        ))
  );
}

export function createEnquiryUrl({
  name,
  location = "",
  interest,
  message = "",
  language = "en",
}) {
  const labels =
    language === "kn"
      ? {
          greeting: uiKannada.whatsappGreeting,
          introduction: uiKannada.whatsappIntroduction,
          name: uiKannada.whatsappName,
          location: uiKannada.whatsappLocation,
          interest: uiKannada.whatsappInterest,
          message: uiKannada.whatsappMessage,
        }
      : {
          greeting: "Namaskara Karnataka Janapada Seva Trust,",
          introduction:
            "I would like to get involved as a cultural ambassador.",
          name: "Name",
          location: "Location",
          interest: "Interest",
          message: "Message",
        };
  const text = [
    labels.greeting,
    "",
    labels.introduction,
    `${labels.name}: ${name.trim()}`,
    location.trim() ? `${labels.location}: ${location.trim()}` : "",
    `${labels.interest}: ${interest}`,
    message.trim() ? `${labels.message}: ${message.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}
