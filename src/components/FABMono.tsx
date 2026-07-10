import React, { useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { HOJAS } from '../theme/colores';

type Props = {
  onPress: () => void;
  tooltip?: string;
};

export default function FABMono({ onPress }: Props) {
  const escala = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(escala, { toValue: 0.9, useNativeDriver: true }).start();
  }

  function onPressOut() {
    Animated.spring(escala, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: escala }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.boton}
      >
        <Image
          source={require('../../assets/mono_copa.jpg')}
          style={styles.imagen}
          contentFit="cover"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  boton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: HOJAS.vino,
    overflow: 'hidden',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
});
