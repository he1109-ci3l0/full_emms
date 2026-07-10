import React from 'react';
import { Tabs } from 'expo-router';
import { MORRIS } from '../../src/theme/colores';
import { ACENTOS } from '../../src/theme/acentos';

const TAB_ICON: Record<string, string> = {
  index: '⊞',
  proyectos: '◈',
  pendientes: '✓',
  calendario: '◷',
  finanzas: '$',
  salud: '♥',
  bienestar: '❀',
  trabajo: '⌘',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: MORRIS.tinta,
          borderTopColor: MORRIS.granate,
          borderTopWidth: 1,
          height: 48,
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          height: 48,
          paddingVertical: 0,
          justifyContent: 'center',
        },
        tabBarActiveTintColor: MORRIS.cremaMorris,
        tabBarInactiveTintColor: MORRIS.salviaMorris,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Nobile_500Medium',
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarIcon: () => null,
      }}
    >
      <Tabs.Screen name="index"      options={{ title: 'Panel' }} />
      <Tabs.Screen name="proyectos"  options={{ title: 'Proyectos' }} />
      <Tabs.Screen name="pendientes" options={{ title: 'Pendientes' }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="finanzas"   options={{ title: 'Finanzas' }} />
      <Tabs.Screen name="salud"      options={{ title: 'Salud' }} />
      <Tabs.Screen name="bienestar"  options={{ title: 'Bienestar' }} />
      <Tabs.Screen name="trabajo"    options={{ title: 'Trabajo' }} />
    </Tabs>
  );
}
