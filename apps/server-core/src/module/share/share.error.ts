import { Schema } from "effect";

export class ErrorShareNotFound extends Schema.TaggedErrorClass<ErrorShareNotFound>()(
  "ErrorShareNotFound",
  { shareId: Schema.String },
) {}

export class ErrorGeneratedVideoNotFound extends Schema.TaggedErrorClass<ErrorGeneratedVideoNotFound>()(
  "ErrorGeneratedVideoNotFound",
  { generatedVideoId: Schema.String },
) {}

export class ErrorShareInvalidInput extends Schema.TaggedErrorClass<ErrorShareInvalidInput>()(
  "ErrorShareInvalidInput",
  { message: Schema.String },
) {}
