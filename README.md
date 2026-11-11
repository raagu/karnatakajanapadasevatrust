# Karnataka Janapada Seva Trust

A responsive website with a modern photographic layout, 38 researched tradition and instrument entries, bilingual search, category shortcuts, combined filters, accessible dialogs, leadership cards, direct calling and WhatsApp enquiries. There is no production JavaScript framework, database, payment processor or stored enquiry details.

The default language is Kannada, using the official name **ಕರ್ನಾಟಕ ಜನಪದ ಸೇವಾ ಟ್ರಸ್ಟ್**. A persistent Kannada/English switch translates the page, art details, dialogs, form labels, validation, WhatsApp message boilerplate, accessible labels and search metadata. Each language has a permanent address: Kannada at `/` and English at `/en/`. The URL determines the rendered language, so a saved preference never silently replaces a crawlable page with another language. The choice is also saved on the visitor's device in `localStorage`; enquiry details are not stored. Dialog language controls preserve entered values and selected interests. Both languages are rendered into HTML before JavaScript runs.

## Look Preview

Requirements: Node.js 22 or newer and Python 3.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. `npm run dev` builds the source in `public/` and serves the generated `dist/` directory, including the nested language and tradition pages. Serve it through HTTP rather than opening the HTML as a file.

## Build and hosting

```sh
SITE_URL=https://your-confirmed-domain.example npm run build
```

Replace the example with the actual HTTPS website URL, including its directory when hosted as a GitHub Pages project. A trailing slash is normalized automatically. This generates 78 static HTML pages with canonical URLs, reciprocal language alternatives, absolute social images, structured data and a complete sitemap. Credentials, query strings and fragments are rejected. Without `SITE_URL`, the build deliberately omits canonical and sitemap URLs rather than inventing a domain.

Upload the contents of `dist/` to a static web host, or import the repository into Netlify or Vercel using the included configuration. Set `SITE_URL` in that host's build environment. The build uses `parse5` as a development dependency to render valid, localized HTML. The published website has no runtime package dependencies. Assets use relative paths so the website works both at a domain root and inside a project directory.

### GitHub Pages

The repository includes `.github/workflows/pages.yml`. It tests the source and a production build served under `/karnatakajanapadasevatrust/`, then builds and publishes only `dist/`. Deployment runs automatically on pushes to `main`, or manually from the Actions tab. The workflow reads the actual public address from GitHub Pages settings, so a future custom domain does not require hardcoded source changes. Official GitHub Actions are pinned to release commit hashes; update these pins when upgrading them.

The build uses HTTPS with the host and path returned by Pages. During custom-domain setup, Pages can report an HTTP address until **Settings → Pages → Enforce HTTPS** is enabled; that HTTP address is not a valid `SITE_URL`. The workflow therefore constructs the HTTPS address without changing the configured domain or project path. Enable **Enforce HTTPS** once the domain's certificate is ready so visitors are redirected to HTTPS as well. The build continues to reject explicitly supplied HTTP URLs, credentials, queries and fragments.

The workflow uses [Chrome already installed on GitHub’s Ubuntu image](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md#browsers-and-drivers). It records the browser version and passes its executable through the existing `CHROME_PATH` test setting. It avoids installing operating-system packages or downloading another browser during deployment, so an Ubuntu package-mirror outage cannot prevent verification. A missing browser or any failing test still stops publishing.

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
- `public/locale.js`: URL-based language switching and in-place dialog translation.
- `public/routes.js`: shared language/detail routes, native language links and safe in-place navigation.
- `public/seo.js`: shared localized page metadata and structured data.
- `public/tradition.js`: full detail pages generated from existing tradition records.
- `public/page-messages.js` and `public/ui-messages.js`: shared build/browser translations.
- `scripts/seo-pages.mjs`: HTML localization and static page generation during the build.
- `public/styles.css`: responsive design and reduced-motion support.
- `public/app.js`: gallery filters, dialogs, image fallbacks and WhatsApp draft flow.
- `public/media.json`: image provenance, creator and license register. Visible image credits are generated from this file.
- `public/fonts/`: self-hosted Inter and Noto Sans Kannada fonts with their open font licenses. WOFF2 versions preserve the original glyphs and metrics and reduce font bytes by about 67%; the original TTF files remain as fallbacks. To regenerate them after a font update, install `fonttools[woff]` in an isolated Python environment and run `python scripts/compress-fonts.py`. This optional maintenance tool is not part of the deployment build.

Every entry uses a local JPEG photograph or documentary video still with reviewed provenance. Archival stills are identified as such; lower-resolution sources retain their native size. The gallery renderer rejects illustration assets. Some oral-literature entries use explicitly captioned photographs of oral-heritage field documentation, rather than claiming an exact photographed proverb or riddle exchange. The Kinnal image depicts a painted wooden goddess from the documented Sawantwadi–Kinnal Woodcraft Revival Project; that joint-project context is visible in both its card and dialog. Source, creator, license and resizing details are recorded in `public/media.json`.

The Krishna Parijatha and Sannata/Bayalata theatre thumbnails are the exact images selected by the user; their records make no Creative Commons or public-domain claim. The Krishna-themed stage image is representative: its regional production style has not been independently verified. The Bayalata image is not asserted to depict a Sannata production. Media is stored locally; the browser never searches third-party image services. If a photograph fails, the browser retries another size of the same photograph, then displays a localized unavailable message. It never substitutes a drawing or an unrelated photograph. `scripts/refresh-media.py` can refresh reviewed source images in `media.json`; it never selects random search results or refreshes user-supplied images. The optional maintenance command requires Pillow, stages a complete batch, and retains cached images when a download cannot complete.

`npm run dev` regenerates the default Kannada gallery and category shortcuts, then builds all pages before starting. After editing source while the server is running, use `npm run refresh-content` and `npm run build`, then reload the page. Production builds render the same registry without JavaScript. Search matches Kannada and English names, aliases, summaries and regional associations; query, theme and region selections combine. Changing language preserves the search and filter state. Photo dialogs keep their language and close controls visible while scrolling.

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

The homepages retain anchor navigation and the existing detail popups. Permanent detail pages use ordinary directories containing `index.html`; no SPA fallback or backend is required. To roll back a deployment, restore a previously tested static build through the hosting provider.

## Technical SEO

The build publishes the existing content at these stable routes:

| Page | Kannada | English |
| --- | --- | --- |
| Homepage | `/` | `/en/` |
| Each of the 38 traditions/instruments | `/traditions/<entry-id>/` | `/en/traditions/<entry-id>/` |

All 78 pages contain their complete localized copy without executing JavaScript. Each has one main heading, a unique title and description, a self-referencing canonical URL, and reciprocal `kn`, `en` and `x-default` language links when `SITE_URL` is configured. The Kannada page is the default language alternative. Existing homepage cards and language controls have real `href` links; JavaScript preserves the current popup and in-place language-switching experience. Modified clicks and JavaScript-disabled browsers use the permanent pages. Keep published entry IDs stable to avoid breaking indexed addresses.

Organization, website, page, article and breadcrumb structured data describe the existing visible facts. No author, founder, event date, review or publication date is invented. The sitemap lists the 78 canonical addresses; it does not manufacture update dates. `robots.txt` allows the pages and their rendering resources. It is a crawler instruction file, not attack protection.

After the owner pushes these changes and the Pages workflow succeeds:

1. Verify `karnatakajanapadasevatrust.org` in [Google Search Console](https://search.google.com/search-console). If already verified, select that property.
2. In **Sitemaps**, submit `https://karnatakajanapadasevatrust.org/sitemap.xml`.
3. Use **URL inspection** to check the Kannada homepage, `/en/` and a tradition page in each language. Confirm the live page is accessible and request indexing for those examples. Monitor **Page indexing** and **Performance** for actual coverage, search impressions and clicks.

The code makes the pages technically discoverable and eligible for indexing. Google decides whether and when to index them and where to rank them; source changes and automated SEO scores cannot guarantee top rankings. See Google's [localized-page guidance](https://developers.google.com/search/docs/specialty/international/localized-versions), [crawlable-link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) and [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

`tests/seo.test.mjs` validates every generated page's localized content, canonical and reciprocal language links, unique metadata, truthful structured data and sitemap membership. Browser checks include JavaScript-disabled navigation, both hosting path formats, images, keyboard/language switching, forms and history navigation. Build tests use disposable copies so they cannot overwrite the running preview.
