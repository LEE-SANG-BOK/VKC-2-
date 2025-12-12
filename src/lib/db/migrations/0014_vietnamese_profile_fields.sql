ALTER TABLE "users" ADD COLUMN "user_type" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "visa_type" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_language" varchar(5) DEFAULT 'vi';--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "visa_type" varchar(50);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "university_name" varchar(150);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "university_email" varchar(150);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "industry" varchar(100);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "company_name" varchar(150);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "job_title" varchar(150);--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "extra_info" text;--> statement-breakpoint

-- Upsert legacy 14 categories with stable slugs/order (Vietnamese labels as default)
INSERT INTO "categories" ("name", "slug", "description", "icon", "order", "sort_order", "is_active")
VALUES
  ('Visa & Lưu trú', 'visa', 'Gia hạn, đổi visa, lưu trú tại Hàn', '🛂', 1, 1, true),
  ('Việc làm & Công sở', 'employment', 'Tìm việc, văn hóa công sở, hợp đồng lao động', '💼', 2, 2, true),
  ('Nhà ở tại Hàn Quốc', 'housing', 'Thuê nhà, hợp đồng, đặt cọc', '🏠', 3, 3, true),
  ('Học tiếng Hàn', 'korean-language', 'TOPIK, khóa học tiếng Hàn', '📚', 4, 4, true),
  ('Đời sống hàng ngày', 'daily-life', 'Thích nghi cuộc sống, khác biệt văn hóa', '🤝', 5, 5, true),
  ('Tài chính & Kiều hối', 'finance', 'Chuyển tiền, ngân hàng, thuế', '💳', 6, 6, true),
  ('Y tế & Bảo hiểm', 'healthcare', 'Bệnh viện, bảo hiểm sức khỏe', '🩺', 7, 7, true),
  ('Quyền lợi lao động', 'legal', 'Pháp lý, quyền lợi, tranh chấp', '⚖️', 8, 8, true),
  ('Ẩm thực & Đặc sản', 'food', 'Nhà hàng, chợ Việt, nguyên liệu', '🍜', 9, 9, true),
  ('Du lịch & Văn hóa', 'culture-tour', 'Du lịch, lễ hội, trải nghiệm văn hóa', '✈️', 10, 10, true),
  ('Khởi nghiệp kinh doanh', 'business', 'Đăng ký kinh doanh, startup', '🏢', 11, 11, true),
  ('Giáo dục & Gia đình', 'education', 'Học bổng, con cái, gia đình đa văn hóa', '🎓', 12, 12, true),
  ('Gửi hàng & Logistics', 'shipping', 'Gửi hàng Hàn-Việt, mua hàng', '📦', 13, 13, true),
  ('Giao lưu cộng đồng', 'cultural-exchange', 'Sự kiện, kết nối cộng đồng', '👥', 14, 14, true)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "order" = EXCLUDED."order",
  "sort_order" = EXCLUDED."sort_order",
  "is_active" = true;--> statement-breakpoint
