import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Superseded by the sidebar dashboard — creators now land on their Overview.
export default function UserDashboardRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/overview');
  }, []);

  return null;
}