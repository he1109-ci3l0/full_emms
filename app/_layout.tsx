import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Philosopher_700Bold,
} from '@expo-google-fonts/philosopher';
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    }).catch(() => {
      setSession(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || session === undefined) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color={MORRIS.granate} />
      </View>
    );
  }

  if (session === null) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    backgroundColor: HOJAS.hueso,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
