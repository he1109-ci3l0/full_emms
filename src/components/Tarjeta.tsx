import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { HOJAS } from '../theme/colores';

type Props = {
  acento: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function Tarjeta({ acento, children, style }: Props) {
  return (
    <View style={[styles.base, { borderTopColor: acento }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: HOJAS.hueso,
    borderColor: HOJAS.malvaGris,
    borderWidth: 1,
    borderTopWidth: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
