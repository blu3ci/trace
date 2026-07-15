CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"assignment_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_submissions_assignment_student_idx" ON "assignment_submissions" ("assignment_id","clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_submissions_document_id_idx" ON "assignment_submissions" ("document_id");--> statement-breakpoint
CREATE INDEX "assignment_submissions_assignment_id_idx" ON "assignment_submissions" ("assignment_id");--> statement-breakpoint
CREATE INDEX "assignment_submissions_clerk_user_id_idx" ON "assignment_submissions" ("clerk_user_id");--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_assignments_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE;