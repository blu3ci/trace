import { Block } from "@blocknote/core";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  json,
  index,
  primaryKey,
  uniqueIndex,
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
    accessCode: varchar("access_code", { length: 6 }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("assignments_clerk_user_id_idx").on(t.clerkUserId),
    uniqueIndex("assignments_access_code_idx").on(t.accessCode),
  ],
);

export const assignmentMembersTable = pgTable(
  "assignment_members",
  {
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignmentsTable.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.assignmentId, t.clerkUserId] }),
    index("assignment_members_clerk_user_id_idx").on(t.clerkUserId),
  ],
);
