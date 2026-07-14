CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"clerk_user_id" text NOT NULL UNIQUE,
	"title" text DEFAULT 'Untitled Document' NOT NULL,
	"content" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "clerk_user_id_idx" ON "documents" ("clerk_user_id");