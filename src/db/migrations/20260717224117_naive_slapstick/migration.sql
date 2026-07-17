ALTER TABLE "receipt_legitimacy_analyses" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "receipt_legitimacy_analyses" ADD COLUMN "content_hash" varchar(64) NOT NULL DEFAULT 'legacy';--> statement-breakpoint
UPDATE "receipt_legitimacy_analyses" AS analysis
SET "document_id" = receipt."document_id"
FROM "assignment_receipts" AS receipt
WHERE analysis."receipt_id" = receipt."id";--> statement-breakpoint
ALTER TABLE "receipt_legitimacy_analyses" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_legitimacy_analyses" ALTER COLUMN "content_hash" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "receipt_legitimacy_analyses" ALTER COLUMN "receipt_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_legitimacy_analyses_document_id_idx" ON "receipt_legitimacy_analyses" ("document_id");--> statement-breakpoint
ALTER TABLE "receipt_legitimacy_analyses" ADD CONSTRAINT "receipt_legitimacy_analyses_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE;
