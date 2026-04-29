import { Clock, Context, Effect, Layer } from "effect";
import type { Plan, PlanCreatePayload, PlanInsertRow, PlanRow } from "./plans.schema";
import { ErrorPlanNotFound } from "./plans.error";
import { PlansRepo } from "./plans.repo";
import { SessionsService } from "../sessions/sessions.service";

const KSUID_EPOCH_SECONDS = 1_400_000_000;
const KSUID_BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KSUID_BYTE_LENGTH = 20;
const KSUID_RANDOM_BYTE_LENGTH = 16;
const PLAN_ID_PREFIX = "pla";

const withModuleLogs = Effect.annotateLogs({ module: "plans" });

export class PlansService extends Context.Service<PlansService>()("module/PlansService", {
  make: Effect.gen(function* () {
    const repo = yield* PlansRepo;
    const sessions = yield* SessionsService;

    const create = Effect.fn("PlansService.create")(function* (
      input: PlanCreatePayload & { readonly userId: string },
    ) {
      yield* Effect.annotateCurrentSpan({ "session.id": input.sessionId, "user.id": input.userId });
      yield* sessions.get({ id: input.sessionId, userId: input.userId });
      const now = yield* Clock.currentTimeMillis;
      const plan: PlanInsertRow = {
        id: createPlanId(now),
        sessionId: input.sessionId,
        userId: input.userId,
        exploration: input.exploration,
        intent: input.intent,
      };
      const row = yield* repo.insert(plan);
      yield* Effect.logInfo("plan.created");
      return toPlan(row);
    }, withModuleLogs);

    const list = Effect.fn("PlansService.list")(function* (input: {
      readonly sessionId: string;
      readonly userId: string;
    }) {
      yield* Effect.annotateCurrentSpan({ "session.id": input.sessionId, "user.id": input.userId });
      yield* sessions.get({ id: input.sessionId, userId: input.userId });
      const rows = yield* repo.listBySessionId(input.sessionId);
      return rows.map(toPlan);
    }, withModuleLogs);

    const get = Effect.fn("PlansService.get")(function* (input: {
      readonly id: string;
      readonly userId: string;
    }) {
      yield* Effect.annotateCurrentSpan({ "plan.id": input.id, "user.id": input.userId });
      const row = yield* repo.getById(input.id);
      if (!row || row.userId !== input.userId) {
        return yield* new ErrorPlanNotFound({ id: input.id });
      }
      return toPlan(row);
    }, withModuleLogs);

    return { create, list, get } as const;
  }),
}) {}

export const PlansServiceLive = Layer.effect(PlansService, PlansService.make);

function createPlanId(now: number) {
  return `${PLAN_ID_PREFIX}_${createKsuid(now)}`;
}

function createKsuid(now: number) {
  const bytes = new Uint8Array(KSUID_BYTE_LENGTH);
  const timestamp = Math.floor(now / 1000) - KSUID_EPOCH_SECONDS;

  new DataView(bytes.buffer).setUint32(0, timestamp);
  crypto.getRandomValues(bytes.subarray(KSUID_BYTE_LENGTH - KSUID_RANDOM_BYTE_LENGTH));

  return encodeBase62(bytes);
}

function encodeBase62(bytes: Uint8Array) {
  let value = 0n;
  for (const byte of bytes) {
    value = value * 256n + BigInt(byte);
  }

  let output = "";
  while (value > 0n) {
    const remainder = Number(value % 62n);
    output = KSUID_BASE62_ALPHABET[remainder] + output;
    value = value / 62n;
  }

  return output.padStart(27, "0");
}

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    exploration: row.exploration,
    intent: row.intent,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}
