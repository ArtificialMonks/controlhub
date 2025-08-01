# Performance Test Documentation

## Overview

The Communitee Control Hub includes comprehensive performance testing to ensure webhook endpoints and database operations meet Expert Council-defined thresholds. This document explains why certain performance tests are currently skipped and provides guidance for running them in appropriate environments.

## Current Status: Performance Tests Skipped (7 Tests)

### Location
- **File**: `src/test/performance/webhook-performance.test.ts`
- **Test Count**: 7 performance tests
- **Status**: Currently skipped due to environment dependencies

### Why These Tests Are Skipped

Performance tests are skipped in the default test environment because they require:

1. **Live Database Connection**: Tests need access to a real Supabase database instance
2. **Environment Variables**: Missing required configuration values
3. **External Dependencies**: Webhook endpoints and performance monitoring systems
4. **Infrastructure Requirements**: Database functions, indexes, and RLS policies

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Webhook Security
N8N_WEBHOOK_SECRET=your-webhook-secret

# Application URL (for webhook testing)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Test Categories and Thresholds

#### 1. API Response Time Performance (2 tests)
- **Threshold**: < 200ms (Expert Council requirement)
- **Load Testing**: 10 iterations for consistency validation
- **Variance Allowance**: Up to 50% for maximum response time

#### 2. Database Performance Validation (2 tests)
- **RLS Policy Optimization**: Validates Row Level Security performance
- **Index Effectiveness**: Ensures critical database indexes exist and are used
- **Required Indexes**:
  - `idx_automation_runs_user_id`
  - `idx_automations_user_id` 
  - `idx_automation_runs_automation_id`

#### 3. Performance Monitoring Integration (2 tests)
- **Metrics Storage**: Validates performance data is stored in database
- **Performance Analysis**: Tests WebhookPerformanceAnalyzer functionality
- **Metrics Tracked**: Response time, auth time, database time

#### 4. Performance Threshold Validation (1 test)
- **API Response**: < 200ms
- **Database Operations**: < 50ms
- **Authentication**: < 20ms
- **Input Validation**: < 10ms

## How to Run Performance Tests

### Prerequisites

1. **Set up Supabase instance** with required tables:
   - `webhook_performance_logs`
   - `automations`
   - `automation_runs`
   - `automation_telemetry`

2. **Configure environment variables** (see above section)

3. **Deploy required database functions**:
   - `validate_rls_performance()`

4. **Ensure application is running** at configured URL

### Running the Tests

```bash
# Set environment variables first
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export N8N_WEBHOOK_SECRET="your-secret"

# Run performance tests
npm run test src/test/performance/webhook-performance.test.ts
```

### Expected Output

When successfully run, tests provide detailed performance metrics:

```
✅ API Response Time: 145.23ms (threshold: 200ms)
📊 Performance Statistics:
   Average: 152.45ms
   Min: 134.12ms
   Max: 189.67ms
   Iterations: 10

✅ RLS Policy Optimization Validated:
   automations: 15% improvement
   automation_runs: 22% improvement
   automation_telemetry: 18% improvement

✅ Database Indexes Validated:
   automations.idx_automations_user_id
   automation_runs.idx_automation_runs_user_id
   automation_runs.idx_automation_runs_automation_id

✅ Performance Metrics Stored:
   Response Time: 156ms
   Auth Time: 12ms
   DB Time: 34ms

✅ All 5 recent requests meet performance thresholds
```

## Development Recommendations

### For Local Development
- **Skip performance tests** in standard development workflow
- Use unit and integration tests for core functionality validation
- Run performance tests only when specifically testing performance improvements

### For CI/CD Pipelines
- **Staging Environment**: Run performance tests with real database
- **Production Monitoring**: Use separate performance monitoring tools
- **Threshold Alerts**: Set up monitoring for performance regressions

### For Performance Optimization
1. **Establish Baseline**: Run tests before making changes
2. **Measure Impact**: Compare results after optimization
3. **Validate Thresholds**: Ensure all Expert Council requirements are met
4. **Document Changes**: Update thresholds if architecture changes warrant it

## Troubleshooting

### Common Issues

1. **"supabaseUrl is required"**
   - Solution: Set `NEXT_PUBLIC_SUPABASE_URL` environment variable

2. **"Cannot read properties of undefined (reading 'from')"**
   - Solution: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set and valid

3. **Database function not found**
   - Solution: Deploy required database functions to your Supabase instance

4. **Network timeouts**
   - Solution: Ensure application is running and accessible at configured URL

### Performance Issues

If tests consistently fail thresholds:

1. **Check Database Performance**: Verify indexes and RLS policies
2. **Review Network Latency**: Test from same network as production
3. **Analyze Application Load**: Ensure no other processes affecting performance
4. **Update Hardware**: Consider upgrading database or server resources

## Integration with Core Functionality

Performance tests validate the same webhook endpoints and database operations used by:

- **N8N Integration**: Webhook processing for automation results
- **Real-time Dashboard**: Database queries for automation status
- **User Authentication**: RLS policy enforcement
- **API Security**: Request validation and authentication timing

These tests ensure the system maintains responsive performance under production loads while meeting all Expert Council requirements for enterprise-grade automation management.