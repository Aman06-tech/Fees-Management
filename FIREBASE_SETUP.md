# Firebase Authentication Setup Guide

This guide will walk you through setting up Firebase Authentication with Google OAuth for the Fees Management System.

## 📋 Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

## 🚀 Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter a project name (e.g., "Fees Management System")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**

## 🔧 Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (</>) to add a web app
2. Register your app:
   - **App nickname**: "Fees Management Frontend" (or any name you prefer)
   - **Check** "Also set up Firebase Hosting" (optional)
3. Click **"Register app"**
4. You'll see your Firebase configuration object - **KEEP THIS WINDOW OPEN**

## 🔑 Step 3: Copy Firebase Configuration

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Update Your `.env.local` File

1. Open `frontend/.env.local`
2. Replace the placeholder values with your actual Firebase configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB...YOUR_ACTUAL_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🔐 Step 4: Enable Authentication Methods

### Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **"Email/Password"**
3. **Enable** the first toggle (Email/Password)
4. Click **"Save"**

### Enable Google Sign-In

1. In the same **Sign-in method** page
2. Click **"Google"**
3. **Enable** the toggle
4. Select a **Project support email** from the dropdown
5. Click **"Save"**

## 🌐 Step 5: Configure Authorized Domains

1. In **Authentication** → **Settings** → **Authorized domains**
2. By default, `localhost` should already be there
3. If deploying to production, add your production domain here

## 🔄 Step 6: Restart Your Development Server

After updating `.env.local`, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd frontend
npm run dev
```

## ✅ Step 7: Test Authentication

### Test Email/Password Registration

1. Navigate to http://localhost:3001/register
2. Fill in the form with:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Confirm Password
   - Select a Role
3. Click **"Create Account"**

### Test Email/Password Login

1. Navigate to http://localhost:3001/login
2. Enter your email and password
3. Click **"Sign In"**

### Test Google OAuth

1. On the login or register page
2. Click **"Sign in with Google"** or **"Continue with Google"**
3. Select your Google account
4. Grant permissions
5. You should be redirected to the dashboard

## 🎨 Features Implemented

✅ Email/Password Registration
✅ Email/Password Login
✅ Google OAuth Sign-In
✅ Google OAuth Sign-Up
✅ Firebase Auth State Management
✅ JWT Token Integration with Backend
✅ Protected Routes
✅ Automatic Token Refresh

## 📁 Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx         # Login page with Google OAuth
│   │   └── register/
│   │       └── page.tsx         # Registration page with Google OAuth
│   ├── layout.tsx               # Root layout with AuthProvider
│   └── providers.tsx            # Client-side providers wrapper
├── contexts/
│   └── AuthContext.tsx          # Firebase auth context
├── lib/
│   ├── firebase.ts              # Firebase configuration
│   └── services/
│       └── auth.ts              # Auth service for backend communication
└── .env.local                   # Environment variables (Firebase config)
```

## 🔒 Security Best Practices

### Firebase Security Rules

1. In Firebase Console, go to **Firestore Database** (if using) or **Realtime Database**
2. Update security rules to ensure users can only access their own data

Example Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Environment Variables

- ⚠️ **NEVER** commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- For production, set environment variables in your hosting platform

### API Key Security

- Firebase API keys are safe to expose in client-side code
- They identify your Firebase project, but don't grant access to your database
- Access is controlled by Firebase Security Rules

## 🐛 Troubleshooting

### Error: "Firebase: Error (auth/unauthorized-domain)"

**Solution:** Add your domain to Authorized domains in Firebase Console
→ Authentication → Settings → Authorized domains

### Error: "Firebase: Error (auth/popup-blocked)"

**Solution:** Enable popups in your browser for localhost

### Error: "useAuth must be used within an AuthProvider"

**Solution:** Ensure `AuthProvider` is wrapping your components in `app/layout.tsx`

### MongoDB Connection Issues

If you see MongoDB connection errors in the backend:

1. Check your IP is whitelisted in MongoDB Atlas
2. Verify `MONGODB_URL` in `backend-node/.env`
3. Ensure MongoDB service is running

## 📚 Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web)

## 🎉 You're All Set!

Your authentication system is now fully configured with:
- ✅ Firebase Authentication
- ✅ Email/Password Login
- ✅ Google OAuth
- ✅ Backend JWT Integration

Visit http://localhost:3001/login to start using your authentication system!

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
