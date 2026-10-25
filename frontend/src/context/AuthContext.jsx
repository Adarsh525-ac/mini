import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  isFirebaseConfigured 
} from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync user state with backend profile
  const syncUserProfile = async (currentUser) => {
    if (!currentUser) {
      setUser(null);
      setIsAdmin(false);
      return;
    }

    try {
      const profile = await api.getCurrentUser();
      setUser({
        ...currentUser,
        role: profile.role || 'user',
        dbUser: profile
      });
      setIsAdmin(profile.role === 'admin');
    } catch (err) {
      console.warn('Backend sync warning:', err.message);
      // Fallback: check if local demo user had admin role
      const isDemoAdmin = currentUser.email === 'admin@cloudtune.io' || currentUser.role === 'admin';
      setUser(currentUser);
      setIsAdmin(isDemoAdmin);
    }
  };

  useEffect(() => {
    // If real Firebase is available, listen to auth state changes
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await syncUserProfile(firebaseUser);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Local Demo Mode (when Firebase credentials are not yet set up)
      const cached = localStorage.getItem('cloudtune_demo_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          setIsAdmin(parsed.role === 'admin');
        } catch {
          localStorage.removeItem('cloudtune_demo_user');
        }
      }
      setLoading(false);
    }
  }, []);

  // Email/Password Login
  const login = async (email, password) => {
    setAuthError(null);
    if (isFirebaseConfigured) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(cred.user);
        return cred.user;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      }
    } else {
      // Local demo mode simulation
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
      const demoUser = {
        uid: 'demo-user-' + Math.random().toString(36).substring(7),
        email,
        displayName: email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        role,
      };
      localStorage.setItem('cloudtune_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setIsAdmin(role === 'admin');
      return demoUser;
    }
  };

  // User Registration
  const register = async (email, password, displayName) => {
    setAuthError(null);
    if (isFirebaseConfigured) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        await syncUserProfile(cred.user);
        return cred.user;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      }
    } else {
      const demoUser = {
        uid: 'demo-user-' + Math.random().toString(36).substring(7),
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
      };
      localStorage.setItem('cloudtune_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setIsAdmin(demoUser.role === 'admin');
      return demoUser;
    }
  };

  // Google Sign-In
  const loginWithGoogle = async () => {
    setAuthError(null);
    if (isFirebaseConfigured) {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        await syncUserProfile(cred.user);
        return cred.user;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      }
    } else {
      const demoUser = {
        uid: 'google-demo-' + Math.random().toString(36).substring(7),
        email: 'google.student@cloudtune.io',
        displayName: 'Google Demo User',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google',
        role: 'user',
      };
      localStorage.setItem('cloudtune_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setIsAdmin(false);
      return demoUser;
    }
  };

  // Logout
  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    localStorage.removeItem('cloudtune_demo_user');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      loading,
      authError,
      login,
      register,
      loginWithGoogle,
      logout,
      isFirebaseConfigured,
      refreshProfile: () => syncUserProfile(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
