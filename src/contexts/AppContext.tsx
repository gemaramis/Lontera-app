import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  profileData: any | null;
  loading: boolean;
  needsSetup: boolean;
  currentServerId: string | null;
  currentServer: any | null;
  currentChannelId: string | null;
  currentConversationId: string | null;
  setCurrentServerId: (id: string | null) => void;
  setCurrentChannelId: (id: string | null) => void;
  setCurrentConversationId: (id: string | null) => void;
  updateProfile: (data: any) => Promise<void>;
  register: (displayName: string, email: string, password: string, photoURL: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  const [currentServer, setCurrentServer] = useState<any | null>(null);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userRef = doc(db, 'users', authUser.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists() || !snap.data()?.displayName) {
          setUser(authUser);
          setNeedsSetup(true);
          setLoading(false);
          return;
        }

        unsubProfile = onSnapshot(userRef, (doc) => {
          setProfileData(doc.data());
        });

        setNeedsSetup(false);
        setUser(authUser);
      } else {
        setUser(null);
        setProfileData(null);
        setNeedsSetup(false);
        if (unsubProfile) unsubProfile();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Sync currentServer metadata
  useEffect(() => {
    if (currentServerId) {
      const unsub = onSnapshot(doc(db, 'servers', currentServerId), (doc) => {
        if (doc.exists()) setCurrentServer({ id: doc.id, ...doc.data() });
      });
      return unsub;
    } else {
      setCurrentServer(null);
    }
  }, [currentServerId]);

  const updateProfile = async (data: any) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...data, lastSeen: new Date().toISOString() }, { merge: true });
  };

  const register = async (displayName: string, email: string, password: string, photoURL: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const authUser = credential.user;
    const userRef = doc(db, 'users', authUser.uid);
    await setDoc(userRef, {
      uid: authUser.uid,
      displayName,
      photoURL,
      email,
      status: 'online',
      lastSeen: new Date().toISOString(),
    });
    setProfileData({ uid: authUser.uid, displayName, photoURL, email, status: 'online' });
    setNeedsSetup(false);
    setUser(authUser);
  };

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const authUser = credential.user;
    const userRef = doc(db, 'users', authUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) setProfileData(snap.data());
    setNeedsSetup(false);
    setUser(authUser);
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
      needsSetup,
      currentServerId,
      currentServer,
      currentChannelId,
      currentConversationId,
      setCurrentServerId,
      setCurrentChannelId,
      setCurrentConversationId,
      updateProfile,
      register,
      login,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
