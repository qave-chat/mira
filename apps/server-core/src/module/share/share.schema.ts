import { Schema } from "effect";

export const GeneratedVideo = Schema.Struct({
  id: Schema.String,
  sourceUrl: Schema.String,
  videoUrl: Schema.String,
  status: Schema.Literal("ready"),
  createdAt: Schema.Number,
});
export type GeneratedVideo = typeof GeneratedVideo.Type;

export const GeneratedVideoCreateInput = Schema.Struct({
  sourceUrl: Schema.String,
});
export type GeneratedVideoCreateInput = typeof GeneratedVideoCreateInput.Type;

export const Share = Schema.Struct({
  id: Schema.String,
  generatedVideoId: Schema.String,
  sourceUrl: Schema.String,
  videoUrl: Schema.String,
  status: Schema.Literal("ready"),
  createdAt: Schema.Number,
});
export type Share = typeof Share.Type;

export const ShareComment = Schema.Struct({
  id: Schema.String,
  shareId: Schema.String,
  authorName: Schema.String,
  body: Schema.String,
  createdAt: Schema.Number,
});
export type ShareComment = typeof ShareComment.Type;

export const ShareCreateInput = Schema.Struct({
  generatedVideoId: Schema.String,
});
export type ShareCreateInput = typeof ShareCreateInput.Type;

export const ShareCommentCreateInput = Schema.Struct({
  authorName: Schema.String,
  body: Schema.String,
});
export type ShareCommentCreateInput = typeof ShareCommentCreateInput.Type;

export const ShareWithComments = Schema.Struct({
  share: Share,
  comments: Schema.Array(ShareComment),
});
export type ShareWithComments = typeof ShareWithComments.Type;

export type GeneratedVideoRow = {
  readonly id: string;
  readonly sourceUrl: string;
  readonly videoUrl: string;
  readonly status: "ready";
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ShareRow = {
  readonly id: string;
  readonly generatedVideoId: string;
  readonly sourceUrl: string;
  readonly videoUrl: string;
  readonly status: "ready";
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ShareCommentRow = {
  readonly id: string;
  readonly shareId: string;
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
