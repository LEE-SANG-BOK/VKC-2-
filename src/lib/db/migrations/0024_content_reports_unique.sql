CREATE UNIQUE INDEX IF NOT EXISTS "content_reports_reporter_target_idx" ON "content_reports" USING btree ("reporter_id","target_type","target_id");--> statement-breakpoint
