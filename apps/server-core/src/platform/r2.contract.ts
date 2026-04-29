import { Context, Effect, Schema } from "effect";

export class ErrorR2 extends Schema.TaggedErrorClass<ErrorR2>()("ErrorR2", {
  message: Schema.String,
  cause: Schema.Defect,
}) {}

export interface R2PutObjectInput {
  readonly key: string;
  readonly body: Uint8Array;
  readonly contentType: string;
}

export interface R2SignGetObjectInput {
  readonly key: string;
  readonly expiresInSeconds: number;
}

export interface R2Service {
  readonly putObject: (input: R2PutObjectInput) => Effect.Effect<void, ErrorR2>;
  readonly signGetObject: (input: R2SignGetObjectInput) => Effect.Effect<string, ErrorR2>;
}

export class R2 extends Context.Service<R2, R2Service>()("platform/R2") {}
