import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ImageBackground } from 'expo-image';

type Props = { children: React.ReactNode };

export default function FondoFloral({ children }: Props) {
  return (
    <ImageBackground
      source={require('../../assets/tapiz_floral.jpg')}
      style={styles.bg}
      contentFit="cover"
    >
      <View style={styles.velo} />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  velo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(234,228,220,0.44)',
  },
});
