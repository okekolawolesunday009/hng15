import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const emailEvents = pgTable(
  "email_events",
  {
    eventKey: text("event_key").primaryKey(),
    eventType: text("event_type").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    recipient: text("recipient").notNull(),
    status: text("status").notNull().default("sending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => ({
    statusCheck: check(
      "email_events_status_check",
      sql`${table.status} in ('sending', 'sent', 'failed')`,
    ),
  }),
);