CREATE INDEX "bookmarks_user_created_at_id_idx" ON "bookmarks" USING btree ("user_id","created_at","id");--> statement-breakpoint
CREATE INDEX "follows_follower_created_at_id_idx" ON "follows" USING btree ("follower_id","created_at","id");--> statement-breakpoint
CREATE INDEX "follows_following_created_at_id_idx" ON "follows" USING btree ("following_id","created_at","id");