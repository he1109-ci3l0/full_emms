import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HOJAS, LAVANDA, SUCULENTAS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';
import type { TipoEvento } from '../types/nucleo';

const COLOR: Record<TipoEvento, string> = {
  entrevista: SUCULENTAS.pizarra,
  consulta:   LAVANDA.rosaLavanda,
  entreno:    HOJAS.salvia,
  cita:       HOJAS.caramelo,
  otro:       HOJAS.malvaGris,
};

const ETIQUETA: Record<TipoEvento, string> = {
  entrevista: 'Entrevista',
  consulta:   'Consulta',
  entreno:    'Entreno',
  cita:       'Cita',
  otro:       'Otro',
};

type Props = { tipo: TipoEvento };

export default function ChipTipoEvento({ tipo }: Props) {
  return (
    <View style={[styles.pill, { backgroundColor: COLOR[tipo] }]}>
      <Text style={styles.texto}>{ETIQUETA[tipo]}</Text>
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
