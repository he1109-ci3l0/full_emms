import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Querubin from '../../src/components/Querubin';
import VentanaChat from '../../src/components/VentanaChat';
import { chatStore } from '../../src/lib/chatStore';
import { MORRIS } from '../../src/theme/colores';

export default function TabsLayout() {
  const [chatAbierto, setChatAbierto] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  useEffect(() => {
    chatStore.onActivar((id) => {
      setConvId(id);
      setChatAbierto(true);
    });
    const pendiente = chatStore.consumirPendiente();
    if (pendiente) { setConvId(pendiente); setChatAbierto(true); }
    return () => chatStore.offActivar();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
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

        <Querubin
          visible={!chatAbierto}
          onAbrir={() => setChatAbierto(true)}
        />

        {chatAbierto && (
          <VentanaChat
            onMinimizar={() => setChatAbierto(false)}
            conversacionId={convId}
            onConversacionId={setConvId}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
