import { Clock, Context, Effect, Layer } from "effect";
import type {
  Session,
  SessionCreatePayload,
  SessionInsertRow,
  SessionRow,
} from "./sessions.schema";
import { SessionsRepo } from "./sessions.repo";
import { ErrorSessionNotFound } from "./sessions.error";

const KSUID_EPOCH_SECONDS = 1_400_000_000;
const KSUID_BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KSUID_BYTE_LENGTH = 20;
const KSUID_RANDOM_BYTE_LENGTH = 16;
const SESSION_ID_PREFIX = "ses";
const DEFAULT_SESSION_PLAN = "Draft";

const withModuleLogs = Effect.annotateLogs({ module: "sessions" });

export class SessionsService extends Context.Service<SessionsService>()("module/SessionsService", {
  make: Effect.gen(function* () {
    const repo = yield* SessionsRepo;

    const create = Effect.fn("SessionsService.create")(function* (
      input: SessionCreatePayload & { readonly userId: string },
    ) {
      const now = yield* Clock.currentTimeMillis;
      const session: SessionInsertRow = {
        id: createSessionId(now),
        userId: input.userId,
        name: input.name,
        plan: DEFAULT_SESSION_PLAN,
      };
      yield* Effect.annotateCurrentSpan({ "session.id": session.id, "user.id": input.userId });
      const row = yield* repo.insert(session);
      yield* Effect.logInfo("session.created");
      return toSession(row);
    }, withModuleLogs);

    const list = Effect.fn("SessionsService.list")(function* (userId: string) {
      yield* Effect.annotateCurrentSpan({ "user.id": userId });
      const rows = yield* repo.listByUserId(userId);
      return rows.map(toSession);
    }, withModuleLogs);

    const get = Effect.fn("SessionsService.get")(function* (input: {
      readonly id: string;
      readonly userId: string;
    }) {
      yield* Effect.annotateCurrentSpan({ "session.id": input.id, "user.id": input.userId });
      const row = yield* repo.getById(input.id);
      if (!row || row.userId !== input.userId) {
        return yield* new ErrorSessionNotFound({ id: input.id });
      }
      return toSession(row);
    }, withModuleLogs);

    return { create, list, get } as const;
  }),
}) {}

export const SessionsServiceLive = Layer.effect(SessionsService, SessionsService.make);

function createSessionId(now: number) {
  return `${SESSION_ID_PREFIX}_${createKsuid(now)}`;
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

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    plan: row.plan,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}
