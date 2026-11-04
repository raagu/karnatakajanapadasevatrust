import { readFile, writeFile } from "node:fs/promises";
import { renderHeritageHTML } from "../public/gallery.js";
const target = new URL("../public/index.html", import.meta.url);
await writeFile(target, renderHeritageHTML(await readFile(target, "utf8")));
console.log("Refreshed the default Kannada heritage collection.");
