CREATE TYPE "user_role" AS ENUM('student', 'instructor');--> statement-breakpoint
CREATE TABLE "user_roles" (
	"clerk_user_id" text PRIMARY KEY,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
