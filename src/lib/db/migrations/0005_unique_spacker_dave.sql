ALTER TABLE "users" ADD COLUMN "nationality" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verified_request_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "verification_badge";