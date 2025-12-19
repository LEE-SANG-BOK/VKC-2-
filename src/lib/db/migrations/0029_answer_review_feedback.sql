CREATE TYPE "answer_review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "is_official" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "review_status" "answer_review_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
CREATE INDEX "answers_is_official_idx" ON "answers" USING btree ("is_official");--> statement-breakpoint
CREATE INDEX "answers_review_status_idx" ON "answers" USING btree ("review_status");--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" varchar(50) DEFAULT 'feedback' NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"steps" text,
	"page_url" text,
	"contact_email" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedbacks_user_idx" ON "feedbacks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedbacks_created_at_idx" ON "feedbacks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "feedbacks_ip_idx" ON "feedbacks" USING btree ("ip_address");
