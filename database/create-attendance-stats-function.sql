-- Create function to get student attendance statistics
CREATE OR REPLACE FUNCTION get_student_attendance_stats(student_id_param UUID)
RETURNS TABLE (
  overall_attendance NUMERIC,
  total_classes INTEGER,
  attendance_streak INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
  total_sessions INTEGER;
  present_count INTEGER;
  attendance_percentage NUMERIC;
  current_streak INTEGER := 0;
  streak_date DATE;
BEGIN
  -- Get total number of class sessions for the student
  SELECT COUNT(*) INTO total_sessions
  FROM attendance_records ar
  JOIN class_sessions cs ON ar.class_session_id = cs.id
  WHERE ar.student_id = student_id_param;
  
  -- Get number of present/late records
  SELECT COUNT(*) INTO present_count
  FROM attendance_records ar
  JOIN class_sessions cs ON ar.class_session_id = cs.id
  WHERE ar.student_id = student_id_param 
    AND ar.status IN ('present', 'late');
  
  -- Calculate attendance percentage
  IF total_sessions > 0 THEN
    attendance_percentage := (present_count::NUMERIC / total_sessions::NUMERIC) * 100;
  ELSE
    attendance_percentage := 0;
  END IF;
  
  -- Calculate attendance streak (consecutive days with present/late status)
  -- Get the most recent attendance record date
  SELECT MAX(cs.date) INTO streak_date
  FROM attendance_records ar
  JOIN class_sessions cs ON ar.class_session_id = cs.id
  WHERE ar.student_id = student_id_param;
  
  -- Count consecutive days with present/late status starting from most recent
  IF streak_date IS NOT NULL THEN
    WITH RECURSIVE streak_calc AS (
      -- Base case: most recent day
      SELECT 
        cs.date,
        CASE 
          WHEN ar.status IN ('present', 'late') THEN 1 
          ELSE 0 
        END as is_present,
        1 as day_count
      FROM attendance_records ar
      JOIN class_sessions cs ON ar.class_session_id = cs.id
      WHERE ar.student_id = student_id_param 
        AND cs.date = streak_date
      
      UNION ALL
      
      -- Recursive case: previous days
      SELECT 
        cs.date,
        CASE 
          WHEN ar.status IN ('present', 'late') THEN 1 
          ELSE 0 
        END as is_present,
        CASE 
          WHEN ar.status IN ('present', 'late') THEN sc.day_count + 1
          ELSE 0
        END as day_count
      FROM streak_calc sc
      JOIN attendance_records ar ON ar.student_id = student_id_param
      JOIN class_sessions cs ON ar.class_session_id = cs.id
      WHERE cs.date = sc.date - INTERVAL '1 day'
        AND sc.is_present = 1
    )
    SELECT MAX(day_count) INTO current_streak
    FROM streak_calc
    WHERE is_present = 1;
  END IF;
  
  -- Return the results
  RETURN QUERY SELECT 
    ROUND(attendance_percentage, 1) as overall_attendance,
    total_sessions as total_classes,
    COALESCE(current_streak, 0) as attendance_streak;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_student_attendance_stats(UUID) TO authenticated;
