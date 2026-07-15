CREATE TABLE "assignment_members" (
	"assignment_id" uuid,
	"clerk_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_members_pkey" PRIMARY KEY("assignment_id","clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "access_code" varchar(6);--> statement-breakpoint
DO $$
DECLARE
	assignment_record record;
	new_access_code varchar(6);
BEGIN
	FOR assignment_record IN SELECT "id" FROM "assignments" WHERE "access_code" IS NULL LOOP
		LOOP
			new_access_code := (floor(random() * 900000) + 100000)::integer::text;
			EXIT WHEN NOT EXISTS (
				SELECT 1 FROM "assignments" WHERE "access_code" = new_access_code
			);
		END LOOP;

		UPDATE "assignments" SET "access_code" = new_access_code WHERE "id" = assignment_record."id";
	END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "assignments" ALTER COLUMN "access_code" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "assignment_members_clerk_user_id_idx" ON "assignment_members" ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_access_code_idx" ON "assignments" ("access_code");--> statement-breakpoint
ALTER TABLE "assignment_members" ADD CONSTRAINT "assignment_members_assignment_id_assignments_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE;
