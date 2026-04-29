import { Schema } from "effect";

export class ErrorSessionNotFound extends Schema.TaggedErrorClass<ErrorSessionNotFound>()(
  "ErrorSessionNotFound",
  { id: Schema.String },
) {}
