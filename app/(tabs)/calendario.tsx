import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import BarraMorris from '../../src/components/BarraMorris';
import ChipContexto from '../../src/components/ChipContexto';
import ChipTipoEvento from '../../src/components/ChipTipoEvento';
import FABMono from '../../src/components/FABMono';
import FondoFloral from '../../src/components/FondoFloral';
import ModalFormulario, { estilosCampo } from '../../src/components/ModalFormulario';
import {
  useBorrarEvento,
  useCrearEvento,
  useEditarEvento,
  useEventos,
} from '../../src/lib/api/nucleo';
import { CONTEXTOS_LISTA } from '../../src/lib/contextos';
import {
  aISO,
  deFechaISO,
  diasDelGrid,
  diasDeSemana,
  esHoy,
  formatDiaCompleto,
  formatDiaCorto,
  formatMesAnio,
  formatRangoSemana,
  lunesDe,
  nombreDiaAbr,
  rangoMes,
  rangoSemana,
  sumarDias,
  sumarMeses,
} from '../../src/lib/fechas';
import { HOJAS, LAVANDA, MORRIS, SUCULENTAS } from '../../src/theme/colores';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import type { ContextoClave, Evento, TipoEvento } from '../../src/types/nucleo';

type Vista = 'mes' | 'semana' | 'dia';
type TiposEvento = TipoEvento[];
const TIPOS: TiposEvento = ['cita', 'entrevista', 'consulta', 'entreno', 'otro'];
const ETIQUETA_TIPO: Record<TipoEvento, string> = {
  cita: 'Cita', entrevista: 'Entrevista', consulta: 'Consulta',
  entreno: 'Entreno', otro: 'Otro',
};

const ANCHURA = Dimensions.get('window').width;
const COL_DIA_MOVIL = (ANCHURA - 48) / 2.3;

// ── Helpers internos ───────────────────────────────────────────────────────

function agruparPorFecha(eventos: Evento[]): Record<string, Evento[]> {
  const map: Record<string, Evento[]> = {};
  for (const e of eventos) {
    if (!map[e.fecha]) map[e.fecha] = [];
    map[e.fecha].push(e);
  }
  return map;
}

function rangoParaVista(vista: Vista, fechaRef: Date) {
  if (vista === 'mes') {
    const { inicio, fin } = rangoMes(fechaRef);
    const lunes = lunesDe(inicio);
    const finGrid = new Date(fin);
    while (finGrid.getDay() !== 0) finGrid.setDate(finGrid.getDate() + 1);
    return { desde: aISO(lunes), hasta: aISO(finGrid) };
  }
  if (vista === 'semana') {
    const { inicio, fin } = rangoSemana(fechaRef);
    return { desde: aISO(inicio), hasta: aISO(fin) };
  }
  return { desde: aISO(fechaRef), hasta: aISO(fechaRef) };
}

function navAnterior(vista: Vista, fecha: Date): Date {
  if (vista === 'mes') return sumarMeses(fecha, -1);
  if (vista === 'semana') return sumarDias(fecha, -7);
  return sumarDias(fecha, -1);
}

function navSiguiente(vista: Vista, fecha: Date): Date {
  if (vista === 'mes') return sumarMeses(fecha, 1);
  if (vista === 'semana') return sumarDias(fecha, 7);
  return sumarDias(fecha, 1);
}

function labelRango(vista: Vista, fechaRef: Date): string {
  if (vista === 'mes') return formatMesAnio(fechaRef);
  if (vista === 'semana') return formatRangoSemana(fechaRef);
  return formatDiaCompleto(aISO(fechaRef));
}

// ── Formulario de evento ───────────────────────────────────────────────────

type FormEventoProps = {
  visible: boolean;
  fechaInicial: string;
  editando: Evento | null;
  onClose: () => void;
};

function FormEvento({ visible, fechaInicial, editando, onClose }: FormEventoProps) {
  const crear = useCrearEvento();
  const editar = useEditarEvento();
  const borrar = useBorrarEvento();

  const [titulo, setTitulo] = useState(editando?.titulo ?? '');
  const [fecha, setFecha] = useState(editando?.fecha ?? fechaInicial);
  const [hora, setHora] = useState(editando?.hora ?? '');
  const [duracion, setDuracion] = useState(editando?.duracion_min?.toString() ?? '');
  const [tipo, setTipo] = useState<TipoEvento>(editando?.tipo ?? 'otro');
  const [contexto, setContexto] = useState<ContextoClave>(editando?.contexto ?? 'personal');
  const [lugar, setLugar] = useState(editando?.lugar ?? '');

  React.useEffect(() => {
    setTitulo(editando?.titulo ?? '');
    setFecha(editando?.fecha ?? fechaInicial);
    setHora(editando?.hora ?? '');
    setDuracion(editando?.duracion_min?.toString() ?? '');
    setTipo(editando?.tipo ?? 'otro');
    setContexto(editando?.contexto ?? 'personal');
    setLugar(editando?.lugar ?? '');
  }, [editando, fechaInicial, visible]);

  async function guardar() {
    const datos = {
      titulo: titulo.trim(),
      fecha,
      hora: hora.trim() || null,
      duracion_min: duracion ? parseInt(duracion, 10) : null,
      tipo,
      contexto,
      lugar: lugar.trim() || null,
      vinculo_id: null,
    };
    if (editando) {
      await editar.mutateAsync({ id: editando.id, ...datos });
    } else {
      await crear.mutateAsync(datos);
    }
    onClose();
  }

  function handleBorrar() {
    if (!editando) return;
    Alert.alert('Borrar evento', '¿Eliminar este evento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar', style: 'destructive',
        onPress: async () => { await borrar.mutateAsync(editando.id); onClose(); },
      },
    ]);
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario
      visible={visible}
      titulo={editando ? 'Editar evento' : 'Nuevo evento'}
      onGuardar={guardar}
      onCancelar={onClose}
      onBorrar={editando ? handleBorrar : undefined}
      guardando={guardando}
    >
      <Text style={estilosCampo.etiqueta}>Título</Text>
      <TextInput
        style={estilosCampo.campo}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Título del evento"
        placeholderTextColor={MORRIS.salviaMorris}
      />

      <Text style={estilosCampo.etiqueta}>Fecha (AAAA-MM-DD)</Text>
      <TextInput
        style={estilosCampo.campo}
        value={fecha}
        onChangeText={setFecha}
        placeholder="2026-07-15"
        placeholderTextColor={MORRIS.salviaMorris}
        keyboardType="numeric"
      />

      <Text style={estilosCampo.etiqueta}>Hora (HH:MM, opcional)</Text>
      <TextInput
        style={estilosCampo.campo}
        value={hora}
        onChangeText={setHora}
        placeholder="14:30"
        placeholderTextColor={MORRIS.salviaMorris}
        keyboardType="numeric"
      />

      <Text style={estilosCampo.etiqueta}>Duración en minutos (opcional)</Text>
      <TextInput
        style={estilosCampo.campo}
        value={duracion}
        onChangeText={setDuracion}
        placeholder="60"
        placeholderTextColor={MORRIS.salviaMorris}
        keyboardType="numeric"
      />

      <Text style={estilosCampo.etiqueta}>Tipo</Text>
      <View style={s.selectorRow}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.opcion, tipo === t && s.opcionActiva]}
            onPress={() => setTipo(t)}
          >
            <Text style={[s.opcionTxt, tipo === t && s.opcionTxtActivo]}>
              {ETIQUETA_TIPO[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={estilosCampo.etiqueta}>Contexto</Text>
      <View style={s.selectorRow}>
        {CONTEXTOS_LISTA.map((c) => (
          <TouchableOpacity
            key={c.clave}
            style={[s.opcion, contexto === c.clave && s.opcionActiva]}
            onPress={() => setContexto(c.clave)}
          >
            <Text style={[s.opcionTxt, contexto === c.clave && s.opcionTxtActivo]}>
              {c.etiqueta}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={estilosCampo.etiqueta}>Lugar (opcional)</Text>
      <TextInput
        style={estilosCampo.campo}
        value={lugar}
        onChangeText={setLugar}
        placeholder="Lugar del evento"
        placeholderTextColor={MORRIS.salviaMorris}
      />
    </ModalFormulario>
  );
}

// ── Detalle de día ─────────────────────────────────────────────────────────

type DetalleDiaProps = {
  iso: string | null;
  eventos: Evento[];
  onCerrar: () => void;
  onAgregar: (fecha: string) => void;
  onEditar: (e: Evento) => void;
};

function DetalleDia({ iso, eventos, onCerrar, onAgregar, onEditar }: DetalleDiaProps) {
  if (!iso) return null;
  return (
    <Modal visible={!!iso} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={s.backdrop} onPress={onCerrar} />
      <View style={s.detalleCentrar}>
        <View style={s.detalleTarjeta}>
          <Text style={s.detalleFecha}>{formatDiaCompleto(iso)}</Text>
          {eventos.length === 0 ? (
            <Text style={s.detalleVacio}>sin eventos</Text>
          ) : (
            eventos.map((e) => (
              <View key={e.id} style={s.detalleFila}>
                <View style={s.detalleInfo}>
                  {e.hora ? <Text style={s.detalleHora}>{e.hora.slice(0, 5)}</Text> : null}
                  <Text style={s.detalleTit} numberOfLines={2}>{e.titulo}</Text>
                </View>
                <TouchableOpacity onPress={() => { onCerrar(); onEditar(e); }}>
                  <Text style={s.detalleEditarTxt}>✎</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity
            style={s.detalleAgregarBtn}
            onPress={() => { onCerrar(); onAgregar(iso); }}
          >
            <Text style={s.detalleAgregarTxt}>Agregar evento</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Vista Mes ──────────────────────────────────────────────────────────────

const ENCABEZADOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

type VistaMesProps = {
  fechaRef: Date;
  eventosPorFecha: Record<string, Evento[]>;
  onDia: (iso: string) => void;
};

function VistaMes({ fechaRef, eventosPorFecha, onDia }: VistaMesProps) {
  const dias = diasDelGrid(fechaRef);
  const mesActual = fechaRef.getMonth();

  return (
    <View style={s.gridMes}>
      {ENCABEZADOS.map((h) => (
        <View key={h} style={s.encabezadoDia}>
          <Text style={s.encabezadoDiaTxt}>{h}</Text>
        </View>
      ))}
      {dias.map((dia) => {
        const iso = aISO(dia);
        const esMes = dia.getMonth() === mesActual;
        const hoy = esHoy(iso);
        const evs = eventosPorFecha[iso] ?? [];
        const tieneEventos = evs.length > 0;

        return (
          <TouchableOpacity
            key={iso}
            style={[s.celdaMes, hoy && s.celdaHoy]}
            onPress={() => onDia(iso)}
          >
            <Text style={[s.celdaNum, !esMes && s.celdaNumAtenuado, hoy && s.celdaNumHoy]}>
              {dia.getDate()}
            </Text>
            {Platform.OS === 'web' ? (
              evs.slice(0, 2).map((e) => (
                <View key={e.id} style={s.miniPill}>
                  <Text style={s.miniPillTxt} numberOfLines={1}>
                    {e.hora ? `${e.hora.slice(0, 5)} ` : ''}{e.titulo}
                  </Text>
                </View>
              ))
            ) : (
              tieneEventos ? <View style={s.puntito} /> : null
            )}
            {Platform.OS === 'web' && evs.length > 2 ? (
              <Text style={s.masEventos}>+{evs.length - 2} más</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Vista Semana ───────────────────────────────────────────────────────────

type VistaSemanaProps = {
  fechaRef: Date;
  eventosPorFecha: Record<string, Evento[]>;
  onDia: (iso: string) => void;
  onEditar: (e: Evento) => void;
};

function VistaSemana({ fechaRef, eventosPorFecha, onDia, onEditar }: VistaSemanaProps) {
  const dias = diasDeSemana(fechaRef);
  const esMovil = Platform.OS !== 'web';

  const columnas = dias.map((dia) => {
    const iso = aISO(dia);
    const hoy = esHoy(iso);
    const evs = eventosPorFecha[iso] ?? [];
    return { dia, iso, hoy, evs };
  });

  const contenido = (
    <View style={[s.semanaRow, !esMovil && { flexWrap: 'nowrap' }]}>
      {columnas.map(({ dia, iso, hoy, evs }) => (
        <View
          key={iso}
          style={[s.semanaCol, esMovil && { width: COL_DIA_MOVIL }]}
        >
          <TouchableOpacity onPress={() => onDia(iso)} style={[s.semanaEncab, hoy && s.semanaEncabHoy]}>
            <Text style={s.semanaEncabDia}>{nombreDiaAbr(dia)}</Text>
            <Text style={[s.semanaEncabNum, hoy && s.semanaEncabNumHoy]}>{dia.getDate()}</Text>
          </TouchableOpacity>
          {evs.map((e) => (
            <TouchableOpacity key={e.id} style={s.semanaEvento} onPress={() => onEditar(e)}>
              {e.hora ? <Text style={s.semanaHora}>{e.hora.slice(0, 5)}</Text> : null}
              <Text style={s.semanaTit} numberOfLines={2}>{e.titulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  return esMovil ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {contenido}
    </ScrollView>
  ) : contenido;
}

// ── Vista Día ──────────────────────────────────────────────────────────────

type VistaDiaProps = {
  iso: string;
  eventos: Evento[];
  onEditar: (e: Evento) => void;
};

function VistaDia({ iso, eventos, onEditar }: VistaDiaProps) {
  if (eventos.length === 0) {
    return <Text style={s.diaVacio}>día despejado…</Text>;
  }
  return (
    <FlatList
      data={eventos}
      keyExtractor={(e) => e.id}
      contentContainerStyle={s.diaLista}
      renderItem={({ item: e }) => (
        <View style={s.diaFila}>
          <View style={s.diaHoraCol}>
            {e.hora ? (
              <Text style={s.diaHora}>{e.hora.slice(0, 5)}</Text>
            ) : (
              <Text style={s.diaSinHora}>—</Text>
            )}
            {e.duracion_min ? (
              <Text style={s.diaDuracion}>{e.duracion_min} min</Text>
            ) : null}
          </View>
          <TouchableOpacity style={s.diaTarjeta} onPress={() => onEditar(e)}>
            <Text style={s.diaTit}>{e.titulo}</Text>
            <View style={s.diaChips}>
              <ChipContexto contexto={e.contexto} />
              <ChipTipoEvento tipo={e.tipo} />
            </View>
            {e.lugar ? <Text style={s.diaLugar}>📍 {e.lugar}</Text> : null}
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function Calendario() {
  const params = useLocalSearchParams<{ vista?: string }>();
  const reducedMotion = useReducedMotion();

  const [vista, setVista] = useState<Vista>('mes');
  const [fechaRef, setFechaRef] = useState(new Date());
  const [diaDetalle, setDiaDetalle] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formFecha, setFormFecha] = useState(aISO(new Date()));
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (params.vista === 'dia') {
        setVista('dia');
        setFechaRef(new Date());
      }
    }, [params.vista]),
  );

  const rango = useMemo(() => rangoParaVista(vista, fechaRef), [vista, fechaRef]);
  const { data: eventos = [] } = useEventos(rango);
  const eventosPorFecha = useMemo(() => agruparPorFecha(eventos), [eventos]);
  const isoRef = aISO(fechaRef);

  function abrirFormNuevo(fecha?: string) {
    setEventoEditando(null);
    setFormFecha(fecha ?? isoRef);
    setFormVisible(true);
  }

  function abrirFormEditar(e: Evento) {
    setEventoEditando(e);
    setFormFecha(e.fecha);
    setFormVisible(true);
  }

  function abrirDetalle(iso: string) {
    if (vista === 'dia') {
      setFechaRef(deFechaISO(iso));
    } else {
      setDiaDetalle(iso);
    }
  }

  const entering = reducedMotion ? undefined : FadeInDown.duration(200);

  return (
    <FondoFloral>
      <BarraMorris titulo="Calendario" />

      {/* Selector Mes / Semana / Día */}
      <View style={s.selector}>
        {(['mes', 'semana', 'dia'] as Vista[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[s.selectorPill, vista === v && s.selectorPillActivo]}
            onPress={() => setVista(v)}
          >
            <Text style={[s.selectorTxt, vista === v && s.selectorTxtActivo]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navegación */}
      <View style={s.navBar}>
        <TouchableOpacity onPress={() => setFechaRef(navAnterior(vista, fechaRef))} style={s.navBtn}>
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navLabel} numberOfLines={1}>{labelRango(vista, fechaRef)}</Text>
        <TouchableOpacity onPress={() => setFechaRef(navSiguiente(vista, fechaRef))} style={s.navBtn}>
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFechaRef(new Date())} style={s.navHoyBtn}>
          <Text style={s.navHoyTxt}>hoy</Text>
        </TouchableOpacity>
      </View>

      {/* Vista activa */}
      <Animated.View key={vista} entering={entering} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.vistaScroll}>
          {vista === 'mes' && (
            <VistaMes
              fechaRef={fechaRef}
              eventosPorFecha={eventosPorFecha}
              onDia={abrirDetalle}
            />
          )}
          {vista === 'semana' && (
            <VistaSemana
              fechaRef={fechaRef}
              eventosPorFecha={eventosPorFecha}
              onDia={(iso) => { setFechaRef(deFechaISO(iso)); setVista('dia'); }}
              onEditar={abrirFormEditar}
            />
          )}
          {vista === 'dia' && (
            <VistaDia
              iso={isoRef}
              eventos={eventosPorFecha[isoRef] ?? []}
              onEditar={abrirFormEditar}
            />
          )}
        </ScrollView>
      </Animated.View>

      <FABMono onPress={() => abrirFormNuevo()} />

      {/* Detalle de día (desde Vista Mes) */}
      <DetalleDia
        iso={diaDetalle}
        eventos={eventosPorFecha[diaDetalle ?? ''] ?? []}
        onCerrar={() => setDiaDetalle(null)}
        onAgregar={(fecha) => abrirFormNuevo(fecha)}
        onEditar={abrirFormEditar}
      />

      {/* Formulario */}
      <FormEvento
        visible={formVisible}
        fechaInicial={formFecha}
        editando={eventoEditando}
        onClose={() => { setFormVisible(false); setEventoEditando(null); }}
      />
    </FondoFloral>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  selectorPill: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  selectorPillActivo: {
    backgroundColor: LAVANDA.ciruelaOscura,
    borderColor: LAVANDA.ciruelaOscura,
  },
  selectorTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 11, color: MORRIS.tinta },
  selectorTxtActivo: { color: HOJAS.hueso },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
  },
  navBtn: { padding: 6 },
  navArrow: { ...TIPOGRAFIA.titulo, fontSize: 24, color: MORRIS.granate },
  navLabel: { ...TIPOGRAFIA.titulo, fontSize: 15, color: MORRIS.tinta, flex: 1, textAlign: 'center' },
  navHoyBtn: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  navHoyTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.tinta },

  vistaScroll: { flexGrow: 1, paddingBottom: 100 },

  // Mes
  gridMes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    backgroundColor: 'rgba(245,240,228,0.82)',
    borderRadius: 10,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  encabezadoDia: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  encabezadoDiaTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  celdaMes: {
    width: `${100 / 7}%`,
    minHeight: 56,
    padding: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(196,177,178,0.3)',
  },
  celdaHoy: {
    backgroundColor: LAVANDA.celeste,
    borderColor: SUCULENTAS.pizarra,
    borderWidth: 1,
    borderRadius: 4,
  },
  celdaNum: { ...TIPOGRAFIA.titulo, fontSize: 13, color: MORRIS.tinta },
  celdaNumAtenuado: { color: HOJAS.malvaGris },
  celdaNumHoy: { color: SUCULENTAS.pizarra },
  miniPill: {
    backgroundColor: 'rgba(87,112,121,0.15)',
    borderLeftWidth: 2,
    borderLeftColor: SUCULENTAS.pizarra,
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginTop: 2,
  },
  miniPillTxt: { ...TIPOGRAFIA.cuerpo, fontSize: 9, color: MORRIS.tinta },
  masEventos: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: HOJAS.vino, marginTop: 1 },
  puntito: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: HOJAS.vino, marginTop: 3, alignSelf: 'center',
  },

  // Semana
  semanaRow: { flexDirection: 'row', paddingHorizontal: 4 },
  semanaCol: { flex: 1, minWidth: COL_DIA_MOVIL, marginHorizontal: 2 },
  semanaEncab: {
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  semanaEncabHoy: { backgroundColor: LAVANDA.celeste },
  semanaEncabDia: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  semanaEncabNum: { ...TIPOGRAFIA.titulo, fontSize: 16, color: MORRIS.tinta },
  semanaEncabNumHoy: { color: SUCULENTAS.pizarra },
  semanaEvento: {
    backgroundColor: HOJAS.hueso,
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: SUCULENTAS.pizarra,
  },
  semanaHora: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  semanaTit: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.tinta },

  // Día
  diaLista: { padding: 12 },
  diaVacio: { ...TIPOGRAFIA.firma, fontSize: 22, color: HOJAS.salvia, textAlign: 'center', marginTop: 40 },
  diaFila: { flexDirection: 'row', marginBottom: 12, gap: 10 },
  diaHoraCol: { width: 52, alignItems: 'flex-end', paddingTop: 4 },
  diaHora: { ...TIPOGRAFIA.etiqueta, fontSize: 12, color: MORRIS.tinta },
  diaSinHora: { ...TIPOGRAFIA.etiqueta, fontSize: 12, color: HOJAS.malvaGris },
  diaDuracion: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  diaTarjeta: {
    flex: 1,
    backgroundColor: HOJAS.hueso,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    gap: 6,
  },
  diaTit: { ...TIPOGRAFIA.cuerpo, fontSize: 15, color: MORRIS.tinta },
  diaChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  diaLugar: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.oliva },

  // Detalle de día
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(67,67,47,0.45)' },
  detalleCentrar: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  detalleTarjeta: {
    width: '100%', maxWidth: 420,
    backgroundColor: HOJAS.hueso,
    borderRadius: 14,
    borderTopWidth: 4,
    borderTopColor: MORRIS.granate,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
  },
  detalleFecha: { ...TIPOGRAFIA.titulo, fontSize: 17, color: MORRIS.granate },
  detalleVacio: { ...TIPOGRAFIA.firma, fontSize: 18, color: HOJAS.salvia },
  detalleEditarTxt: { fontSize: 18, color: MORRIS.salviaMorris },
  detalleFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: HOJAS.malvaGris,
    gap: 8,
  },
  detalleInfo: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  detalleHora: { ...TIPOGRAFIA.etiqueta, fontSize: 11, color: MORRIS.salviaMorris, minWidth: 36 },
  detalleTit: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta, flex: 1 },
  detalleAgregarBtn: {
    backgroundColor: MORRIS.granate,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  detalleAgregarTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 12, color: MORRIS.cremaMorris },

  // Form selectors
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  opcion: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: HOJAS.malvaGris, backgroundColor: SUCULENTAS.crema,
  },
  opcionActiva: { backgroundColor: MORRIS.granate, borderColor: MORRIS.granate },
  opcionTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.tinta },
  opcionTxtActivo: { color: HOJAS.hueso },
});
