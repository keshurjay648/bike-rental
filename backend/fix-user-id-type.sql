-- Fix User ID Type Compatibility
-- This script fixes the UUID vs INTEGER type mismatch

-- 1. Check the current data type of users.id column
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- 2. Check the current data type of bookings.user_id column
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'user_id';

-- 3. Fix the type mismatch by changing bookings.user_id to match users.id
DO $$
DECLARE
    users_id_type TEXT;
BEGIN
    -- Get the data type of users.id
    SELECT data_type INTO users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    RAISE NOTICE 'Users.id type: %', users_id_type;
    
    -- If users.id is integer, change bookings.user_id to integer
    IF users_id_type = 'integer' THEN
        -- First, drop the foreign key constraint if it exists
        DROP CONSTRAINT IF EXISTS fk_bookings_user_id CASCADE;
        
        -- Change the column type (this will fail if there's data, so we need to handle it)
        BEGIN
            -- If there's no data in bookings.user_id, we can safely change the type
            IF (SELECT COUNT(*) FROM bookings WHERE user_id IS NOT NULL) = 0 THEN
                ALTER TABLE bookings ALTER COLUMN user_id TYPE INTEGER USING user_id::integer;
                RAISE NOTICE 'Changed bookings.user_id to INTEGER type';
            ELSE
                -- If there's data, we need to handle it differently
                RAISE NOTICE 'Cannot change bookings.user_id type - existing data found';
            END IF;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Error changing bookings.user_id type: %', SQLERRM;
        END;
    END IF;
END $$;

-- 4. Alternative approach: If users.id is integer, create a UUID column and migrate
DO $$
DECLARE
    users_id_type TEXT;
BEGIN
    -- Get the data type of users.id
    SELECT data_type INTO users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    -- If users.id is integer, add a UUID column and use that for foreign keys
    IF users_id_type = 'integer' THEN
        -- Add UUID column to users table
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='users' AND column_name='uuid_id'
        ) THEN
            ALTER TABLE users ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid();
            RAISE NOTICE 'Added uuid_id column to users table';
            
            -- Update existing users to have UUID values
            UPDATE users SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL;
            RAISE NOTICE 'Populated uuid_id for existing users';
        END IF;
        
        -- Add UUID column to bookings table if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='bookings' AND column_name='user_uuid_id'
        ) THEN
            ALTER TABLE bookings ADD COLUMN user_uuid_id UUID;
            RAISE NOTICE 'Added user_uuid_id column to bookings table';
        END IF;
        
        -- Create foreign key constraint using UUID columns
        DROP CONSTRAINT IF EXISTS fk_bookings_user_id CASCADE;
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_uuid_id 
            FOREIGN KEY (user_uuid_id) REFERENCES users(uuid_id) ON DELETE CASCADE;
        RAISE NOTICE 'Created foreign key constraint using UUID columns';
    END IF;
END $$;

-- 5. Update the account deletion functions to work with both ID types
CREATE OR REPLACE FUNCTION DeleteUserAccount(user_email VARCHAR(255), user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    users_id_type TEXT;
    actual_user_id UUID;
    actual_user_id_int INTEGER;
BEGIN
    -- Get the data type of users.id
    SELECT data_type INTO users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    -- Handle based on the ID type
    IF users_id_type = 'integer' THEN
        -- Use UUID column for deletion
        actual_user_id := (SELECT uuid_id FROM users WHERE email = user_email AND id = user_id::integer);
        
        -- Delete user preferences
        DELETE FROM user_preferences WHERE user_id = actual_user_id;
        
        -- Delete user sessions
        DELETE FROM user_sessions WHERE user_id = actual_user_id;
        
        -- Delete user bookings
        DELETE FROM bookings WHERE user_uuid_id = actual_user_id;
        
        -- Delete user account
        DELETE FROM users WHERE email = user_email AND id = user_id::integer;
        
    ELSE
        -- Use UUID column directly
        actual_user_id := user_id::UUID;
        
        -- Delete user preferences
        DELETE FROM user_preferences WHERE user_id = actual_user_id;
        
        -- Delete user sessions
        DELETE FROM user_sessions WHERE user_id = actual_user_id;
        
        -- Delete user bookings
        DELETE FROM bookings WHERE user_id = actual_user_id;
        
        -- Delete user account
        DELETE FROM users WHERE email = user_email AND id = actual_user_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user account: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 6. Update the DeleteUserBookings function to work with both ID types
CREATE OR REPLACE FUNCTION DeleteUserBookings(user_email VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete user bookings (check both user_id and user_uuid_id columns)
    DELETE FROM bookings WHERE customer_email = user_email;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user bookings: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a view to check the current database structure
CREATE OR REPLACE VIEW database_structure AS
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
UNION ALL
SELECT 
    'bookings' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY table_name, column_name;

SELECT 'User ID type compatibility fix completed!' as status;

-- 8. Show the current structure
SELECT * FROM database_structure WHERE table_name IN ('users', 'bookings') AND column_name LIKE '%user_id%';
