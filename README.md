# Karnataka Janapada Seva Trust

A responsive website with a modern photographic layout, 38 researched tradition and instrument entries, bilingual search, category shortcuts, combined filters, accessible dialogs, leadership cards, direct calling and WhatsApp enquiries. There is no production JavaScript framework, database, payment processor or stored enquiry details.

The default language is Kannada, using the official name **ಕರ್ನಾಟಕ ಜನಪದ ಸೇವಾ ಟ್ರಸ್ಟ್**. A persistent Kannada/English switch translates the page, art details, dialogs, form labels, validation, WhatsApp message boilerplate, accessible labels and search metadata. The choice is saved on the visitor's device in `localStorage`; enquiry details are not stored. Dialog language controls preserve entered values and selected interests. The default HTML contains Kannada before JavaScript runs.

## Look Preview

Requirements: Node.js 22 or newer and Python 3.

```sh
npm run dev
```

Open http://127.0.0.1:4173. The `public/` directory is the complete website. Serve it through HTTP rather than opening the HTML as a file.

## Build and hosting

```sh
SITE_URL=https://your-confirmed-domain.example npm run build
```

Replace the example with the actual HTTPS website URL, including its directory when hosted as a GitHub Pages project. A trailing slash is normalized automatically. This adds the canonical URL, absolute social image URLs, organization URL and sitemap. Credentials, query strings and fragments are rejected. Without `SITE_URL`, the build deliberately omits canonical and sitemap URLs rather than inventing a domain.

Upload the contents of `dist/` to a static web host, or import the repository into Netlify or Vercel using the included configuration. Set `SITE_URL` in that host's build environment. The build has no production package dependencies. Assets use relative paths so the website works both at a domain root and inside a project directory.

### GitHub Pages

The repository includes `.github/workflows/pages.yml`. It tests the source and a production build served under `/karnatakajanapadasevatrust/`, then builds and publishes only `dist/`. Deployment runs automatically on pushes to `main`, or manually from the Actions tab. The workflow reads the actual public address from GitHub Pages settings, so a future custom domain does not require hardcoded source changes. Official GitHub Actions are pinned to release commit hashes; update these pins when upgrading them.

The workflow uses the explicit `ubuntu-24.04` runner and Node24-compatible Pages actions. The website build continues to use Node22. These are separate runtimes: changing the website's `node-version` does not update the runtime bundled into an action. Artifact upload includes hidden public files so `.nojekyll` is retained.

One-time setup by the repository owner:

1. In `raagu/karnatakajanapadasevatrust`, open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push the updated source, including the workflow, to `main`. If the workflow was pushed before enabling Pages, rerun it from **Actions → Deploy website to GitHub Pages → Run workflow**, choosing `main`.
4. Wait for both the build and deployment jobs to succeed. Open the published address shown in **Settings → Pages**.

If the live address displays this README, check **Source** first: it must say **GitHub Actions**, not **Deploy from a branch → main → /(root)**. Branch publishing and the custom workflow can otherwise both publish to the same address. The workflow now checks this setting before building and stops with an explicit instruction if it is still set to branch publishing. After changing the setting, run **Deploy website to GitHub Pages** again. An earlier README response may remain cached for up to ten minutes; use a hard refresh or a private browser window after deployment finishes. Node runtime deprecation and runner migration warnings are separate from the choice of files being published.

The expected default address is https://raagu.github.io/karnatakajanapadasevatrust/. The source does not need to move into the repository root or a `/docs` folder, and generated `dist/` files remain ignored by Git. No personal access token or deployment secret is required; deployment uses GitHub's short-lived workflow token. `public/.nojekyll` is also included in the build to identify it as prebuilt static content.

To reproduce the configured build locally:

```sh
SITE_URL=https://raagu.github.io/karnatakajanapadasevatrust/ npm run build
```

The sitemap is served at the website's `sitemap.xml` address. Search engines only recognize `robots.txt` at a host's root, so the copy inside a Pages project directory does not control crawling; submit the project sitemap directly if needed.

`_headers` configures security headers on compatible static hosts; `vercel.json` configures those headers on Vercel. GitHub Pages does not apply these files. An HTML Content Security Policy and referrer policy preserve the controls that browsers support through metadata. Header-only controls such as `frame-ancestors`, `X-Frame-Options`, and `Permissions-Policy` require a host or proxy that can set HTTP headers; they are not asserted for GitHub Pages.

To roll back, revert the source commit on `main`; the workflow will test and redeploy that version. This setup alone does not enable Pages or confirm a live deployment.

## Content and assets

- `public/index.html`: page copy, leadership, contact number, metadata and NGO structured data.
- `public/content.js`: detailed folk art descriptions, sources, contact configuration and enquiry composition.
- `public/heritage-expansion.js`: researched English/Kannada entries for literature, music, performance and crafts.
- `public/heritage-additions.js`: the requested additions, religious and daiva traditions, puppet forms, Hase Chittara and eight musical instruments.
- `public/photo-assets.js`: reviewed replacement photographs, accurate bilingual captions and documentary/representative context.
- `public/gallery.js`: shared static gallery and filter rendering. The collection has 4 literature, 4 music, 11 dance/theatre, 3 ritual, 3 puppetry, 5 craft and 8 instrument entries. A dedicated instruments section uses the same records and dialogs. Togalu Gombeyata remains a single entry in the puppetry group.
- `public/translations.js`: English/Kannada page dictionaries, Kannada art descriptions and dialog translations.
- `public/locale.js`: language switching, device preference, metadata and in-place dialog translation.
- `public/styles.css`: responsive design and reduced-motion support.
- `public/app.js`: gallery filters, dialogs, image fallbacks and WhatsApp draft flow.
- `public/media.json`: image provenance, creator and license register. Visible image credits are generated from this file.
- `public/fonts/`: self-hosted Inter and Noto Sans Kannada fonts with their open font licenses.

Every entry uses a local JPEG photograph or documentary video still with reviewed provenance. Archival stills are identified as such; lower-resolution sources retain their native size. The gallery renderer rejects illustration assets. Some oral-literature entries use explicitly captioned photographs of oral-heritage field documentation, rather than claiming an exact photographed proverb or riddle exchange. The Kinnal image depicts a painted wooden goddess from the documented Sawantwadi–Kinnal Woodcraft Revival Project; that joint-project context is visible in both its card and dialog. Source, creator, license and resizing details are recorded in `public/media.json`.

The Krishna Parijatha and Sannata/Bayalata theatre thumbnails are the exact images selected by the user; their records make no Creative Commons or public-domain claim. The Krishna-themed stage image is representative: its regional production style has not been independently verified. The Bayalata image is not asserted to depict a Sannata production. Media is stored locally; the browser never searches third-party image services. If a photograph fails, the browser retries another size of the same photograph, then displays a localized unavailable message. It never substitutes a drawing or an unrelated photograph. `scripts/refresh-media.py` can refresh reviewed source images in `media.json`; it never selects random search results or refreshes user-supplied images. The optional maintenance command requires Pillow, stages a complete batch, and retains cached images when a download cannot complete.

`npm run dev` regenerates the default Kannada gallery and category shortcuts before starting. After editing the collection while the server is already running, use `npm run refresh-content` and reload the page. Production builds render the same registry without JavaScript. Search matches Kannada and English names, aliases, summaries and regional associations; query, theme and region selections combine. Changing language preserves the search and filter state. Photo dialogs keep their language and close controls visible while scrolling.

## Evidence and pending material

- The Trust name, leadership roles and phone number were supplied by the user. The phone number is used as an Indian number, `+91 9902122029`; live calling and the WhatsApp account's availability have not been independently verified.
- T.A. Narayana Gowda's portrait is correctly identified and licensed CC BY 3.0. The available source is 472 × 563, suitable for the current modest display but not a high-resolution portrait.
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

Browser tests use installed Google Chrome on macOS and Playwright's Chromium on other systems. On Linux, install the test browser with `npx playwright install --with-deps chromium` after `npm ci`. Set `CHROME_PATH` for another Chromium executable and `TEST_BASE_URL` for another running server. They cover keyboard use, dialogs, mobile navigation, overlapping regional filters, validation and encoding of WhatsApp drafts, responsive overflow, image loading and automated WCAG checks. Tests intercept WhatsApp actions and do not send messages. Automated accessibility checks complement manual visual and keyboard review; they do not establish full compliance.

Locale checks cover the Kannada default, exact Trust spelling, fully translated visible copy and accessible labels, English preference persistence, live form switching, Kannada message drafts, metadata and responsive layouts. Gallery checks cover real JPEG file signatures, photo provenance, exact card/dialog assets, Kinnal context captions, bilingual search, combined filters, shortcuts, empty states, image recovery, the complete leadership card and static build controls. Optional media-maintenance tests can be run with `python -m unittest discover -s tests -p 'test_refresh_media.py'` in an environment containing Pillow.

The server supports a single page with anchor navigation. No SPA fallback or backend is required. To roll back a deployment, restore a previously tested static build through the hosting provider.
