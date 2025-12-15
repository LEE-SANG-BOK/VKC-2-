CREATE TYPE "public"."content_target" AS ENUM('post', 'answer', 'comment');--> statement-breakpoint
CREATE TYPE "public"."news_type" AS ENUM('post', 'cardnews', 'shorts');--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "topic_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visa_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"visa_type" varchar(20) NOT NULL,
	"min_salary" integer,
	"locale" varchar(5) DEFAULT 'vi' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visa_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visa_type" varchar(20) NOT NULL,
	"requirement" text NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	"locale" varchar(5) DEFAULT 'vi' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "language" varchar(5) DEFAULT 'vi' NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "type" "news_type" DEFAULT 'post' NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "content" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verified_profile_summary" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verified_profile_keywords" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "korean_level" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_type" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "visa_type" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_language" varchar(5) DEFAULT 'vi';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "badge_type" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trust_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "helpful_answers" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "adoption_rate" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_expert" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "visa_type" varchar(50);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "university_name" varchar(150);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "university_email" varchar(150);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "industry" varchar(100);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "company_name" varchar(150);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "job_title" varchar(150);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "extra_info" text;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_subscriptions" ADD CONSTRAINT "topic_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_subscriptions" ADD CONSTRAINT "topic_subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_reports_reporter_idx" ON "content_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "content_reports_target_idx" ON "content_reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "content_reports_status_idx" ON "content_reports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_reports_reporter_target_idx" ON "content_reports" USING btree ("reporter_id","target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_subscriptions_user_category_idx" ON "topic_subscriptions" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "topic_subscriptions_user_idx" ON "topic_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "topic_subscriptions_category_idx" ON "topic_subscriptions" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "visa_jobs_code_locale_idx" ON "visa_jobs" USING btree ("code","locale");--> statement-breakpoint
CREATE INDEX "visa_jobs_visa_type_idx" ON "visa_jobs" USING btree ("visa_type");--> statement-breakpoint
CREATE INDEX "visa_requirements_visa_type_idx" ON "visa_requirements" USING btree ("visa_type");--> statement-breakpoint
CREATE INDEX "visa_requirements_locale_idx" ON "visa_requirements" USING btree ("locale");