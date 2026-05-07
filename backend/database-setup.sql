

-- 1. Create Database (if not exists)
CREATE DATABASE IF NOT EXISTS bike_rental;
USE bike_rental;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- 3. Bikes Table
CREATE TABLE IF NOT EXISTS bikes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    cc VARCHAR(50),
    torque VARCHAR(50),
    horsepower VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_type (type),
    INDEX idx_available (is_available)
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    bike_id VARCHAR(36) NOT NULL,
    bike_name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    total_hours INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bike_id) REFERENCES bikes(id),
    INDEX idx_user_email (customer_email),
    INDEX idx_user_id (user_id),
    INDEX idx_bike_id (bike_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
);

-- 5. User Sessions Table (for JWT token management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);

-- 6. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    preferred_bike_type VARCHAR(100),
    preferred_price_range VARCHAR(50),
    notification_settings JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
);

-- 7. Insert Sample Bikes Data
INSERT IGNORE INTO bikes (id, name, type, price_per_hour, image_url, cc, torque, horsepower) VALUES
('bike-1', 'BMW G310', 'Naked', 180.00, 'img/g310.png', '313 cc', '28 Nm', '34 hp'),
('bike-2', 'TVS RR310', 'Sports', 190.00, 'img/tvsrr.png', '312 cc', '29 Nm', '34 hp'),
('bike-3', 'TVS RTR160', 'Naked', 120.00, 'img/rtr160.png', '159 cc', '14 Nm', '16 hp'),
('bike-4', 'BMW GS310', 'Adventure', 200.00, 'img/gs310.png', '313 cc', '28 Nm', '34 hp'),
('bike-5', 'Honda CBR600rr', 'Sports', 210.00, 'img/cbr.png', '599 cc', '66 Nm', '119 hp'),
('bike-6', 'Yamaha Aerox 155', 'Scooter', 80.00, 'img/yama.png', '155 cc', '13.9 Nm', '15 hp'),
('bike-7', 'Honda PCX', 'Scooter', 90.00, 'img/pcx.png', '157 cc', '15 Nm', '16 hp'),
('bike-8', 'Burgman 400', 'Scooter', 140.00, 'img/burg.png', '400 cc', '35 Nm', '29 hp'),
('bike-9', 'Harley Davidson LiveWire', 'Electric', 160.00, 'img/harly.png', '105 kW electric motor', '116 Nm', '105 hp');

-- 8. Create Stored Procedures for Account Deletion

-- Procedure to delete user and all related data
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS DeleteUserAccount(IN user_email VARCHAR(255), IN user_id VARCHAR(36))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Delete user preferences
    DELETE FROM user_preferences WHERE user_id = user_id;
    
    -- Delete user sessions
    DELETE FROM user_sessions WHERE user_id = user_id;
    
    -- Delete user bookings
    DELETE FROM bookings WHERE user_id = user_id;
    
    -- Delete user account
    DELETE FROM users WHERE email = user_email AND id = user_id;
    
    COMMIT;
END //
DELIMITER ;

-- Procedure to delete user bookings only
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS DeleteUserBookings(IN user_email VARCHAR(255))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Delete user bookings
    DELETE FROM bookings WHERE customer_email = user_email;
    
    COMMIT;
END //
DELIMITER ;

-- 9. Create Views for Common Queries
CREATE OR REPLACE VIEW user_booking_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    COUNT(b.id) as total_bookings,
    SUM(b.total_price) as total_spent,
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
    COUNT(booking.id) as total_bookings,
    SUM(booking.total_price) as total_revenue,
    AVG(booking.total_price) as avg_booking_value
FROM bikes b
LEFT JOIN bookings booking ON b.id = booking.bike_id
GROUP BY b.id, b.name, b.type, b.price_per_hour;

-- 10. Database Triggers for Data Integrity

-- Trigger to clean up expired sessions
DELIMITER //
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
AFTER INSERT ON user_sessions
FOR EACH ROW
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END //
DELIMITER ;

-- 11. Database Optimization
-- Create indexes for better performance on large datasets
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_bikes_price ON bikes(price_per_hour);

-- 12. Backup and Maintenance Notes
/*
For production deployment:

1. Set up regular backups:
   mysqldump -u username -p bike_rental > backup.sql

2. Set up user permissions:
   CREATE USER 'bike_rental_app'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON bike_rental.* TO 'bike_rental_app'@'localhost';

3. Optimize for production:
   - Set up connection pooling
   - Configure appropriate buffer sizes
   - Set up read replicas for scaling

4. Security considerations:
   - Use prepared statements to prevent SQL injection
   - Implement proper authentication
   - Use HTTPS for all API calls
   - Regular security updates
*/

-- 13. Sample Test Data (Optional - for testing only)
/*
-- Insert test user (password: 'test123')
INSERT IGNORE INTO users (id, name, email, password, phone) VALUES
('test-user-1', 'Test User', 'test@example.com', '$2b$10$example_hash', '+919876543210');

-- Insert test booking
INSERT IGNORE INTO bookings (id, user_id, customer_name, customer_email, bike_id, bike_name, start_date, end_date, total_hours, total_price) VALUES
('booking-1', 'test-user-1', 'Test User', 'test@example.com', 'bike-1', 'BMW G310', '2024-01-01 10:00:00', '2024-01-01 14:00:00', 4, 720.00);
*/

SELECT 'Database setup completed successfully!' as status;
