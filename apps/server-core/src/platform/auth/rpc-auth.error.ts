import { Schema } from "effect";

export class ErrorRpcUnauthorized extends Schema.TaggedErrorClass<ErrorRpcUnauthorized>()(
  "ErrorRpcUnauthorized",
  { message: Schema.String },
) {}

export class ErrorRpcForbidden extends Schema.TaggedErrorClass<ErrorRpcForbidden>()(
  "ErrorRpcForbidden",
  { message: Schema.String },
) {}
