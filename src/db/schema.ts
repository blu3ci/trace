import {
  pgTable,
  uuid,
  text,
  timestamp,
  json,
  index,
  varchar,
} from "drizzle-orm/pg-core";
import { SerializedEditorState } from "lexical";

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
    content: json("content").$type<SerializedEditorState>(),
    createdAt,
    updatedAt,
  },
  (t) => [index("clerk_user_id_idx").on(t.clerkUserId)],
);
