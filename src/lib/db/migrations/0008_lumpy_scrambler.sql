CREATE TABLE "category_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_subscriptions" ADD CONSTRAINT "category_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_subscriptions" ADD CONSTRAINT "category_subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_subscriptions_user_idx" ON "category_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "category_subscriptions_category_idx" ON "category_subscriptions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "category_subscriptions_unique" ON "category_subscriptions" USING btree ("user_id","category_id");