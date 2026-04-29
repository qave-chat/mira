import { Schema } from "effect";

export class ErrorVideoGenerateInvalidInput extends Schema.TaggedErrorClass<ErrorVideoGenerateInvalidInput>()(
  "ErrorVideoGenerateInvalidInput",
  { message: Schema.String },
) {}
