import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
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
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 