import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import {
  arts,
  galleryEntries,
  matchesRegion,
  matchesTradition,
  createEnquiryUrl,
} from "../public/content.js";

test("regional associations support overlapping regions without substring matching", () => {
  assert.equal(matchesRegion("karavali malenadu", "malenadu"), true);
  assert.equal(matchesRegion("karavali malenadu", "bayaluseeme"), false);
  assert.equal(matchesRegion("karavali malenadu", "kara"), false);
  assert.equal(matchesRegion("karavali malenadu", "all"), true);
});
test("WhatsApp enquiry uses the supplied number and preserves special characters safely", () => {
  const url = new URL(
    createEnquiryUrl({
      name: "  Asha & Ravi  ",
      location: "Mysuru",
      interest: "Learning & teaching",
      message: "<hello> #culture ಕನ್ನಡ",
    }),
  );
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/919902122029");
  assert.equal(url.searchParams.size, 1);
  assert.match(url.searchParams.get("text"), /Name: Asha & Ravi\n/);
  assert.match(url.searchParams.get("text"), /<hello> #culture ಕನ್ನಡ/);
});
test("the expanded collection covers four researched categories with bilingual detail", async () => {
  assert.equal(galleryEntries.length, 20);
  assert.equal(Object.keys(arts).length, 20);
  assert.equal(new Set(galleryEntries.map((entry) => entry.id)).size, 20);
  const expectedCounts = { literature: 4, music: 4, dance: 8, crafts: 4 };
  const actualCounts = {};
  for (const entry of galleryEntries) {
    actualCounts[entry.category] = (actualCounts[entry.category] || 0) + 1;
    assert.ok(
      arts[entry.id],
      `${entry.id} must be available to the detail dialog.`,
    );
    assert.equal(new URL(arts[entry.id].source).protocol, "https:");
    assert.ok(entry.regions.length > 0);
    assert.ok(
      entry.regions.every((region) =>
        ["karavali", "bayaluseeme", "malenadu"].includes(region),
      ),
    );
    for (const field of [
      "name",
      "region",
      "summary",
      "tag",
      "origin",
      "importance",
    ]) {
      assert.ok(
        entry.en[field]?.trim(),
        `${entry.id}.${field} needs English copy.`,
      );
      assert.match(
        entry.kn[field],
        /[\u0c80-\u0cff]/,
        `${entry.id}.${field} needs Kannada copy.`,
      );
    }
    assert.ok(entry.imageSrc?.startsWith("/images/"));
    assert.ok(
      (await stat(new URL(`../public${entry.imageSrc}`, import.meta.url)))
        .size > 100,
    );
    if (entry.smallImageSrc)
      assert.ok(
        (
          await stat(
            new URL(`../public${entry.smallImageSrc}`, import.meta.url),
          )
        ).size > 100,
      );
    assert.equal(
      entry.illustrated,
      false,
      `${entry.id} must use a real photo.`,
    );
    assert.match(entry.imageSrc, /\.jpe?g$/i);
    for (const imagePath of [entry.imageSrc, entry.smallImageSrc].filter(
      Boolean,
    )) {
      const bytes = await readFile(
        new URL(`../public${imagePath}`, import.meta.url),
      );
      assert.equal(bytes[0], 0xff, `${imagePath} must contain JPEG bytes.`);
      assert.equal(bytes[1], 0xd8, `${imagePath} must contain JPEG bytes.`);
      assert.equal(bytes[2], 0xff, `${imagePath} must contain JPEG bytes.`);
      assert.notEqual(bytes.subarray(0, 100).toString().includes("<svg"), true);
    }
    if (entry.captionType === "representative") {
      assert.ok(
        entry.photoCaption.en?.trim(),
        `${entry.id} needs its representative-photo context.`,
      );
      assert.match(entry.photoCaption.kn, /[\u0c80-\u0cff]/);
    }
  }
  assert.deepEqual(actualCounts, expectedCounts);
});
test("Kinnal photo identifies the joint revival project without claiming exclusive historical provenance", () => {
  const entry = galleryEntries.find((item) => item.id === "kinhal");
  assert.equal(entry.imageSrc, "/images/kinhal-authentic.jpg");
  assert.equal(entry.captionType, "representative");
  assert.match(entry.photoCaption.en, /Sawantwadi[–—-]Kinnal/);
  assert.match(entry.photoCaption.en, /revival project/i);
  assert.match(entry.photoCaption.kn, /ಸಾವಂತವಾಡಿ[–—-]ಕಿನ್ನಾಳ/);
});
test("search matches either language and combines with category and region", () => {
  const veeragase = galleryEntries.find((item) => item.id === "veeragase");
  assert.equal(matchesTradition(veeragase, { query: "  VEERAGASE  " }), true);
  assert.equal(matchesTradition(veeragase, { query: "ವೀರಗಾಸೆ" }), true);
  assert.equal(
    matchesTradition(veeragase, {
      query: "Veeragase",
      category: "dance",
      region: "bayaluseeme",
    }),
    true,
  );
  assert.equal(
    matchesTradition(veeragase, { query: "Veeragase", category: "crafts" }),
    false,
  );
  assert.equal(
    matchesTradition(veeragase, { query: "Veeragase", region: "karavali" }),
    false,
  );
  assert.equal(
    matchesTradition(veeragase, { query: "not-a-tradition" }),
    false,
  );
  assert.equal(matchesTradition(veeragase, { query: "   " }), true);
});
test("NGO schema has a correct context and avoids unsupported founder claims", async () => {
  const html = await readFile(
    new URL("../public/index.html", import.meta.url),
    "utf8",
  );
  const data = JSON.parse(
    html.match(/id="organization-schema">(.*?)<\/script>/s)[1],
  );
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "NGO");
  assert.equal(data.telephone, "+91-9902122029");
  assert.equal(data.founder, undefined);
});
test("photographs retain provenance while user-supplied media makes no Creative Commons claim", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/media.json", import.meta.url), "utf8"),
  );
  for (const entry of galleryEntries) {
    if (entry.illustrated) continue;
    assert.ok(
      entry.mediaId,
      `${entry.id} needs a photograph provenance record.`,
    );
    assert.ok(manifest.find((item) => item.id === entry.mediaId));
  }
  assert.ok(
    manifest.some((item) => item.rightsType === "user-supplied"),
    "The provided Hayath Kargal image must record its user-supplied provenance.",
  );
  for (const item of manifest) {
    assert.ok(item.source && item.local);
    if (item.rightsType === "user-supplied") {
      assert.doesNotMatch(
        String(item.license || ""),
        /CC BY|CC0|Creative Commons|public domain/i,
      );
    } else {
      assert.ok(item.creator && item.license && item.licenseUrl);
    }
    assert.ok(
      (await stat(new URL(`../public${item.local}`, import.meta.url))).size >
        100,
    );
  }
});
