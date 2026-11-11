import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { galleryEntries } from "../public/content.js";
import { browserOptions } from "./browser-options.mjs";

test('returning to the hero clears a previously highlighted section', async () => {
  await withPage({width:1440,height:1000}, async page => {
    await page.locator('#leadership-heading').scrollIntoViewIfNeeded();
    await expect(page.locator('#primary-nav a[href="#leadership"]')).toHaveAttribute('aria-current','location');
    await page.locator('.footer-bottom a[href="#home"]').click();
    await expect(page.locator('#primary-nav [aria-current]')).toHaveCount(0);
  });
});

const expectedEntries = ({ category = "all", region = "all" } = {}) =>
  galleryEntries.filter(
    (entry) =>
      (category === "all" || entry.category === category) &&
      (region === "all" || entry.regions.includes(region)),
  );
const countMessage = (count) =>
  `${count} ${count === 1 ? "tradition" : "traditions"} to explore`;

const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";
let browser;

before(async () => {
  browser = await chromium.launch(browserOptions);
});
after(async () => {
  await browser?.close();
});

async function withPage(
  viewport,
  check,
  { language = "en", storedLanguage } = {},
) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  if (storedLanguage !== undefined) {
    await context.addInitScript((value) => {
      localStorage.setItem("kjst-language", value);
    }, storedLanguage);
  }
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(baseURL, { waitUntil: "load", timeout: 15000 });
    if (language) {
      await page.locator(`[data-language="${language}"]`).first().click();
      await expect(page.locator("html")).toHaveAttribute("lang", language);
    }
    await check(page);
    assert.deepEqual(
      errors,
      [],
      "The page must not produce uncaught JavaScript errors.",
    );
  } finally {
    await context.close();
  }
}

test("keyboard users can open, navigate and dismiss dialogs with focus restored", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    const trigger = page.locator('.hero-actions [data-open="ambassador"]');
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.locator("#site-dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Close dialog" }),
    ).toBeFocused();
    const nameField = dialog.getByRole("textbox", {
      name: "Your name",
      exact: true,
    });
    for (
      let step = 0;
      step < 8 &&
      !(await nameField.evaluate(
        (element) => element === document.activeElement,
      ));
      step++
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(nameField).toBeFocused();
    await dialog.getByRole("button", { name: "Close dialog" }).focus();
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await dialog.evaluate(
        (element) =>
          document.activeElement === document.body ||
          element.contains(document.activeElement),
      ),
      true,
      "Focus may move to browser controls but must not reach the inert background.",
    );
    await trigger.evaluate((element) => element.focus());
    await expect(trigger).not.toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();

    const artTrigger = page.getByRole("link", {
      name: "Explore Dollu Kunitha",
      exact: true,
    });
    await artTrigger.focus();
    await expect(artTrigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      dialog.getByRole("heading", { name: "Dollu Kunitha", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(artTrigger).toBeFocused();
  });
});

test("a queued dialog close preserves a newer focus and a reopened dialog", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    const opener = page.locator('.hero-actions [data-open="ambassador"]');
    const art = page.locator('[data-art-open="dollu"]');
    await opener.click();
    const newFocusPreserved = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const dialog = document.querySelector("#site-dialog");
          const next = document.querySelector('[data-art-open="dollu"]');
          dialog.addEventListener(
            "close",
            () => resolve(document.activeElement === next),
            { once: true },
          );
          dialog.close();
          next.focus();
        }),
    );
    assert.equal(
      newFocusPreserved,
      true,
      "The late native close event must not steal a newer visible focus.",
    );
    await expect(art).toBeFocused();
    await art.press("Enter");
    await expect(page.locator("#dialog-title")).toHaveText("Dollu Kunitha");
    await page.keyboard.press("Escape");
    await expect(art).toBeFocused();
    await opener.click();
    const reopenedState = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const dialog = document.querySelector("#site-dialog");
          dialog.addEventListener(
            "close",
            () =>
              resolve({
                open: dialog.open,
                title: document.querySelector("#dialog-title").textContent,
                focusedInside: dialog.contains(document.activeElement),
              }),
            { once: true },
          );
          dialog.close();
          const next = document.querySelector('[data-art-open="dollu"]');
          next.focus();
          next.click();
        }),
    );
    assert.deepEqual(reopenedState, {
      open: true,
      title: "Dollu Kunitha",
      focusedInside: true,
    });
    await page.keyboard.press("Escape");
    await expect(art).toBeFocused();
  });
});

test("regional filters show the expected overlapping traditions and announce counts", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    for (const region of ["karavali", "bayaluseeme", "malenadu", "all"]) {
      const count = expectedEntries({ region }).length;
      const filter = page.locator(`[data-filter="${region}"]`);
      await filter.click();
      await expect(filter).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".art-card:visible")).toHaveCount(count);
      await expect(page.locator("#gallery-count")).toHaveText(
        countMessage(count),
      );
      await expect(
        page.locator('[data-filter][aria-pressed="true"]'),
      ).toHaveCount(1);
      assert.equal(
        await page
          .locator(".art-card[hidden]")
          .evaluateAll((cards) =>
            cards.every((card) => getComputedStyle(card).display === "none"),
          ),
        true,
      );
    }
  });
});

test("mobile navigation support dialog returns focus to the menu toggle", async () => {
  await withPage({ width: 390, height: 844 }, async (page) => {
    const toggle = page.getByRole("button", { name: "Menu" });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const support = page.locator('#primary-nav [data-open="support"]');
    await support.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#site-dialog")).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Escape");
    await expect(page.locator("#site-dialog")).not.toBeVisible();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });
});

test("ambassador enquiry validates names and prepares a WhatsApp draft without sending", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    await page.evaluate(() => {
      window.__openedUrls = [];
      window.open = (...args) => {
        window.__openedUrls.push(args);
        return null;
      };
    });
    await page.locator('.hero-actions [data-open="ambassador"]').click();
    const dialog = page.locator("#site-dialog");
    const name = dialog.getByRole("textbox", {
      name: "Your name",
      exact: true,
    });
    await name.fill("   ");
    await dialog.getByRole("button", { name: "Continue in WhatsApp" }).click();
    assert.deepEqual(await page.evaluate(() => window.__openedUrls), []);
    assert.equal(
      await name.evaluate((element) => element.validity.valid),
      false,
    );
    await name.fill(" Asha & Ravi ");
    await dialog
      .getByRole("textbox", { name: "Your town or district" })
      .fill("Mysuru");
    await dialog
      .getByRole("textbox", { name: "A little more about you" })
      .fill("<hello> #culture ಕನ್ನಡ");
    await dialog.getByRole("button", { name: "Continue in WhatsApp" }).click();
    const opened = await page.evaluate(() => window.__openedUrls);
    assert.equal(opened.length, 1);
    const [href, target, features] = opened[0];
    const url = new URL(href);
    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, "/919902122029");
    assert.equal(url.searchParams.size, 1);
    assert.match(url.searchParams.get("text"), /Name: Asha & Ravi\n/);
    assert.match(url.searchParams.get("text"), /<hello> #culture ಕನ್ನಡ/);
    assert.equal(target, "_blank");
    assert.match(features, /noopener/);
    await expect(dialog).toContainText("You review and send it there.");
  });
});

test("site has no horizontal overflow at phone, tablet and desktop sizes", async () => {
  for (const width of [320, 390, 768, 1440]) {
    await withPage({ width, height: 900 }, async (page) => {
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `Page overflows at ${width}px.`,
      );
      await page.locator('.join-actions [data-open="ambassador"]').click();
      const dialog = page.locator("#site-dialog");
      assert.ok(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
        `Dialog overflows at ${width}px.`,
      );
    });
  }
});

test("displayed local images and gallery modal images load successfully", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (element) => element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      assert.equal(
        await image.getAttribute("data-fallback-applied"),
        null,
        `Image used a fallback: ${await image.getAttribute("alt")}`,
      );
    }
    for (const trigger of await page.locator("[data-art-open]").all()) {
      const id = await trigger.getAttribute("data-art-open");
      const entry = galleryEntries.find((item) => item.id === id);
      await trigger.click();
      const photo = page.locator("#site-dialog .dialog-photo");
      await expect(photo).toHaveJSProperty("src", new URL(entry.imageSrc.slice(1), baseURL).href);
      assert.match(await photo.getAttribute("src"), /\.jpe?g$/i);
      await expect
        .poll(() =>
          photo.evaluate(
            (element) => element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      await page.keyboard.press("Escape");
    }
  });
});

test("a failed primary photo recovers with the same tradition's real thumbnail", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    const entry = galleryEntries.find((item) => item.id === "dollu");
    await page.route("**/intentionally-missing-test-image.jpg", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );
    const checkRecovery = async (image) => {
      await image.evaluate((element) => {
        element.removeAttribute("srcset");
        element.src = "/images/intentionally-missing-test-image.jpg";
      });
      await expect(image).toHaveAttribute("data-recovery-attempted", "true");
      await expect
        .poll(
          async () =>
            new URL(await image.getAttribute("src"), page.url()).pathname,
        )
        .toBe(entry.smallImageSrc);
      await expect
        .poll(() =>
          image.evaluate(
            (element) => element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      assert.equal(
        await image.getAttribute("data-fallback-applied"),
        null,
        "A successful photo recovery must not become an unavailable-image state.",
      );
      assert.doesNotMatch(await image.getAttribute("src"), /\.svg(?:\?|$)/i);
      await expect(image).toBeVisible();
    };
    const galleryImage = page.locator('[data-art="dollu"] img');
    await galleryImage.scrollIntoViewIfNeeded();
    await checkRecovery(galleryImage);
    await page.locator('[data-art-open="dollu"]').click();
    await checkRecovery(page.locator("#site-dialog .dialog-photo"));
  });
});

test("unavailable main and backup photos show a localized message without a drawing", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    const entry = galleryEntries.find((item) => item.id === "dollu");
    await page.route("**/images/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      return [entry.imageSrc, entry.smallImageSrc].includes(path)
        ? route.fulfill({ status: 404, body: "" })
        : route.continue();
    });
    await page.reload({ waitUntil: "load" });
    const card = page.locator('[data-art="dollu"]');
    await card.scrollIntoViewIfNeeded();
    const galleryImage = card.locator("img");
    const checkUnavailable = async (image, container) => {
      await expect(image).toHaveAttribute("data-fallback-applied", "true");
      await expect(image).toBeHidden();
      assert.doesNotMatch(await image.getAttribute("src"), /\.svg(?:\?|$)/i);
      await expect(container.locator(".photo-unavailable-text")).toBeVisible();
      await expect(container.locator(".photo-unavailable-text")).toHaveText(
        /photo|photograph/i,
      );
    };
    await checkUnavailable(galleryImage, card);
    await card.locator('[data-art-open="dollu"]').click();
    const dialog = page.locator("#site-dialog");
    const modalImage = dialog.locator(".dialog-photo");
    await checkUnavailable(modalImage, dialog);
    await dialog.locator('[data-language="kn"]').click();
    for (const container of [card, dialog]) {
      await expect(container.locator(".photo-unavailable-text")).toHaveText(
        /[\u0c80-\u0cff]/,
      );
      await expect(container.locator(".photo-unavailable-text")).not.toHaveText(
        /photo|photograph/i,
      );
    }
    await dialog.locator('[data-language="en"]').click();
    for (const container of [card, dialog])
      await expect(container.locator(".photo-unavailable-text")).toHaveText(
        /photo|photograph/i,
      );
  });
});

test("desktop, mobile navigation and enquiry dialog pass automated WCAG checks", async () => {
  for (const width of [390, 1440]) {
    await withPage({ width, height: 1000 }, async (page) => {
      const check = async (state) => {
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          results.violations.map((item) => ({
            id: item.id,
            impact: item.impact,
            targets: item.nodes.map((node) => node.target),
          })),
          [],
          `Accessibility violations in ${state} at ${width}px.`,
        );
      };
      await check("page");
      if (width === 390) {
        await page.getByRole("button", { name: "Menu" }).click();
        await check("expanded mobile navigation");
        await page.keyboard.press("Escape");
      }
      await page.locator('.hero-actions [data-open="ambassador"]').click();
      await check("enquiry dialog");
    });
  }
});

const officialKannadaName = "ಕರ್ನಾಟಕ ಜನಪದ ಸೇವಾ ಟ್ರಸ್ಟ್";
const kannadaScript = /[\u0c80-\u0cff]/;

async function untranslatedUI(page) {
  const labels = await page.evaluate(() => {
    const values = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement;
      if (
        !element ||
        element.closest("script, style, svg, [data-language]") ||
        !element.checkVisibility({ checkVisibilityCSS: true })
      )
        continue;
      if (node.textContent.trim()) values.push(node.textContent.trim());
    }
    for (const element of document.querySelectorAll(
      "[aria-label], [placeholder], img[alt]",
    )) {
      if (
        !element.checkVisibility({ checkVisibilityCSS: true }) ||
        element.closest("[data-language]")
      )
        continue;
      for (const name of ["aria-label", "placeholder", "alt"]) {
        const value = element.getAttribute(name);
        if (value) values.push(value);
      }
    }
    return values;
  });
  const properNames =
    /Karnataka Janapada Seva Trust|T\.?\s?A\.?\s?Narayana Gowda|Dollu Kunitha|Yakshagana|Veeragase|Kamsale|Togalu Gombeyaata|Janapada Geethegalu|Sobane Pada|WhatsApp|English/gi;
  return labels.filter((value) =>
    /[a-z]{2,}/i.test(value.replace(properNames, "")),
  );
}

test("a fresh visit renders the official Kannada name, page, labels and search metadata", async () => {
  await withPage(
    { width: 1440, height: 1000 },
    async (page) => {
      await expect(page.locator("html")).toHaveAttribute("lang", "kn");
      await expect(
        page.locator('[data-language="kn"]').first(),
      ).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".brand-kannada")).toHaveText(
        officialKannadaName,
      );
      await expect(page.locator("h1")).toHaveText(kannadaScript);
      assert.match(await page.title(), kannadaScript);
      assert.ok((await page.title()).includes(officialKannadaName));
      assert.doesNotMatch(
        await page.locator("body").innerText(),
        /ಕರ್ನಾಟಕ ಜಾನಪದ ಸೇವಾ ಟ್ರಸ್ಟ್/,
        "Every displayed Trust name must use the supplied official Kannada spelling.",
      );
      for (const selector of [
        'meta[name="description"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[name="twitter:title"]',
        'meta[name="twitter:description"]',
      ]) {
        assert.match(
          await page.locator(selector).getAttribute("content"),
          kannadaScript,
          `${selector} must be localized.`,
        );
      }
      const schema = JSON.parse(
        await page.locator("#organization-schema").textContent(),
      );
      assert.equal(schema.name, officialKannadaName);
      assert.ok(
        (await page.locator("[data-i18n]").count()) > 50,
        "Page copy must be covered by the locale dictionary.",
      );
      assert.deepEqual(
        await untranslatedUI(page),
        [],
        "Visible copy and accessible labels must not leak untranslated English.",
      );
      const html = await (await page.request.get(baseURL)).text();
      assert.match(html, /<html[^>]*lang=["']kn["']/);
      assert.ok(
        html.includes(officialKannadaName),
        "The default HTML must contain the official Kannada name before JavaScript runs.",
      );
    },
    { language: null },
  );
});

test("Kannada dialogs, filters and English switching remain consistent with the selected locale", async () => {
  await withPage(
    { width: 1440, height: 1000 },
    async (page) => {
      await page.locator('[data-filter="karavali"]').click();
      await expect(page.locator(".art-card:visible")).toHaveCount(
        expectedEntries({ region: "karavali" }).length,
      );
      await expect(page.locator("#gallery-count")).toHaveText(kannadaScript);
      await page.locator('[data-art-open="yakshagana"]').click();
      await expect(page.locator("#dialog-title")).toHaveText(kannadaScript);
      await expect(page.locator(".dialog-inner h3").first()).toHaveText(
        kannadaScript,
      );
      await page.keyboard.press("Escape");
      for (const type of ["ambassador", "support", "privacy"]) {
        await page
          .locator(`[data-open="${type}"]`)
          .filter({ visible: true })
          .first()
          .click();
        await expect(page.locator("#dialog-title")).toHaveText(kannadaScript);
        assert.deepEqual(
          await untranslatedUI(page),
          [],
          `${type} UI must be fully Kannada.`,
        );
        await page.keyboard.press("Escape");
      }
      await page.locator('[data-open="credits"]').click();
      await expect(page.locator("#dialog-title")).toHaveText(kannadaScript);
      await expect(page.locator(".credit-list li").first()).toBeVisible();
      await page.keyboard.press("Escape");
      await page.locator('[data-language="en"]').first().click();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("h1")).toContainText("Keeping our");
      await expect(page.locator("#gallery-count")).toHaveText(
        countMessage(expectedEntries({ region: "karavali" }).length),
      );
      await expect(page.locator('[data-filter="karavali"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.locator('[data-art-open="yakshagana"]').click();
      await expect(page.locator("#dialog-title")).toHaveText("Yakshagana");
      await expect(page.locator(".dialog-inner h3").first()).toHaveText(
        "Roots & region",
      );
      await page.keyboard.press("Escape");
      await page.locator('.hero-actions [data-open="ambassador"]').click();
      await expect(
        page.locator('#site-dialog input[name="name"]'),
      ).toHaveAttribute("placeholder", "How should we address you?");
      await page.keyboard.press("Escape");
      await page.locator('[data-language="kn"]').first().click();
      await expect(page.locator("html")).toHaveAttribute("lang", "kn");
      await expect(page.locator("#gallery-count")).toHaveText(kannadaScript);
    },
    { language: null },
  );
});

test("changing language in an open dialog preserves entered enquiry values and selected interests", async () => {
  await withPage(
    { width: 390, height: 844 },
    async (page) => {
      await page.evaluate(() => {
        window.__openedUrls = [];
        window.open = (...args) => {
          window.__openedUrls.push(args);
          return null;
        };
      });
      await page.locator('.hero-actions [data-open="ambassador"]').click();
      const dialog = page.locator("#site-dialog");
      await dialog.locator('input[name="name"]').fill("Asha & Ravi");
      await dialog.locator('input[name="location"]').fill("ಮೈಸೂರು");
      await dialog
        .locator('select[name="interest"]')
        .selectOption({ index: 2 });
      await dialog
        .locator('textarea[name="message"]')
        .fill("ಕಲೆ ಮತ್ತು ಸಂಸ್ಕೃತಿ");
      for (const language of ["en", "kn"]) {
        await dialog.locator(`[data-language="${language}"]`).click();
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('input[name="name"]')).toHaveValue(
          "Asha & Ravi",
        );
        await expect(dialog.locator('input[name="location"]')).toHaveValue(
          "ಮೈಸೂರು",
        );
        assert.equal(
          await dialog
            .locator('select[name="interest"]')
            .evaluate((element) => element.selectedIndex),
          2,
        );
        await expect(dialog.locator('textarea[name="message"]')).toHaveValue(
          "ಕಲೆ ಮತ್ತು ಸಂಸ್ಕೃತಿ",
        );
        if (language === "en") {
          await expect(
            dialog.getByRole("textbox", { name: "Your name", exact: true }),
          ).toBeVisible();
          await expect(
            dialog.getByRole("button", { name: "Continue in WhatsApp" }),
          ).toBeVisible();
        } else {
          await expect(dialog.locator("#dialog-title")).toHaveText(
            kannadaScript,
          );
          assert.match(
            await dialog
              .locator('input[name="name"]')
              .getAttribute("placeholder"),
            kannadaScript,
          );
          assert.equal(
            await dialog
              .locator("select option")
              .evaluateAll((options) =>
                options.every((option) =>
                  /[\u0c80-\u0cff]/.test(option.textContent),
                ),
              ),
            true,
          );
        }
      }
      await dialog.locator('button[type="submit"]').click();
      const opened = await page.evaluate(() => window.__openedUrls);
      assert.equal(opened.length, 1);
      const draft = new URL(opened[0][0]).searchParams.get("text");
      assert.match(draft, /Asha & Ravi/);
      assert.match(draft, kannadaScript);
      assert.doesNotMatch(
        draft,
        /I would like|Name:|Location:|Interest:|Message:/,
        "Kannada enquiry boilerplate must be localized too.",
      );
      await page.keyboard.press("Escape");
      await page.locator('[data-art-open="yakshagana"]').click();
      await expect(dialog.locator("#dialog-title")).toHaveText(kannadaScript);
      await dialog.locator('[data-language="en"]').click();
      await expect(dialog.locator("#dialog-title")).toHaveText("Yakshagana");
      await expect(dialog.locator("h3").first()).toHaveText("Roots & region");
      await dialog.locator('[data-language="kn"]').click();
      await expect(dialog.locator("#dialog-title")).toHaveText(kannadaScript);
      await expect(dialog.locator("h3").first()).toHaveText(kannadaScript);
    },
    { language: null },
  );
});

test("English preference survives reload while an invalid saved locale falls back to Kannada", async () => {
  await withPage(
    { width: 1440, height: 1000 },
    async (page) => {
      await page.locator('[data-language="en"]').first().click();
      assert.equal(
        await page.evaluate(() => localStorage.getItem("kjst-language")),
        "en",
      );
      await page.reload({ waitUntil: "load" });
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("h1")).toContainText("Keeping our");
      assert.match(await page.title(), /Karnataka Janapada Seva Trust/);
      assert.equal(
        JSON.parse(await page.locator("#organization-schema").textContent())
          .name,
        "Karnataka Janapada Seva Trust",
      );
    },
    { language: null },
  );
  await withPage(
    { width: 390, height: 844 },
    async (page) => {
      await expect(page.locator("html")).toHaveAttribute("lang", "kn");
      await expect(page.locator(".brand-kannada")).toHaveText(
        officialKannadaName,
      );
      await expect(page.locator("h1")).toHaveText(kannadaScript);
    },
    { language: null, storedLanguage: "unsupported-locale" },
  );
});

test("language switching works from the keyboard and preserves mobile dialog focus behavior", async () => {
  await withPage(
    { width: 390, height: 844 },
    async (page) => {
      const english = page.locator('[data-language="en"]').first();
      await english.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(english).toBeFocused();
      const kannada = page.locator('[data-language="kn"]').first();
      await kannada.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("html")).toHaveAttribute("lang", "kn");
      await expect(kannada).toBeFocused();
      const toggle = page.locator(".menu-toggle");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await page.locator('#primary-nav [data-open="support"]').click();
      await expect(page.locator("#dialog-title")).toHaveText(kannadaScript);
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "Kannada controls must fit the mobile viewport.",
      );
    },
    { language: null },
  );
});

test("Kannada layouts remain within the viewport and pass automated accessibility checks", async () => {
  for (const width of [320, 390, 768, 1440]) {
    await withPage(
      { width, height: 1000 },
      async (page) => {
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `Kannada page overflows at ${width}px.`,
        );
        if (width === 390 || width === 1440) {
          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          assert.deepEqual(
            results.violations.map((item) => ({
              id: item.id,
              targets: item.nodes.map((node) => node.target),
            })),
            [],
            `Kannada page accessibility failures at ${width}px.`,
          );
        }
        await page.locator('.hero-actions [data-open="ambassador"]').click();
        assert.ok(
          await page
            .locator("#site-dialog")
            .evaluate(
              (element) => element.scrollWidth <= element.clientWidth + 1,
            ),
          `Kannada dialog overflows at ${width}px.`,
        );
        if (width === 390) {
          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          assert.deepEqual(
            results.violations.map((item) => ({
              id: item.id,
              targets: item.nodes.map((node) => node.target),
            })),
            [],
            "Kannada enquiry dialog accessibility failures.",
          );
        }
      },
      { language: null },
    );
  }
});

test("category tabs expose all seven parts of Karnataka folk heritage", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    await expect(page.locator(".art-card")).toHaveCount(galleryEntries.length);
    for (const [category, count] of Object.entries({
      literature: 4,
      music: 4,
      dance: 11,
      ritual: 3,
      puppetry: 3,
      crafts: 5,
      instruments: 8,
    })) {
      const filter = page.locator(`[data-category="${category}"]`);
      await filter.click();
      await expect(filter).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".art-card:visible")).toHaveCount(count);
      await expect(page.locator("#gallery-count")).toHaveText(
        countMessage(count),
      );
      assert.deepEqual(
        await page
          .locator(".art-card:visible")
          .evaluateAll((cards) => cards.map((card) => card.dataset.art).sort()),
        expectedEntries({ category })
          .map((entry) => entry.id)
          .sort(),
      );
      await expect(
        page.locator('[data-category][aria-pressed="true"]'),
      ).toHaveCount(1);
    }
    await page.locator('[data-category="all"]').click();
    await expect(page.locator(".art-card:visible")).toHaveCount(galleryEntries.length);
  });
});

test("category and region filters intersect and an empty result can reset both", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    for (const category of ["literature", "music", "dance", "ritual", "puppetry", "crafts", "instruments"]) {
      await page.locator(`[data-category="${category}"]`).click();
      for (const region of ["karavali", "bayaluseeme", "malenadu"]) {
        await page.locator(`[data-filter="${region}"]`).click();
        const expected = expectedEntries({ category, region });
        await expect(page.locator(".art-card:visible")).toHaveCount(
          expected.length,
        );
        await expect(page.locator("#gallery-count")).toHaveText(
          countMessage(expected.length),
        );
        assert.deepEqual(
          await page
            .locator(".art-card:visible")
            .evaluateAll((cards) =>
              cards.map((card) => card.dataset.art).sort(),
            ),
          expected.map((entry) => entry.id).sort(),
        );
      }
    }
    const empty = ["literature", "music", "dance", "crafts"]
      .flatMap((category) =>
        ["karavali", "bayaluseeme", "malenadu"].map((region) => ({
          category,
          region,
        })),
      )
      .find((filters) => expectedEntries(filters).length === 0);
    assert.ok(
      empty,
      "At least one valid category/region combination should exercise the empty state.",
    );
    await page.locator(`[data-category="${empty.category}"]`).click();
    await page.locator(`[data-filter="${empty.region}"]`).click();
    await expect(page.locator(".art-card:visible")).toHaveCount(0);
    await expect(page.locator("[data-reset-gallery]")).toBeVisible();
    await page.locator('[data-language="kn"]').first().click();
    await expect(page.locator(".art-card:visible")).toHaveCount(0);
    assert.deepEqual(
      await untranslatedUI(page),
      [],
      "The empty-state message and reset action must be localized.",
    );
    await page.locator("[data-reset-gallery]").click();
    await expect(page.locator('[data-category="all"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator('[data-filter="all"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".art-card:visible")).toHaveCount(galleryEntries.length);
  });
});

test("switching language preserves the selected category and region", async () => {
  await withPage({ width: 390, height: 1000 }, async (page) => {
    await page.locator('[data-category="crafts"]').click();
    await page.locator('[data-filter="bayaluseeme"]').click();
    const expected = expectedEntries({
      category: "crafts",
      region: "bayaluseeme",
    });
    assert.ok(expected.length > 0);
    for (const language of ["kn", "en"]) {
      await page.locator(`[data-language="${language}"]`).first().click();
      await expect(page.locator('[data-category="crafts"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.locator('[data-filter="bayaluseeme"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.locator(".art-card:visible")).toHaveCount(
        expected.length,
      );
      await expect(page.locator("#gallery-count")).toHaveText(
        language === "en" ? countMessage(expected.length) : kannadaScript,
      );
      if (language === "kn") assert.deepEqual(await untranslatedUI(page), []);
      await page.locator(`[data-art-open="${expected[0].id}"]`).click();
      await expect(page.locator("#dialog-title")).toHaveText(
        expected[0][language].name,
      );
      await page.keyboard.press("Escape");
    }
  });
});

test("leadership shows one president card with a loaded portrait in both languages", async () => {
  for (const width of [320, 1440]) {
    for (const language of ["kn", "en"]) {
      await withPage({ width, height: 1000 }, async (page) => {
        const leadership = page.locator("#leadership");
        const card = leadership.locator(".leader-card");
        await expect(card).toHaveCount(1);
        await expect(card.getByRole("heading", { level: 3 })).toHaveText(
          language === "kn" ? "ಟಿ.ಎ. ನಾರಾಯಣಗೌಡ್ರು" : "T.A. Narayana Gowda",
        );
        await expect(card.locator(".leader-role")).toHaveText(
          language === "kn" ? "ಅಧ್ಯಕ್ಷರು" : "PRESIDENT",
        );
        await expect(card).toContainText(
          language === "kn" ? officialKannadaName : "Karnataka Janapada Seva Trust",
        );
        const image = leadership.locator("img");
        await expect(image).toHaveCount(1);
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveJSProperty("src", new URL("images/president.jpg", baseURL).href);
        await expect.poll(() => image.evaluate(
          (element) => element.complete && element.naturalWidth > 0,
        )).toBe(true);
        assert.equal(await image.getAttribute("data-fallback-applied"), null);
      }, { language });
    }
  }
});

test("search finds English and Kannada names regardless of the interface language", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    const search = page.locator("#heritage-search");
    await expect(search).toHaveAttribute("type", "search");
    for (const query of ["Veeragase", "ವೀರಗಾಸೆ"]) {
      await search.fill(query);
      await search.press("Enter");
      await expect(search).toHaveValue(query);
      await expect(page.locator(".art-card:visible")).toHaveCount(1);
      await expect(page.locator('[data-art="veeragase"]')).toBeVisible();
    }
    await page.locator('[data-language="kn"]').first().click();
    await expect(search).toHaveValue("ವೀರಗಾಸೆ");
    assert.match(await search.getAttribute("placeholder"), kannadaScript);
    await search.fill("Channapatna");
    await expect(page.locator(".art-card:visible")).toHaveCount(1);
    await expect(page.locator('[data-art="channapatna"]')).toBeVisible();
    await search.fill("ಚನ್ನಪಟ್ಟಣ");
    await page.locator('[data-language="en"]').first().click();
    await expect(search).toHaveValue("ಚನ್ನಪಟ್ಟಣ");
    await expect(page.locator('[data-art="channapatna"]')).toBeVisible();
    await page.locator("[data-clear-search]").click();
    await expect(search).toHaveValue("");
    await expect(page.locator(".art-card:visible")).toHaveCount(galleryEntries.length);
  });
});

test("search combines with category and region, while reset clears all three choices", async () => {
  await withPage({ width: 390, height: 1000 }, async (page) => {
    await page.locator('[data-category="crafts"]').click();
    await page.locator('[data-filter="bayaluseeme"]').click();
    const search = page.locator("#heritage-search");
    await search.fill("Channapatna");
    await expect(page.locator(".art-card:visible")).toHaveCount(1);
    await expect(page.locator('[data-art="channapatna"]')).toBeVisible();
    await page.locator('[data-filter="karavali"]').click();
    await expect(page.locator(".art-card:visible")).toHaveCount(0);
    await expect(page.locator(".gallery-empty")).toBeVisible();
    await page.locator('[data-language="kn"]').first().click();
    await expect(search).toHaveValue("Channapatna");
    await expect(page.locator('[data-category="crafts"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator('[data-filter="karavali"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".art-card:visible")).toHaveCount(0);
    await page.locator("[data-reset-gallery]").click();
    await expect(search).toHaveValue("");
    await expect(page.locator('[data-category="all"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator('[data-filter="all"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".art-card:visible")).toHaveCount(galleryEntries.length);
  });
});

test("category shortcuts lead directly to the relevant collection", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    for (const category of ["literature", "music", "dance", "ritual", "puppetry", "crafts", "instruments"]) {
      const shortcut = page
        .locator(`[data-browse-category="${category}"]`)
        .first();
      await expect(shortcut).toBeVisible();
      await shortcut.click();
      await expect(
        page.locator(`[data-category="${category}"]`),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".art-card:visible")).toHaveCount(
        expectedEntries({ category }).length,
      );
    }
  });
});

test("every gallery and detail image is a photograph and Kinnal context is visible in both languages", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    for (const image of await page.locator(".art-image img").all())
      assert.match(await image.getAttribute("src"), /\.jpe?g$/i);
    await expect(page.locator(".illustration-label")).toHaveCount(0);
    const entry = galleryEntries.find((item) => item.id === "kinhal");
    const card = page.locator('[data-art="kinhal"]');
    for (const language of ["en", "kn"]) {
      await page.locator(`[data-language="${language}"]`).first().click();
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator("img")).toHaveJSProperty(
        "src",
        new URL("images/kinhal-authentic.jpg", baseURL).href,
      );
      await expect(card).toContainText(entry.photoCaption[language]);
      await card.locator('[data-art-open="kinhal"]').click();
      const dialog = page.locator("#site-dialog");
      await expect(dialog.locator(".dialog-photo")).toHaveJSProperty(
        "src",
        new URL("images/kinhal-authentic.jpg", baseURL).href,
      );
      await expect(dialog).toContainText(entry.photoCaption[language]);
      await dialog.locator("#art-credit").scrollIntoViewIfNeeded();
      await expect(dialog.locator(".dialog-close")).toBeInViewport({
        ratio: 1,
      });
      await page.keyboard.press("Escape");
    }
  });
});

test("rituals and puppet forms have distinct groups and translated detail without duplicating Togalu", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    for (const language of ["kn", "en"]) {
      await page.locator(`[data-language="${language}"]`).first().click();
      for (const [category, ids] of Object.entries({
        ritual: ["bengaluru-karaga", "bhootha-aradhane", "nagamandala"],
        puppetry: ["gaarudi-gombe", "puppetry", "sootrada-gombeyata"],
      })) {
        await page.locator(`[data-category="${category}"]`).click();
        assert.deepEqual(await page.locator(".art-card:visible").evaluateAll((cards) => cards.map((card) => card.dataset.art).sort()), ids);
        for (const id of ids) {
          const entry = galleryEntries.find((item) => item.id === id);
          await page.locator(`.art-card [data-art-open="${id}"]`).click();
          await expect(page.locator("#dialog-title")).toHaveText(entry[language].name);
          await expect(page.locator("#dialog-content")).toContainText(entry[language].origin);
          await expect.poll(() => page.locator(".dialog-photo").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
          await page.keyboard.press("Escape");
        }
      }
    }
    await expect(page.locator('.art-card[data-art="puppetry"]')).toHaveCount(1);
  });
});

test("the dedicated instrument section is accessible in both languages on desktop and mobile", async () => {
  for (const width of [390, 1440]) {
    await withPage({ width, height: 1000 }, async (page) => {
      const instruments = galleryEntries.filter((entry) => entry.category === "instruments");
      await page.locator('.category-shortcut[data-browse-category="instruments"]').click();
      await expect(page).toHaveURL(/#instruments$/);
      await expect(page.locator("#instruments-heading")).toBeInViewport();
      await expect(page.locator("#instruments .instrument-card")).toHaveCount(8);
      for (const language of ["kn", "en"]) {
        await page.locator(`[data-language="${language}"]`).first().click();
        for (const entry of instruments) {
          const card = page.locator(`[data-instrument="${entry.id}"]`);
          await expect(card.locator("h3")).toHaveText(entry[language].name);
          await expect(card.locator(".instrument-summary")).toHaveText(entry[language].summary);
          await card.locator(".instrument-open").click();
          await expect(page.locator("#dialog-title")).toHaveText(entry[language].name);
          await expect.poll(() => page.locator(".dialog-photo").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
          await page.keyboard.press("Escape");
          if (entry.photoFit === "contain") {
            const imageBox = await card.locator("img").boundingBox();
            const containerBox = await card.locator(".instrument-photo").boundingBox();
            assert.ok(imageBox.height <= containerBox.height + 1, "Instrument images must fit their frames without being clipped.");
          }
        }
      }
      await page.locator("#instruments [data-browse-category]").click();
      await expect(page.locator('.art-card:visible')).toHaveCount(8);
      await expect(page.locator('[data-category="instruments"]')).toHaveAttribute("aria-pressed", "true");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    });
  }
});

test("selected theatre photographs retain their translated names and reuse notices", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    for (const id of ["krishna-parijatha", "sannata-bayalata"]) {
      const entry = galleryEntries.find((item) => item.id === id);
      await page.locator(`.art-card [data-art-open="${id}"]`).click();
      const credit = page.locator("#art-credit");
      await expect(credit).toContainText("No public reuse license is asserted");
      await expect(credit.locator("a")).toHaveText(entry.en.name);
      await expect(page.locator(".dialog-photo-caption")).toContainText(entry.photoCaption.en);
      await page.locator('#site-dialog [data-language="kn"]').click();
      await expect(credit).toContainText("ಸಾರ್ವಜನಿಕ ಮರುಬಳಕೆಯ");
      await expect(page.locator(".dialog-photo-caption")).toContainText(entry.photoCaption.kn);
      await page.keyboard.press("Escape");
      await page.locator('[data-language="en"]').first().click();
    }
  });
});
