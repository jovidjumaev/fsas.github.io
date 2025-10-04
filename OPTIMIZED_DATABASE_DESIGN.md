# Optimized Database Design for FSAS

## Overview

This document outlines the optimized database design for the Furman Smart Attendance System (FSAS) that efficiently handles class management across different academic periods without creating multiple tables per class.

## Key Design Principles

1. **Single Table Approach**: Instead of creating separate tables for each class, we use a unified structure that efficiently stores all class instances and sessions
2. **Normalized Design**: Proper normalization to avoid data redundancy while maintaining performance
3. **Scalable Architecture**: Designed to handle thousands of classes and students efficiently
4. **Academic Period Support**: Built-in support for different academic periods (Fall 2025, Spring 2026, etc.)
5. **Performance Optimization**: Materialized views and indexes for fast queries

## Database Schema

### Core Tables

#### 1. Academic Periods
```sql
academic_periods (
    id UUID PRIMARY KEY,
    name VARCHAR(100), -- 'Fall 2025', 'Spring 2026'
    year INTEGER,
    semester VARCHAR(20), -- 'fall', 'spring', 'summer'
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN,
    is_active BOOLEAN
)
```

#### 2. Courses (Master Catalog)
```sql
courses (
    id UUID PRIMARY KEY,
    code VARCHAR(20), -- 'CSC-105', 'MAT-201'
    name VARCHAR(200),
    description TEXT,
    credits INTEGER,
    department_id UUID,
    is_active BOOLEAN
)
```

#### 3. Class Instances
```sql
class_instances (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES courses(id),
    professor_id UUID REFERENCES professors(user_id),
    academic_period_id UUID REFERENCES academic_periods(id),
    room_location VARCHAR(100),
    schedule_info VARCHAR(200), -- 'MWF 10:00-10:50'
    max_students INTEGER,
    current_enrollment INTEGER, -- Denormalized for performance
    is_active BOOLEAN,
    is_published BOOLEAN
)
```

#### 4. Class Sessions
```sql
class_sessions (
    id UUID PRIMARY KEY,
    class_instance_id UUID REFERENCES class_instances(id),
    session_number INTEGER, -- 1, 2, 3, etc.
    date DATE,
    start_time TIME,
    end_time TIME,
    room_location VARCHAR(100),
    notes TEXT,
    qr_secret VARCHAR(255),
    qr_expires_at TIMESTAMP,
    is_active BOOLEAN,
    status VARCHAR(20), -- 'scheduled', 'active', 'completed'
    attendance_count INTEGER -- Denormalized for performance
)
```

#### 5. Attendance Records
```sql
attendance_records (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES class_sessions(id),
    student_id UUID REFERENCES students(user_id),
    scanned_at TIMESTAMP,
    status VARCHAR(20), -- 'present', 'late', 'absent', 'excused'
    minutes_late INTEGER,
    device_fingerprint VARCHAR(255),
    ip_address INET,
    qr_secret_used VARCHAR(255)
)
```

## How It Solves Your Requirements

### 1. Class Creation Across Academic Periods

**Scenario**: Professor creates CSC-105 for Fall 2025

**Process**:
1. Course already exists in `courses` table (CSC-105: Introduction to Computer Science)
2. Professor creates a new `class_instance` with:
   - `course_id`: References the CSC-105 course
   - `professor_id`: Professor's ID
   - `academic_period_id`: Fall 2025 period ID
   - `room_location`: "Riley Hall 201"
   - `schedule_info`: "MWF 10:00-10:50"

**Result**: One row in `class_instances` table represents CSC-105 for Fall 2025

### 2. Student Enrollment Management

**Adding Students**:
- Professor adds students to the class instance via `enrollments` table
- `current_enrollment` count is automatically updated via triggers
- Students can be added/dropped anytime during the semester

**Tracking**:
- Each enrollment has status: 'active', 'dropped', 'completed', 'withdrawn'
- Enrollment history is preserved for audit purposes

### 3. Session Management

**Creating Sessions**:
- Each class session is a row in `class_sessions` table
- `session_number` auto-increments (1, 2, 3, etc.)
- Sessions are linked to the class instance, not individual classes

**Example for CSC-105 Fall 2025**:
```
Session 1: 2025-08-26 10:00-10:50 (Introduction)
Session 2: 2025-08-28 10:00-10:50 (Variables)
Session 3: 2025-08-30 10:00-10:50 (Functions)
...
```

### 4. Attendance Tracking

**Per Session**:
- Each student's attendance for each session is one row in `attendance_records`
- Status: 'present', 'late', 'absent', 'excused'
- `minutes_late` calculated automatically
- QR code usage tracked for security

**Efficient Queries**:
- Get all attendance for a class: `WHERE class_sessions.class_instance_id = ?`
- Get student's attendance history: `WHERE attendance_records.student_id = ?`
- Get attendance for specific period: Join with `academic_periods`

## Performance Optimizations

### 1. Materialized Views
```sql
-- Pre-calculated attendance statistics
CREATE MATERIALIZED VIEW attendance_summary AS
SELECT 
    class_instance_id,
    course_code,
    course_name,
    total_sessions,
    completed_sessions,
    total_enrolled,
    present_count,
    late_count,
    absent_count,
    attendance_rate
FROM class_instances ci
JOIN courses c ON ci.course_id = c.id
-- ... complex joins and aggregations
```

### 2. Strategic Indexes
- `idx_class_instances_professor` - Fast professor queries
- `idx_class_sessions_instance` - Fast session lookups
- `idx_attendance_records_session` - Fast attendance queries
- `idx_academic_periods_current` - Fast current period queries

### 3. Denormalized Fields
- `current_enrollment` in `class_instances` (updated via triggers)
- `attendance_count` in `class_sessions` (updated via triggers)
- Reduces need for complex COUNT queries

## Example Queries

### Get All Classes for Professor in Current Period
```sql
SELECT ci.*, c.code, c.name, ap.name as period_name
FROM class_instances ci
JOIN courses c ON ci.course_id = c.id
JOIN academic_periods ap ON ci.academic_period_id = ap.id
WHERE ci.professor_id = $1 
AND ap.is_current = true
AND ci.is_active = true;
```

### Get Attendance for Specific Class
```sql
SELECT cs.session_number, cs.date, cs.start_time,
       COUNT(ar.id) as total_attendance,
       COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
       COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count
FROM class_sessions cs
LEFT JOIN attendance_records ar ON cs.id = ar.session_id
WHERE cs.class_instance_id = $1
GROUP BY cs.id, cs.session_number, cs.date, cs.start_time
ORDER BY cs.date;
```

### Get Student Attendance History
```sql
SELECT cs.date, cs.start_time, ar.status, ar.minutes_late,
       c.code, c.name as course_name
FROM attendance_records ar
JOIN class_sessions cs ON ar.session_id = cs.id
JOIN class_instances ci ON cs.class_instance_id = ci.id
JOIN courses c ON ci.course_id = c.id
WHERE ar.student_id = $1
AND ci.academic_period_id = $2
ORDER BY cs.date DESC;
```

## Benefits of This Design

### 1. Scalability
- Can handle thousands of classes across multiple academic periods
- No table creation needed for new classes
- Efficient queries even with large datasets

### 2. Flexibility
- Easy to add new academic periods
- Support for different class schedules
- Flexible attendance statuses

### 3. Performance
- Materialized views for fast analytics
- Strategic indexes for common queries
- Denormalized fields for frequently accessed data

### 4. Maintainability
- Single schema for all classes
- Consistent data structure
- Easy to add new features

### 5. Data Integrity
- Foreign key constraints
- Unique constraints prevent duplicates
- Triggers maintain data consistency

## Migration Strategy

1. **Backup Current Data**: Create backup tables
2. **Create New Tables**: Run the optimized schema script
3. **Migrate Data**: Use the migration script to transfer data
4. **Update Application**: Modify API endpoints to use new schema
5. **Verify**: Run verification queries to ensure data integrity
6. **Cleanup**: Remove old tables after verification

## API Endpoints

The new schema works with these optimized API endpoints:

- `GET /api/courses` - Get all available courses
- `POST /api/class-instances` - Create new class instance
- `GET /api/professors/:id/class-instances` - Get professor's classes
- `POST /api/class-instances/:id/sessions` - Create new session
- `GET /api/sessions/:id/attendance` - Get session attendance
- `POST /api/sessions/:id/attendance` - Record attendance
- `POST /api/class-instances/:id/enroll` - Enroll students
- `GET /api/class-instances/:id/attendance-summary` - Get analytics

## Conclusion

This optimized database design provides:

✅ **Efficient class management** across academic periods  
✅ **Scalable architecture** that grows with your needs  
✅ **Fast performance** with strategic optimizations  
✅ **Easy maintenance** with consistent structure  
✅ **Rich analytics** with materialized views  
✅ **Data integrity** with proper constraints  

The design eliminates the need to create multiple tables per class while providing all the functionality you need for managing classes, students, and attendance across different academic periods.
