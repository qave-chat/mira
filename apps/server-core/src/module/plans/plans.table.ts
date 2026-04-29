import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { PlanExplorationItem } from "./plans.schema";

export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    userId: text("user_id").notNull(),
    exploration: jsonb("exploration").$type<ReadonlyArray<PlanExplorationItem>>().notNull(),
    intent: text("intent").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("plans_session_id_idx").on(table.sessionId)],
);
