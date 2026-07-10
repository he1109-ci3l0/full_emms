import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BarraMorris from '../../src/components/BarraMorris';
import FondoFloral from '../../src/components/FondoFloral';
import Tarjeta from '../../src/components/Tarjeta';
import { ACENTOS } from '../../src/theme/acentos';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import { MORRIS } from '../../src/theme/colores';

export default function Bienestar() {
  return (
    <FondoFloral>
      <BarraMorris titulo="Bienestar" />
      <Animated.View entering={FadeInDown} style={styles.cuerpo}>
        <Tarjeta acento={ACENTOS.bienestar} style={styles.tarjeta}>
          <Text style={styles.nombre}>Bienestar</Text>
        </Tarjeta>
      </Animated.View>
    </FondoFloral>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flex: 1, padding: 16 },
  tarjeta: { marginTop: 8 },
  nombre: { ...TIPOGRAFIA.titulo, fontSize: 20, color: MORRIS.tinta },
});
