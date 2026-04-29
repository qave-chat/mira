import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ErrorSessionNotFound } from "../sessions/sessions.service";
import { Plan, PlanCreatePayload } from "./plans.schema";
import { ErrorPlanNotFound } from "./plans.service";

export class PlanCreate extends Rpc.make("PlanCreate", {
  payload: PlanCreatePayload,
  success: Plan,
  error: ErrorSessionNotFound,
}) {}

export class PlanList extends Rpc.make("PlanList", {
  payload: Schema.Struct({ sessionId: Schema.String }),
  success: Schema.Array(Plan),
  error: ErrorSessionNotFound,
}) {}

export class PlanGet extends Rpc.make("PlanGet", {
  payload: Schema.Struct({ id: Schema.String }),
  success: Plan,
  error: ErrorPlanNotFound,
}) {}

export const PlanRpcs = RpcGroup.make(PlanCreate, PlanList, PlanGet);
