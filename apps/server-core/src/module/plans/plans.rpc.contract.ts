import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ErrorSessionNotFound } from "../sessions/sessions.error";
import { ErrorRpcUnauthorized } from "../../platform/auth/rpc-auth.error";
import { ErrorPlanNotFound } from "./plans.error";
import { Plan, PlanCreatePayload } from "./plans.schema";

export class PlanCreate extends Rpc.make("PlanCreate", {
  payload: PlanCreatePayload,
  success: Plan,
  error: Schema.Union([ErrorSessionNotFound, ErrorRpcUnauthorized]),
}) {}

export class PlanList extends Rpc.make("PlanList", {
  payload: Schema.Struct({ sessionId: Schema.String }),
  success: Schema.Array(Plan),
  error: Schema.Union([ErrorSessionNotFound, ErrorRpcUnauthorized]),
}) {}

export class PlanGet extends Rpc.make("PlanGet", {
  payload: Schema.Struct({ id: Schema.String }),
  success: Plan,
  error: Schema.Union([ErrorPlanNotFound, ErrorRpcUnauthorized]),
}) {}

export const PlanRpcs = RpcGroup.make(PlanCreate, PlanList, PlanGet);
