import { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import SocialLiftScreen from '../../../screens/SocialLiftScreen';
import { useAuth } from '../../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  // Only redirect when this screen is actually the one on screen — it stays
  // mounted underneath /register, /login, etc. (pushed, not replaced), and a
  // plain useEffect on [user] would fire from the background the moment
  // completeProfile()/login() sets a role, stealing navigation away from
  // whatever screen the user is actually looking at (e.g. the Creator DNA
  // onboarding step right after signup).
  useFocusEffect(
    useCallback(() => {
      if (user?.role) {
        router.replace(user.role === 'admin' ? '/admin-dashboard' : '/dashboard/create');
      }
    }, [user])
  );

  return <SocialLiftScreen />;
}