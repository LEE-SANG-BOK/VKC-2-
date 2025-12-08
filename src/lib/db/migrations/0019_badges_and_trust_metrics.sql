ALTER TABLE "users" ADD COLUMN "badge_type" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trust_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "helpful_answers" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "adoption_rate" numeric(5,2) DEFAULT 0 NOT NULL;--> statement-breakpoint
