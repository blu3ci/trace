import { Block } from "@blocknote/core";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  json,
  integer,
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
    accessCode: varchar("access_code", { length: 8 }).notNull(),
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

export const assignmentSubmissionsTable = pgTable(
  "assignment_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignmentsTable.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    submittedAt: timestamp("submitted_at"),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("assignment_submissions_assignment_student_idx").on(
      t.assignmentId,
      t.clerkUserId,
    ),
    uniqueIndex("assignment_submissions_document_id_idx").on(t.documentId),
    index("assignment_submissions_assignment_id_idx").on(t.assignmentId),
    index("assignment_submissions_clerk_user_id_idx").on(t.clerkUserId),
  ],
);

export const documentMilestonesTable = pgTable(
  "document_milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "cascade" }),
    content: json("content").$type<Block[]>(),
    wordCount: integer("word_count").notNull(),
    blockCount: integer("block_count").notNull(),
    activeSeconds: integer("active_seconds").notNull().default(0),
    createdAt,
  },
  (t) => [index("document_milestones_document_id_created_at_idx").on(t.documentId, t.createdAt)],
);

export const assignmentReceiptsTable = pgTable(
  "assignment_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => assignmentSubmissionsTable.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "cascade" }),
    finalContent: json("final_content").$type<Block[]>().notNull(),
    finalWordCount: integer("final_word_count").notNull(),
    revisionCount: integer("revision_count").notNull(),
    activeSeconds: integer("active_seconds").notNull().default(0),
    submittedAt: timestamp("submitted_at").notNull(),
    createdAt,
  },
  (t) => [
    uniqueIndex("assignment_receipts_submission_id_idx").on(t.submissionId),
    uniqueIndex("assignment_receipts_document_id_idx").on(t.documentId),
  ],
);
