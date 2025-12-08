CREATE TABLE IF NOT EXISTS "topic_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "topic_subscriptions" ADD CONSTRAINT "topic_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "topic_subscriptions" ADD CONSTRAINT "topic_subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "topic_subscriptions_user_category_idx" ON "topic_subscriptions" USING btree ("user_id","category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topic_subscriptions_user_idx" ON "topic_subscriptions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topic_subscriptions_category_idx" ON "topic_subscriptions" USING btree ("category_id");
