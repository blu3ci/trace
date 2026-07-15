CREATE TABLE "assignment_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"submission_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"final_content" json NOT NULL,
	"final_word_count" integer NOT NULL,
	"revision_count" integer NOT NULL,
	"active_seconds" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL,
	"word_count" integer NOT NULL,
	"block_count" integer NOT NULL,
	"active_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_receipts_submission_id_idx" ON "assignment_receipts" ("submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_receipts_document_id_idx" ON "assignment_receipts" ("document_id");--> statement-breakpoint
CREATE INDEX "document_milestones_document_id_created_at_idx" ON "document_milestones" ("document_id","created_at");--> statement-breakpoint
ALTER TABLE "assignment_receipts" ADD CONSTRAINT "assignment_receipts_Xj1n30uJ5vls_fkey" FOREIGN KEY ("submission_id") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assignment_receipts" ADD CONSTRAINT "assignment_receipts_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "document_milestones" ADD CONSTRAINT "document_milestones_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE;