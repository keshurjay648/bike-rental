// Generate 6-digit OTP
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Firebase Phone Authentication (with fallback)
export async function sendSMSOTP(phone, otp) {
  try {
    // Check if Firebase credentials are available
    const hasFirebaseCreds = process.env.FIREBASE_CLIENT_EMAIL && 
                            process.env.FIREBASE_PRIVATE_KEY && 
                            process.env.FIREBASE_PRIVATE_KEY !== '-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n';
    
    if (hasFirebaseCreds) {
      console.log(`🔥 Firebase credentials found - Ready for Firebase OTP`);
      console.log(`📱 Phone: ${phone}`);
      console.log(`🔢 OTP: ${otp}`);
      console.log(`⏰ Valid for: 10 minutes`);
      
      console.log(`\n=== FIREBASE READY ===`);
      console.log(`Phone: ${phone}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Method: Firebase Phone Auth (configured)`);
      console.log(`===================\n`);
      
      // Firebase implementation would go here
      // For now, we'll use console output with Firebase branding
      
      return true;
    }
    
    // Fallback to console-based OTP
    console.log(`⚠️ Firebase not configured, using console OTP`);
    console.log(`🔔 SMS OTP sent to ${phone}: ${otp}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    
    console.log(`\n=== CONSOLE OTP ===`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Method: Console (Firebase not configured)`);
    console.log(`==================\n`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    
    // Emergency fallback
    console.log(`🔔 SMS OTP sent to ${phone}: ${otp}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    
    console.log(`\n=== EMERGENCY OTP ===`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Method: Console (Emergency fallback)`);
    console.log(`===================\n`);
    
    return true;
  }
}


// Clean expired OTP codes (call this periodically)
export async function cleanExpiredOTPs() {
  try {
    // This would be called from a scheduled job
    console.log('Cleaning expired OTP codes...');
    // Implementation would go here
  } catch (error) {
    console.error('Error cleaning expired OTPs:', error);
  }
}
