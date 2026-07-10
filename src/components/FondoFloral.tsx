import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ImageBackground } from 'expo-image';

type Props = { children: React.ReactNode };

export default function FondoFloral({ children }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View
        // @ts-ignore — CSS-only props válidos en React Native Web
        style={[styles.bg, styles.webRepeat]}
      >
        <View style={styles.velo} />
        {children}
      </View>
    );
  }

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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const floralUri: string = require('../../assets/tapiz_floral.jpg');

const styles = StyleSheet.create({
  bg: { flex: 1 },
  velo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(234,228,220,0.30)',
  },
  webRepeat: {
    backgroundImage: `url(${floralUri})`,
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
  } as any,
});
