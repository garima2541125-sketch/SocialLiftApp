import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import SocialLiftScreen from '../../../screens/SocialLiftScreen';
import { useAuth } from '../../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role) {
      router.replace(user.role === 'admin' ? '/admin-dashboard' : '/dashboard/create');
    }
  }, [user]);

  return <SocialLiftScreen />;
}