import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HOJAS, MORRIS, SUCULENTAS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';
import type { Pendiente } from '../types/nucleo';
import ChipContexto from './ChipContexto';
import ChipPrioridad from './ChipPrioridad';

type Props = {
  item: Pendiente;
  onToggle: () => void;
  onEditar: () => void;
};

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function estaVencido(fechaIso: string | null, hecho: boolean): boolean {
  if (!fechaIso || hecho) return false;
  return new Date(fechaIso) < new Date(new Date().toDateString());
}

export default function FilaPendiente({ item, onToggle, onEditar }: Props) {
  const vencido = estaVencido(item.fecha_limite, item.hecho);

  return (
    <View style={styles.fila}>
      <TouchableOpacity onPress={onToggle} style={styles.check}>
        <View style={[styles.cuadro, item.hecho && styles.cuadroHecho]}>
          {item.hecho ? <Text style={styles.tick}>✓</Text> : null}
        </View>
      </TouchableOpacity>

      <View style={styles.centro}>
        <Text style={[styles.titulo, item.hecho && styles.tituloHecho]} numberOfLines={2}>
          {item.titulo}
        </Text>
        <View style={styles.chips}>
          <ChipPrioridad prioridad={item.prioridad} />
          <ChipContexto contexto={item.contexto} />
        </View>
        {item.fecha_limite ? (
          <Text style={[styles.fecha, vencido && styles.fechaVencida]}>
            {formatFecha(item.fecha_limite)}
            {vencido ? '  vencido' : ''}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity onPress={onEditar} style={styles.editar}>
        <Text style={styles.editarTxt}>✎</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: HOJAS.hueso,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  check: { paddingTop: 2 },
  cuadro: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: HOJAS.ciruela,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuadroHecho: {
    backgroundColor: HOJAS.ciruela,
  },
  tick: {
    color: HOJAS.hueso,
    fontSize: 13,
    lineHeight: 16,
  },
  centro: { flex: 1, gap: 5 },
  titulo: {
    ...TIPOGRAFIA.cuerpo,
    fontSize: 15,
    color: MORRIS.tinta,
  },
  tituloHecho: {
    textDecorationLine: 'line-through',
    color: SUCULENTAS.salviaClara,
  },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  fecha: {
    ...TIPOGRAFIA.etiqueta,
    fontSize: 10,
    color: MORRIS.tinta,
  },
  fechaVencida: {
    color: HOJAS.vino,
  },
  editar: { paddingLeft: 4, paddingTop: 2 },
  editarTxt: { fontSize: 18, color: MORRIS.salviaMorris },
});
