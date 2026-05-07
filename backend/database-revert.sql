-- Database Revert Script
-- This script will revert all changes and restore database to original state

-- 1. Drop all new tables we created
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;

-- 2. Drop all new columns we added
-- Remove columns from bikes table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bikes' AND column_name='is_available'
    ) THEN
        ALTER TABLE bikes DROP COLUMN is_available;
        RAISE NOTICE 'Dropped is_available column from bikes table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bikes' AND column_name='created_at'
    ) THEN
        ALTER TABLE bikes DROP COLUMN created_at;
        RAISE NOTICE 'Dropped created_at column from bikes table';
    END IF;
END $$;

-- Remove columns from bookings table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='user_id'
    ) THEN
        ALTER TABLE bookings DROP COLUMN user_id;
        RAISE NOTICE 'Dropped user_id column from bookings table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='bike_id'
    ) THEN
        ALTER TABLE bookings DROP COLUMN bike_id;
        RAISE NOTICE 'Dropped bike_id column from bookings table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='total_hours'
    ) THEN
        ALTER TABLE bookings DROP COLUMN total_hours;
        RAISE NOTICE 'Dropped total_hours column from bookings table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='status'
    ) THEN
        ALTER TABLE bookings DROP COLUMN status;
        RAISE NOTICE 'Dropped status column from bookings table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='payment_status'
    ) THEN
        ALTER TABLE bookings DROP COLUMN payment_status;
        RAISE NOTICE 'Dropped payment_status column from bookings table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='updated_at'
    ) THEN
        ALTER TABLE bookings DROP COLUMN updated_at;
        RAISE NOTICE 'Dropped updated_at column from bookings table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='user_uuid_id'
    ) THEN
        ALTER TABLE bookings DROP COLUMN user_uuid_id;
        RAISE NOTICE 'Dropped user_uuid_id column from bookings table';
    END IF;
END $$;

-- Remove columns from users table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='uuid_id'
    ) THEN
        ALTER TABLE users DROP COLUMN uuid_id;
        RAISE NOTICE 'Dropped uuid_id column from users table';
    END IF;
END $$;

-- 3. Drop all new indexes we created
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_bikes_available;
DROP INDEX IF EXISTS idx_bikes_created_at;
DROP INDEX IF EXISTS idx_bookings_user_id;
DROP INDEX IF EXISTS idx_bookings_bike_id;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_created_at;
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_token_hash;
DROP INDEX IF EXISTS idx_sessions_expires_at;

-- 4. Drop all functions we created
DROP FUNCTION IF EXISTS DeleteUserAccount(VARCHAR, UUID);
DROP FUNCTION IF EXISTS DeleteUserBookings(VARCHAR);
DROP FUNCTION IF EXISTS DeleteUserAccount(VARCHAR, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 5. Drop all triggers we created
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;

-- 6. Drop all views we created
DROP VIEW IF EXISTS user_booking_summary;
DROP VIEW IF EXISTS bike_popularity;
DROP VIEW IF EXISTS database_structure;

-- 7. Drop all constraints we added
DO $$
BEGIN
    -- Drop foreign key constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_user_id'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT fk_bookings_user_id;
        RAISE NOTICE 'Dropped fk_bookings_user_id constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_bike_id'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT fk_bookings_bike_id;
        RAISE NOTICE 'Dropped fk_bookings_bike_id constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_sessions_user_id'
    ) THEN
        ALTER TABLE user_sessions DROP CONSTRAINT fk_sessions_user_id;
        RAISE NOTICE 'Dropped fk_sessions_user_id constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_preferences_user_id'
    ) THEN
        ALTER TABLE user_preferences DROP CONSTRAINT fk_preferences_user_id;
        RAISE NOTICE 'Dropped fk_preferences_user_id constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_preferences'
    ) THEN
        ALTER TABLE user_preferences DROP CONSTRAINT unique_user_preferences;
        RAISE NOTICE 'Dropped unique_user_preferences constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_user_uuid_id'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT fk_bookings_user_uuid_id;
        RAISE NOTICE 'Dropped fk_bookings_user_uuid_id constraint';
    END IF;
END $$;

-- 8. Clean up any sample data we inserted (optional - comment out if you want to keep it)
-- DELETE FROM bikes WHERE id IN ('bike-1', 'bike-2', 'bike-3', 'bike-4', 'bike-5', 'bike-6', 'bike-7', 'bike-8', 'bike-9');

-- 9. Show what's left after cleanup
SELECT 'Database revert completed!' as status;

-- 10. Show remaining tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'bikes', 'bookings')
ORDER BY table_name;

-- 11. Show remaining columns for each table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'bikes', 'bookings')
ORDER BY table_name, ordinal_position;
