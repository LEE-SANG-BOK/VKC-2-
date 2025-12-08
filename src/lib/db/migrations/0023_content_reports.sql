CREATE TYPE "content_target" AS ENUM ('post', 'answer', 'comment');--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "content_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporter_id" uuid NOT NULL,
  "target_type" "content_target" NOT NULL,
  "target_id" uuid NOT NULL,
  "type" "report_type" NOT NULL,
  "status" "report_status" DEFAULT 'pending' NOT NULL,
  "reason" text NOT NULL,
  "handled_by" uuid,
  "handled_at" timestamp,
  "review_note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "users"("id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_reports_reporter_idx" ON "content_reports" USING btree ("reporter_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_reports_target_idx" ON "content_reports" USING btree ("target_type","target_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_reports_status_idx" ON "content_reports" USING btree ("status");
