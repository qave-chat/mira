import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { Context, Effect, Layer, Schema } from "effect";
import { mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const withModuleLogs = Effect.annotateLogs({ module: "video-generate" });

export class ErrorVideoGenerateRender extends Schema.TaggedErrorClass<ErrorVideoGenerateRender>()(
  "ErrorVideoGenerateRender",
  { message: Schema.String, cause: Schema.Defect },
) {}

const renderError = (cause: unknown) =>
  new ErrorVideoGenerateRender({
    message: cause instanceof Error ? cause.message : String(cause),
    cause,
  });

export class VideoGenerateRenderer extends Context.Service<VideoGenerateRenderer>()(
  "module/VideoGenerateRenderer",
  {
    make: Effect.gen(function* () {
      const moduleDir = path.dirname(fileURLToPath(import.meta.url));
      const entryPoint = path.join(moduleDir, "remotion/index.ts");
      const outDir =
        process.env.MIRA_VIDEO_GENERATE_DIR ?? path.join(tmpdir(), "mira", "video-generate");
      yield* Effect.tryPromise({
        try: () => mkdir(outDir, { recursive: true }),
        catch: renderError,
      });
      const serveUrl = yield* Effect.tryPromise({
        try: () => bundle({ entryPoint }),
        catch: renderError,
      });

      const render = Effect.fn("VideoGenerateRenderer.render")(function* (input: {
        readonly id: string;
        readonly prompt: string;
        readonly photoUrls: ReadonlyArray<string>;
      }) {
        const inputProps = { prompt: input.prompt, photoUrls: input.photoUrls };
        const outputLocation = path.join(outDir, `${input.id}.mp4`);
        yield* Effect.logInfo("video-generate.remotion.select-composition", { id: input.id });
        const composition = yield* Effect.tryPromise({
          try: () =>
            selectComposition({
              serveUrl,
              id: "VideoGenerateSlideshow",
              inputProps,
            }),
          catch: renderError,
        });
        yield* Effect.logInfo("video-generate.remotion.render-started", { id: input.id });
        yield* Effect.tryPromise({
          try: () =>
            renderMedia({
              composition,
              serveUrl,
              codec: "h264",
              outputLocation,
              inputProps,
              onProgress: ({ progress }) => {
                if (progress === 1 || Math.round(progress * 100) % 25 === 0) {
                  console.log(
                    `video-generate.remotion.progress id=${input.id} progress=${Math.round(progress * 100)}%`,
                  );
                }
              },
            }),
          catch: renderError,
        });
        const bytes = yield* Effect.tryPromise({
          try: () => readFile(outputLocation),
          catch: renderError,
        });
        yield* Effect.tryPromise({
          try: () => rm(outputLocation, { force: true }),
          catch: renderError,
        });
        return bytes;
      }, withModuleLogs);

      return { render } as const;
    }),
  },
) {}

export const VideoGenerateRendererLive = Layer.effect(
  VideoGenerateRenderer,
  VideoGenerateRenderer.make,
);
