import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CONTEXTOS } from '../lib/contextos';
import { SUCULENTAS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';
import type { ContextoClave } from '../types/nucleo';

type Props = { contexto: ContextoClave };

export default function ChipContexto({ contexto }: Props) {
  const { color, etiqueta } = CONTEXTOS[contexto];
  return (
    <View style={[styles.pill, { backgroundColor: color }]}>
      <Text style={styles.texto}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  texto: {
    ...TIPOGRAFIA.etiqueta,
    fontSize: 10,
    color: SUCULENTAS.carbon,
  },
});
