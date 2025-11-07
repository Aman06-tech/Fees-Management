'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { authService } from '@/lib/services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Get Firebase ID token and send to backend
        try {
          const idToken = await firebaseUser.getIdToken();
          localStorage.setItem('firebase_token', idToken);
        } catch (error) {
          console.error('Error getting Firebase token:', error);
        }
      } else {
        setUser(null);
        localStorage.removeItem('firebase_token');
        localStorage.removeItem('auth_token');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Send credentials to backend for JWT token FIRST
      const backendResponse = await authService.login({ email, password });

      // Store the backend JWT token
      if (backendResponse.token) {
        localStorage.setItem('auth_token', backendResponse.token);
      }

      // Then sign in with Firebase (optional - for additional features)
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (firebaseError: any) {
        console.error('Firebase login error:', firebaseError);
        // Continue even if Firebase fails - backend auth is primary
      }

      return;
    } catch (error: any) {
      console.error('Sign in error:', error);
      // Provide user-friendly error messages
      if (error.message.includes('Invalid email or password')) {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later');
      } else {
        throw new Error(error.message || 'Failed to sign in');
      }
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string = 'admin') => {
    try {
      // Register user in backend FIRST
      const backendResponse = await authService.register({
        email,
        password,
        name,
        role: role as any
      });

      // Store the backend JWT token
      if (backendResponse.token) {
        localStorage.setItem('auth_token', backendResponse.token);
      }

      // Then create user in Firebase (optional - for additional features)
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Update user profile with name
        await updateProfile(result.user, { displayName: name });
      } catch (firebaseError: any) {
        console.error('Firebase registration error:', firebaseError);
        // Continue even if Firebase fails - backend auth is primary
      }

      return;
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Provide user-friendly error messages
      if (error.message.includes('already exists')) {
        throw new Error('An account with this email already exists');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Use at least 6 characters');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password sign up is not enabled. Please contact support.');
      } else {
        throw new Error(error.message || 'Failed to sign up');
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Send to backend to create/login user and get JWT token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL
        })
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with backend');
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      } else {
        throw new Error('No authentication token received from backend');
      }

      return;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      // Provide user-friendly error messages
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup was closed before completing');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with the same email but different sign-in method');
      } else {
        throw new Error(error.message || 'Failed to sign in with Google');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('firebase_token');
      // Redirect to home/login page
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if there's an error, clear tokens and redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('firebase_token');
      window.location.href = '/login';
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
