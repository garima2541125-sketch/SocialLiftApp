import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// This screen has been superseded by the sidebar dashboard at /dashboard/create.
// Kept as a redirect so any old links/back-navigation still land somewhere valid.
export default function UserDashboardRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/create');
  }, []);

  return null;
}
