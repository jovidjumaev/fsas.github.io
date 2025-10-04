-- =====================================================
-- DATABASE VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify class creation and data storage

-- =====================================================
-- 1. CHECK RECENTLY CREATED CLASS INSTANCES
-- =====================================================

SELECT '=== RECENT CLASS INSTANCES ===' as section;

SELECT 
    ci.id,
    ci.class_code,
    ci.section_number,
    c.code as course_code,
    c.name as course_name,
    ap.name as academic_period,
    ci.days_of_week,
    ci.start_time,
    ci.end_time,
    ci.first_class_date,
    ci.last_class_date,
    ci.room_location,
    ci.max_students,
    ci.current_enrollment,
    ci.enrollment_deadline,
    ci.is_active,
    ci.created_at
FROM class_instances ci
JOIN courses c ON ci.course_id = c.id
JOIN academic_periods ap ON ci.academic_period_id = ap.id
ORDER BY ci.created_at DESC
LIMIT 5;

-- =====================================================
-- 2. CHECK GENERATED CLASS SESSIONS
-- =====================================================

SELECT '=== RECENT CLASS SESSIONS ===' as section;

SELECT 
    ci.class_code,
    cs.session_number,
    cs.date,
    cs.start_time,
    cs.end_time,
    cs.status,
    cs.attendance_count
FROM class_sessions cs
JOIN class_instances ci ON cs.class_instance_id = ci.id
ORDER BY ci.created_at DESC, cs.session_number
LIMIT 10;

-- =====================================================
-- 3. CHECK DATA INTEGRITY
-- =====================================================

SELECT '=== DATA INTEGRITY CHECKS ===' as section;

-- Check for duplicate section numbers within same course and period
SELECT 
    'Duplicate section numbers:' as check_type,
    course_id,
    academic_period_id,
    section_number,
    COUNT(*) as count
FROM class_instances
GROUP BY course_id, academic_period_id, section_number
HAVING COUNT(*) > 1;

-- Check for duplicate class codes
SELECT 
    'Duplicate class codes:' as check_type,
    class_code,
    COUNT(*) as count
FROM class_instances
GROUP BY class_code
HAVING COUNT(*) > 1;

-- Check for null required fields
SELECT 
    'Classes with null section_number:' as check_type,
    COUNT(*) as count
FROM class_instances
WHERE section_number IS NULL;

SELECT 
    'Classes with null class_code:' as check_type,
    COUNT(*) as count
FROM class_instances
WHERE class_code IS NULL;

SELECT 
    'Classes with null enrollment_deadline:' as check_type,
    COUNT(*) as count
FROM class_instances
WHERE enrollment_deadline IS NULL;

-- =====================================================
-- 4. CHECK ENROLLMENT DEADLINE CALCULATION
-- =====================================================

SELECT '=== ENROLLMENT DEADLINE VERIFICATION ===' as section;

SELECT 
    class_code,
    first_class_date,
    enrollment_deadline,
    (enrollment_deadline - first_class_date) as days_difference,
    CASE 
        WHEN (enrollment_deadline - first_class_date) = 14 THEN '✅ Correct (14 days)'
        ELSE '❌ Incorrect'
    END as verification
FROM class_instances
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 5. CHECK SESSION GENERATION
-- =====================================================

SELECT '=== SESSION GENERATION VERIFICATION ===' as section;

SELECT 
    ci.class_code,
    ci.days_of_week,
    ci.first_class_date,
    ci.last_class_date,
    COUNT(cs.id) as sessions_generated,
    MIN(cs.date) as first_session_date,
    MAX(cs.date) as last_session_date
FROM class_instances ci
LEFT JOIN class_sessions cs ON ci.id = cs.class_instance_id
GROUP BY ci.id, ci.class_code, ci.days_of_week, ci.first_class_date, ci.last_class_date
ORDER BY ci.created_at DESC
LIMIT 5;

-- =====================================================
-- 6. CHECK FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT '=== FOREIGN KEY VERIFICATION ===' as section;

-- Check for orphaned class instances
SELECT 
    'Orphaned class instances (no course):' as check_type,
    COUNT(*) as count
FROM class_instances ci
LEFT JOIN courses c ON ci.course_id = c.id
WHERE c.id IS NULL;

SELECT 
    'Orphaned class instances (no academic period):' as check_type,
    COUNT(*) as count
FROM class_instances ci
LEFT JOIN academic_periods ap ON ci.academic_period_id = ap.id
WHERE ap.id IS NULL;

SELECT 
    'Orphaned class instances (no professor):' as check_type,
    COUNT(*) as count
FROM class_instances ci
LEFT JOIN professors p ON ci.professor_id = p.user_id
WHERE p.user_id IS NULL;

-- =====================================================
-- 7. SUMMARY STATISTICS
-- =====================================================

SELECT '=== SUMMARY STATISTICS ===' as section;

SELECT 
    'Total class instances:' as metric,
    COUNT(*) as count
FROM class_instances;

SELECT 
    'Total class sessions:' as metric,
    COUNT(*) as count
FROM class_sessions;

SELECT 
    'Active class instances:' as metric,
    COUNT(*) as count
FROM class_instances
WHERE is_active = true;

SELECT 
    'Classes with sessions:' as metric,
    COUNT(DISTINCT ci.id) as count
FROM class_instances ci
JOIN class_sessions cs ON ci.id = cs.class_instance_id;

SELECT 
    'Average sessions per class:' as metric,
    ROUND(AVG(session_count), 2) as count
FROM (
    SELECT ci.id, COUNT(cs.id) as session_count
    FROM class_instances ci
    LEFT JOIN class_sessions cs ON ci.id = cs.class_instance_id
    GROUP BY ci.id
) as class_session_counts;
