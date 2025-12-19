CREATE TABLE "event_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" varchar(50) NOT NULL,
  "entity_type" varchar(50) NOT NULL,
  "entity_id" uuid,
  "user_id" uuid,
  "session_id" varchar(100),
  "ip_hash" varchar(128),
  "locale" varchar(10),
  "referrer" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "event_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX "event_logs_event_entity_idx" ON "event_logs" ("event_type","entity_type","entity_id","created_at");
--> statement-breakpoint
CREATE INDEX "event_logs_user_created_idx" ON "event_logs" ("user_id","created_at");
