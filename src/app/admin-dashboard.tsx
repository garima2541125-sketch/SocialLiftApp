import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// The owner console now lives at /owner/overview (sidebar console with
// Team & Seats, Approvals, Brand Kits, Billing). This route is kept as a
// redirect since login/register still send owners here first.
export default function AdminDashboardRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/owner/overview');
  }, []);

  return null;
}
