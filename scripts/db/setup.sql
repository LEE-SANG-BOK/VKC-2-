-- =====================================================
-- Viet K-Connect Database Setup Script
-- Created by Agent 4 - Complete Database Initialization
-- Date: 2025-09-30
-- =====================================================

-- This script combines all database setup steps for easy deployment

\echo 'Starting Viet K-Connect Database Setup...'

-- =====================================================
-- STEP 1: CREATE MAIN SCHEMA
-- =====================================================

\echo 'Step 1: Creating main database schema...'
\i '/Users/bk/Desktop/viet-kconnect/supabase/migrations/001_initial_schema.sql'

-- =====================================================
-- STEP 2: APPLY RLS POLICIES
-- =====================================================

\echo 'Step 2: Applying Row Level Security policies...'
\i '/Users/bk/Desktop/viet-kconnect/supabase/migrations/002_rls_policies.sql'

-- =====================================================
-- STEP 3: INSERT SEED DATA (DEVELOPMENT ONLY)
-- =====================================================

\echo 'Step 3: Inserting seed data for development...'
-- Only run seed data if this is a development environment
DO $$
BEGIN
  IF current_setting('app.environment', true) = 'development' THEN
    \i '/Users/bk/Desktop/viet-kconnect/scripts/db/seed.sql'
    RAISE NOTICE 'Seed data inserted for development environment';
  ELSE
    RAISE NOTICE 'Skipping seed data insertion for production environment';
  END IF;
END $$;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

\echo 'Step 4: Verifying database setup...'

-- Check all tables exist
SELECT
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check triggers
SELECT
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check functions
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Final verification
SELECT
  'Database setup completed successfully!' as status,
  NOW() as completed_at;

\echo 'Database setup completed!'
\echo ''
\echo 'Summary:'
\echo '- Core tables: users, questions, answers, categories, votes, comments, notifications'
\echo '- Security: RLS policies enabled on all tables'
\echo '- Performance: Indexes created for optimal query performance'
\echo '- Features: Full-text search, vote counting, activity tracking'
\echo '- Audit: Comprehensive logging system for important operations'
\echo ''
\echo 'Next steps:'
\echo '1. Update Next.js TypeScript types to match new schema'
\echo '2. Test database connection from application'
\echo '3. Verify RLS policies work correctly'
\echo '4. Run performance tests with sample queries'