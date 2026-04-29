import { Clock, Context, Effect, Layer } from "effect";
import {
  ErrorGeneratedVideoNotFound,
  ErrorShareInvalidInput,
  ErrorShareNotFound,
} from "./share.error";
import { ShareRepo } from "./share.repo";
import type {
  GeneratedVideo,
  GeneratedVideoCreateInput,
  GeneratedVideoRow,
  Share,
  ShareComment,
  ShareCommentCreateInput,
  ShareCreateInput,
  ShareCommentRow,
  ShareRow,
} from "./share.schema";

const withModuleLogs = Effect.annotateLogs({ module: "share" });
const MAX_AUTHOR_NAME_LENGTH = 80;
const MAX_COMMENT_BODY_LENGTH = 2_000;
const KSUID_EPOCH_SECONDS = 1_400_000_000;
const KSUID_BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KSUID_BYTE_LENGTH = 20;
const KSUID_RANDOM_BYTE_LENGTH = 16;

const validateUrl = (sourceUrl: string) => {
  try {
    const parsed = new URL(sourceUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export class ShareService extends Context.Service<ShareService>()("module/ShareService", {
  make: Effect.gen(function* () {
    const repo = yield* ShareRepo;

    const createGeneratedVideo = Effect.fn("ShareService.createGeneratedVideo")(function* (
      input: GeneratedVideoCreateInput,
    ) {
      const sourceUrl = input.sourceUrl.trim();
      if (!validateUrl(sourceUrl)) {
        return yield* new ErrorShareInvalidInput({ message: "A valid http(s) URL is required" });
      }

      const createdAt = yield* Clock.currentTimeMillis;
      const row = yield* repo.insertGeneratedVideo({
        id: createId("gvi", createdAt),
        sourceUrl,
        videoUrl: sourceUrl,
        status: "ready" as const,
      });
      yield* Effect.logInfo("share.generated-video.created");
      return toGeneratedVideo(row);
    }, withModuleLogs);

    const create = Effect.fn("ShareService.create")(function* (input: ShareCreateInput) {
      const generatedVideo = yield* repo.getGeneratedVideoById(input.generatedVideoId);
      if (!generatedVideo) {
        return yield* new ErrorGeneratedVideoNotFound({
          generatedVideoId: input.generatedVideoId,
        });
      }

      const existingShare = yield* repo.getShareByGeneratedVideoId(generatedVideo.id);
      if (existingShare) {
        return toShare(existingShare);
      }

      const createdAt = yield* Clock.currentTimeMillis;
      const row = yield* repo.insertShare({
        id: createId("shr", createdAt),
        generatedVideoId: generatedVideo.id,
        sourceUrl: generatedVideo.sourceUrl,
        videoUrl: generatedVideo.videoUrl,
        status: "ready" as const,
      });
      yield* Effect.logInfo("share.created");
      return toShare(row);
    }, withModuleLogs);

    const get = Effect.fn("ShareService.get")(function* (shareId: string) {
      yield* Effect.annotateCurrentSpan({ "share.id": shareId });
      const share = yield* repo.getShareById(shareId);
      if (!share) {
        return yield* new ErrorShareNotFound({ shareId });
      }
      const comments = yield* repo.listCommentsByShareId(shareId);
      return { share: toShare(share), comments: comments.map(toShareComment) };
    }, withModuleLogs);

    const createComment = Effect.fn("ShareService.createComment")(function* (
      shareId: string,
      input: ShareCommentCreateInput,
    ) {
      yield* Effect.annotateCurrentSpan({ "share.id": shareId });
      const share = yield* repo.getShareById(shareId);
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

      const createdAt = yield* Clock.currentTimeMillis;
      const row = yield* repo.insertComment({
        id: createId("com", createdAt),
        shareId,
        authorName,
        body,
      });
      yield* Effect.logInfo("share.comment.created");
      return toShareComment(row);
    }, withModuleLogs);

    return { createGeneratedVideo, create, get, createComment } as const;
  }),
}) {}

export const ShareServiceLive = Layer.effect(ShareService, ShareService.make);

function toGeneratedVideo(row: GeneratedVideoRow): GeneratedVideo {
  return {
    id: row.id,
    sourceUrl: row.sourceUrl,
    videoUrl: row.videoUrl,
    status: row.status,
    createdAt: row.createdAt.getTime(),
  };
}

function toShare(row: ShareRow): Share {
  return {
    id: row.id,
    generatedVideoId: row.generatedVideoId,
    sourceUrl: row.sourceUrl,
    videoUrl: row.videoUrl,
    status: row.status,
    createdAt: row.createdAt.getTime(),
  };
}

function toShareComment(row: ShareCommentRow): ShareComment {
  return {
    id: row.id,
    shareId: row.shareId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.getTime(),
  };
}

function createId(prefix: string, now: number) {
  return `${prefix}_${createKsuid(now)}`;
}

function createKsuid(now: number) {
  const bytes = new Uint8Array(KSUID_BYTE_LENGTH);
  const timestamp = Math.floor(now / 1000) - KSUID_EPOCH_SECONDS;

  new DataView(bytes.buffer).setUint32(0, timestamp);
  crypto.getRandomValues(bytes.subarray(KSUID_BYTE_LENGTH - KSUID_RANDOM_BYTE_LENGTH));

  return encodeBase62(bytes);
}

function encodeBase62(bytes: Uint8Array) {
  let value = 0n;
  for (const byte of bytes) {
    value = value * 256n + BigInt(byte);
  }

  let output = "";
  while (value > 0n) {
    const remainder = Number(value % 62n);
    output = KSUID_BASE62_ALPHABET[remainder] + output;
    value = value / 62n;
  }

  return output.padStart(27, "0");
}
