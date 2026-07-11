import React, { useEffect, useRef } from 'react';
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

  const xInicio = posGuardada?.x ?? W - tam - MARGEN;
  const yInicio = posGuardada?.y ?? H - tam - TAB_BAR_H - insets.bottom - MARGEN * 2;

  const x = useSharedValue(xInicio);
  const y = useSharedValue(yInicio);
  const xOffset = useSharedValue(0);
  const yOffset = useSharedValue(0);
  const arrastrado = useRef(false);

  useEffect(() => {
    if (posGuardada) {
      x.value = posGuardada.x;
      y.value = posGuardada.y;
    }
  }, [posGuardada]);

  function clampX(v: number) {
    'worklet';
    return Math.max(MARGEN, Math.min(v, W - tam - MARGEN));
  }

  function clampY(v: number) {
    'worklet';
    const yMax = H - tam - TAB_BAR_H - insets.bottom - MARGEN;
    return Math.max(insets.top + MARGEN, Math.min(v, yMax));
  }

  function magnetizar(xActual: number, yActual: number) {
    'worklet';
    const centroX = xActual + tam / 2;
    const xMag = centroX < W / 2 ? MARGEN : W - tam - MARGEN;
    return { xMag, yMag: clampY(yActual) };
  }

  function persistir(xVal: number, yVal: number) {
    guardar.mutate({ ...((preferencias ?? {}) as Record<string, unknown>), querubin: { x: xVal, y: yVal } });
  }

  const pan = Gesture.Pan()
    .onStart(() => {
      arrastrado.current = false;
      xOffset.value = x.value;
      yOffset.value = y.value;
    })
    .onUpdate((e) => {
      arrastrado.current = Math.abs(e.translationX) > 4 || Math.abs(e.translationY) > 4;
      x.value = clampX(xOffset.value + e.translationX);
      y.value = clampY(yOffset.value + e.translationY);
    })
    .onEnd(() => {
      const { xMag, yMag } = magnetizar(x.value, y.value);
      x.value = withSpring(xMag, { damping: 15, stiffness: 180 });
      y.value = withSpring(yMag, { damping: 15, stiffness: 180 });
      runOnJS(persistir)(xMag, yMag);
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (!arrastrado.current) runOnJS(onAbrir)();
  });

  const gesto = Gesture.Simultaneous(pan, tap);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  if (!visible) return null;

  return (
    <GestureDetector gesture={gesto}>
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
