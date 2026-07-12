import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccionesPendientes, useGuardarPreferencia, usePreferencias } from '../lib/api/secretaria';
import { MORRIS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';

const TAM = 76;
const TAM_CHICO = 60;
const MARGEN = 16;
const TAB_BAR_H = 56;

interface QuerbinProps {
  onAbrir: () => void;
  visible: boolean;
}

export default function Querubin({ onAbrir, visible }: QuerbinProps) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = Dimensions.get('window');
  const tam = W < 380 ? TAM_CHICO : TAM;

  const { data: preferencias } = usePreferencias();
  const guardar = useGuardarPreferencia();
  const { data: acciones = [] } = useAccionesPendientes();
  const propuestasPendientes = acciones.length;

  const posGuardada = preferencias?.querubin as { x: number; y: number } | undefined;
  const defaultX = W - tam - MARGEN;
  const defaultY = H - tam - TAB_BAR_H - insets.bottom - MARGEN * 2;

  const x = useSharedValue(posGuardada?.x ?? defaultX);
  const y = useSharedValue(posGuardada?.y ?? defaultY);
  const xOrigen = useSharedValue(posGuardada?.x ?? defaultX);
  const yOrigen = useSharedValue(posGuardada?.y ?? defaultY);

  // Safe area bounds as shared values (stable after mount)
  const safeTop = useSharedValue(insets.top + MARGEN);
  const safeBottom = useSharedValue(H - tam - TAB_BAR_H - insets.bottom - MARGEN);
  const safeLeft = useSharedValue(MARGEN);
  const safeRight = useSharedValue(W - tam - MARGEN);

  useEffect(() => {
    if (posGuardada) {
      x.value = posGuardada.x;
      y.value = posGuardada.y;
      xOrigen.value = posGuardada.x;
      yOrigen.value = posGuardada.y;
    }
  }, [posGuardada]);

  function persistir(xVal: number, yVal: number) {
    guardar.mutate({ ...((preferencias ?? {}) as Record<string, unknown>), querubin: { x: xVal, y: yVal } });
  }

  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      xOrigen.value = x.value;
      yOrigen.value = y.value;
    })
    .onUpdate((e) => {
      'worklet';
      x.value = Math.max(safeLeft.value, Math.min(xOrigen.value + e.translationX, safeRight.value));
      y.value = Math.max(safeTop.value, Math.min(yOrigen.value + e.translationY, safeBottom.value));
    })
    .onEnd((e) => {
      'worklet';
      const fueTap = Math.abs(e.translationX) < 8 && Math.abs(e.translationY) < 8;
      if (fueTap) {
        x.value = withSpring(xOrigen.value, { damping: 18, stiffness: 200 });
        y.value = withSpring(yOrigen.value, { damping: 18, stiffness: 200 });
        runOnJS(onAbrir)();
        return;
      }
      const centroX = x.value + tam / 2;
      const xMag = centroX < safeRight.value / 2 + safeLeft.value / 2 ? safeLeft.value : safeRight.value;
      const yMag = Math.max(safeTop.value, Math.min(y.value, safeBottom.value));
      x.value = withSpring(xMag, { damping: 15, stiffness: 180 });
      y.value = withSpring(yMag, { damping: 15, stiffness: 180 });
      runOnJS(persistir)(xMag, yMag);
    });

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  if (!visible) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[s.burbuja, { width: tam, height: tam, borderRadius: tam / 2 }, estilo]}>
        <Image source={require('../../assets/querubin_chat.jpg')} style={[s.img, { width: tam, height: tam, borderRadius: tam / 2 }]} />
        {propuestasPendientes > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{propuestasPendientes}</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  burbuja: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 4,
    borderColor: MORRIS.granate,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
    overflow: 'hidden',
  },
  img: { resizeMode: 'cover' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: MORRIS.granate,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: '#fff' },
});
