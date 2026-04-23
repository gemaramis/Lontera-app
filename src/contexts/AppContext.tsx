import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  profileData: any | null;
  loading: boolean;
  currentServerId: string | null;
  currentChannelId: string | null;
  currentConversationId: string | null;
  setCurrentServerId: (id: string | null) => void;
  setCurrentChannelId: (id: string | null) => void;
  setCurrentConversationId: (id: string | null) => void;
  updateProfile: (data: any) => Promise<void>;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Sync user basics once
        const userRef = doc(db, 'users', authUser.uid);
        await setDoc(userRef, {
          uid: authUser.uid,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          email: authUser.email,
        }, { merge: true });

        // Real-time listener for profile changes
        unsubProfile = onSnapshot(userRef, (doc) => {
          setProfileData(doc.data());
        });

        setUser(authUser);
      } else {
        setUser(null);
        setProfileData(null);
        if (unsubProfile) unsubProfile();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const updateProfile = async (data: any) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...data, lastSeen: new Date().toISOString() }, { merge: true });
  };

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, { status: 'online', lastSeen: new Date().toISOString() }, { merge: true });
    }
  };

  const logout = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { status: 'offline', lastSeen: new Date().toISOString() }, { merge: true });
    }
    await signOut(auth);
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      profileData,
      loading, 
      currentServerId, 
      currentChannelId, 
      currentConversationId,
      setCurrentServerId, 
      setCurrentChannelId,
      setCurrentConversationId,
      updateProfile,
      signIn,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
