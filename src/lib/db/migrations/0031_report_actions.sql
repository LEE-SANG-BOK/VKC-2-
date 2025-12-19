CREATE TYPE "report_action" AS ENUM('none', 'warn', 'hide', 'blind', 'delete');--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "action" "report_action" DEFAULT 'none' NOT NULL;--> statement-breakpoint
CREATE INDEX "reports_action_idx" ON "reports" USING btree ("action");
