import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import authProvider from '../auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // RESTORE SESSION
  // (each provider tells us who's logged in, if anyone)
  // =========================

  useEffect(() => {
    const unsubscribe = authProvider.subscribe((profile) => {
      setUserState(profile);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // =========================
  // SET USER
  // (local-only setter, not tied to any backend)
  // =========================

  const setUser = async (profile) => {
    setUserState(profile);
    return profile;
  };

  // =========================
  // AUTH ACTIONS
  // Each delegates to the active provider, then updates local state with
  // the result directly — not just relying on subscribe() — so callers get
  // the same immediate feedback they always have.
  // =========================

  const register = async (name, email, password) => {
    const profile = await authProvider.register(name, email, password);
    setUserState(profile);
    return profile;
  };

  const login = async (email, password) => {
    const profile = await authProvider.login(email, password);
    setUserState(profile);
    return profile;
  };

  const googleLogin = async (args) => {
    const profile = await authProvider.googleLogin(args);
    setUserState(profile);
    return profile;
  };

  const completeProfile = async (role, fullName) => {
    const profile = await authProvider.completeProfile(role, fullName);
    setUserState(profile);
    return profile;
  };

  const updateProfileDetails = async (profileData) => {
    const profile = await authProvider.updateProfileDetails(profileData);
    setUserState(profile);
    return profile;
  };

  const signOut = async () => {
    await authProvider.signOut();
    setUserState(null);
  };

  const getToken = () => authProvider.getToken();

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {
    user,
    loading,

    register,
    login,
    googleLogin,

    setUser,
    completeProfile,
    updateProfileDetails,

    signOut,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =========================
// HOOK
// =========================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}

export default AuthContext;
