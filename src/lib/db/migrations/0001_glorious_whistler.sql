ALTER TABLE "notifications" DROP CONSTRAINT "notifications_from_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "sender_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "from_user_id";