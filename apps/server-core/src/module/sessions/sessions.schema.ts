import { Schema } from "effect";

export const Session = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  name: Schema.String,
  plan: Schema.String,
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
});
export type Session = typeof Session.Type;

export const SessionCreatePayload = Schema.Struct({
  name: Schema.String,
});
export type SessionCreatePayload = typeof SessionCreatePayload.Type;

export const SessionDeleteR2WorkflowInput = Schema.Struct({
  sessionId: Schema.String,
  keys: Schema.Array(Schema.String),
});
export type SessionDeleteR2WorkflowInput = typeof SessionDeleteR2WorkflowInput.Type;

export const SessionDeleteR2WorkflowResult = Schema.Struct({
  deleted: Schema.Number,
});
export type SessionDeleteR2WorkflowResult = typeof SessionDeleteR2WorkflowResult.Type;

export type SessionRow = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly plan: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type SessionInsertRow = Omit<SessionRow, "createdAt" | "updatedAt">;
