import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAccionesPendientes,
  useConfirmarAccion,
  useConversaciones,
  useCrearConversacion,
  useEnviarMensaje,
  useMensajes,
  useRechazarAccion,
} from '../lib/api/secretaria';
import { HOJAS, MORRIS, SUCULENTAS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';
import type { Mensaje, Propuesta } from '../types/secretaria';

const W = Dimensions.get('window').width;
const ES_ANCHO = W >= 600;

interface VentanaChatProps {
  onMinimizar: () => void;
  conversacionId: string | null;
  onConversacionId: (id: string) => void;
}

function TarjetaAccion({ propuesta }: { propuesta: Propuesta }) {
  const confirmar = useConfirmarAccion();
  const rechazar = useRechazarAccion();
  const [estado, setEstado] = useState<'pendiente' | 'aplicado' | 'rechazado'>('pendiente');

  return (
    <View style={s.tarjetaAccion}>
      <Text style={s.tarjetaDesc}>{propuesta.descripcion}</Text>
      {estado === 'pendiente' ? (
        <View style={s.tarjetaBtns}>
          <TouchableOpacity
            style={[s.tarjetaBtn, { backgroundColor: MORRIS.granate }]}
            onPress={async () => {
              await confirmar.mutateAsync(propuesta.id);
              setEstado('aplicado');
            }}
          >
            <Text style={s.tarjetaBtnTxt}>Confirmar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tarjetaBtn, { backgroundColor: HOJAS.malvaGris }]}
            onPress={async () => {
              await rechazar.mutateAsync(propuesta.id);
              setEstado('rechazado');
            }}
          >
            <Text style={s.tarjetaBtnTxt}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={[s.tarjetaEstado, { color: estado === 'aplicado' ? HOJAS.salvia : HOJAS.malvaGris }]}>
          {estado === 'aplicado' ? 'aplicado ✓' : 'rechazado'}
        </Text>
      )}
    </View>
  );
}

function BurbujaMensaje({ msg, propuestas }: { msg: Mensaje; propuestas?: Propuesta[] }) {
  const esUsuaria = msg.rol === 'usuaria';
  const hora = new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[s.burbujaWrap, esUsuaria ? s.burbujaWrapDer : s.burbujaWrapIzq]}>
      <View style={[s.burbuja, esUsuaria ? s.burbujaUsuaria : s.burbujaAgente]}>
        <Text style={s.burbujaTxt}>{msg.texto}</Text>
        <Text style={s.burbujaHora}>{hora}</Text>
      </View>
      {propuestas && propuestas.length > 0 && (
        <View style={s.propuestasWrap}>
          {propuestas.map((p) => <TarjetaAccion key={p.id} propuesta={p} />)}
        </View>
      )}
    </View>
  );
}

export default function VentanaChat({ onMinimizar, conversacionId, onConversacionId }: VentanaChatProps) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);

  const { data: conversaciones = [] } = useConversaciones();
  const crearConv = useCrearConversacion();
  const { data: mensajes = [] } = useMensajes(conversacionId);
  const { data: acciones = [] } = useAccionesPendientes();
  const enviar = useEnviarMensaje();

  const propuestasPorMsg = React.useMemo(() => {
    const mapa: Record<string, Propuesta[]> = {};
    return mapa;
  }, [acciones]);

  useEffect(() => {
    if (!conversacionId && conversaciones.length > 0) {
      onConversacionId(conversaciones[0].id);
    }
  }, [conversaciones, conversacionId]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [mensajes]);

  async function asegurarConversacion(): Promise<string> {
    if (conversacionId) return conversacionId;
    const nueva = await crearConv.mutateAsync();
    onConversacionId(nueva.id);
    return nueva.id;
  }

  async function enviarMensaje() {
    const txt = texto.trim();
    if (!txt || enviar.isPending) return;
    setTexto('');
    setEscribiendo(true);
    const convId = await asegurarConversacion();
    const resp = await enviar.mutateAsync({ conversacion_id: convId, mensaje: txt });
    setEscribiendo(false);
    if (resp.propuestas?.length) {
      const ultimo = mensajes[mensajes.length - 1];
      if (ultimo) propuestasPorMsg[ultimo.id] = resp.propuestas;
    }
  }

  async function nuevaConversacion() {
    const nueva = await crearConv.mutateAsync();
    onConversacionId(nueva.id);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[s.ventana, ES_ANCHO && s.ventanaAncha]}
    >
      {/* Encabezado */}
      <View style={s.header}>
        <Image source={require('../../assets/tapiz_morris_barra.jpg')} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={s.headerInner}>
          <Text style={s.headerTit}>Secretaria</Text>
          <View style={s.headerBtns}>
            <TouchableOpacity onPress={nuevaConversacion} style={s.headerBtn}>
              <Text style={s.headerBtnTxt}>nueva</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/chats')} style={s.headerBtn}>
              <Text style={s.headerBtnTxt}>historial</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onMinimizar} style={s.headerBtn}>
              <Text style={s.headerBtnTxt}>—</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mensajes */}
      <ScrollView
        ref={scrollRef}
        style={s.mensajes}
        contentContainerStyle={s.mensajesPad}
        keyboardShouldPersistTaps="handled"
      >
        {mensajes.length === 0 && (
          <Text style={s.vacio}>Hola, ¿en qué te ayudo?</Text>
        )}
        {mensajes.map((msg) => (
          <BurbujaMensaje key={msg.id} msg={msg} propuestas={propuestasPorMsg[msg.id]} />
        ))}
        {escribiendo && (
          <View style={[s.burbujaWrap, s.burbujaWrapIzq]}>
            <View style={[s.burbuja, s.burbujaAgente]}>
              <Text style={[s.burbujaTxt, TIPOGRAFIA.firma]}>escribiendo…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe algo…"
          placeholderTextColor={MORRIS.salviaMorris}
          multiline
          onSubmitEditing={enviarMensaje}
          blurOnSubmit={false}
          returnKeyType="send"
        />
        <TouchableOpacity style={[s.enviarBtn, !texto.trim() && s.enviarBtnDis]} onPress={enviarMensaje} disabled={!texto.trim() || enviar.isPending}>
          <Text style={s.enviarTxt}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  ventana: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: SUCULENTAS.crema,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 998,
    overflow: 'hidden',
  },
  ventanaAncha: {
    left: undefined,
    right: 0,
    width: 380,
    height: '80%',
    borderTopLeftRadius: 20,
  },

  header: {
    height: 52,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(103,45,56,0.45)',
  },
  headerTit: { ...TIPOGRAFIA.titulo, fontSize: 16, color: MORRIS.cremaMorris },
  headerBtns: { flexDirection: 'row', gap: 10 },
  headerBtn: { padding: 4 },
  headerBtnTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.cremaMorris },

  mensajes: { flex: 1 },
  mensajesPad: { padding: 14, gap: 10, paddingBottom: 20 },
  vacio: { ...TIPOGRAFIA.firma, fontSize: 18, color: HOJAS.salvia, textAlign: 'center', paddingVertical: 30 },

  burbujaWrap: { gap: 6 },
  burbujaWrapDer: { alignItems: 'flex-end' },
  burbujaWrapIzq: { alignItems: 'flex-start' },
  burbuja: { maxWidth: '80%', borderRadius: 14, padding: 10, gap: 4 },
  burbujaUsuaria: { backgroundColor: HOJAS.hueso },
  burbujaAgente: { backgroundColor: SUCULENTAS.rosaPalido },
  burbujaTxt: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },
  burbujaHora: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: MORRIS.salviaMorris, textTransform: 'none', letterSpacing: 0 },

  propuestasWrap: { gap: 6, maxWidth: '90%' },
  tarjetaAccion: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: MORRIS.granate,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tarjetaDesc: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },
  tarjetaBtns: { flexDirection: 'row', gap: 8 },
  tarjetaBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  tarjetaBtnTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: '#fff' },
  tarjetaEstado: { ...TIPOGRAFIA.firma, fontSize: 14 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: HOJAS.malvaGris,
    backgroundColor: SUCULENTAS.crema,
  },
  input: {
    flex: 1,
    ...TIPOGRAFIA.cuerpo,
    fontSize: 14,
    color: MORRIS.tinta,
    backgroundColor: HOJAS.hueso,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  enviarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MORRIS.granate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarBtnDis: { opacity: 0.4 },
  enviarTxt: { ...TIPOGRAFIA.titulo, fontSize: 18, color: '#fff' },
});
