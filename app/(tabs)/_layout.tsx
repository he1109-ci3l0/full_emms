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
        },
        tabBarActiveTintColor: MORRIS.cremaMorris,
        tabBarInactiveTintColor: MORRIS.salviaMorris,
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Nobile_500Medium' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Panel', tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="proyectos" options={{ title: 'Proyectos', tabBarIcon: () => null }} />
      <Tabs.Screen name="pendientes" options={{ title: 'Pendientes', tabBarIcon: () => null }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario', tabBarIcon: () => null }} />
      <Tabs.Screen name="finanzas" options={{ title: 'Finanzas', tabBarIcon: () => null }} />
      <Tabs.Screen name="salud" options={{ title: 'Salud', tabBarIcon: () => null }} />
      <Tabs.Screen name="bienestar" options={{ title: 'Bienestar', tabBarIcon: () => null }} />
      <Tabs.Screen name="trabajo" options={{ title: 'Trabajo', tabBarIcon: () => null }} />
    </Tabs>
  );
}
