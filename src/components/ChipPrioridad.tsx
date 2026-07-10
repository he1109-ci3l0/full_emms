import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HOJAS, SUCULENTAS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';
import type { Prioridad } from '../types/nucleo';

const COLOR: Record<Prioridad, string> = {
  alta:  HOJAS.vino,
  media: HOJAS.caramelo,
  baja:  HOJAS.malvaGris,
};

const ETIQUETA: Record<Prioridad, string> = {
  alta:  'Alta',
  media: 'Media',
  baja:  'Baja',
};

type Props = { prioridad: Prioridad };

export default function ChipPrioridad({ prioridad }: Props) {
  return (
    <View style={[styles.pill, { backgroundColor: COLOR[prioridad] }]}>
      <Text style={styles.texto}>{ETIQUETA[prioridad]}</Text>
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
