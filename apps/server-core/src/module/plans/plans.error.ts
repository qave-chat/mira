import { Schema } from "effect";

export class ErrorPlanNotFound extends Schema.TaggedErrorClass<ErrorPlanNotFound>()(
  "ErrorPlanNotFound",
  { id: Schema.String },
) {}
