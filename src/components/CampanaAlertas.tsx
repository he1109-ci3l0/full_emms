import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAlertas, useAlertasNoVistas } from '../lib/api/alertas';
import { useGuardarPreferencia, usePreferencias } from '../lib/api/secretaria';
import { HOJAS, MORRIS, SUCULENTAS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';
import type { Alerta } from '../types/alertas';

function formatHora(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function FilaAlerta({ alerta }: { alerta: Alerta }) {
  return (
    <View style={s.filaAlerta}>
      <Text style={s.alertaMsg} numberOfLines={2}>{alerta.mensaje}</Text>
      <Text style={s.alertaHora}>{formatHora(alerta.dispara_en)}</Text>
    </View>
  );
}

export default function CampanaAlertas() {
  const [abierta, setAbierta] = useState(false);
  const { data: alertas = [] } = useAlertas();
  const { data: preferencias } = usePreferencias();
  const guardar = useGuardarPreferencia();

  const vistaHasta = (preferencias?.alertas_vistas_hasta as string | undefined) ?? null;
  const noVistas = useAlertasNoVistas(alertas, vistaHasta);

  function abrir() {
    setAbierta(true);
    // Marcar como vistas
    const ahora = new Date().toISOString();
    guardar.mutate({ ...((preferencias ?? {}) as Record<string, unknown>), alertas_vistas_hasta: ahora });
  }

  return (
    <>
      <TouchableOpacity style={s.campanaBtn} onPress={abrir}>
        <Text style={s.campanaIcon}>🔔</Text>
        {noVistas > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{noVistas > 99 ? '99+' : noVistas}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={abierta} transparent animationType="fade" onRequestClose={() => setAbierta(false)}>
        <Pressable style={s.backdrop} onPress={() => setAbierta(false)} />
        <View style={s.panel}>
          <View style={s.panelHeader}>
            <Text style={s.panelTit}>Alertas recientes</Text>
            <TouchableOpacity onPress={() => setAbierta(false)}>
              <Text style={s.cerrarTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          {alertas.length === 0 ? (
            <Text style={s.vacio}>Sin alertas los últimos 7 días</Text>
          ) : (
            <FlatList
              data={alertas}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => <FilaAlerta alerta={item} />}
              style={s.lista}
              contentContainerStyle={s.listaPad}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  campanaBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  campanaIcon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: MORRIS.granate,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: '#fff' },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(67,67,47,0.35)',
  },
  panel: {
    position: 'absolute',
    top: 80,
    right: 12,
    width: 300,
    maxHeight: 400,
    backgroundColor: HOJAS.hueso,
    borderRadius: 12,
    borderTopWidth: 3,
    borderTopColor: MORRIS.granate,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: HOJAS.malvaGris,
  },
  panelTit: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.granate },
  cerrarTxt: { fontSize: 16, color: MORRIS.salviaMorris, padding: 4 },
  lista: { maxHeight: 340 },
  listaPad: { padding: 12, gap: 10 },
  vacio: { ...TIPOGRAFIA.firma, fontSize: 16, color: HOJAS.salvia, textAlign: 'center', padding: 20 },
  filaAlerta: {
    gap: 3,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HOJAS.malvaGris,
  },
  alertaMsg: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },
  alertaHora: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: MORRIS.salviaMorris },
});
