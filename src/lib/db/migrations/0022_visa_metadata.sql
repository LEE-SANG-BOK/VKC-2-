CREATE TABLE IF NOT EXISTS "visa_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE UNIQUE INDEX IF NOT EXISTS "visa_jobs_code_locale_idx" ON "visa_jobs" USING btree ("code","locale");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visa_jobs_visa_type_idx" ON "visa_jobs" USING btree ("visa_type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "visa_requirements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "visa_type" varchar(20) NOT NULL,
  "requirement" text NOT NULL,
  "weight" integer DEFAULT 0 NOT NULL,
  "locale" varchar(5) DEFAULT 'vi' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visa_requirements_visa_type_idx" ON "visa_requirements" USING btree ("visa_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visa_requirements_locale_idx" ON "visa_requirements" USING btree ("locale");
