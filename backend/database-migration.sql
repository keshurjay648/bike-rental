-- Database Migration Script for PostgreSQL
-- Use this to update your existing database with missing columns

-- 1. Add missing columns to bikes table
DO $$
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bikes' AND column_name='is_available'
    ) THEN
        ALTER TABLE bikes ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_available column to bikes table';
    END IF;
    
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bikes' AND column_name='created_at'
    ) THEN
        ALTER TABLE bikes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to bikes table';
    END IF;
END $$;

-- 2. Add missing columns to bookings table if they don't exist
DO $$
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='user_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to bookings table';
    END IF;
    
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='bike_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN bike_id UUID;
        RAISE NOTICE 'Added bike_id column to bookings table';
    END IF;
    
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='total_hours'
    ) THEN
        ALTER TABLE bookings ADD COLUMN total_hours INTEGER;
        RAISE NOTICE 'Added total_hours column to bookings table';
    END IF;
    
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='status'
    ) THEN
        ALTER TABLE bookings ADD COLUMN status VARCHAR(50) DEFAULT 'confirmed';
        RAISE NOTICE 'Added status column to bookings table';
    END IF;
    
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='payment_status'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'Added payment_status column to bookings table';
    END IF;
    
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='updated_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to bookings table';
    END IF;
END $$;

-- 3. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_bikes_available ON bikes(is_available);
CREATE INDEX IF NOT EXISTS idx_bikes_created_at ON bikes(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bike_id ON bookings(bike_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- 4. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    preferred_bike_type VARCHAR(100),
    preferred_price_range VARCHAR(50),
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for bookings.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_user_id'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_bookings_user_id constraint';
    END IF;
    
    -- Add foreign key for bookings.bike_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_bike_id'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_bike_id 
            FOREIGN KEY (bike_id) REFERENCES bikes(id);
        RAISE NOTICE 'Added fk_bookings_bike_id constraint';
    END IF;
    
    -- Add foreign key for user_sessions.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_sessions_user_id'
    ) THEN
        ALTER TABLE user_sessions ADD CONSTRAINT fk_sessions_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_sessions_user_id constraint';
    END IF;
    
    -- Add foreign key for user_preferences.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_preferences_user_id'
    ) THEN
        ALTER TABLE user_preferences ADD CONSTRAINT fk_preferences_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_preferences_user_id constraint';
    END IF;
    
    -- Add unique constraint for user_preferences
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_preferences'
    ) THEN
        ALTER TABLE user_preferences ADD CONSTRAINT unique_user_preferences 
            UNIQUE (user_id);
        RAISE NOTICE 'Added unique_user_preferences constraint';
    END IF;
END $$;

-- 6. Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- 7. Create or replace functions for account deletion
CREATE OR REPLACE FUNCTION DeleteUserAccount(user_email VARCHAR(255), user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete user preferences
    DELETE FROM user_preferences WHERE user_id = user_id;
    
    -- Delete user sessions
    DELETE FROM user_sessions WHERE user_id = user_id;
    
    -- Delete user bookings
    DELETE FROM bookings WHERE user_id = user_id;
    
    -- Delete user account
    DELETE FROM users WHERE email = user_email AND id = user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user account: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION DeleteUserBookings(user_email VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete user bookings
    DELETE FROM bookings WHERE customer_email = user_email;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user bookings: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Apply triggers to tables that have updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert sample bike data if bikes table is empty
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM bikes) = 0 THEN
        INSERT INTO bikes (id, name, type, price_per_hour, image_url, cc, torque, horsepower) VALUES
        ('bike-1', 'BMW G310', 'Naked', 180.00, 'img/g310.png', '313 cc', '28 Nm', '34 hp'),
        ('bike-2', 'TVS RR310', 'Sports', 190.00, 'img/tvsrr.png', '312 cc', '29 Nm', '34 hp'),
        ('bike-3', 'TVS RTR160', 'Naked', 120.00, 'img/rtr160.png', '159 cc', '14 Nm', '16 hp'),
        ('bike-4', 'BMW GS310', 'Adventure', 200.00, 'img/gs310.png', '313 cc', '28 Nm', '34 hp'),
        ('bike-5', 'Honda CBR600rr', 'Sports', 210.00, 'img/cbr.png', '599 cc', '66 Nm', '119 hp'),
        ('bike-6', 'Yamaha Aerox 155', 'Scooter', 80.00, 'img/yama.png', '155 cc', '13.9 Nm', '15 hp'),
        ('bike-7', 'Honda PCX', 'Scooter', 90.00, 'img/pcx.png', '157 cc', '15 Nm', '16 hp'),
        ('bike-8', 'Burgman 400', 'Scooter', 140.00, 'img/burg.png', '400 cc', '35 Nm', '29 hp'),
        ('bike-9', 'Harley Davidson LiveWire', 'Electric', 160.00, 'img/harly.png', '105 kW electric motor', '116 Nm', '105 hp');
        RAISE NOTICE 'Inserted sample bike data';
    END IF;
END $$;

SELECT 'Database migration completed successfully!' as status;
