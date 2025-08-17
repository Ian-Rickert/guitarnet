import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile, getUserProfile } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists, if not create one
      const existingProfile = await getUserProfile(user.uid);
      if (!existingProfile) {
        await createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          username: user.displayName || 'Guitarist',
          skillLevel: 'Beginner',
          favoriteArtists: [],
          songs: [],
          bio: '',
          profilePic: '🎸',
        });
      }
      
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, username) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Create user profile for email signup
      await createUserProfile(user.uid, {
        email: user.email,
        displayName: username,
        photoURL: null,
        username: username,
        skillLevel: 'Beginner',
        favoriteArtists: [],
        songs: [],
        bio: '',
        profilePic: '🎸',
      });
      
      return user;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Check if user profile exists, if not create one
      const existingProfile = await getUserProfile(user.uid);
      if (!existingProfile) {
        await createUserProfile(user.uid, {
          email: user.email,
          displayName: user.email.split('@')[0], // Use email prefix as username
          photoURL: null,
          username: user.email.split('@')[0],
          skillLevel: 'Beginner',
          favoriteArtists: [],
          songs: [],
          bio: '',
          profilePic: '🎸',
        });
      }
      
      return user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 