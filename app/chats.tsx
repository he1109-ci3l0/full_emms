import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FondoFloral from '../src/components/FondoFloral';
import { useBuscarChats, useConversaciones } from '../src/lib/api/secretaria';
import { HOJAS, MORRIS, SUCULENTAS } from '../src/theme/colores';
import { TIPOGRAFIA } from '../src/theme/tipografia';
import type { Conversacion } from '../src/types/secretaria';

function formatFechaConv(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Chats() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const hayFiltro = busqueda.length >= 2 || !!(desde || hasta);
  const { data: todas = [] } = useConversaciones();
  const { data: encontradas = [] } = useBuscarChats(busqueda, desde || undefined, hasta || undefined);

  const conversaciones: Conversacion[] = hayFiltro ? encontradas : todas;

  function abrirConversacion(id: string) {
    router.back();
  }

  return (
    <FondoFloral>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.volverBtn}>
          <Text style={s.volverTxt}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={s.titulo}>Historial de chats</Text>
      </View>

      <View style={s.buscadorWrap}>
        <TextInput
          style={s.buscador}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por asunto o mensaje…"
          placeholderTextColor={MORRIS.salviaMorris}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity onPress={() => setMostrarFiltros((v) => !v)} style={s.filtroBtn}>
          <Text style={s.filtroBtnTxt}>{mostrarFiltros ? '▲' : '▼'} fechas</Text>
        </TouchableOpacity>
      </View>

      {mostrarFiltros && (
        <View style={s.fechasWrap}>
          <View style={{ flex: 1 }}>
            <Text style={s.fechaEtiq}>Desde (AAAA-MM-DD)</Text>
            <TextInput
              style={s.fechaInput}
              value={desde}
              onChangeText={setDesde}
              keyboardType="numeric"
              placeholder="2026-01-01"
              placeholderTextColor={MORRIS.salviaMorris}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fechaEtiq}>Hasta (AAAA-MM-DD)</Text>
            <TextInput
              style={s.fechaInput}
              value={hasta}
              onChangeText={setHasta}
              keyboardType="numeric"
              placeholder="2026-12-31"
              placeholderTextColor={MORRIS.salviaMorris}
            />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={[s.lista, { paddingBottom: insets.bottom + 20 }]}>
        {conversaciones.length === 0 ? (
          <Text style={s.vacio}>{hayFiltro ? 'Sin resultados' : 'Sin conversaciones'}</Text>
        ) : (
          conversaciones.map((c) => (
            <TouchableOpacity key={c.id} style={s.convCard} onPress={() => abrirConversacion(c.id)}>
              <View style={s.convHeader}>
                <Text style={s.convAsunto} numberOfLines={1}>{c.asunto}</Text>
                <Text style={s.convFecha}>{formatFechaConv(c.ultima_actividad)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </FondoFloral>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 4,
    backgroundColor: 'rgba(238,231,225,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: HOJAS.malvaGris,
  },
  volverBtn: { paddingVertical: 4 },
  volverTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.granate },
  titulo: { ...TIPOGRAFIA.titulo, fontSize: 20, color: MORRIS.granate },

  buscadorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: 'rgba(238,231,225,0.7)',
  },
  buscador: {
    flex: 1,
    ...TIPOGRAFIA.cuerpo,
    fontSize: 14,
    color: MORRIS.tinta,
    backgroundColor: HOJAS.hueso,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
  },
  filtroBtn: { padding: 8 },
  filtroBtnTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.oliva },

  fechasWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: 'rgba(238,231,225,0.7)',
  },
  fechaEtiq: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: MORRIS.salviaMorris, marginBottom: 4 },
  fechaInput: {
    ...TIPOGRAFIA.cuerpo,
    fontSize: 13,
    color: MORRIS.tinta,
    backgroundColor: HOJAS.hueso,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
  },

  lista: { padding: 14, gap: 10 },
  vacio: { ...TIPOGRAFIA.firma, fontSize: 18, color: HOJAS.salvia, textAlign: 'center', paddingVertical: 40 },

  convCard: {
    backgroundColor: 'rgba(238,231,225,0.85)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  convHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  convAsunto: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.granate, flex: 1 },
  convFecha: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: MORRIS.salviaMorris },
});
