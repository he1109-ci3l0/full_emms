import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

export async function obtenerTokenWebPush(): Promise<string> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Web Push no está disponible en este navegador');
  }
  const vapidKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error('VAPID key no configurada (EXPO_PUBLIC_VAPID_PUBLIC_KEY)');

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKey,
  });
  return JSON.stringify(sub.toJSON());
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registrarDispositivoAndroid(): Promise<void> {
  if (Platform.OS !== 'android' || !Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await supabase
    .from('dispositivos')
    .upsert({ plataforma: 'android', token, activo: true }, { onConflict: 'user_id,token' });
}

export function tablaATab(tabla: string): string {
  const mapa: Record<string, string> = {
    pendientes: '/(tabs)/pendientes',
    eventos: '/(tabs)/calendario',
    cobranzas: '/(tabs)/finanzas',
    pagos_programados: '/(tabs)/finanzas',
    medicamentos: '/(tabs)/salud',
    suplementos: '/(tabs)/bienestar',
    ciclo: '/(tabs)/salud',
    checkin: '/(tabs)/bienestar',
    entrevistas: '/(tabs)/trabajo',
  };
  return mapa[tabla] ?? '/(tabs)';
}
