CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"clerk_user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"course" varchar(120),
	"description" text,
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "assignments_clerk_user_id_idx" ON "assignments" ("clerk_user_id");