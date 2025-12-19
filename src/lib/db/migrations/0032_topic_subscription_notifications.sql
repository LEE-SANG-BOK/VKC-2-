CREATE TYPE "notification_channel" AS ENUM('in_app', 'email', 'push');--> statement-breakpoint
CREATE TYPE "notification_frequency" AS ENUM('instant', 'daily', 'weekly', 'off');--> statement-breakpoint
ALTER TABLE "topic_subscriptions" ADD COLUMN "notification_channel" "notification_channel" DEFAULT 'in_app' NOT NULL;--> statement-breakpoint
ALTER TABLE "topic_subscriptions" ADD COLUMN "notification_frequency" "notification_frequency" DEFAULT 'instant' NOT NULL;
