CREATE TABLE "receipt_legitimacy_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"receipt_id" uuid NOT NULL,
	"model" varchar(64) NOT NULL,
	"analysis" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_legitimacy_analyses_receipt_id_idx" ON "receipt_legitimacy_analyses" ("receipt_id");--> statement-breakpoint
ALTER TABLE "receipt_legitimacy_analyses" ADD CONSTRAINT "receipt_legitimacy_analyses_1D9JRWNnwePf_fkey" FOREIGN KEY ("receipt_id") REFERENCES "assignment_receipts"("id") ON DELETE CASCADE;