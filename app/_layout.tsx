import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Philosopher_700Bold } from '@expo-google-fonts/philosopher';
import { BricolageGrotesque_400Regular } from '@expo-google-fonts/bricolage-grotesque';
import { Nobile_500Medium } from '@expo-google-fonts/nobile';
import { Zeyada_400Regular } from '@expo-google-fonts/zeyada';
import { supabase } from '../src/lib/supabase';
import { MORRIS, HOJAS } from '../src/theme/colores';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Philosopher_700Bold,
    BricolageGrotesque_400Regular,
    Nobile_500Medium,
    Zeyada_400Regular,
  });
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    const inTabs = segments[0] === '(tabs)';
    if (!session && inTabs) {
      router.replace('/login');
    } else if (session && !inTabs) {
      router.replace('/(tabs)/');
    }
  }, [session, segments]);

  return (
    <SafeAreaProvider>
      {(!fontsLoaded || session === undefined) && (
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color={MORRIS.granate} />
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cargando: {
    ...StyleSheet.absoluteFill,
    backgroundColor: HOJAS.hueso,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
