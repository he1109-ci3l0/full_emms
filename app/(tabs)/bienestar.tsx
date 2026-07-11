import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BarraMorris from '../../src/components/BarraMorris';
import FABMono from '../../src/components/FABMono';
import FondoFloral from '../../src/components/FondoFloral';
import ModalFormulario, { estilosCampo } from '../../src/components/ModalFormulario';
import {
  useBorrarEntrenamiento,
  useBorrarSustancia,
  useBorrarSuplemento,
  useCrearEntrenamiento,
  useCrearSustancia,
  useCrearSuplemento,
  useEditarEntrenamiento,
  useEditarSuplemento,
  useEntrenamientos,
  useNutricionDia,
  useNutricionHistorial,
  useSemanaBienestar,
  useSuenoDia,
  useSuenoHistorial,
  useSuplementos,
  useSustancias,
  useAnimoDia,
  useUpsertAnimo,
  useUpsertNutricion,
  useUpsertSueno,
} from '../../src/lib/api/bienestar';
import { useEventos } from '../../src/lib/api/nucleo';
import { ACTIVIDADES_BASE, colorDeActividad } from '../../src/lib/actividades';
import { HIGIENE_SUENO, pctHigiene } from '../../src/lib/higiene_sueno';
import { aISO, lunesDe, formatRangoSemana, sumarDias } from '../../src/lib/fechas';
import { HOJAS, LAVANDA, MORRIS, SUCULENTAS } from '../../src/theme/colores';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import type { Entrenamiento, Suplemento, calcularDuracionSueno, formatDuracion } from '../../src/types/bienestar';
import { calcularDuracionSueno as calcDur, formatDuracion as fmtDur } from '../../src/types/bienestar';

// ── Constantes ─────────────────────────────────────────────────────────────

const ACENTO = HOJAS.salvia;

type Seccion = 'Hoy' | 'Semana' | 'Entrenos' | 'Nutrición' | 'Sueño' | 'Sustancias';
const PILLS: Seccion[] = ['Hoy', 'Semana', 'Entrenos', 'Nutrición', 'Sueño', 'Sustancias'];

const ETIQUETAS_NUT = ['casa', 'fuera', 'orden', 'hambre real', 'por ansiedad', 'hidratada', 'poca hidratación'];
const ANIMO_COLOR = [HOJAS.vino, HOJAS.caramelo, HOJAS.malvaGris, LAVANDA.aqua, HOJAS.salvia];
const ANIMO_LABEL = ['muy mal', 'mal', 'regular', 'bien', 'muy bien'];
const INTENSIDAD_COLOR = [HOJAS.salvia, LAVANDA.aqua, HOJAS.caramelo, SUCULENTAS.malva, HOJAS.vino];

function mesAnioHoy() {
  const h = new Date();
  return { mes: h.getMonth() + 1, anio: h.getFullYear() };
}

function navMes(mes: number, anio: number, d: 1 | -1): { mes: number; anio: number } {
  let m = mes + d; let a = anio;
  if (m > 12) { m = 1; a += 1; } if (m < 1) { m = 12; a -= 1; }
  return { mes: m, anio: a };
}

function mesLabel(mes: number, anio: number): string {
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${MESES[mes - 1]} ${anio}`;
}

// ── PillRow ────────────────────────────────────────────────────────────────

function PillRow<T extends string>({
  opciones, valor, onChange, etiqueta,
}: { opciones: T[]; valor: T; onChange: (v: T) => void; etiqueta?: (v: T) => string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll}>
      <View style={s.pillRow}>
        {opciones.map((o) => (
          <TouchableOpacity key={o} style={[s.pillOpc, valor === o && s.pillOpcActivo]} onPress={() => onChange(o)}>
            <Text style={[s.pillOpcTxt, valor === o && s.pillOpcTxtActivo]}>{etiqueta ? etiqueta(o) : o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function ChipsMulti({ opciones, seleccion, onChange }: { opciones: string[]; seleccion: string[]; onChange: (v: string[]) => void }) {
  return (
    <View style={s.chipsWrap}>
      {opciones.map((o) => {
        const sel = seleccion.includes(o);
        return (
          <TouchableOpacity key={o} style={[s.pillOpc, sel && s.pillOpcActivo]} onPress={() => onChange(sel ? seleccion.filter((x) => x !== o) : [...seleccion, o])}>
            <Text style={[s.pillOpcTxt, sel && s.pillOpcTxtActivo]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Sección HOY ────────────────────────────────────────────────────────────

function SeccionHoy({ onAbrirEntreno }: { onAbrirEntreno: () => void }) {
  const hoy = aISO(new Date());
  const { data: animoHoy } = useAnimoDia(hoy);
  const { data: suenoHoy } = useSuenoDia(hoy);
  const { data: nutHoy } = useNutricionDia(hoy);
  const { data: suplementos = [] } = useSuplementos();
  const { data: eventosHoy = [] } = useEventos({ desde: hoy, hasta: hoy });
  const { data: entrenosHoy = [] } = useEntrenamientos(10);
  const upsertAnimo = useUpsertAnimo();
  const upsertSueno = useUpsertSueno();
  const upsertNut = useUpsertNutricion();
  const crearEntreno = useCrearEntrenamiento();

  const [nivelAnimo, setNivelAnimo] = useState<number>(animoHoy?.nivel ?? 3);
  const [textoAnimo, setTextoAnimo] = useState(animoHoy?.texto ?? '');
  const [horaDormir, setHoraDormir] = useState(suenoHoy?.hora_dormir ?? '');
  const [horaDespertar, setHoraDespertar] = useState(suenoHoy?.hora_despertar ?? '');
  const [calidad, setCalidad] = useState<number>(suenoHoy?.calidad ?? 3);
  const [higiene, setHigiene] = useState<string[]>(suenoHoy?.higiene ?? []);
  const [registroNut, setRegistroNut] = useState(nutHoy?.registro ?? '');
  const [etiqNut, setEtiqNut] = useState<string[]>(nutHoy?.etiquetas ?? []);
  const [supsHoy, setSupsHoy] = useState<string[]>(nutHoy?.suplementos_tomados ?? []);

  React.useEffect(() => {
    setNivelAnimo(animoHoy?.nivel ?? 3);
    setTextoAnimo(animoHoy?.texto ?? '');
  }, [animoHoy]);
  React.useEffect(() => {
    setHoraDormir(suenoHoy?.hora_dormir ?? '');
    setHoraDespertar(suenoHoy?.hora_despertar ?? '');
    setCalidad(suenoHoy?.calidad ?? 3);
    setHigiene(suenoHoy?.higiene ?? []);
  }, [suenoHoy]);
  React.useEffect(() => {
    setRegistroNut(nutHoy?.registro ?? '');
    setEtiqNut(nutHoy?.etiquetas ?? []);
    setSupsHoy(nutHoy?.suplementos_tomados ?? []);
  }, [nutHoy]);

  const guardarAnimo = () => upsertAnimo.mutate({ fecha: hoy, nivel: nivelAnimo, texto: textoAnimo.trim() || null });
  const guardarSueno = () => upsertSueno.mutate({ fecha: hoy, hora_dormir: horaDormir.trim() || null, hora_despertar: horaDespertar.trim() || null, calidad, higiene });
  const guardarNut = () => upsertNut.mutate({ fecha: hoy, registro: registroNut.trim(), etiquetas: etiqNut, suplementos_tomados: supsHoy });

  const entrenosDeHoy = entrenosHoy.filter((e) => e.fecha === hoy);
  const eventosEntreno = eventosHoy.filter((e) => e.tipo === 'entreno');
  const sugeridos = eventosEntreno.filter(
    (ev) => !entrenosDeHoy.some((ent) => ent.notas?.includes(ev.id)),
  );

  const durSueno = calcDur(horaDormir || null, horaDespertar || null);

  const supsActivos = suplementos.filter((s) => s.activo).map((s) => s.nombre);

  return (
    <ScrollView contentContainerStyle={s.seccionPad}>
      {/* Ánimo */}
      <View style={s.card}>
        <Text style={s.cardTit}>¿Cómo me siento hoy?</Text>
        <View style={s.animoRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} style={[s.animoPunto, { backgroundColor: ANIMO_COLOR[n - 1], opacity: nivelAnimo === n ? 1 : 0.35, transform: [{ scale: nivelAnimo === n ? 1.25 : 1 }] }]} onPress={() => setNivelAnimo(n)} />
          ))}
        </View>
        <Text style={s.animoLabel}>{ANIMO_LABEL[nivelAnimo - 1]}</Text>
        <TextInput style={estilosCampo.campo} value={textoAnimo} onChangeText={setTextoAnimo} placeholder="Nota opcional…" placeholderTextColor={MORRIS.salviaMorris} multiline />
        <TouchableOpacity style={s.btnGuardarSec} onPress={guardarAnimo}>
          <Text style={s.btnGuardarSecTxt}>Guardar ánimo</Text>
        </TouchableOpacity>
      </View>

      {/* Sueño */}
      <View style={s.card}>
        <Text style={s.cardTit}>¿Cómo dormí?</Text>
        <View style={s.suenoRow}>
          <View style={{ flex: 1 }}>
            <Text style={estilosCampo.etiqueta}>Me dormí (HH:MM)</Text>
            <TextInput style={estilosCampo.campo} value={horaDormir} onChangeText={setHoraDormir} keyboardType="numeric" placeholder="23:00" placeholderTextColor={MORRIS.salviaMorris} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilosCampo.etiqueta}>Desperté (HH:MM)</Text>
            <TextInput style={estilosCampo.campo} value={horaDespertar} onChangeText={setHoraDespertar} keyboardType="numeric" placeholder="07:00" placeholderTextColor={MORRIS.salviaMorris} />
          </View>
        </View>
        {durSueno != null && (
          <Text style={s.durSueno}>{fmtDur(durSueno)} de sueño</Text>
        )}
        <Text style={estilosCampo.etiqueta}>Calidad</Text>
        <View style={s.animoRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} style={[s.calidadPunto, calidad === n && { borderColor: ACENTO, backgroundColor: ACENTO }]} onPress={() => setCalidad(n)}>
              <Text style={[s.calidadNum, calidad === n && { color: MORRIS.cremaMorris }]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={estilosCampo.etiqueta}>Higiene del sueño</Text>
        <ChipsMulti opciones={[...HIGIENE_SUENO]} seleccion={higiene} onChange={setHigiene} />
        <TouchableOpacity style={s.btnGuardarSec} onPress={guardarSueno}>
          <Text style={s.btnGuardarSecTxt}>Guardar sueño</Text>
        </TouchableOpacity>
      </View>

      {/* Nutrición */}
      <View style={s.card}>
        <Text style={s.cardTit}>¿Cómo comí?</Text>
        <TextInput style={[estilosCampo.campo, { minHeight: 80, textAlignVertical: 'top' }]} value={registroNut} onChangeText={setRegistroNut} placeholder="Desayuno, comida, cena…" placeholderTextColor={MORRIS.salviaMorris} multiline />
        <Text style={estilosCampo.etiqueta}>Etiquetas</Text>
        <ChipsMulti opciones={ETIQUETAS_NUT} seleccion={etiqNut} onChange={setEtiqNut} />
        {supsActivos.length > 0 && (
          <>
            <Text style={estilosCampo.etiqueta}>Suplementos tomados hoy</Text>
            <ChipsMulti opciones={supsActivos} seleccion={supsHoy} onChange={setSupsHoy} />
          </>
        )}
        <TouchableOpacity style={s.btnGuardarSec} onPress={guardarNut}>
          <Text style={s.btnGuardarSecTxt}>Guardar nutrición</Text>
        </TouchableOpacity>
      </View>

      {/* Entreno */}
      <View style={s.card}>
        <Text style={s.cardTit}>¿Entrené hoy?</Text>
        {sugeridos.length > 0 && (
          <>
            <Text style={s.sugeridoTit}>Eventos de entreno hoy — confirmar:</Text>
            {sugeridos.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={s.sugeridoFila}
                onPress={() => crearEntreno.mutate({
                  fecha: hoy,
                  actividad: ev.titulo.replace(/^[Ee]ntreno:?\s*/i, '').trim() || 'entreno',
                  duracion_min: ev.duracion_min ?? 60,
                  lugar: ev.lugar ?? null,
                  intensidad: 3,
                  notas: ev.id,
                })}
              >
                <Text style={s.sugeridoTxt}>{ev.titulo}{ev.hora ? ` · ${ev.hora.slice(0, 5)}` : ''}</Text>
                <Text style={s.sugeridoBtn}>+ Registrar</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {entrenosDeHoy.length > 0 && (
          entrenosDeHoy.map((e) => (
            <Text key={e.id} style={s.entHoyItem}>✓ {e.actividad} · {fmtDur(e.duracion_min)}</Text>
          ))
        )}
        <TouchableOpacity style={[s.btnGuardarSec, { backgroundColor: colorDeActividad('pesas') }]} onPress={onAbrirEntreno}>
          <Text style={s.btnGuardarSecTxt}>+ Registrar entreno</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Sección SEMANA ─────────────────────────────────────────────────────────

function SeccionSemana() {
  const [lunes, setLunes] = useState(() => aISO(lunesDe(new Date())));
  const { data: semana } = useSemanaBienestar(lunes);

  const navSemana = (d: 1 | -1) => {
    const base = new Date(lunes + 'T12:00:00');
    base.setDate(base.getDate() + d * 7);
    setLunes(aISO(lunesDe(base)));
  };

  const actEntradas = semana ? Object.entries(semana.minutosPorActividad).sort((a, b) => b[1] - a[1]) : [];
  const maxMin = actEntradas[0]?.[1] ?? 1;

  return (
    <ScrollView contentContainerStyle={s.seccionPad}>
      <View style={s.navMes}>
        <TouchableOpacity style={s.navBtn} onPress={() => navSemana(-1)}><Text style={s.navBtnTxt}>‹</Text></TouchableOpacity>
        <Text style={s.navMesTxt}>{formatRangoSemana(new Date(lunes + 'T12:00:00'))}</Text>
        <TouchableOpacity style={s.navBtn} onPress={() => navSemana(1)}><Text style={s.navBtnTxt}>›</Text></TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <View style={s.statItem}><Text style={s.statVal}>{semana ? fmtDur(semana.minutosTotales) : '—'}</Text><Text style={s.statEtiq}>entreno</Text></View>
        <View style={s.statItem}><Text style={s.statVal}>{semana?.intensidadMedia ?? '—'}</Text><Text style={s.statEtiq}>intensidad</Text></View>
        <View style={s.statItem}><Text style={s.statVal}>{semana?.promedioAnimo ?? '—'}</Text><Text style={s.statEtiq}>ánimo</Text></View>
        <View style={s.statItem}><Text style={s.statVal}>{semana?.promedioCalidadSueno ?? '—'}</Text><Text style={s.statEtiq}>sueño</Text></View>
      </View>

      {actEntradas.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTit}>Por actividad</Text>
          {actEntradas.map(([act, min]) => (
            <View key={act} style={s.barFila}>
              <Text style={s.barLabel}>{act}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(min / maxMin) * 100}%`, backgroundColor: colorDeActividad(act) }]} />
              </View>
              <Text style={s.barMonto}>{fmtDur(min)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.card}>
        <Text style={s.cardTit}>Registros de la semana</Text>
        <View style={s.registrosFila}>
          <Text style={s.registroItem}>Sueño: {semana?.diasConSueno ?? 0}/7</Text>
          <Text style={s.registroItem}>Ánimo: {semana?.diasConAnimo ?? 0}/7</Text>
          <Text style={s.registroItem}>Nutrición: {semana?.diasConNutricion ?? 0}/7</Text>
        </View>
        {semana && semana.lugaresUsados.length > 0 && (
          <Text style={s.lugaresUsados}>Lugares: {semana.lugaresUsados.join(', ')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

// ── Form Entreno ───────────────────────────────────────────────────────────

function FormEntreno({ visible, editando, onClose }: { visible: boolean; editando: Entrenamiento | null; onClose: () => void }) {
  const crear = useCrearEntrenamiento();
  const editar = useEditarEntrenamiento();
  const hoy = aISO(new Date());

  const [fecha, setFecha] = useState(editando?.fecha ?? hoy);
  const [actividad, setActividad] = useState(editando?.actividad ?? 'pesas');
  const [actLibre, setActLibre] = useState('');
  const [duracion, setDuracion] = useState(editando?.duracion_min?.toString() ?? '');
  const [lugar, setLugar] = useState(editando?.lugar ?? '');
  const [intensidad, setIntensidad] = useState(editando?.intensidad ?? 3);
  const [notas, setNotas] = useState(editando?.notas ?? '');

  React.useEffect(() => {
    setFecha(editando?.fecha ?? hoy);
    setActividad(editando?.actividad ?? 'pesas');
    setActLibre('');
    setDuracion(editando?.duracion_min?.toString() ?? '');
    setLugar(editando?.lugar ?? '');
    setIntensidad(editando?.intensidad ?? 3);
    setNotas(editando?.notas ?? '');
  }, [editando, visible]);

  const actFinal = actLibre.trim() || actividad;

  async function guardar() {
    const datos = { fecha, actividad: actFinal, duracion_min: parseInt(duracion, 10), lugar: lugar.trim() || null, intensidad, notas: notas.trim() || null };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario visible={visible} titulo={editando ? 'Editar entreno' : 'Nuevo entreno'} onGuardar={guardar} onCancelar={onClose} guardando={guardando}>
      <Text style={estilosCampo.etiqueta}>Fecha (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={fecha} onChangeText={setFecha} keyboardType="numeric" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Actividad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll}>
        <View style={s.pillRow}>
          {ACTIVIDADES_BASE.map((a) => (
            <TouchableOpacity key={a.nombre} style={[s.pillOpc, actividad === a.nombre && !actLibre && { backgroundColor: a.color, borderColor: a.color }]} onPress={() => { setActividad(a.nombre); setActLibre(''); }}>
              <Text style={[s.pillOpcTxt, actividad === a.nombre && !actLibre && { color: MORRIS.cremaMorris }]}>{a.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TextInput style={estilosCampo.campo} value={actLibre} onChangeText={setActLibre} placeholder="Otra actividad…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Duración (minutos)</Text>
      <TextInput style={estilosCampo.campo} value={duracion} onChangeText={setDuracion} keyboardType="numeric" placeholder="60" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Lugar (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={lugar} onChangeText={setLugar} placeholder="Gym / Casa…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Intensidad</Text>
      <View style={s.animoRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} style={[s.calidadPunto, intensidad === n && { backgroundColor: INTENSIDAD_COLOR[n - 1], borderColor: INTENSIDAD_COLOR[n - 1] }]} onPress={() => setIntensidad(n)}>
            <Text style={[s.calidadNum, intensidad === n && { color: MORRIS.cremaMorris }]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} placeholder="Observaciones…" placeholderTextColor={MORRIS.salviaMorris} multiline />
    </ModalFormulario>
  );
}

// ── Sección ENTRENOS ───────────────────────────────────────────────────────

function SeccionEntrenos({ showForm, setShowForm, editando, setEditando }: {
  showForm: boolean; setShowForm: (v: boolean) => void;
  editando: Entrenamiento | null; setEditando: (v: Entrenamiento | null) => void;
}) {
  const { data: entrenos = [] } = useEntrenamientos(60);
  const borrar = useBorrarEntrenamiento();

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {entrenos.length === 0 ? (
          <Text style={s.vacio}>sin entrenos registrados</Text>
        ) : (
          entrenos.map((e) => {
            const color = colorDeActividad(e.actividad);
            return (
              <TouchableOpacity key={e.id} style={[s.entCard, { borderLeftColor: color }]} onPress={() => { setEditando(e); setShowForm(true); }}>
                <View style={s.entHeader}>
                  <View style={[s.actDot, { backgroundColor: color }]} />
                  <Text style={s.entActividad}>{e.actividad}</Text>
                  <Text style={s.entDuracion}>{fmtDur(e.duracion_min)}</Text>
                  <View style={[s.intPill, { backgroundColor: INTENSIDAD_COLOR[e.intensidad - 1] }]}>
                    <Text style={s.intPillTxt}>{e.intensidad}</Text>
                  </View>
                </View>
                <Text style={s.entFecha}>{e.fecha}{e.lugar ? ` · ${e.lugar}` : ''}</Text>
                {e.notas && !e.notas.match(/^[0-9a-f-]{36}$/) && <Text style={s.entNotas}>{e.notas}</Text>}
                <TouchableOpacity onPress={() => Alert.alert('Borrar entreno', '¿Eliminar?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(e.id) },
                ])}>
                  <Text style={s.borrarTxt}>borrar</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <FABMono onPress={() => { setEditando(null); setShowForm(true); }} />
    </>
  );
}

// ── Sección NUTRICIÓN ──────────────────────────────────────────────────────

function FormSuplemento({ visible, editando, onClose }: { visible: boolean; editando: Suplemento | null; onClose: () => void }) {
  const crear = useCrearSuplemento();
  const editar = useEditarSuplemento();
  const [nombre, setNombre] = useState(editando?.nombre ?? '');
  const [dosis, setDosis] = useState(editando?.dosis ?? '');
  const [existencias, setExistencias] = useState(editando?.existencias?.toString() ?? '');
  const [recompra, setRecompra] = useState(editando?.recompra_fecha ?? '');
  const [activo, setActivo] = useState(editando?.activo ?? true);

  React.useEffect(() => {
    setNombre(editando?.nombre ?? ''); setDosis(editando?.dosis ?? '');
    setExistencias(editando?.existencias?.toString() ?? ''); setRecompra(editando?.recompra_fecha ?? '');
    setActivo(editando?.activo ?? true);
  }, [editando, visible]);

  async function guardar() {
    const datos = { nombre: nombre.trim(), dosis: dosis.trim() || null, existencias: existencias ? parseInt(existencias, 10) : null, recompra_fecha: recompra.trim() || null, activo };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo={editando ? 'Editar suplemento' : 'Nuevo suplemento'} onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending || editar.isPending}>
      <Text style={estilosCampo.etiqueta}>Nombre</Text>
      <TextInput style={estilosCampo.campo} value={nombre} onChangeText={setNombre} placeholder="Magnesio / Omega 3…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Dosis (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={dosis} onChangeText={setDosis} placeholder="400mg" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Existencias (unidades, opcional)</Text>
      <TextInput style={estilosCampo.campo} value={existencias} onChangeText={setExistencias} keyboardType="numeric" placeholder="30" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha de recompra (AAAA-MM-DD, opcional)</Text>
      <TextInput style={estilosCampo.campo} value={recompra} onChangeText={setRecompra} keyboardType="numeric" placeholder="2026-08-01" placeholderTextColor={MORRIS.salviaMorris} />
      <TouchableOpacity style={s.checkRow} onPress={() => setActivo((v) => !v)}>
        <View style={[s.check, activo && s.checkActivo]} />
        <Text style={s.checkLabel}>Activo</Text>
      </TouchableOpacity>
    </ModalFormulario>
  );
}

function SeccionNutricion() {
  const hoy = aISO(new Date());
  const { data: historial = [] } = useNutricionHistorial();
  const { data: suplementos = [] } = useSuplementos();
  const borrarSup = useBorrarSuplemento();
  const [showFormSup, setShowFormSup] = useState(false);
  const [editandoSup, setEditandoSup] = useState<Suplemento | null>(null);

  const vencidos = suplementos.filter((s) => s.recompra_fecha && s.recompra_fecha <= hoy && s.activo);

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {vencidos.length > 0 && (
          <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: HOJAS.caramelo }]}>
            <Text style={s.cardTit}>Recompra pendiente</Text>
            {vencidos.map((sup) => <Text key={sup.id} style={s.medDosis}>{sup.nombre} · {sup.recompra_fecha}</Text>)}
          </View>
        )}

        <View style={s.card}>
          <View style={s.presHeader}>
            <Text style={s.cardTit}>Suplementos</Text>
            <TouchableOpacity onPress={() => { setEditandoSup(null); setShowFormSup(true); }}>
              <Text style={s.verTodas}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {suplementos.length === 0 ? (
            <Text style={s.vacio}>sin suplementos</Text>
          ) : (
            suplementos.map((sup) => (
              <TouchableOpacity key={sup.id} style={[s.supFila, !sup.activo && { opacity: 0.5 }]} onPress={() => { setEditandoSup(sup); setShowFormSup(true); }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.entActividad}>{sup.nombre}{sup.dosis ? ` · ${sup.dosis}` : ''}</Text>
                  {sup.existencias != null && <Text style={s.entFecha}>{sup.existencias} unidades</Text>}
                  {sup.recompra_fecha && <Text style={[s.entFecha, sup.recompra_fecha <= hoy && { color: HOJAS.caramelo }]}>recompra {sup.recompra_fecha}</Text>}
                </View>
                <TouchableOpacity onPress={() => borrarSup.mutate(sup.id)}>
                  <Text style={s.borrarTxt}>borrar</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={s.cardTit}>Últimos registros</Text>
        {historial.length === 0 ? (
          <Text style={s.vacio}>sin registros</Text>
        ) : (
          historial.map((n) => (
            <View key={n.id} style={s.nutCard}>
              <Text style={s.entFecha}>{n.fecha}</Text>
              <Text style={s.nutRegistro}>{n.registro}</Text>
              {n.etiquetas.length > 0 && <Text style={s.entFecha}>{n.etiquetas.join(' · ')}</Text>}
              {n.suplementos_tomados.length > 0 && <Text style={s.entFecha}>Suplementos: {n.suplementos_tomados.join(', ')}</Text>}
            </View>
          ))
        )}
      </ScrollView>
      <FormSuplemento visible={showFormSup} editando={editandoSup} onClose={() => setShowFormSup(false)} />
    </>
  );
}

// ── Sección SUEÑO ──────────────────────────────────────────────────────────

function SeccionSueno() {
  const { data: historial = [] } = useSuenoHistorial();

  const conCalidad = historial.filter((s) => s.calidad != null);
  const promedioCalidad = conCalidad.length > 0
    ? (conCalidad.reduce((acc, s) => acc + (s.calidad ?? 0), 0) / conCalidad.length).toFixed(1)
    : null;

  const semanaActual = historial.slice(0, 7);
  const pctHig = semanaActual.length > 0
    ? Math.round(semanaActual.reduce((acc, s) => acc + pctHigiene(s.higiene), 0) / semanaActual.length)
    : null;

  return (
    <ScrollView contentContainerStyle={s.seccionPad}>
      <View style={s.statsRow}>
        {promedioCalidad && (
          <View style={s.statItem}><Text style={s.statVal}>{promedioCalidad}</Text><Text style={s.statEtiq}>calidad media</Text></View>
        )}
        {pctHig != null && (
          <View style={s.statItem}><Text style={s.statVal}>{pctHig}%</Text><Text style={s.statEtiq}>higiene 7 días</Text></View>
        )}
      </View>
      {historial.length === 0 ? (
        <Text style={s.vacio}>sin registros de sueño</Text>
      ) : (
        historial.map((reg) => {
          const dur = calcDur(reg.hora_dormir, reg.hora_despertar);
          return (
            <View key={reg.id} style={s.suenoCard}>
              <View style={s.entHeader}>
                <Text style={s.entActividad}>{reg.fecha}</Text>
                {dur != null && <Text style={s.entDuracion}>{fmtDur(dur)}</Text>}
                {reg.calidad != null && (
                  <View style={[s.intPill, { backgroundColor: INTENSIDAD_COLOR[reg.calidad - 1] }]}>
                    <Text style={s.intPillTxt}>{reg.calidad}</Text>
                  </View>
                )}
              </View>
              {(reg.hora_dormir || reg.hora_despertar) && (
                <Text style={s.entFecha}>{reg.hora_dormir?.slice(0, 5) ?? '—'} → {reg.hora_despertar?.slice(0, 5) ?? '—'}</Text>
              )}
              {reg.higiene.length > 0 && (
                <Text style={s.entFecha}>{pctHigiene(reg.higiene)}% higiene</Text>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ── Sección SUSTANCIAS ─────────────────────────────────────────────────────

function FormSustancia({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const crear = useCrearSustancia();
  const hoy = aISO(new Date());
  const [sustancia, setSustancia] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [contexto, setContexto] = useState('');
  const [notas, setNotas] = useState('');
  const [fecha, setFecha] = useState(hoy);

  React.useEffect(() => {
    if (!visible) { setSustancia(''); setCantidad(''); setContexto(''); setNotas(''); setFecha(hoy); }
  }, [visible]);

  async function guardar() {
    await crear.mutateAsync({ sustancia: sustancia.trim(), cantidad: cantidad.trim() || null, contexto_consumo: contexto.trim() || null, notas: notas.trim() || null, fecha });
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo="Registro" onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending}>
      <Text style={estilosCampo.etiqueta}>Sustancia</Text>
      <TextInput style={estilosCampo.campo} value={sustancia} onChangeText={setSustancia} placeholder="—" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Cantidad (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={cantidad} onChangeText={setCantidad} placeholder="—" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Contexto (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={contexto} onChangeText={setContexto} placeholder="—" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} multiline placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={fecha} onChangeText={setFecha} keyboardType="numeric" placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

function SeccionSustancias() {
  const [{ mes, anio }, setMesAnio] = useState(mesAnioHoy);
  const { data: sustancias = [] } = useSustancias(mes, anio);
  const borrar = useBorrarSustancia();
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <View style={s.navMes}>
        <TouchableOpacity style={s.navBtn} onPress={() => setMesAnio((p) => navMes(p.mes, p.anio, -1))}><Text style={s.navBtnTxt}>‹</Text></TouchableOpacity>
        <Text style={s.navMesTxt}>{mesLabel(mes, anio)}</Text>
        <TouchableOpacity style={s.navBtn} onPress={() => setMesAnio((p) => navMes(p.mes, p.anio, 1))}><Text style={s.navBtnTxt}>›</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[s.seccionPad, { paddingTop: 0 }]}>
        {sustancias.length === 0 ? (
          <Text style={s.vacio}>sin registros</Text>
        ) : (
          sustancias.map((sus) => (
            <View key={sus.id} style={s.sustCard}>
              <View style={s.entHeader}>
                <Text style={s.entActividad}>{sus.sustancia}</Text>
                <Text style={s.entFecha}>{sus.fecha}</Text>
              </View>
              {sus.cantidad && <Text style={s.entFecha}>{sus.cantidad}</Text>}
              {sus.contexto_consumo && <Text style={s.entFecha}>{sus.contexto_consumo}</Text>}
              {sus.notas && <Text style={s.nutRegistro}>{sus.notas}</Text>}
              <TouchableOpacity onPress={() => Alert.alert('Borrar registro', '¿Eliminar?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(sus.id) },
              ])}>
                <Text style={s.borrarTxt}>borrar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
      <FABMono onPress={() => setShowForm(true)} />
      <FormSustancia visible={showForm} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function Bienestar() {
  const [seccion, setSeccion] = useState<Seccion>('Hoy');
  const [showFormEntreno, setShowFormEntreno] = useState(false);
  const [editandoEntreno, setEditandoEntreno] = useState<Entrenamiento | null>(null);

  return (
    <FondoFloral>
      <BarraMorris titulo="Bienestar" subtitulo="cuerpo y hábitos" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.navPills}>
        <View style={s.navPillsRow}>
          {PILLS.map((p) => (
            <TouchableOpacity key={p} style={[s.navPill, seccion === p && s.navPillActivo]} onPress={() => setSeccion(p)}>
              <Text style={[s.navPillTxt, seccion === p && s.navPillTxtActivo]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={s.cuerpo}>
        {seccion === 'Hoy'        && <SeccionHoy onAbrirEntreno={() => { setEditandoEntreno(null); setShowFormEntreno(true); }} />}
        {seccion === 'Semana'     && <SeccionSemana />}
        {seccion === 'Entrenos'   && <SeccionEntrenos showForm={showFormEntreno} setShowForm={setShowFormEntreno} editando={editandoEntreno} setEditando={setEditandoEntreno} />}
        {seccion === 'Nutrición'  && <SeccionNutricion />}
        {seccion === 'Sueño'      && <SeccionSueno />}
        {seccion === 'Sustancias' && <SeccionSustancias />}
      </View>

      <FormEntreno visible={showFormEntreno} editando={editandoEntreno} onClose={() => setShowFormEntreno(false)} />
    </FondoFloral>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  navPills: { borderBottomWidth: 1, borderBottomColor: HOJAS.malvaGris, backgroundColor: HOJAS.hueso },
  navPillsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  navPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: ACENTO },
  navPillActivo: { backgroundColor: ACENTO },
  navPillTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: ACENTO },
  navPillTxtActivo: { color: MORRIS.cremaMorris },

  cuerpo: { flex: 1 },
  seccionPad: { padding: 14, paddingBottom: 100, gap: 12 },
  card: { backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 12, padding: 14, gap: 8 },
  cardTit: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.granate },
  vacio: { ...TIPOGRAFIA.firma, fontSize: 18, color: HOJAS.salvia, textAlign: 'center', paddingVertical: 20 },
  borrarTxt: { ...TIPOGRAFIA.firma, fontSize: 14, color: HOJAS.vino },
  verTodas: { ...TIPOGRAFIA.firma, fontSize: 16, color: MORRIS.oliva },
  presHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Ánimo
  animoRow: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  animoPunto: { width: 28, height: 28, borderRadius: 14 },
  animoLabel: { ...TIPOGRAFIA.firma, fontSize: 18, color: MORRIS.tinta, textAlign: 'center' },
  btnGuardarSec: { backgroundColor: ACENTO, borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 4 },
  btnGuardarSecTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.cremaMorris },

  // Sueño
  suenoRow: { flexDirection: 'row', gap: 10 },
  durSueno: { ...TIPOGRAFIA.titulo, fontSize: 18, color: MORRIS.tinta, textAlign: 'center' },
  calidadPunto: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: HOJAS.malvaGris, alignItems: 'center', justifyContent: 'center' },
  calidadNum: { ...TIPOGRAFIA.etiqueta, fontSize: 11, color: MORRIS.tinta },

  // Semana
  navMes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 16, backgroundColor: 'rgba(238,231,225,0.7)' },
  navBtn: { padding: 8 },
  navBtnTxt: { ...TIPOGRAFIA.titulo, fontSize: 22, color: MORRIS.granate },
  navMesTxt: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 12, padding: 14 },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { ...TIPOGRAFIA.titulo, fontSize: 22, color: MORRIS.tinta },
  statEtiq: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  barFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { ...TIPOGRAFIA.cuerpo, fontSize: 11, color: MORRIS.tinta, width: 100 },
  barTrack: { flex: 1, height: 10, backgroundColor: HOJAS.malvaGris, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barMonto: { ...TIPOGRAFIA.cuerpo, fontSize: 11, color: MORRIS.tinta, width: 50, textAlign: 'right' },
  registrosFila: { flexDirection: 'row', justifyContent: 'space-around' },
  registroItem: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },
  lugaresUsados: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },

  // Entrenos
  entCard: { backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12, borderLeftWidth: 4, gap: 4 },
  entHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actDot: { width: 10, height: 10, borderRadius: 5 },
  entActividad: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta, flex: 1 },
  entDuracion: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.salviaMorris },
  entFecha: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },
  entNotas: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.tinta },
  intPill: { borderRadius: 10, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  intPillTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.cremaMorris },

  // Nutrición
  supFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  nutCard: { backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12, gap: 3 },
  nutRegistro: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },

  // Sueño historial
  suenoCard: { backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12, gap: 4 },

  // Sustancias
  sustCard: { backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12, gap: 4 },

  // Hoy — sugeridos
  sugeridoTit: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  sugeridoFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  sugeridoTxt: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta, flex: 1 },
  sugeridoBtn: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: ACENTO },
  entHoyItem: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: HOJAS.salvia },

  // Chip selector
  pillScroll: { marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  pillOpc: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, backgroundColor: SUCULENTAS.crema },
  pillOpcActivo: { backgroundColor: ACENTO, borderColor: ACENTO },
  pillOpcTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.tinta },
  pillOpcTxtActivo: { color: MORRIS.cremaMorris },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },

  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  check: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: HOJAS.malvaGris },
  checkActivo: { backgroundColor: ACENTO, borderColor: ACENTO },
  checkLabel: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },

  medDosis: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.salviaMorris },
});
