-- Complete Database Setup for Account Deletion (PostgreSQL)
-- Copy and paste this entire file into your PostgreSQL database

-- 1. Create Database (run this separately in PostgreSQL)
-- CREATE DATABASE bike_rental;
-- \c bike_rental;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 3. Bikes Table
CREATE TABLE IF NOT EXISTS bikes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    cc VARCHAR(50),
    torque VARCHAR(50),
    horsepower VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for bikes table
CREATE INDEX IF NOT EXISTS idx_bikes_name ON bikes(name);
CREATE INDEX IF NOT EXISTS idx_bikes_type ON bikes(type);
CREATE INDEX IF NOT EXISTS idx_bikes_available ON bikes(is_available);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    bike_id UUID NOT NULL,
    bike_name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    total_hours INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create foreign key constraints
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_bike_id 
    FOREIGN KEY (bike_id) REFERENCES bikes(id);

-- Create indexes for bookings table
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bike_id ON bookings(bike_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 5. User Sessions Table (for JWT token management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create foreign key constraint for sessions
ALTER TABLE user_sessions ADD CONSTRAINT fk_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- 6. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    preferred_bike_type VARCHAR(100),
    preferred_price_range VARCHAR(50),
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create foreign key constraint for preferences
ALTER TABLE user_preferences ADD CONSTRAINT fk_preferences_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create unique constraint for preferences
ALTER TABLE user_preferences ADD CONSTRAINT unique_user_preferences 
    UNIQUE (user_id);

-- 7. Insert Sample Bikes Data
INSERT INTO bikes (id, name, type, price_per_hour, image_url, cc, torque, horsepower) VALUES
('bike-1', 'BMW G310', 'Naked', 180.00, 'img/g310.png', '313 cc', '28 Nm', '34 hp'),
('bike-2', 'TVS RR310', 'Sports', 190.00, 'img/tvsrr.png', '312 cc', '29 Nm', '34 hp'),
('bike-3', 'TVS RTR160', 'Naked', 120.00, 'img/rtr160.png', '159 cc', '14 Nm', '16 hp'),
('bike-4', 'BMW GS310', 'Adventure', 200.00, 'img/gs310.png', '313 cc', '28 Nm', '34 hp'),
('bike-5', 'Honda CBR600rr', 'Sports', 210.00, 'img/cbr.png', '599 cc', '66 Nm', '119 hp'),
('bike-6', 'Yamaha Aerox 155', 'Scooter', 80.00, 'img/yama.png', '155 cc', '13.9 Nm', '15 hp'),
('bike-7', 'Honda PCX', 'Scooter', 90.00, 'img/pcx.png', '157 cc', '15 Nm', '16 hp'),
('bike-8', 'Burgman 400', 'Scooter', 140.00, 'img/burg.png', '400 cc', '35 Nm', '29 hp'),
('bike-9', 'Harley Davidson LiveWire', 'Electric', 160.00, 'img/harly.png', '105 kW electric motor', '116 Nm', '105 hp')
ON CONFLICT (id) DO NOTHING;

-- 8. Create Functions for Account Deletion

-- Function to delete user and all related data
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

-- Function to delete user bookings only
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

-- 9. Create Views for Common Queries

CREATE OR REPLACE VIEW user_booking_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    COUNT(b.id) as total_bookings,
    COALESCE(SUM(b.total_price), 0) as total_spent,
    MAX(b.created_at) as last_booking_date
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
GROUP BY u.id, u.name, u.email;

CREATE OR REPLACE VIEW bike_popularity AS
SELECT 
    b.id as bike_id,
    b.name as bike_name,
    b.type as bike_type,
    b.price_per_hour,
    COALESCE(COUNT(booking.id), 0) as total_bookings,
    COALESCE(SUM(booking.total_price), 0) as total_revenue,
    COALESCE(AVG(booking.total_price), 0) as avg_booking_value
FROM bikes b
LEFT JOIN bookings booking ON b.id = booking.bike_id
GROUP BY b.id, b.name, b.type, b.price_per_hour;

-- 10. Database Triggers for Data Integrity

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables that have updated_at column
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Database Optimization
-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_bikes_price ON bikes(price_per_hour);

-- 12. Cleanup Function for Expired Sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 13. Sample Test Data (Optional - for testing only)
/*
-- Insert test user (password: 'test123' - you'll need to hash this properly)
INSERT INTO users (id, name, email, password, phone) VALUES
('test-user-1', 'Test User', 'test@example.com', '$2b$10$example_hash', '+919876543210')
ON CONFLICT (email) DO NOTHING;

-- Insert test booking
INSERT INTO bookings (id, user_id, customer_name, customer_email, bike_id, bike_name, start_date, end_date, total_hours, total_price) VALUES
('booking-1', 'test-user-1', 'Test User', 'test@example.com', 'bike-1', 'BMW G310', '2024-01-01 10:00:00', '2024-01-01 14:00:00', 4, 720.00)
ON CONFLICT (id) DO NOTHING;
*/

SELECT 'PostgreSQL database setup completed successfully!' as status;
