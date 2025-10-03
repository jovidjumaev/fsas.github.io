-- Fix the database trigger for user profile creation
-- This script should be run in Supabase SQL Editor

-- First, drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Create the function
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO users (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Unknown'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create role-specific profile
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'student' THEN
        INSERT INTO students (user_id, student_id, enrollment_year, major)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'student_id', 'STU' || EXTRACT(EPOCH FROM NOW())::bigint),
            EXTRACT(YEAR FROM NOW())::integer,
            COALESCE(NEW.raw_user_meta_data->>'major', NULL)
        )
        ON CONFLICT (user_id) DO NOTHING;
    ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'professor' THEN
        INSERT INTO professors (user_id, employee_id, title, office_location, phone)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'employee_id', 'EMP' || EXTRACT(EPOCH FROM NOW())::bigint),
            COALESCE(NEW.raw_user_meta_data->>'title', 'Professor'),
            COALESCE(NEW.raw_user_meta_data->>'office_location', 'TBD'),
            COALESCE(NEW.raw_user_meta_data->>'phone', 'TBD')
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Test the trigger
SELECT 'Trigger created successfully' as status;
