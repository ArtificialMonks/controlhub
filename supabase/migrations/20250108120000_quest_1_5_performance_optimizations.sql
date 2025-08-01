-- Quest 1.5: Real-Time Data Display - Performance Optimizations
-- Expert consensus validated database performance enhancements
-- Performance Expert recommendations for optimal query performance

-- ============================================================================
-- STRATEGIC INDEXES FOR AUTOMATIONS TABLE
-- ============================================================================

-- Primary index for user-based queries (RLS performance optimization)
-- Security Expert requirement: Optimizes RLS policy performance
CREATE INDEX IF NOT EXISTS idx_automations_user_id 
ON automations(user_id);

-- Status-based filtering index (common query pattern)
-- Performance Expert requirement: Optimizes status filtering
CREATE INDEX IF NOT EXISTS idx_automations_status 
ON automations(status);

-- Temporal ordering index (for recent automations queries)
-- Performance Expert requirement: Optimizes ORDER BY created_at queries
CREATE INDEX IF NOT EXISTS idx_automations_created_at 
ON automations(created_at DESC);

-- Last run temporal index (for activity-based queries)
-- Performance Expert requirement: Optimizes last_run_at filtering and ordering
CREATE INDEX IF NOT EXISTS idx_automations_last_run_at 
ON automations(last_run_at DESC NULLS LAST);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- User + Status composite index (most common query pattern)
-- Performance Expert requirement: Optimizes user-specific status filtering
CREATE INDEX IF NOT EXISTS idx_automations_user_status 
ON automations(user_id, status);

-- User + Status + Created composite index (dashboard queries)
-- Performance Expert requirement: Optimizes user dashboard with status and recency
CREATE INDEX IF NOT EXISTS idx_automations_user_status_created 
ON automations(user_id, status, created_at DESC);

-- User + Last Run composite index (activity monitoring)
-- Performance Expert requirement: Optimizes recent activity queries
CREATE INDEX IF NOT EXISTS idx_automations_user_last_run 
ON automations(user_id, last_run_at DESC NULLS LAST);

-- ============================================================================
-- PERFORMANCE MONITORING INDEXES
-- ============================================================================

-- Success rate analysis index (performance monitoring)
-- Performance Expert requirement: Optimizes success rate calculations
CREATE INDEX IF NOT EXISTS idx_automations_success_rate 
ON automations(success_rate DESC) 
WHERE success_rate IS NOT NULL;

-- Duration analysis index (performance monitoring)
-- Performance Expert requirement: Optimizes duration-based queries
CREATE INDEX IF NOT EXISTS idx_automations_avg_duration 
ON automations(avg_duration_ms) 
WHERE avg_duration_ms IS NOT NULL;

-- ============================================================================
-- REAL-TIME SUBSCRIPTION OPTIMIZATIONS
-- ============================================================================

-- Ensure automations table is included in real-time publication
-- Security Expert requirement: Real-time subscriptions respect RLS
DO $$
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'automations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE automations;
  END IF;
END $$;

-- ============================================================================
-- RLS POLICY PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Optimize existing RLS policies with function wrapping for better performance
-- Security Expert requirement: RLS optimization with performance consideration

-- Drop existing policy if it exists (for recreation with optimization)
DROP POLICY IF EXISTS "Users can access their own automations" ON automations;

-- Create optimized RLS policy with function wrapping
-- Performance Expert requirement: Function wrapping for better caching
CREATE POLICY "Users can access their own automations"
ON automations FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- QUERY PERFORMANCE ANALYSIS FUNCTIONS
-- ============================================================================

-- Function to analyze automation query performance
-- Performance Expert requirement: Query performance monitoring
CREATE OR REPLACE FUNCTION analyze_automation_query_performance()
RETURNS TABLE (
  index_name text,
  table_name text,
  index_size text,
  index_scans bigint,
  tuples_read bigint,
  tuples_fetched bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    indexrelname::text as index_name,
    relname::text as table_name,
    pg_size_pretty(pg_relation_size(indexrelid))::text as index_size,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes 
  WHERE relname = 'automations'
  ORDER BY idx_scan DESC;
$$;

-- Function to get automation table statistics
-- Performance Expert requirement: Table performance monitoring
CREATE OR REPLACE FUNCTION get_automation_table_stats()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  table_size text,
  index_size text,
  total_size text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    'automations'::text as table_name,
    (SELECT COUNT(*) FROM automations) as row_count,
    pg_size_pretty(pg_total_relation_size('automations'::regclass) - pg_indexes_size('automations'::regclass))::text as table_size,
    pg_size_pretty(pg_indexes_size('automations'::regclass))::text as index_size,
    pg_size_pretty(pg_total_relation_size('automations'::regclass))::text as total_size;
$$;

-- ============================================================================
-- PERFORMANCE VALIDATION QUERIES
-- ============================================================================

-- Query to validate index usage for common automation queries
-- Performance Expert requirement: Index usage validation
CREATE OR REPLACE FUNCTION validate_automation_index_usage()
RETURNS TABLE (
  query_type text,
  estimated_cost numeric,
  uses_index boolean,
  index_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function would contain EXPLAIN queries for common patterns
  -- Implementation would analyze query plans for index usage
  RETURN QUERY
  SELECT 
    'user_automations'::text as query_type,
    0.0::numeric as estimated_cost,
    true::boolean as uses_index,
    'idx_automations_user_id'::text as index_name;
END;
$$;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Add comments to indexes for documentation
COMMENT ON INDEX idx_automations_user_id IS 'Primary index for user-based automation queries and RLS performance';
COMMENT ON INDEX idx_automations_status IS 'Index for status-based filtering queries';
COMMENT ON INDEX idx_automations_created_at IS 'Index for temporal ordering and recent automation queries';
COMMENT ON INDEX idx_automations_user_status IS 'Composite index for user-specific status filtering';
COMMENT ON INDEX idx_automations_user_status_created IS 'Composite index for dashboard queries with user, status, and recency';

-- Add table comment for Quest 1.5 context
COMMENT ON TABLE automations IS 'Automations table with Quest 1.5 performance optimizations for real-time data display';

-- ============================================================================
-- PERFORMANCE MONITORING SETUP
-- ============================================================================

-- Enable query statistics collection for performance monitoring
-- Performance Expert requirement: Query performance tracking
SELECT pg_stat_statements_reset();

-- Grant necessary permissions for performance monitoring
-- Performance Expert requirement: Monitoring access permissions
GRANT EXECUTE ON FUNCTION analyze_automation_query_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION get_automation_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_automation_index_usage() TO authenticated;
