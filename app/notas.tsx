import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FondoFloral from '../src/components/FondoFloral';
import { useBorrarNota, useCrearNota, useNotas } from '../src/lib/api/nucleo';
import { CONTEXTOS_LISTA } from '../src/lib/contextos';
import { HOJAS, MORRIS, SUCULENTAS } from '../src/theme/colores';
import { TIPOGRAFIA } from '../src/theme/tipografia';
import type { ContextoClave, Nota } from '../src/types/nucleo';

export default function NotasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: notas = [] } = useNotas();
  const crear = useCrearNota();
  const borrar = useBorrarNota();

  const [texto, setTexto] = useState('');
  const [contexto, setContexto] = useState<ContextoClave>('personal');

  async function guardar() {
    const trimmed = texto.trim();
    if (!trimmed) return;
    await crear.mutateAsync({ texto: trimmed, contexto });
    setTexto('');
  }

  function confirmarBorrar(nota: Nota) {
    Alert.alert('Borrar nota', '¿Eliminar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => borrar.mutate(nota.id),
      },
    ]);
  }

  return (
    <FondoFloral>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.btnVolver}>
            <Text style={styles.txtVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>Notas</Text>
        </View>

        <View style={styles.captura}>
          <TextInput
            style={styles.textarea}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe una nota…"
            placeholderTextColor={MORRIS.salviaMorris}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.capturaBottom}>
            <View style={styles.ctxRow}>
              {CONTEXTOS_LISTA.map((c) => (
                <TouchableOpacity
                  key={c.clave}
                  style={[styles.ctxPill, contexto === c.clave && styles.ctxPillActivo]}
                  onPress={() => setContexto(c.clave)}
                >
                  <Text style={[styles.ctxTxt, contexto === c.clave && styles.ctxTxtActivo]}>
                    {c.etiqueta}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btnGuardar, (!texto.trim() || crear.isPending) && styles.btnDisabled]}
              onPress={guardar}
              disabled={!texto.trim() || crear.isPending}
            >
              <Text style={styles.btnGuardarTxt}>
                {crear.isPending ? 'Guardando…' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={notas}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.notaCard}>
              <Text style={styles.notaTxt}>{item.texto}</Text>
              <View style={styles.notaFooter}>
                <Text style={styles.notaFecha}>
                  {new Date(item.created_at).toLocaleString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <TouchableOpacity onPress={() => confirmarBorrar(item)}>
                  <Text style={styles.btnBorrar}>Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.vacio}>sin notas aún…</Text>
          }
        />
      </KeyboardAvoidingView>
    </FondoFloral>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: HOJAS.malvaGris,
    gap: 12,
  },
  btnVolver: { padding: 4 },
  txtVolver: { ...TIPOGRAFIA.etiqueta, fontSize: 12, color: MORRIS.granate },
  titulo: { ...TIPOGRAFIA.titulo, fontSize: 20, color: MORRIS.granate },
  captura: {
    margin: 12,
    backgroundColor: HOJAS.hueso,
    borderRadius: 12,
    borderTopWidth: 4,
    borderTopColor: HOJAS.caramelo,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    padding: 12,
    gap: 10,
  },
  textarea: {
    minHeight: 80,
    fontSize: 15,
    color: MORRIS.tinta,
    fontFamily: 'BricolageGrotesque_400Regular',
  },
  capturaBottom: { gap: 8 },
  ctxRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ctxPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    backgroundColor: SUCULENTAS.crema,
  },
  ctxPillActivo: { backgroundColor: MORRIS.granate, borderColor: MORRIS.granate },
  ctxTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.tinta },
  ctxTxtActivo: { color: HOJAS.hueso },
  btnGuardar: {
    backgroundColor: MORRIS.granate,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: 'flex-end',
  },
  btnDisabled: { opacity: 0.5 },
  btnGuardarTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 11, color: MORRIS.cremaMorris },
  lista: { paddingHorizontal: 12, paddingBottom: 40 },
  notaCard: {
    backgroundColor: SUCULENTAS.rosaPalido,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  notaTxt: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },
  notaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notaFecha: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  btnBorrar: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: HOJAS.vino },
  vacio: {
    ...TIPOGRAFIA.firma,
    fontSize: 20,
    color: HOJAS.salvia,
    textAlign: 'center',
    marginTop: 40,
  },
});
