import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

const REGISTERED_USERS_KEY = 'sociallift_registered_users';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);

  const findRegisteredUser = async (email) => {
    try {
      const raw = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      const map = raw ? JSON.parse(raw) : {};
      return map[email] || null;
    } catch {
      return null;
    }
  };

  const saveRegisteredUser = async (u) => {
    try {
      const raw = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const { name, role, dob, location, interests, genre, creatorDNA } = u;
      map[u.email] = { name, role, dob, location, interests, genre, creatorDNA };
      await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(map));
    } catch (e) {
      console.log('Failed to save registered user', e);
    }
  };

  const setUser = async (profile) => {
    const existing = await findRegisteredUser(profile.email);
    const merged = existing ? { ...profile, ...existing } : { ...profile, role: null };
    setUserState(merged);
    return merged;
  };

  const completeProfile = async (role, fullName) => {
    if (!user) return null;
    const updated = { ...user, role, name: fullName || user.name };
    await saveRegisteredUser(updated);
    setUserState(updated);
    return updated;
  };

  const updateProfileDetails = async (details) => {
    if (!user) return null;
    const updated = { ...user, ...details };
    await saveRegisteredUser(updated);
    setUserState(updated);
    return updated;
  };

  const signOut = () => {
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, completeProfile, updateProfileDetails, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}