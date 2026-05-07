# Firebase Phone Authentication Setup

## Quick Setup Guide

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `bike-rental-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Phone Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Sign-in method" tab
3. Enable "Phone" authentication
4. Save settings

### 3. Get Firebase Config
1. Go to Project Settings (⚙️ icon)
2. Under "Your apps", click "Web"
3. Copy Firebase config object
4. Update `frontend/firebase-config.js` with your config

### 4. Get Service Account Key (Backend)
1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Save the JSON file
4. Copy the contents to your `.env` file:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 5. Update Frontend Config
Replace the demo config in `frontend/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 6. Test the Implementation
1. Open `frontend/verify-otp.html`
2. Enter phone number with country code (+91XXXXXXXXXX)
3. Click "Send OTP"
4. Enter the OTP received
5. Click "Verify OTP"

## Features Implemented

### ✅ Firebase Phone Authentication
- Client-side Firebase SDK integration
- reCAPTCHA verification
- OTP sending and verification
- Italian language support (auth.languageCode = 'it')
- Fallback to console OTP if Firebase fails

### ✅ Backend Integration
- Firebase Admin SDK for server-side operations
- Environment variable configuration
- Graceful fallback to console OTP
- User verification status tracking

### ✅ User Experience
- Clean, modern UI
- Real-time feedback
- Error handling
- Responsive design
- Multiple verification methods

## Troubleshooting

### Common Issues

1. **"reCAPTCHA initialization failed"**
   - Check your Firebase config
   - Ensure phone authentication is enabled
   - Use fallback verification method

2. **"auth/quota-exceeded"**
   - Firebase has daily limits on free tier
   - System automatically falls back to console OTP

3. **"auth/invalid-phone-number"**
   - Ensure phone number includes country code
   - Format: +91XXXXXXXXXX for India

4. **Backend Firebase errors**
   - Check service account key format
   - Ensure private key has correct line breaks
   - Verify project ID matches

### Testing Without Firebase Credits
The system automatically falls back to console OTP when Firebase is not configured:
1. Server console shows: `🔔 SMS OTP sent to [phone]: [OTP]`
2. Use the console OTP for testing
3. Full functionality maintained

## Production Deployment

### Security Considerations
- Never expose Firebase private key in frontend
- Use environment variables for sensitive data
- Enable reCAPTCHA in production
- Monitor Firebase usage quotas

### Scaling
- Firebase free tier: 10,000 phone verifications/month
- Upgrade to paid plan for higher volume
- Consider multiple Firebase projects for different environments

## Support

For Firebase documentation:
- [Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Pricing](https://firebase.google.com/pricing)
