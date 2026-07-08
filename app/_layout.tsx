import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import {
  useFonts,
  Philosopher_700Bold,
} from '@expo-google-fonts/philosopher';
import {
  BricolageGrotesque_400Regular,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Nobile_500Medium,
} from '@expo-google-fonts/nobile';
import {
  Zeyada_400Regular,
} from '@expo-google-fonts/zeyada';
import { supabase } from '../src/lib/supabase';
import { router } from 'expo-router';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Philosopher_700Bold,
    BricolageGrotesque_400Regular,
    Nobile_500Medium,
    Zeyada_400Regular,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      }
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || !ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
