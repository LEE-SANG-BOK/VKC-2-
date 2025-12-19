ALTER TABLE "news" ADD COLUMN "start_at" timestamp;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "end_at" timestamp;--> statement-breakpoint
CREATE INDEX "news_start_at_idx" ON "news" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "news_end_at_idx" ON "news" USING btree ("end_at");
