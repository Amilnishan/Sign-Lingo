import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { 
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QuestProvider } from '@/contexts/QuestContext';
import { UserProvider, useUser } from '@/contexts/UserContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Inner component so we can use useUser() inside UserProvider */
function InnerLayout() {
  const colorScheme = useColorScheme();
  const { sendHeartbeat, syncProgressToBackend } = useUser();

  // ── Heartbeat: ping backend every 60 s so admin sees "Online" ──
  useEffect(() => {
    // Fire once immediately on mount (only if we have a token)
    const run = async () => {
      const ok = await sendHeartbeat();
      if (ok) syncProgressToBackend(); // also sync streak/weakSigns
    };
    run();
    const id = setInterval(run, 60_000);
    return () => clearInterval(id);
  }, [sendHeartbeat, syncProgressToBackend]);

  return (
    <QuestProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding-step1" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding-step2" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding-step3" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding-step4" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="achievements" options={{ headerShown: false }} />
        <Stack.Screen name="feedback" options={{ headerShown: false }} />
        <Stack.Screen name="learning-stats" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </QuestProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <UserProvider>
      <InnerLayout />
    </UserProvider>
  );
}
