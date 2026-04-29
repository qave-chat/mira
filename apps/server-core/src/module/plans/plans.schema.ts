import { Schema } from "effect";

export const PlanExplorationItem = Schema.Struct({
  screenshot: Schema.String,
  screenshotUrl: Schema.optional(Schema.String),
  reason: Schema.String,
  position: Schema.optional(
    Schema.Struct({
      x: Schema.Number,
      y: Schema.Number,
    }),
  ),
});
export type PlanExplorationItem = typeof PlanExplorationItem.Type;

export const PlanLink = Schema.Struct({
  from: Schema.String,
  to: Schema.String,
});
export type PlanLink = typeof PlanLink.Type;

export const Plan = Schema.Struct({
  id: Schema.String,
  sessionId: Schema.String,
  userId: Schema.String,
  exploration: Schema.Array(PlanExplorationItem),
  links: Schema.Array(PlanLink),
  title: Schema.String,
  intent: Schema.String,
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
});
export type Plan = typeof Plan.Type;

export const PlanCreatePayload = Schema.Struct({
  sessionId: Schema.String,
  exploration: Schema.Array(PlanExplorationItem),
  links: Schema.optional(Schema.Array(PlanLink)),
  title: Schema.String,
  intent: Schema.String,
});
export type PlanCreatePayload = typeof PlanCreatePayload.Type;

export const PlanUpdatePayload = Schema.Struct({
  id: Schema.String,
  exploration: Schema.Array(PlanExplorationItem),
  links: Schema.Array(PlanLink),
});
export type PlanUpdatePayload = typeof PlanUpdatePayload.Type;

export type PlanRow = {
  readonly id: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly exploration: ReadonlyArray<PlanExplorationItem>;
  readonly links: ReadonlyArray<PlanLink>;
  readonly title: string;
  readonly intent: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type PlanInsertRow = Omit<PlanRow, "createdAt" | "updatedAt">;
export type PlanUpdateRow = Pick<PlanRow, "exploration" | "links">;
