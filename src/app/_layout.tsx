import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="next" />
          <Stack.Screen name="login" />
          <Stack.Screen name="profile-details" />
          <Stack.Screen name="user-dashboard" />
          <Stack.Screen name="admin-dashboard" />
          <Stack.Screen name="dashboard/create" />
          <Stack.Screen name="dashboard/edit" />
          <Stack.Screen name="dashboard/review-queue" />
          <Stack.Screen name="dashboard/analytics" />
          <Stack.Screen name="dashboard/brand-kit" />
          <Stack.Screen name="dashboard/settings" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}