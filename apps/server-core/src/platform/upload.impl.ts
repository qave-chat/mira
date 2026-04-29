import { Effect } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { Auth } from "./auth/auth.contract";
import { R2 } from "./r2.contract";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_EXPIRES_SECONDS = 60 * 60;

type UploadedImage = {
  key: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

const isImageFile = (value: unknown): value is File =>
  value instanceof File && value.type.startsWith("image/");

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-");

export const UploadLive = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const auth = yield* Auth;
    const r2 = yield* R2;

    const uploadImages = Effect.fn("UploadLive.uploadImages")(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const headers = new Headers(request.headers as Record<string, string>);
      const session = yield* auth
        .resolveSession(headers)
        .pipe(Effect.catchTags({ ErrorAuth: Effect.die }));
      if (!session.user || !session.session) {
        return HttpServerResponse.fromWeb(
          Response.json({ error: "Authentication required" }, { status: 401 }),
        );
      }

      const webRequest = new Request(request.url, {
        body: request.source as never,
        headers,
        method: request.method,
      });
      const formData = yield* Effect.tryPromise({
        try: () => webRequest.formData(),
        catch: (cause) => cause,
      });
      const files = (formData.getAll("files") as unknown[]).filter(isImageFile);
      if (files.length === 0) {
        return HttpServerResponse.fromWeb(
          Response.json({ error: "No image files provided" }, { status: 400 }),
        );
      }

      const uploaded: UploadedImage[] = [];
      for (const file of files) {
        if (file.size > MAX_IMAGE_BYTES) {
          return HttpServerResponse.fromWeb(
            Response.json({ error: `${file.name} exceeds the 10MB image limit` }, { status: 413 }),
          );
        }

        const key = `uploads/${session.user.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
        const body = new Uint8Array(yield* Effect.promise(() => file.arrayBuffer()));
        yield* r2
          .putObject({ body, contentType: file.type, key })
          .pipe(Effect.catchTags({ ErrorR2: Effect.die }));
        const url = yield* r2
          .signGetObject({ expiresInSeconds: SIGNED_URL_EXPIRES_SECONDS, key })
          .pipe(Effect.catchTags({ ErrorR2: Effect.die }));

        uploaded.push({ key, name: file.name, size: file.size, type: file.type, url });
      }

      return HttpServerResponse.fromWeb(Response.json({ files: uploaded }));
    });

    yield* router.add("POST", "/api/uploads/images", uploadImages);
  }),
);
