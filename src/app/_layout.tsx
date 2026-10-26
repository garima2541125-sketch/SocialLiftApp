import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '../context/AuthContext';
import { BrandKitProvider } from '../context/BrandKitContext';
import { OwnerDataProvider } from '../context/OwnerDataContext';
import { ThemeProvider as AppThemeProvider } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <OwnerDataProvider>
        <BrandKitProvider>
          <AppThemeProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AnimatedSplashOverlay />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="next" />
                <Stack.Screen name="login" />
                <Stack.Screen name="privacy" />
                <Stack.Screen name="terms" />
                <Stack.Screen name="accept-terms" />
                <Stack.Screen name="profile-details" />
                <Stack.Screen name="user-dashboard" />
                <Stack.Screen name="admin-dashboard" />
                <Stack.Screen name="dashboard/create" />
                <Stack.Screen name="dashboard/review-queue" />
                <Stack.Screen name="dashboard/analytics" />
                <Stack.Screen name="dashboard/brand-kit" />
                <Stack.Screen name="dashboard/settings" />
                <Stack.Screen name="owner/overview" />
                <Stack.Screen name="owner/approvals" />
                <Stack.Screen name="owner/team-seats" />
                <Stack.Screen name="owner/brand-kits" />
                <Stack.Screen name="owner/billing" />
              </Stack>
            </ThemeProvider>
          </AppThemeProvider>
        </BrandKitProvider>
      </OwnerDataProvider>
    </AuthProvider>
  );
}