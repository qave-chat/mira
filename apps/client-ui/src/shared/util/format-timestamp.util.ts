import { DateTime } from "effect";

export function toIso(ms: number): string {
  return DateTime.formatIso(DateTime.makeUnsafe(ms));
}

export function toLocal(ms: number): string {
  return DateTime.formatLocal(DateTime.makeUnsafe(ms), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
