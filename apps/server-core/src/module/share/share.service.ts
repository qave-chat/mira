import { Clock, Context, Effect, Layer } from "effect";
import { randomUUID } from "node:crypto";
import {
  ErrorGeneratedVideoNotFound,
  ErrorShareInvalidInput,
  ErrorShareNotFound,
} from "./share.error";
import type {
  GeneratedVideo,
  GeneratedVideoCreateInput,
  Share,
  ShareComment,
  ShareCommentCreateInput,
  ShareCreateInput,
} from "./share.schema";

const withModuleLogs = Effect.annotateLogs({ module: "share" });
const MAX_AUTHOR_NAME_LENGTH = 80;
const MAX_COMMENT_BODY_LENGTH = 2_000;

const validateUrl = (sourceUrl: string) => {
  try {
    const parsed = new URL(sourceUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export class ShareService extends Context.Service<ShareService>()("module/ShareService", {
  make: Effect.sync(function () {
    const generatedVideos = new Map<string, GeneratedVideo>();
    const shares = new Map<string, Share>();
    const comments = new Map<string, Array<ShareComment>>();

    const createGeneratedVideo = Effect.fn("ShareService.createGeneratedVideo")(function* (
      input: GeneratedVideoCreateInput,
    ) {
      const sourceUrl = input.sourceUrl.trim();
      if (!validateUrl(sourceUrl)) {
        return yield* new ErrorShareInvalidInput({ message: "A valid http(s) URL is required" });
      }

      const id = yield* Effect.sync(() => randomUUID());
      const createdAt = yield* Clock.currentTimeMillis;
      const generatedVideo = {
        id,
        sourceUrl,
        videoUrl: sourceUrl,
        status: "ready" as const,
        createdAt,
      } satisfies GeneratedVideo;
      generatedVideos.set(id, generatedVideo);
      yield* Effect.logInfo("share.generated-video.created");
      return generatedVideo;
    }, withModuleLogs);

    const create = Effect.fn("ShareService.create")(function* (input: ShareCreateInput) {
      const generatedVideo = generatedVideos.get(input.generatedVideoId);
      if (!generatedVideo) {
        return yield* new ErrorGeneratedVideoNotFound({
          generatedVideoId: input.generatedVideoId,
        });
      }

      const existingShare = Array.from(shares.values()).find(
        (share) => share.generatedVideoId === generatedVideo.id,
      );
      if (existingShare) {
        return existingShare;
      }

      const id = yield* Effect.sync(() => randomUUID());
      const createdAt = yield* Clock.currentTimeMillis;
      const share = {
        id,
        generatedVideoId: generatedVideo.id,
        sourceUrl: generatedVideo.sourceUrl,
        videoUrl: generatedVideo.videoUrl,
        status: "ready" as const,
        createdAt,
      } satisfies Share;
      shares.set(id, share);
      comments.set(id, []);
      yield* Effect.logInfo("share.created");
      return share;
    }, withModuleLogs);

    const get = Effect.fn("ShareService.get")(function* (shareId: string) {
      yield* Effect.annotateCurrentSpan({ "share.id": shareId });
      const share = shares.get(shareId);
      if (!share) {
        return yield* new ErrorShareNotFound({ shareId });
      }
      return { share, comments: comments.get(shareId) ?? [] };
    }, withModuleLogs);

    const createComment = Effect.fn("ShareService.createComment")(function* (
      shareId: string,
      input: ShareCommentCreateInput,
    ) {
      yield* Effect.annotateCurrentSpan({ "share.id": shareId });
      const share = shares.get(shareId);
      if (!share) {
        return yield* new ErrorShareNotFound({ shareId });
      }

      const authorName = input.authorName.trim();
      const body = input.body.trim();
      if (authorName.length === 0) {
        return yield* new ErrorShareInvalidInput({ message: "Name is required" });
      }
      if (authorName.length > MAX_AUTHOR_NAME_LENGTH) {
        return yield* new ErrorShareInvalidInput({ message: "Name is too long" });
      }
      if (body.length === 0) {
        return yield* new ErrorShareInvalidInput({ message: "Comment is required" });
      }
      if (body.length > MAX_COMMENT_BODY_LENGTH) {
        return yield* new ErrorShareInvalidInput({ message: "Comment is too long" });
      }

      const comment = {
        id: yield* Effect.sync(() => randomUUID()),
        shareId,
        authorName,
        body,
        createdAt: yield* Clock.currentTimeMillis,
      } satisfies ShareComment;
      comments.set(shareId, [comment, ...(comments.get(shareId) ?? [])]);
      yield* Effect.logInfo("share.comment.created");
      return comment;
    }, withModuleLogs);

    return { createGeneratedVideo, create, get, createComment } as const;
  }),
}) {}

export const ShareServiceLive = Layer.effect(ShareService, ShareService.make);
