import { mkdtemp, cp, symlink, rm, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { once } from "node:events";
import { execFileSync } from "node:child_process";

const source = fileURLToPath(new URL("../", import.meta.url));

export async function createBuildFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "kjst-seo-test-"));
  for (const name of ["public", "scripts", ".github", "package.json"])
    await cp(path.join(source, name), path.join(root, name), { recursive: true });
  await symlink(path.join(source, "node_modules"), path.join(root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return {
    root,
    build(siteURL = "") {
      return execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: root, env: { ...process.env, SITE_URL: siteURL }, stdio: "pipe" });
    },
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

export async function serveFixture(directory, prefix = "/") {
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (!url.pathname.startsWith(prefix)) return void response.writeHead(404).end();
      const resource = path.resolve(directory, decodeURIComponent(url.pathname.slice(prefix.length)) || ".");
      if (resource !== directory && !resource.startsWith(directory + path.sep)) return void response.writeHead(403).end();
      const info = await stat(resource);
      if (info.isDirectory() && !url.pathname.endsWith("/"))
        return void response.writeHead(301, { Location: url.pathname + "/" + url.search }).end();
      const file = info.isDirectory() ? path.join(resource, "index.html") : resource;
      response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
      response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { baseURL: `http://127.0.0.1:${server.address().port}${prefix}`, close: () => new Promise((resolve) => server.close(resolve)) };
}
