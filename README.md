# Karnataka Janapada Seva Trust

A responsive website with a modern photographic layout, 20 researched traditions, bilingual search, category shortcuts, combined filters, accessible dialogs, leadership cards, direct calling and WhatsApp enquiries. There is no production JavaScript framework, database, payment processor or stored enquiry details.

The default language is Kannada, using the official name **ಕರ್ನಾಟಕ ಜನಪದ ಸೇವಾ ಟ್ರಸ್ಟ್**. A persistent Kannada/English switch translates the page, art details, dialogs, form labels, validation, WhatsApp message boilerplate, accessible labels and search metadata. The choice is saved on the visitor's device in `localStorage`; enquiry details are not stored. Dialog language controls preserve entered values and selected interests. The default HTML contains Kannada before JavaScript runs.

## Preview

Requirements: Node.js 22 or newer and Python 3.

```sh
npm run dev
```

Open http://127.0.0.1:4173. The `public/` directory is the complete website. Serve it through HTTP rather than opening the HTML as a file.

## Build and hosting

```sh
SITE_URL=https://your-confirmed-domain.example npm run build
```

Replace the example with the actual HTTPS origin. This adds the canonical URL, absolute social image URLs, organization URL and sitemap. Without `SITE_URL`, the build deliberately omits canonical and sitemap URLs rather than inventing a domain.

Upload the contents of `dist/` to a static web host, or import the repository into Netlify or Vercel using the included configuration. Set `SITE_URL` in that host's build environment. The build has no production package dependencies. `_headers` configures security headers on compatible static hosts; `vercel.json` configures the same headers on Vercel. Other hosts must configure equivalent headers themselves.

Hosted publication through the connected Sites service was unavailable in this workspace. No hosted deployment was created.

## Content and assets

- `public/index.html`: page copy, leadership, contact number, metadata and NGO structured data.
- `public/content.js`: detailed folk art descriptions, sources, contact configuration and enquiry composition.
- `public/heritage-expansion.js`: researched English/Kannada entries for literature, music, performance and crafts.
- `public/photo-assets.js`: reviewed replacement photographs, accurate bilingual captions and documentary/representative context.
- `public/gallery.js`: shared static gallery and filter rendering. The collection has 4 literature, 4 music, 8 performance and 4 material-culture entries.
- `public/translations.js`: English/Kannada page dictionaries, Kannada art descriptions and dialog translations.
- `public/locale.js`: language switching, device preference, metadata and in-place dialog translation.
- `public/styles.css`: responsive design and reduced-motion support.
- `public/app.js`: gallery filters, dialogs, image fallbacks and WhatsApp draft flow.
- `public/media.json`: image provenance, creator and license register. Visible image credits are generated from this file.
- `public/fonts/`: self-hosted Inter and Noto Sans Kannada fonts with their open font licenses.

Every tradition uses a real JPEG photograph with reviewed provenance. The gallery renderer rejects illustration assets. Some oral-literature entries use explicitly captioned photographs of oral-heritage field documentation, rather than claiming an exact photographed proverb or riddle exchange. The Kinnal image depicts a painted wooden goddess from the documented Sawantwadi–Kinnal Woodcraft Revival Project; that joint-project context is visible in both its card and dialog. Source, creator, license and resizing details are recorded in `public/media.json`.

Hayath Kargal's photograph is the exact image selected by the user; its record makes no Creative Commons or public-domain claim. Media is stored locally; the browser never searches third-party image services. If a photograph fails, the browser retries another size of the same photograph, then displays a localized unavailable message. It never substitutes a drawing or an unrelated photograph. `scripts/refresh-media.py` can refresh reviewed source images in `media.json`; it never selects random search results or refreshes user-supplied images. The optional maintenance command requires Pillow, stages a complete batch, and retains cached images when a download cannot complete.

`npm run dev` regenerates the default Kannada gallery and category shortcuts before starting. After editing the collection while the server is already running, use `npm run refresh-content` and reload the page. Production builds render the same registry without JavaScript. Search matches Kannada and English names, summaries and regional associations; query, theme and region selections combine. Changing language preserves the search and filter state. Photo dialogs keep their language and close controls visible while scrolling.

## Evidence and pending material

- The Trust name, leadership roles and phone number were supplied by the user. The phone number is used as an Indian number, `+91 9902122029`; live calling and the WhatsApp account's availability have not been independently verified.
- T.A. Narayana Gowda's portrait is correctly identified and licensed CC BY 3.0. The available source is 472 × 563, suitable for the current modest display but not a high-resolution portrait.
- Hayath Kargal's portrait was supplied by the user through the Google image URL in this conversation. The original is a 200 × 200 thumbnail; no high-resolution quality or public reuse license is asserted.
- Past program details are pending. The site does not invent event dates, impact counts, biographies or attributed quotations. The mission section identifies proposed priorities and a future roadmap.
- No donation destination was supplied. “Support the Trust” provides a direct contact route and clearly states that online payment is unavailable.
- Leadership roles do not establish founder status; the structured data makes no founder claim.
- Cultural descriptions link to the relevant cultural institutions. See `content-sources.json` for the research register.
- Search metadata supports discoverability. A #1 search ranking cannot be guaranteed.

## Verification

```sh
npm ci
npm run dev
# In a second terminal, while the local server is running:
npm test
```

Browser tests use installed Google Chrome by default. Set `CHROME_PATH` for another Chromium executable and `TEST_BASE_URL` for another running server. They cover keyboard use, dialogs, mobile navigation, overlapping regional filters, validation and encoding of WhatsApp drafts, responsive overflow, image loading and automated WCAG checks. Tests intercept WhatsApp actions and do not send messages. Automated accessibility checks complement manual visual and keyboard review; they do not establish full compliance.

Locale checks cover the Kannada default, exact Trust spelling, fully translated visible copy and accessible labels, English preference persistence, live form switching, Kannada message drafts, metadata and responsive layouts. Gallery checks cover real JPEG file signatures, photo provenance, exact card/dialog assets, Kinnal context captions, bilingual search, combined filters, shortcuts, empty states, image recovery, the complete leadership card and static build controls. Optional media-maintenance tests can be run with `python -m unittest discover -s tests -p 'test_refresh_media.py'` in an environment containing Pillow.

The server supports a single page with anchor navigation. No SPA fallback or backend is required. To roll back a deployment, restore a previously tested static build through the hosting provider.
