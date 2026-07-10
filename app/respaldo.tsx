import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FondoFloral from '../src/components/FondoFloral';
import { supabase } from '../src/lib/supabase';
import { HOJAS, MORRIS, SUCULENTAS } from '../src/theme/colores';
import { TIPOGRAFIA } from '../src/theme/tipografia';
import type { ContextoClave, EstadoProyecto, Prioridad, TipoEvento } from '../src/types/nucleo';

type GabineteProyecto = {
  nombre: string;
  contexto: ContextoClave;
  estado: EstadoProyecto;
  nota?: string;
};

type GabinetePendiente = {
  titulo: string;
  contexto: ContextoClave;
  prioridad: Prioridad;
  fecha_limite?: string | null;
  hecho?: boolean;
};

type GabineteEvento = {
  titulo: string;
  fecha: string;
  hora?: string | null;
  duracion_min?: number | null;
  contexto: ContextoClave;
  lugar?: string | null;
  tipo: TipoEvento;
};

type GabineteNota = {
  texto: string;
  contexto: ContextoClave;
  cuando?: string;
};

type GabineteJSON = {
  proyectos?: GabineteProyecto[];
  pendientes?: GabinetePendiente[];
  eventos?: GabineteEvento[];
  notas?: GabineteNota[];
};

type Conteos = { proyectos: number; pendientes: number; eventos: number; notas: number };

async function leerJSON(uri: string): Promise<GabineteJSON> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return res.json() as Promise<GabineteJSON>;
  }
  const file = new File(uri);
  const texto = await file.text();
  return JSON.parse(texto) as GabineteJSON;
}

async function importarGabinete(json: GabineteJSON): Promise<Conteos> {
  const conteos: Conteos = { proyectos: 0, pendientes: 0, eventos: 0, notas: 0 };

  if (json.proyectos?.length) {
    const { data: existentes } = await supabase.from('proyectos').select('nombre');
    const set = new Set((existentes ?? []).map((r: { nombre: string }) => r.nombre));
    const nuevos = json.proyectos
      .filter((p) => !set.has(p.nombre))
      .map(({ nombre, contexto, estado, nota }) => ({
        nombre, contexto, estado, nota: nota ?? null,
      }));
    if (nuevos.length) {
      await supabase.from('proyectos').insert(nuevos);
      conteos.proyectos = nuevos.length;
    }
  }

  if (json.pendientes?.length) {
    const { data: existentes } = await supabase.from('pendientes').select('titulo, fecha_limite');
    const set = new Set(
      (existentes ?? []).map(
        (r: { titulo: string; fecha_limite: string | null }) =>
          `${r.titulo}|${r.fecha_limite ?? ''}`,
      ),
    );
    const nuevos = json.pendientes
      .filter((p) => !set.has(`${p.titulo}|${p.fecha_limite ?? ''}`))
      .map(({ titulo, contexto, prioridad, fecha_limite, hecho }) => ({
        titulo, contexto, prioridad,
        fecha_limite: fecha_limite ?? null,
        hecho: hecho ?? false,
        proyecto_id: null,
      }));
    if (nuevos.length) {
      await supabase.from('pendientes').insert(nuevos);
      conteos.pendientes = nuevos.length;
    }
  }

  if (json.eventos?.length) {
    const { data: existentes } = await supabase.from('eventos').select('titulo, fecha');
    const set = new Set(
      (existentes ?? []).map(
        (r: { titulo: string; fecha: string }) => `${r.titulo}|${r.fecha}`,
      ),
    );
    const nuevos = json.eventos
      .filter((e) => !set.has(`${e.titulo}|${e.fecha}`))
      .map(({ titulo, fecha, hora, duracion_min, contexto, lugar, tipo }) => ({
        titulo, fecha, contexto, tipo,
        hora: hora ?? null,
        duracion_min: duracion_min ?? null,
        lugar: lugar ?? null,
        vinculo_id: null,
      }));
    if (nuevos.length) {
      await supabase.from('eventos').insert(nuevos);
      conteos.eventos = nuevos.length;
    }
  }

  if (json.notas?.length) {
    const { data: existentes } = await supabase.from('notas').select('texto');
    const set = new Set((existentes ?? []).map((r: { texto: string }) => r.texto));
    const nuevas = json.notas
      .filter((n) => !set.has(n.texto))
      .map(({ texto, contexto }) => ({ texto, contexto }));
    if (nuevas.length) {
      await supabase.from('notas').insert(nuevas);
      conteos.notas = nuevas.length;
    }
  }

  return conteos;
}

async function exportarJSON(): Promise<string> {
  const [p, pe, e, n] = await Promise.all([
    supabase.from('proyectos').select('*').order('created_at'),
    supabase.from('pendientes').select('*').order('created_at'),
    supabase.from('eventos').select('*').order('fecha'),
    supabase.from('notas').select('*').order('created_at', { ascending: false }),
  ]);
  return JSON.stringify(
    { proyectos: p.data, pendientes: pe.data, eventos: e.data, notas: n.data },
    null,
    2,
  );
}

export default function Respaldo() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  async function handleImportar() {
    try {
      setCargando(true);
      setMensaje('');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const json = await leerJSON(result.assets[0].uri);
      const conteos = await importarGabinete(json);
      setMensaje(
        `Importado: ${conteos.proyectos} proyectos, ${conteos.pendientes} pendientes, ` +
          `${conteos.eventos} eventos, ${conteos.notas} notas.`,
      );
    } catch (e: unknown) {
      Alert.alert('Error al importar', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function handleExportar() {
    try {
      setCargando(true);
      setMensaje('');
      const jsonStr = await exportarJSON();
      const nombre = `full_emms_${new Date().toISOString().slice(0, 10)}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(url);
        setMensaje('Archivo descargado.');
      } else {
        const file = new File(Paths.cache, nombre);
        file.create({ overwrite: true });
        file.write(jsonStr);
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
        setMensaje('Listo para compartir.');
      }
    } catch (e: unknown) {
      Alert.alert('Error al exportar', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <FondoFloral>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.btnVolver}>
            <Text style={styles.txtVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>Respaldo</Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTit}>Importar del Gabinete</Text>
          <Text style={styles.descripcion}>
            Elige el JSON exportado por el Gabinete HTML. Se insertan solo los registros
            nuevos; una segunda importación no duplica datos.
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnImportar, cargando && styles.btnDisabled]}
            onPress={handleImportar}
            disabled={cargando}
          >
            <Text style={styles.btnTxt}>{cargando ? 'Importando…' : 'Elegir archivo JSON'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTit}>Exportar todo</Text>
          <Text style={styles.descripcion}>
            Descarga un JSON con el contenido completo de proyectos, pendientes, eventos y notas.
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnExportar, cargando && styles.btnDisabled]}
            onPress={handleExportar}
            disabled={cargando}
          >
            <Text style={styles.btnTxt}>{cargando ? 'Exportando…' : 'Exportar JSON'}</Text>
          </TouchableOpacity>
        </View>

        {mensaje ? (
          <View style={styles.mensajeBox}>
            <Text style={styles.mensajeTxt}>{mensaje}</Text>
          </View>
        ) : null}
      </ScrollView>
    </FondoFloral>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  btnVolver: { padding: 4 },
  txtVolver: { ...TIPOGRAFIA.etiqueta, fontSize: 12, color: MORRIS.granate },
  titulo: { ...TIPOGRAFIA.titulo, fontSize: 22, color: MORRIS.granate },
  seccion: {
    backgroundColor: HOJAS.hueso,
    borderRadius: 12,
    borderTopWidth: 4,
    borderTopColor: HOJAS.caramelo,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    padding: 18,
    gap: 12,
  },
  seccionTit: { ...TIPOGRAFIA.titulo, fontSize: 16, color: MORRIS.tinta },
  descripcion: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.oliva, lineHeight: 20 },
  btn: { borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  btnImportar: { backgroundColor: MORRIS.granate },
  btnExportar: { backgroundColor: SUCULENTAS.pizarra },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 12, color: HOJAS.hueso },
  mensajeBox: {
    backgroundColor: 'rgba(238,231,225,0.90)',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: HOJAS.caramelo,
  },
  mensajeTxt: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },
});
