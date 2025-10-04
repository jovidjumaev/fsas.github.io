#!/bin/bash
# =====================================================
# CLEANUP REDUNDANT FILES
# =====================================================
# This script removes all redundant/outdated files

echo "🧹 Cleaning up redundant files..."

# Old database schemas
rm -f database/schema.sql
rm -f simplified-schema.sql
rm -f migrate-to-simplified-schema.sql
rm -f migrate-to-optimized-design.sql
rm -f simple-migration.sql

# Old backend servers
rm -f backend/server.ts
rm -f backend/simple-server.js
rm -f backend/enhanced-server.js

# Test scripts (temporary)
rm -f test-*.js
rm -f check-*.js
rm -f create-sample-data*.js
rm -f run-sample-data.js

# Old database fixes
rm -f fix-database-issues.sql
rm -f fix-database-issues-safe.sql
rm -f fix-professors-department.sql
rm -f enable-rls-with-policies.sql

# Old sample data scripts
rm -f populate-sample-data.sql
rm -f populate-sample-data-simple.sql
rm -f insert-sample-data.sql
rm -f simple-test-data*.sql
rm -f minimal-test-data.sql
rm -f working-test-data.sql

# Old cleanup scripts
rm -f cleanup-duplicate-tables.sql
rm -f cleanup-old-tables.sql
rm -f cleanup-old-tables-final.sql
rm -f execute-cleanup.js

# Old analysis scripts
rm -f comprehensive-database-analysis.js
rm -f simple-database-analysis.js
rm -f analyze-database-design.js

# Old setup guides
rm -f DATABASE_SETUP_INSTRUCTIONS.md
rm -f FINAL_SETUP_GUIDE.md
rm -f FIXED_SCHEMA_INSTRUCTIONS.md
rm -f SUPABASE_SETUP_GUIDE.md
rm -f SUPABASE_SETUP.md
rm -f SUPABASE_STATUS_REPORT.md
rm -f step-by-step-execution.md

# Old documentation
rm -f database-design-analysis.md
rm -f database-design-analysis-report.md
rm -f optimized-design-summary.md
rm -f add-students-guide.md
rm -f add-real-students-guide.md

# Old test data scripts
rm -f add-sample-students-and-enrollments.sql
rm -f add-sample-students-simple.sql

# Old API scripts
rm -f apply-schema-via-api.js
rm -f apply-schema.js
rm -f execute-sample-data.js

# Old test files
rm -f test-connection-only.sql
rm -f create-test-data.sql

# Old verification scripts
rm -f verify-cleanup-final.js
rm -f verify-cleanup.js
rm -f verify-optimized-migration.js

echo "✅ Cleanup complete!"
echo "📁 Remaining essential files:"
echo "   - Core application files (src/, backend/optimized-server.js)"
echo "   - Current database schema (optimized-database-design.sql)"
echo "   - Applied improvements (database-improvements-phase1.sql)"
echo "   - Main documentation (README.md, DATABASE_ANALYSIS_REPORT.md)"
echo "   - Configuration files (package.json, next.config.js, etc.)"
