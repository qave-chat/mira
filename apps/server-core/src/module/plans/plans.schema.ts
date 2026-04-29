import { Schema } from "effect";

export const PlanExplorationItem = Schema.Struct({
  screenshot: Schema.String,
  reason: Schema.String,
});
export type PlanExplorationItem = typeof PlanExplorationItem.Type;

export const Plan = Schema.Struct({
  id: Schema.String,
  sessionId: Schema.String,
  userId: Schema.String,
  exploration: Schema.Array(PlanExplorationItem),
  intent: Schema.String,
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
});
export type Plan = typeof Plan.Type;

export const PlanCreatePayload = Schema.Struct({
  sessionId: Schema.String,
  exploration: Schema.Array(PlanExplorationItem),
  intent: Schema.String,
});
export type PlanCreatePayload = typeof PlanCreatePayload.Type;

export type PlanRow = {
  readonly id: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly exploration: ReadonlyArray<PlanExplorationItem>;
  readonly intent: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type PlanInsertRow = Omit<PlanRow, "createdAt" | "updatedAt">;
