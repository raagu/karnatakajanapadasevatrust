import {
  getLanguage,
  t,
  localizeDynamic,
  updateFailureAlts,
} from "./locale.js";
import {
  arts,
  galleryEntries,
  categories,
  CONTACT,
  matchesTradition,
  createEnquiryUrl,
} from "./content.js";
import { assetPath, galleryLabels } from "./gallery.js";

const dialog = document.querySelector("#site-dialog");
const dialogContent = document.querySelector("#dialog-content");
const closeButton = dialog.querySelector(".dialog-close");
let lastTrigger;
let credits;
const text = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

function showDialog(content, trigger) {
  lastTrigger = trigger;
  dialogContent.innerHTML = content;
  delete dialog.dataset.artId;
  localizeDynamic(dialogContent);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  closeButton.focus({ preventScroll: true });
}

function creditLine(item) {
  if (!item) return "";
  if (item.rightsType === "user-supplied")
    return `<a href="${text(item.source)}" target="_blank" rel="noopener noreferrer">${text(item.id === "vice-president" ? "Hayath Kargal" : galleryEntries.find((entry) => entry.mediaId === item.id)?.en.name || item.title)}</a> · <span>Image supplied for this website; photographer not specified. No public reuse license is asserted.</span>`;
  return `<a href="${text(item.source)}" target="_blank" rel="noopener noreferrer">${text(item.title)}</a> · ${text(item.creator)} · <a href="${text(item.licenseUrl)}" target="_blank" rel="noopener noreferrer">${text(item.license)}</a>. Images resized; displayed crops vary by screen.`;
}

async function getCredits() {
  if (credits) return credits;
  const response = await fetch("./media.json");
  if (!response.ok) throw new Error("Image credits could not be loaded.");
  credits = await response.json();
  return credits;
}

function showArt(id, trigger) {
  const art = arts[id];
  if (!art) return;
  const entry = galleryEntries.find((item) => item.id === id);
  showDialog(
    `<figure class="dialog-media"><img class="dialog-photo photo-${id}${entry.photoFit === "contain" ? " photo-contain" : ""}" src="${text(assetPath(entry.imageSrc))}" width="1200" height="800" alt="${text(entry.en.alt)}">${entry.photoCaption.en ? `<figcaption class="dialog-photo-caption"><strong>Photo context</strong>: <span class="dialog-photo-caption-copy">${text(entry.photoCaption.en)}</span></figcaption>` : ""}</figure><div class="dialog-inner"><div class="dialog-category">${text(categories.find((category) => category.id === entry.category).en)}</div><p class="eyebrow">${text(art.region)}</p><h2 id="dialog-title">${text(art.name)}</h2><h3>Roots & region</h3><p>${text(art.origin)}</p><h3>Why it matters</h3><p>${text(art.importance)}</p><p class="source-note">Learn more: <a href="${art.source}" target="_blank" rel="noopener noreferrer">${art.sourceName} ↗</a></p><p class="source-note" id="art-credit">${art.illustrated ? "Original illustration created for this website." : 'Photo attribution: <a href="./media.json" target="_blank" rel="noopener noreferrer">view the image credit register</a>.'}</p></div>`,
    trigger,
  );
  dialog.dataset.artId = id;
  if (art.illustrated) return;
  getCredits()
    .then((items) => {
      const credit = dialog.querySelector("#art-credit");
      if (credit && dialog.dataset.artId === id) {
        credit.innerHTML = creditLine(
          items.find((item) => item.id === art.mediaId),
        );
        localizeDynamic(dialogContent);
      }
    })
    .catch(() => {});
}

function showAmbassador(trigger) {
  showDialog(
    `<div class="dialog-inner"><p class="eyebrow">YOUR TIME CAN KEEP A TRADITION ALIVE.</p><h2 id="dialog-title">Bring your passion.<br>Find your place.</h2><p>Tell the Trust how you would like to take part. Whether you’re an artist, a storyteller or simply someone who cares, your interest matters.</p><form class="enquiry-form"><label>Your name<input name="name" autocomplete="name" required maxlength="80" placeholder="How should we address you?"></label><label>Your town or district <span>(optional)</span><input name="location" autocomplete="address-level2" maxlength="100" placeholder="Where are you based?"></label><label>I would like to help with<select name="interest"><option>Volunteering at cultural gatherings</option><option>Teaching or learning a folk art</option><option>Documenting stories and traditions</option><option>Supporting artist welfare</option><option>Discussing another way to contribute</option></select></label><label>A little more about you <span>(optional)</span><textarea name="message" maxlength="800" placeholder="Share your skills, interest or questions."></textarea></label><p class="form-note">The next step opens WhatsApp with your message. You review and send it there. This website does not store your details or register you automatically.</p><button class="button button-red" type="submit">Continue in WhatsApp <span aria-hidden="true">↗</span></button><p class="form-note">Prefer a conversation? <a href="tel:${CONTACT.phone}">Call ${CONTACT.display}</a>.</p></form></div>`,
    trigger,
  );
  dialog.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.name;
    name.setCustomValidity(name.value.trim() ? "" : t("nameRequired"));
    if (!form.reportValidity()) return;
    const url = createEnquiryUrl({
      ...Object.fromEntries(new FormData(form)),
      language: getLanguage(),
    });
    window.open(url, "_blank", "noopener,noreferrer");
  });
  dialog
    .querySelector('input[name="name"]')
    .addEventListener("invalid", (event) =>
      event.target.setCustomValidity(t("nameRequired")),
    );
  dialog
    .querySelector('input[name="name"]')
    .addEventListener("input", (event) => event.target.setCustomValidity(""));
}

function showSupport(trigger) {
  showDialog(
    `<div class="dialog-inner"><p class="eyebrow">LET’S KEEP OUR ROOTS ALIVE, TOGETHER.</p><h2 id="dialog-title">Make room for<br>a living legacy.</h2><p>You can support the Trust through your time, knowledge, resources or a conversation about artist welfare and cultural preservation.</p><h3>Start a conversation</h3><p>Speak with the Trust to discuss the kind of support you have in mind and request the official contribution details.</p><a class="dialog-call" href="tel:${CONTACT.phone}">${CONTACT.display}</a><div class="dialog-notice">Online donations are not available on this website. Please confirm any contribution arrangements directly with the Trust before making a payment.</div><a class="button button-red" href="tel:${CONTACT.phone}">Call to discuss support <span aria-hidden="true">↗</span></a><p class="source-note">Want to contribute your time? <button class="text-button" id="switch-to-ambassador">Become a cultural ambassador →</button></p></div>`,
    trigger,
  );
  dialog
    .querySelector("#switch-to-ambassador")
    .addEventListener("click", () => showAmbassador(lastTrigger));
}

async function showCredits(trigger) {
  showDialog(
    '<div class="dialog-inner"><p class="eyebrow">CREATED BY PEOPLE. SHARED WITH CARE.</p><h2 id="dialog-title">The people behind<br>the pictures.</h2><p id="credits-status" role="status">Loading image credits…</p></div>',
    trigger,
  );
  try {
    const items = await getCredits();
    if (!dialog.querySelector("#credits-status")) return;
    dialog.querySelector("#credits-status").outerHTML =
      `<p>Each image record links to its source and states its reuse terms. Original creators retain their rights. Photographs and archival video stills are resized for this website; display crops vary by screen.</p><ul class="credit-list">${items.map((item) => `<li><strong>${text(item.id === "president" ? "T.A. Narayana Gowda" : item.id === "vice-president" ? "Hayath Kargal" : item.title)}</strong><p>${creditLine(item)}</p></li>`).join("")}</ul><p>Real photographs and documentary video stills illustrate the collection. Context captions identify representative images; user-selected images carry their own reuse notices.</p>`;
    localizeDynamic(dialogContent);
  } catch {
    const status = dialog.querySelector("#credits-status");
    if (status)
      status.innerHTML =
        'Image credits could not be loaded. <a href="./media.json" target="_blank" rel="noopener noreferrer">Open the credit register</a> or try again.';
    localizeDynamic(dialogContent);
  }
}

function showPrivacy(trigger) {
  showDialog(
    `<div class="dialog-inner"><p class="eyebrow">A LITTLE CLARITY GOES A LONG WAY.</p><h2 id="dialog-title">Your privacy.</h2><p>This website has no analytics, advertising cookies, accounts or newsletter tracking. Your language preference is saved only on this device. Enquiry details are not saved by this website.</p><h3>When you contact the Trust</h3><p>The ambassador form prepares a WhatsApp message. Choosing “Continue in WhatsApp” passes the details you entered to WhatsApp, where its privacy terms apply. You decide whether to send the message. Phone links open your device’s calling application.</p><h3>Website delivery</h3><p>The hosting provider may process standard request information to deliver and protect this website. Fonts and photographs are served with the website. External reference and license links open third-party websites.</p><h3>Questions or corrections</h3><p>Contact the Trust on <a href="tel:${CONTACT.phone}">${CONTACT.display}</a>.</p></div>`,
    trigger,
  );
}

document.addEventListener("click", (event) => {
  const artButton = event.target.closest("[data-art-open]");
  if (artButton) return showArt(artButton.dataset.artOpen, artButton);
  const trigger = event.target.closest("[data-open]");
  if (!trigger) return;
  const handlers = {
    ambassador: showAmbassador,
    support: showSupport,
    credits: showCredits,
    privacy: showPrivacy,
  };
  handlers[trigger.dataset.open]?.(trigger);
});
closeButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom)
  )
    dialog.close();
});
dialog.addEventListener("close", () => {
  // Native close events can arrive after another dialog opens or focus moves.
  // Preserve that newer focus; only repair focus left on the closed dialog/body.
  if (dialog.open) return;
  const active = document.activeElement;
  if (active !== document.body && active !== dialog && !dialog.contains(active))
    return;
  const target = lastTrigger?.getClientRects().length
    ? lastTrigger
    : menuToggle;
  target?.focus({ preventScroll: true });
});

function updateGalleryCount(
  count = document.querySelectorAll(".art-card:not([hidden])").length,
) {
  document.querySelector("#gallery-count").textContent = t(
    count === 1 ? "galleryCountOne" : "galleryCount",
  ).replace("{count}", count);
}
document.addEventListener("languagechange", () => {
  applyGalleryFilters();
  document.querySelector("#year").textContent = new Date().getFullYear();
  const name = dialog.querySelector('input[name="name"]');
  if (name?.validity.customError) name.setCustomValidity(t("nameRequired"));
});
updateGalleryCount();

const selectedFilters = { region: "all", category: "all", query: "" };
const searchInput = document.querySelector("#heritage-search");
function applyGalleryFilters() {
  let count = 0;
  for (const entry of galleryEntries) {
    const visible = matchesTradition(entry, selectedFilters);
    document.querySelector(`.art-card[data-art="${entry.id}"]`).hidden =
      !visible;
    if (visible) count++;
  }
  document.querySelector(".gallery-empty").hidden = count !== 0;
  updateGalleryCount(count);
  document.querySelector("[data-clear-search]").hidden = !searchInput.value;
  document.querySelector("[data-reset-gallery]").disabled =
    !selectedFilters.query &&
    selectedFilters.category === "all" &&
    selectedFilters.region === "all";
  renderFilterChips();
  for (const button of document.querySelectorAll(
    "[data-filter],[data-category]",
  )) {
    const active = button.hasAttribute("data-category")
      ? button.dataset.category === selectedFilters.category
      : button.dataset.filter === selectedFilters.region;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}
document.querySelectorAll("[data-filter],[data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.hasAttribute("data-category"))
      selectedFilters.category = button.dataset.category;
    else selectedFilters.region = button.dataset.filter;
    applyGalleryFilters();
  });
});
function renderFilterChips() {
  const language = getLanguage(),
    list = document.querySelector(".active-filter-list");
  list.replaceChildren();
  const labels = {
    category: categories.find((item) => item.id === selectedFilters.category)?.[
      language
    ],
    region: t(`filter.${selectedFilters.region}`),
    query: selectedFilters.query,
  };
  for (const key of ["category", "region", "query"]) {
    if (
      (key === "query" && !selectedFilters.query.trim()) ||
      (key !== "query" && selectedFilters[key] === "all")
    )
      continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.dataset.removeFilter = key;
    button.textContent = labels[key] + " ×";
    button.setAttribute(
      "aria-label",
      (language === "kn" ? "ಈ ಆಯ್ಕೆಯನ್ನು ತೆಗೆದುಹಾಕಿ: " : "Remove filter: ") +
        labels[key],
    );
    list.append(button);
  }
  list.hidden = !list.childElementCount;
}
searchInput.addEventListener("input", () => {
  selectedFilters.query = searchInput.value;
  applyGalleryFilters();
});
document.querySelector("[data-clear-search]").addEventListener("click", () => {
  searchInput.value = "";
  selectedFilters.query = "";
  applyGalleryFilters();
  searchInput.focus();
});
document
  .querySelector(".active-filter-list")
  .addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-filter]");
    if (!button) return;
    const key = button.dataset.removeFilter;
    selectedFilters[key] = key === "query" ? "" : "all";
    searchInput.value = selectedFilters.query;
    applyGalleryFilters();
    if (key === "query") searchInput.focus();
    else
      document
        .querySelector(
          key === "category" ? "[data-category=all]" : "[data-filter=all]",
        )
        .focus();
  });
document.querySelectorAll("[data-browse-category]").forEach((link) =>
  link.addEventListener("click", () => {
    selectedFilters.category = link.dataset.browseCategory;
    selectedFilters.region = "all";
    selectedFilters.query = "";
    searchInput.value = "";
    applyGalleryFilters();
  }),
);
document.querySelector("[data-reset-gallery]").addEventListener("click", () => {
  selectedFilters.category = selectedFilters.region = "all";
  selectedFilters.query = "";
  searchInput.value = "";
  applyGalleryFilters();
  document.querySelector('[data-category="all"]').focus();
});

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#primary-nav");
function closeMenu() {
  nav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
});
nav.addEventListener("click", (event) => {
  if (event.target.closest("a,button")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("is-open")) {
    closeMenu();
    menuToggle.focus();
  }
});
matchMedia("(min-width: 1101px)").addEventListener("change", closeMenu);
document.querySelector("#year").textContent = new Date().getFullYear();

// A failed photograph may retry a smaller copy of the same photograph.
// Never substitute an illustration or an unrelated picture.
function recoverPhoto(img) {
  if (!(img instanceof HTMLImageElement) || img.dataset.fallbackApplied) return;
  if (!img.alt) {
    img.hidden = true;
    return;
  }
  const id =
    img.closest(".art-card")?.dataset.art ||
    img.closest(".instrument-card")?.dataset.instrument ||
    img.dataset.shortcutPhoto ||
    (img.classList.contains("dialog-photo") ? dialog.dataset.artId : null);
  const entry = galleryEntries.find((item) => item.id === id);
  const failed = img.currentSrc || img.src;
  const backup = [
    entry?.smallImageSrc,
    entry?.imageSrc,
    img.id === "hero-photo" ? "/images/yakshagana-hero-800.jpg" : null,
  ]
    .filter(Boolean)
    .map(assetPath)
    .find((url) => new URL(url, location.href).href !== failed);
  if (backup && !img.dataset.recoveryAttempted) {
    img.dataset.recoveryAttempted = "true";
    img.removeAttribute("srcset");
    img.src = backup;
    return;
  }
  img.dataset.fallbackApplied = "true";
  img.dataset.fallbackAlt = img.alt;
  img.removeAttribute("srcset");
  img.hidden = true;
  const parent = img.parentElement;
  parent.classList.add("has-unavailable-photo");
  let status = parent.querySelector(".photo-unavailable-text");
  if (!status) {
    status = document.createElement("span");
    status.className = "photo-unavailable-text";
    status.setAttribute("role", "status");
    parent.append(status);
  }
  status.textContent = galleryLabels[getLanguage()].photoUnavailable;
  updateFailureAlts();
}
document.addEventListener("error", (event) => recoverPhoto(event.target), true);
for (const image of document.images)
  if (image.complete && image.naturalWidth === 0) recoverPhoto(image);

const observedLinks = [
  ...document.querySelectorAll('#primary-nav a[href^="#"]'),
];
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of observedLinks) {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("is-current", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: 0 },
  );
  for (const link of observedLinks) {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) observer.observe(section);
  }
  observer.observe(document.querySelector('#home'));
}
const progress = document.querySelector(".scroll-progress");
let progressScheduled = false;
function updateProgress() {
  const available = document.documentElement.scrollHeight - innerHeight;
  progress.value = available > 0 ? (scrollY / available) * 100 : 0;
  progressScheduled = false;
}
addEventListener(
  "scroll",
  () => {
    if (!progressScheduled) {
      progressScheduled = true;
      requestAnimationFrame(updateProgress);
    }
  },
  { passive: true },
);
updateProgress();
applyGalleryFilters();
