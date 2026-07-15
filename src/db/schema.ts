import { Block } from "@blocknote/core";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  json,
  index,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at").defaultNow().notNull();
const updatedAt = timestamp("updated_at")
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());

export const documentsTable = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull(),
    title: varchar("title", {length: 255}).default("Untitled Document").notNull(),
    content: json("content").$type<Block[]>(),
    createdAt,
    updatedAt,
  },
  (t) => [index("clerk_user_id_idx").on(t.clerkUserId)],
);

export const assignmentsTable = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    course: varchar("course", { length: 120 }),
    description: text("description"),
    dueDate: date("due_date"),
    createdAt,
    updatedAt,
  },
  (t) => [index("assignments_clerk_user_id_idx").on(t.clerkUserId)],
);
