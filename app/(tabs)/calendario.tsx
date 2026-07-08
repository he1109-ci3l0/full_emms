import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BarraMorris from '../../src/components/BarraMorris';
import Tarjeta from '../../src/components/Tarjeta';
import { ACENTOS } from '../../src/theme/acentos';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import { MORRIS } from '../../src/theme/colores';

export default function Calendario() {
  return (
    <View style={styles.contenedor}>
      <BarraMorris titulo="Calendario" />
      <Animated.View entering={FadeInDown} style={styles.cuerpo}>
        <Tarjeta acento={ACENTOS.calendario} style={styles.tarjeta}>
          <Text style={styles.nombre}>Calendario</Text>
        </Tarjeta>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F7F3EE' },
  cuerpo: { flex: 1, padding: 16 },
  tarjeta: { marginTop: 8 },
  nombre: { ...TIPOGRAFIA.titulo, fontSize: 20, color: MORRIS.tinta },
});
