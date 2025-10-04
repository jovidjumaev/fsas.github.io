-- Add test academic periods to the database
INSERT INTO academic_periods (id, name, year, semester, start_date, end_date, is_current) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Fall 2024', 2024, 'Fall', '2024-08-26', '2024-12-13', false),
('550e8400-e29b-41d4-a716-446655440000', 'Spring 2025', 2025, 'Spring', '2025-01-13', '2025-05-09', true),
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Summer 2025', 2025, 'Summer', '2025-05-19', '2025-08-08', false),
('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Fall 2025', 2025, 'Fall', '2025-08-25', '2025-12-12', false),
('6ba7b812-9dad-11d1-80b4-00c04fd430c8', 'Spring 2026', 2026, 'Spring', '2026-01-12', '2026-05-08', false)
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
SELECT 'Academic periods added:' as status, COUNT(*) as count FROM academic_periods;
SELECT 'Current period:' as info, name, year, semester, is_current FROM academic_periods WHERE is_current = true;
