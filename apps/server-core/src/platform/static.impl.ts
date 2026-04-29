import { Effect } from "effect";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client");
const indexHtml = path.join(clientDist, "index.html");

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const cacheControl = (pathname: string) =>
  pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache";

const safeFilePath = (pathname: string) => {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^\.\.(?:\/|$)/, "");
  const filePath = path.join(clientDist, normalized);
  return filePath.startsWith(clientDist) ? filePath : indexHtml;
};

const responseForFile = Effect.fn("responseForFile")(function* (
  filePath: string,
  requestPath: string,
) {
  const file = Bun.file(filePath);
  const exists = yield* Effect.promise(() => file.exists());
  if (!exists) {
    return new Response(Bun.file(indexHtml), {
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
  return new Response(file, {
    headers: {
      "Cache-Control": cacheControl(requestPath),
      "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
    },
  });
});

export const StaticLive = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const handleStatic = Effect.fn("StaticLive.handleStatic")(function* (
      request: HttpServerRequest.HttpServerRequest,
    ) {
      const webRequest = yield* HttpServerRequest.toWeb(request);
      const { pathname } = new URL(webRequest.url);
      if (pathname.startsWith("/api/")) {
        return HttpServerResponse.empty({ status: 404 });
      }
      const filePath = pathname === "/" ? indexHtml : safeFilePath(pathname);
      const webResponse = yield* responseForFile(filePath, pathname);
      return HttpServerResponse.fromWeb(webResponse);
    });
    yield* router.add("GET", "/", handleStatic);
    yield* router.add("GET", "/*", handleStatic);
  }),
);
