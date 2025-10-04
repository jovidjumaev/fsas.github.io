-- =====================================================
-- DATABASE VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify your migration was successful

-- =====================================================
-- 1. BASIC DATA COUNTS
-- =====================================================

SELECT '=== BASIC DATA COUNTS ===' as section;

SELECT 'Courses migrated:' as check_type, COUNT(*) as count FROM courses
UNION ALL
SELECT 'Class instances migrated:', COUNT(*) FROM class_instances
UNION ALL
SELECT 'Class sessions migrated:', COUNT(*) FROM class_sessions
UNION ALL
SELECT 'Attendance records migrated:', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'Enrollments migrated:', COUNT(*) FROM enrollments
UNION ALL
SELECT 'Academic periods:', COUNT(*) FROM academic_periods;

-- =====================================================
-- 2. CHECK FOR MISSING DATA
-- =====================================================

SELECT '=== CHECKING FOR MISSING DATA ===' as section;

-- Check for missing class instances
SELECT 'Missing class instances:' as issue, COUNT(*) as count 
FROM classes cl 
LEFT JOIN class_instances ci ON cl.professor_id = ci.professor_id 
    AND cl.academic_period_id = ci.academic_period_id
    AND cl.code = (SELECT code FROM courses WHERE id = ci.course_id)
WHERE ci.id IS NULL;

-- Check for missing sessions
SELECT 'Missing sessions:' as issue, COUNT(*) as count
FROM sessions s
LEFT JOIN classes cl ON s.class_id = cl.id
LEFT JOIN class_instances ci ON cl.professor_id = ci.professor_id 
    AND cl.academic_period_id = ci.academic_period_id
    AND cl.code = (SELECT code FROM courses WHERE id = ci.course_id)
LEFT JOIN class_sessions cs ON ci.id = cs.class_instance_id 
    AND s.date = cs.date 
    AND s.start_time = cs.start_time
WHERE cs.id IS NULL;

-- Check for missing attendance records
SELECT 'Missing attendance records:' as issue, COUNT(*) as count
FROM attendance a
LEFT JOIN sessions s ON a.session_id = s.id
LEFT JOIN classes cl ON s.class_id = cl.id
LEFT JOIN class_instances ci ON cl.professor_id = ci.professor_id 
    AND cl.academic_period_id = ci.academic_period_id
    AND cl.code = (SELECT code FROM courses WHERE id = ci.course_id)
LEFT JOIN class_sessions cs ON ci.id = cs.class_instance_id 
    AND s.date = cs.date 
    AND s.start_time = cs.start_time
LEFT JOIN attendance_records ar ON cs.id = ar.session_id AND a.student_id = ar.student_id
WHERE ar.id IS NULL;

-- =====================================================
-- 3. CHECK NEW DATABASE STRUCTURE
-- =====================================================

SELECT '=== NEW DATABASE STRUCTURE ===' as section;

-- Check class instances structure
SELECT 
    'Class Instances Sample:' as info,
    ci.class_code,
    c.code as course_code,
    c.name as course_name,
    ci.section_number,
    ap.name as period_name,
    ci.current_enrollment,
    ci.max_students,
    ci.is_active
FROM class_instances ci
JOIN courses c ON ci.course_id = c.id
JOIN academic_periods ap ON ci.academic_period_id = ap.id
ORDER BY ci.created_at DESC
LIMIT 5;

-- Check sessions structure
SELECT 
    'Class Sessions Sample:' as info,
    ci.class_code,
    cs.session_number,
    cs.date,
    cs.start_time,
    cs.status,
    cs.attendance_count
FROM class_sessions cs
JOIN class_instances ci ON cs.class_instance_id = ci.id
ORDER BY ci.class_code, cs.session_number
LIMIT 10;

-- Check attendance records structure
SELECT 
    'Attendance Records Sample:' as info,
    ci.class_code,
    cs.session_number,
    cs.date,
    ar.status,
    ar.minutes_late,
    u.first_name,
    u.last_name,
    ar.scanned_at
FROM attendance_records ar
JOIN class_sessions cs ON ar.session_id = cs.id
JOIN class_instances ci ON cs.class_instance_id = ci.id
JOIN students s ON ar.student_id = s.user_id
JOIN users u ON s.user_id = u.id
ORDER BY ar.scanned_at DESC
LIMIT 5;

-- =====================================================
-- 4. CHECK CONSTRAINTS AND INDEXES
-- =====================================================

SELECT '=== CONSTRAINTS AND INDEXES ===' as section;

-- Check unique constraints
SELECT 
    'Unique Constraints:' as info,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid IN (
    'class_instances'::regclass,
    'class_sessions'::regclass,
    'attendance_records'::regclass,
    'courses'::regclass
)
AND contype = 'u'
ORDER BY conrelid, conname;

-- Check indexes
SELECT 
    'Indexes:' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('class_instances', 'class_sessions', 'attendance_records', 'courses')
ORDER BY tablename, indexname;

-- =====================================================
-- 5. CHECK FUNCTIONS AND TRIGGERS
-- =====================================================

SELECT '=== FUNCTIONS AND TRIGGERS ===' as section;

-- Check if functions exist
SELECT 
    'Functions:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'generate_class_code',
    'get_next_section_number',
    'generate_class_sessions',
    'update_enrollment_count',
    'update_session_attendance_count'
)
ORDER BY routine_name;

-- Check if triggers exist
SELECT 
    'Triggers:' as info,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%enrollment%' OR trigger_name LIKE '%attendance%'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 6. CHECK MATERIALIZED VIEWS
-- =====================================================

SELECT '=== MATERIALIZED VIEWS ===' as section;

-- Check if materialized view exists
SELECT 
    'Materialized Views:' as info,
    schemaname,
    matviewname,
    definition
FROM pg_matviews 
WHERE matviewname = 'class_attendance_summary';

-- Check materialized view data
SELECT 
    'Materialized View Sample:' as info,
    class_code,
    course_code,
    course_name,
    section_number,
    total_sessions,
    completed_sessions,
    cancelled_sessions,
    total_enrolled,
    attendance_rate
FROM class_attendance_summary
LIMIT 5;

-- =====================================================
-- 7. DATA INTEGRITY CHECKS
-- =====================================================

SELECT '=== DATA INTEGRITY CHECKS ===' as section;

-- Check for orphaned records
SELECT 'Orphaned class sessions:' as check_type, COUNT(*) as count
FROM class_sessions cs
LEFT JOIN class_instances ci ON cs.class_instance_id = ci.id
WHERE ci.id IS NULL;

SELECT 'Orphaned attendance records:' as check_type, COUNT(*) as count
FROM attendance_records ar
LEFT JOIN class_sessions cs ON ar.session_id = cs.id
WHERE cs.id IS NULL;

-- Check enrollment counts match
SELECT 'Enrollment count mismatches:' as check_type, COUNT(*) as count
FROM class_instances ci
WHERE ci.current_enrollment != (
    SELECT COUNT(*) 
    FROM enrollments e 
    WHERE e.class_instance_id = ci.id 
    AND e.status = 'active'
);

-- Check session attendance counts match
SELECT 'Session attendance count mismatches:' as check_type, COUNT(*) as count
FROM class_sessions cs
WHERE cs.attendance_count != (
    SELECT COUNT(*) 
    FROM attendance_records ar 
    WHERE ar.session_id = cs.id
);

-- =====================================================
-- 8. PERFORMANCE CHECKS
-- =====================================================

SELECT '=== PERFORMANCE CHECKS ===' as section;

-- Check table sizes
SELECT 
    'Table Sizes:' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('class_instances', 'class_sessions', 'attendance_records', 'courses', 'enrollments')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage (if available)
SELECT 
    'Index Usage:' as info,
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename IN ('class_instances', 'class_sessions', 'attendance_records')
ORDER BY idx_scan DESC;

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT '=== MIGRATION SUMMARY ===' as section;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM class_instances) > 0 THEN '✅ Class instances created successfully'
        ELSE '❌ No class instances found'
    END as status,
    (SELECT COUNT(*) FROM class_instances) as count;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM class_sessions) > 0 THEN '✅ Class sessions created successfully'
        ELSE '❌ No class sessions found'
    END as status,
    (SELECT COUNT(*) FROM class_sessions) as count;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM attendance_records) > 0 THEN '✅ Attendance records migrated successfully'
        ELSE '❌ No attendance records found'
    END as status,
    (SELECT COUNT(*) FROM attendance_records) as count;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_matviews WHERE matviewname = 'class_attendance_summary') > 0 THEN '✅ Materialized view created successfully'
        ELSE '❌ Materialized view not found'
    END as status;
