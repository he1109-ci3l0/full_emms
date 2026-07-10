import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
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
  useBorrarCiclo,
  useBorrarMedico,
  useBorrarMedicamento,
  useBorrarPresupuesto,
  useBorrarProcedimiento,
  useBorrarToma,
  useCiclo,
  useCrearCiclo,
  useCrearMedico,
  useCrearMedicamento,
  useCrearPresupuesto,
  useCrearProcedimiento,
  useEditarCiclo,
  useEditarMedico,
  useEditarMedicamento,
  useEditarProcedimiento,
  useMedicos,
  useMedicamentos,
  usePresupuestos,
  useProcedimientos,
  useRegistrarToma,
  useTomas,
  useTomas7Dias,
} from '../../src/lib/api/salud';
import { useCrearEvento } from '../../src/lib/api/nucleo';
import { useCrearMeta } from '../../src/lib/api/finanzas';
import { predecirCiclo } from '../../src/lib/ciclo';
import { aISO } from '../../src/lib/fechas';
import { HOJAS, LAVANDA, MORRIS, SUCULENTAS } from '../../src/theme/colores';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import type { ContextoClave } from '../../src/types/nucleo';
import type {
  Ciclo,
  EstadoProcedimiento,
  Medico,
  Medicamento,
  PresupuestoMedico,
  Procedimiento,
  TipoProcedimiento,
} from '../../src/types/salud';
import { useEventos } from '../../src/lib/api/nucleo';

// ── Constantes ─────────────────────────────────────────────────────────────

const ACENTO = LAVANDA.rosaLavanda;

type Seccion = 'Hoy' | 'Ciclo' | 'Medicamentos' | 'Procedimientos' | 'Médicos';
const PILLS: Seccion[] = ['Hoy', 'Ciclo', 'Medicamentos', 'Procedimientos', 'Médicos'];

const SINTOMAS_CATALOGO = ['cólico', 'migraña', 'fatiga', 'hinchazón', 'cambios de ánimo'];

const TIPOS_PROC: TipoProcedimiento[] = ['cirugia', 'estetica', 'laser', 'podologia', 'dental', 'estudio', 'otro'];
const ESTADOS_PROC: EstadoProcedimiento[] = ['explorando', 'cotizado', 'agendado', 'realizado', 'descartado'];

const ESTADO_COLOR: Record<EstadoProcedimiento, string> = {
  explorando: HOJAS.malvaGris,
  cotizado:   HOJAS.caramelo,
  agendado:   SUCULENTAS.pizarra,
  realizado:  HOJAS.salvia,
  descartado: HOJAS.malvaGris,
};

function formatPeso(n: number): string {
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── PillRow genérico ───────────────────────────────────────────────────────

function PillRow<T extends string>({
  opciones, valor, onChange, etiqueta,
}: { opciones: T[]; valor: T; onChange: (v: T) => void; etiqueta?: (v: T) => string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll}>
      <View style={s.pillRow}>
        {opciones.map((o) => (
          <TouchableOpacity
            key={o}
            style={[s.pillOpc, valor === o && s.pillOpcActivo]}
            onPress={() => onChange(o)}
          >
            <Text style={[s.pillOpcTxt, valor === o && s.pillOpcTxtActivo]}>
              {etiqueta ? etiqueta(o) : o}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Sección HOY ────────────────────────────────────────────────────────────

function SeccionHoy() {
  const hoy = aISO(new Date());
  const { data: medicamentos = [] } = useMedicamentos();
  const { data: tomas = [] } = useTomas(hoy);
  const { data: eventosHoy = [] } = useEventos({ desde: hoy, hasta: hoy });
  const { data: ciclos = [] } = useCiclo();
  const registrarToma = useRegistrarToma();
  const borrarToma = useBorrarToma();

  const activos = medicamentos.filter((m) => m.activo);
  const prediccion = predecirCiclo(ciclos);

  const consultasHoy = eventosHoy.filter((e) => e.tipo === 'consulta');

  return (
    <ScrollView contentContainerStyle={s.seccionPad}>
      {prediccion && (
        <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: ACENTO }]}>
          <Text style={s.cardTit}>Ciclo</Text>
          <Text style={s.cicloPredict}>
            Próximo periodo estimado: {prediccion.proximaFecha}
            {prediccion.diasRestantes >= 0
              ? ` · en ${prediccion.diasRestantes} días`
              : ` · hace ${Math.abs(prediccion.diasRestantes)} días`}
          </Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.cardTit}>Tomas de hoy</Text>
        {activos.length === 0 ? (
          <Text style={s.vacio}>sin medicamentos activos</Text>
        ) : (
          activos.flatMap((med) =>
            med.horarios.map((horario) => {
              const toma = tomas.find(
                (t) => t.medicamento_id === med.id && t.horario === horario,
              );
              return (
                <TouchableOpacity
                  key={`${med.id}-${horario}`}
                  style={s.tomaFila}
                  onPress={() => {
                    if (toma) {
                      borrarToma.mutate({ id: toma.id, fecha: hoy, medicamento_id: med.id });
                    } else {
                      registrarToma.mutate({ medicamento_id: med.id, fecha: hoy, horario, tomada: true });
                    }
                  }}
                >
                  <View style={[s.tomaCheck, toma && s.tomaCheckActivo]}>
                    {toma && <Text style={s.tomaCheckMark}>✓</Text>}
                  </View>
                  <View style={s.tomaInfo}>
                    <Text style={s.tomaMed}>{med.nombre}</Text>
                    <Text style={s.tomaHorario}>{horario} · {med.dosis}</Text>
                  </View>
                </TouchableOpacity>
              );
            }),
          )
        )}
      </View>

      {consultasHoy.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTit}>Consultas de hoy</Text>
          {consultasHoy.map((e) => (
            <View key={e.id} style={s.consultaFila}>
              {e.hora && <Text style={s.consultaHora}>{e.hora.slice(0, 5)}</Text>}
              <Text style={s.consultaTit}>{e.titulo}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Sección CICLO ──────────────────────────────────────────────────────────

const ETIQ_SINT: Record<string, string> = {
  'cólico': 'Cólico', 'migraña': 'Migraña', 'fatiga': 'Fatiga',
  'hinchazón': 'Hinchazón', 'cambios de ánimo': 'Cambios de ánimo',
};

function FormCiclo({ visible, editando, onClose }: { visible: boolean; editando: Ciclo | null; onClose: () => void }) {
  const crear = useCrearCiclo();
  const editar = useEditarCiclo();
  const hoy = aISO(new Date());

  const [fecha, setFecha] = useState(editando?.fecha_inicio ?? hoy);
  const [duracion, setDuracion] = useState(editando?.duracion_dias?.toString() ?? '');
  const [sintomas, setSintomas] = useState<string[]>(editando?.sintomas ?? []);
  const [sintomaLibre, setSintomaLibre] = useState('');
  const [notas, setNotas] = useState(editando?.notas ?? '');

  React.useEffect(() => {
    setFecha(editando?.fecha_inicio ?? hoy);
    setDuracion(editando?.duracion_dias?.toString() ?? '');
    setSintomas(editando?.sintomas ?? []);
    setSintomaLibre('');
    setNotas(editando?.notas ?? '');
  }, [editando, visible]);

  function toggleSintoma(s: string) {
    setSintomas((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function agregarLibre() {
    const s = sintomaLibre.trim();
    if (s && !sintomas.includes(s)) setSintomas((prev) => [...prev, s]);
    setSintomaLibre('');
  }

  async function guardar() {
    const datos = {
      fecha_inicio: fecha.trim(),
      duracion_dias: duracion ? parseInt(duracion, 10) : null,
      sintomas,
      notas: notas.trim() || null,
    };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario
      visible={visible}
      titulo={editando ? 'Editar registro' : 'Registrar periodo'}
      onGuardar={guardar}
      onCancelar={onClose}
      guardando={guardando}
    >
      <Text style={estilosCampo.etiqueta}>Fecha de inicio (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={fecha} onChangeText={setFecha} keyboardType="numeric" placeholderTextColor={MORRIS.salviaMorris} />

      <Text style={estilosCampo.etiqueta}>Duración en días (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={duracion} onChangeText={setDuracion} keyboardType="numeric" placeholder="5" placeholderTextColor={MORRIS.salviaMorris} />

      <Text style={estilosCampo.etiqueta}>Síntomas</Text>
      <View style={s.sintomasGrid}>
        {SINTOMAS_CATALOGO.map((sint) => (
          <TouchableOpacity
            key={sint}
            style={[s.sintomaChip, sintomas.includes(sint) && s.sintomaChipActivo]}
            onPress={() => toggleSintoma(sint)}
          >
            <Text style={[s.sintomaChipTxt, sintomas.includes(sint) && s.sintomaChipTxtActivo]}>
              {ETIQ_SINT[sint] ?? sint}
            </Text>
          </TouchableOpacity>
        ))}
        {sintomas.filter((sint2) => !SINTOMAS_CATALOGO.includes(sint2)).map((sint2) => (
          <TouchableOpacity key={sint2} style={s.sintomaChipActivo} onPress={() => toggleSintoma(sint2)}>
            <Text style={s.sintomaChipTxtActivo}>{sint2}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.libreRow}>
        <TextInput style={[estilosCampo.campo, { flex: 1, marginBottom: 0 }]} value={sintomaLibre} onChangeText={setSintomaLibre} placeholder="Otro síntoma…" placeholderTextColor={MORRIS.salviaMorris} />
        <TouchableOpacity style={s.btnAgregar} onPress={agregarLibre}>
          <Text style={s.btnAgregarTxt}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} placeholder="Observaciones…" placeholderTextColor={MORRIS.salviaMorris} multiline />
    </ModalFormulario>
  );
}

function SeccionCiclo() {
  const { data: ciclos = [] } = useCiclo();
  const borrar = useBorrarCiclo();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Ciclo | null>(null);

  const prediccion = predecirCiclo(ciclos);

  const duraciones = ciclos.filter((c) => c.duracion_dias != null).map((c) => c.duracion_dias as number);
  const promDuracion = duraciones.length > 0
    ? Math.round(duraciones.reduce((s, v) => s + v, 0) / duraciones.length)
    : null;

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        <View style={s.cicloStats}>
          {prediccion && (
            <>
              <View style={s.statItem}>
                <Text style={s.statVal}>{prediccion.promedioIntervalo}</Text>
                <Text style={s.statEtiq}>días promedio</Text>
              </View>
              {promDuracion && (
                <View style={s.statItem}>
                  <Text style={s.statVal}>{promDuracion}</Text>
                  <Text style={s.statEtiq}>días de duración</Text>
                </View>
              )}
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: prediccion.diasRestantes <= 3 ? HOJAS.vino : MORRIS.tinta }]}>
                  {prediccion.diasRestantes >= 0 ? `${prediccion.diasRestantes}d` : 'hoy'}
                </Text>
                <Text style={s.statEtiq}>próximo</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={s.btnRegistrarHoy}
          onPress={() => { setEditando(null); setShowForm(true); }}
        >
          <Text style={s.btnRegistrarHoyTxt}>+ Registrar periodo</Text>
        </TouchableOpacity>

        {ciclos.length === 0 ? (
          <Text style={s.vacio}>sin registros todavía</Text>
        ) : (
          ciclos.map((c, i) => {
            const siguiente = ciclos[i - 1];
            let intervalo: number | null = null;
            if (siguiente) {
              const ms = new Date(siguiente.fecha_inicio).getTime() - new Date(c.fecha_inicio).getTime();
              intervalo = Math.round(ms / (1000 * 60 * 60 * 24));
            }
            return (
              <TouchableOpacity
                key={c.id}
                style={s.cicloFila}
                onPress={() => { setEditando(c); setShowForm(true); }}
              >
                <View style={s.cicloFilaInfo}>
                  <Text style={s.cicloFecha}>{c.fecha_inicio}</Text>
                  <View style={s.cicloMetas}>
                    {c.duracion_dias ? <Text style={s.cicloMeta}>{c.duracion_dias}d duración</Text> : null}
                    {intervalo ? <Text style={s.cicloMeta}>ciclo {intervalo}d</Text> : null}
                  </View>
                  {c.sintomas.length > 0 && (
                    <Text style={s.cicloSintomas}>{c.sintomas.join(' · ')}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Borrar registro', '¿Eliminar?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(c.id) },
                ])}>
                  <Text style={s.borrarTxt}>borrar</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <FormCiclo visible={showForm} editando={editando} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Sección MEDICAMENTOS ───────────────────────────────────────────────────

function AdherenciaPuntos({ medicamentoId }: { medicamentoId: string }) {
  const { data: tomas = [] } = useTomas7Dias(medicamentoId);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return aISO(d);
  });
  return (
    <View style={s.adherenciaRow}>
      {dias.map((fecha) => {
        const tomada = tomas.some((t) => t.fecha === fecha && t.tomada);
        return (
          <View
            key={fecha}
            style={[s.adherenciaPunto, { backgroundColor: tomada ? HOJAS.salvia : HOJAS.vino }]}
          />
        );
      })}
    </View>
  );
}

function FormMedicamento({ visible, editando, onClose }: { visible: boolean; editando: Medicamento | null; onClose: () => void }) {
  const crear = useCrearMedicamento();
  const editar = useEditarMedicamento();

  const [nombre, setNombre] = useState(editando?.nombre ?? '');
  const [dosis, setDosis] = useState(editando?.dosis ?? '');
  const [frecuencia, setFrecuencia] = useState(editando?.frecuencia ?? '');
  const [horarios, setHorarios] = useState<string[]>(editando?.horarios ?? []);
  const [horarioInput, setHorarioInput] = useState('');
  const [activo, setActivo] = useState(editando?.activo ?? true);
  const [motivo, setMotivo] = useState(editando?.motivo ?? '');

  React.useEffect(() => {
    setNombre(editando?.nombre ?? '');
    setDosis(editando?.dosis ?? '');
    setFrecuencia(editando?.frecuencia ?? '');
    setHorarios(editando?.horarios ?? []);
    setHorarioInput('');
    setActivo(editando?.activo ?? true);
    setMotivo(editando?.motivo ?? '');
  }, [editando, visible]);

  function agregarHorario() {
    const h = horarioInput.trim();
    if (h && !horarios.includes(h)) setHorarios((prev) => [...prev, h]);
    setHorarioInput('');
  }

  async function guardar() {
    const datos = {
      nombre: nombre.trim(),
      dosis: dosis.trim(),
      frecuencia: frecuencia.trim(),
      horarios,
      activo,
      motivo: motivo.trim() || null,
    };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario
      visible={visible}
      titulo={editando ? 'Editar medicamento' : 'Nuevo medicamento'}
      onGuardar={guardar}
      onCancelar={onClose}
      guardando={guardando}
    >
      <Text style={estilosCampo.etiqueta}>Nombre</Text>
      <TextInput style={estilosCampo.campo} value={nombre} onChangeText={setNombre} placeholder="Ibuprofeno…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Dosis</Text>
      <TextInput style={estilosCampo.campo} value={dosis} onChangeText={setDosis} placeholder="400mg" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Frecuencia</Text>
      <TextInput style={estilosCampo.campo} value={frecuencia} onChangeText={setFrecuencia} placeholder="cada 8h / diario / según dolor" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Horarios</Text>
      {horarios.map((h) => (
        <View key={h} style={s.horarioFila}>
          <Text style={s.horarioTxt}>{h}</Text>
          <TouchableOpacity onPress={() => setHorarios((prev) => prev.filter((x) => x !== h))}>
            <Text style={s.borrarTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={s.libreRow}>
        <TextInput style={[estilosCampo.campo, { flex: 1, marginBottom: 0 }]} value={horarioInput} onChangeText={setHorarioInput} placeholder="08:00" placeholderTextColor={MORRIS.salviaMorris} keyboardType="numeric" />
        <TouchableOpacity style={s.btnAgregar} onPress={agregarHorario}>
          <Text style={s.btnAgregarTxt}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={estilosCampo.etiqueta}>Motivo (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={motivo} onChangeText={setMotivo} placeholder="Indicación médica…" placeholderTextColor={MORRIS.salviaMorris} />
      <TouchableOpacity style={s.checkRow} onPress={() => setActivo((v) => !v)}>
        <View style={[s.check, activo && s.checkActivo]} />
        <Text style={s.checkLabel}>Activo</Text>
      </TouchableOpacity>
    </ModalFormulario>
  );
}

function SeccionMedicamentos() {
  const { data: medicamentos = [] } = useMedicamentos();
  const borrar = useBorrarMedicamento();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Medicamento | null>(null);

  const activos = medicamentos.filter((m) => m.activo);
  const suspendidos = medicamentos.filter((m) => !m.activo);

  function MedCard({ med }: { med: Medicamento }) {
    return (
      <TouchableOpacity
        style={[s.medCard, !med.activo && s.medSuspendido]}
        onPress={() => { setEditando(med); setShowForm(true); }}
      >
        <View style={s.medHeader}>
          <Text style={[s.medNombre, !med.activo && { color: HOJAS.malvaGris }]}>{med.nombre}</Text>
          {!med.activo && (
            <View style={s.suspendidoPill}>
              <Text style={s.suspendidoTxt}>Suspendido</Text>
            </View>
          )}
        </View>
        <Text style={s.medDosis}>{med.dosis} · {med.frecuencia}</Text>
        {med.horarios.length > 0 && (
          <Text style={s.medHorarios}>{med.horarios.join(', ')}</Text>
        )}
        {med.motivo ? <Text style={s.medMotivo}>{med.motivo}</Text> : null}
        {med.activo && <AdherenciaPuntos medicamentoId={med.id} />}
        <TouchableOpacity onPress={() => Alert.alert('Borrar medicamento', '¿Eliminar?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(med.id) },
        ])}>
          <Text style={[s.borrarTxt, { marginTop: 4 }]}>borrar</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {activos.length === 0 && suspendidos.length === 0 && (
          <Text style={s.vacio}>sin medicamentos registrados</Text>
        )}
        {activos.map((m) => <MedCard key={m.id} med={m} />)}
        {suspendidos.length > 0 && (
          <Text style={[s.cardTit, { marginTop: 8 }]}>Suspendidos</Text>
        )}
        {suspendidos.map((m) => <MedCard key={m.id} med={m} />)}
      </ScrollView>
      <FABMono onPress={() => { setEditando(null); setShowForm(true); }} />
      <FormMedicamento visible={showForm} editando={editando} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Sección PROCEDIMIENTOS ─────────────────────────────────────────────────

function DetalleProcedimiento({ proc, medicos, onClose }: {
  proc: Procedimiento;
  medicos: Medico[];
  onClose: () => void;
}) {
  const { data: presupuestos = [] } = usePresupuestos(proc.id);
  const crearPresupuesto = useCrearPresupuesto();
  const borrarPresupuesto = useBorrarPresupuesto();
  const crearEvento = useCrearEvento();
  const crearMeta = useCrearMeta();

  const [showFormPres, setShowFormPres] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [incluye, setIncluye] = useState('');
  const [vigencia, setVigencia] = useState('');

  const medico = medicos.find((m) => m.id === proc.medico_id);
  const total = presupuestos.reduce((s, p) => s + Number(p.monto), 0);

  async function guardarPresupuesto() {
    const incluyeArr = incluye.split(',').map((x) => x.trim()).filter(Boolean);
    await crearPresupuesto.mutateAsync({
      procedimiento_id: proc.id,
      concepto: concepto.trim(),
      monto: parseFloat(monto),
      incluye: incluyeArr,
      vigencia: vigencia.trim() || null,
    });
    setConcepto(''); setMonto(''); setIncluye(''); setVigencia('');
    setShowFormPres(false);
  }

  async function agendarConsulta() {
    const titulo = `Consulta: ${proc.nombre}`;
    await crearEvento.mutateAsync({
      titulo,
      fecha: aISO(new Date()),
      hora: null,
      duracion_min: null,
      tipo: 'consulta',
      contexto: 'personal' as ContextoClave,
      lugar: medico?.consultorio ?? null,
      vinculo_id: proc.id,
    });
    Alert.alert('Consulta creada', 'Aparecerá en el Calendario.');
  }

  async function crearMetaAhorro() {
    if (total <= 0) { Alert.alert('Sin presupuesto', 'Agrega partidas primero.'); return; }
    await crearMeta.mutateAsync({
      nombre: proc.nombre,
      etiqueta: 'medica',
      monto_objetivo: total,
      monto_actual: 0,
      fecha_objetivo: proc.fecha_tentativa ?? null,
    });
    Alert.alert('Meta creada', 'Aparecerá en Finanzas → Metas.');
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={s.detalleContainer}>
        <View style={s.detalleHeader}>
          <TouchableOpacity onPress={onClose} style={s.detalleBack}>
            <Text style={s.detalleBackTxt}>‹ Volver</Text>
          </TouchableOpacity>
          <Text style={s.detalleTitulo}>{proc.nombre}</Text>
        </View>
        <ScrollView contentContainerStyle={s.seccionPad}>
          <View style={s.card}>
            <View style={[s.estadoPill, { backgroundColor: ESTADO_COLOR[proc.estado], alignSelf: 'flex-start' }]}>
              <Text style={s.estadoPillTxt}>{proc.estado}</Text>
            </View>
            <Text style={s.detalleTipo}>{proc.tipo}</Text>
            {medico && <Text style={s.detalleInfo}>Médico: {medico.nombre} · {medico.especialidad}</Text>}
            {proc.fecha_tentativa && <Text style={s.detalleInfo}>Fecha tentativa: {proc.fecha_tentativa}</Text>}
            {proc.notas && <Text style={s.detalleInfo}>{proc.notas}</Text>}
          </View>

          <View style={s.card}>
            <View style={s.presHeader}>
              <Text style={s.cardTit}>Presupuesto</Text>
              <TouchableOpacity onPress={() => setShowFormPres(true)}>
                <Text style={s.verTodas}>+ Agregar</Text>
              </TouchableOpacity>
            </View>
            {presupuestos.length === 0 ? (
              <Text style={s.vacio}>sin partidas</Text>
            ) : (
              presupuestos.map((p) => (
                <View key={p.id} style={s.presFila}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.presConcepto}>{p.concepto}</Text>
                    {p.incluye.length > 0 && (
                      <Text style={s.presIncluye}>Incluye: {p.incluye.join(', ')}</Text>
                    )}
                    {p.vigencia && <Text style={s.presVigencia}>Vigencia: {p.vigencia}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={s.presMonto}>{formatPeso(Number(p.monto))}</Text>
                    <TouchableOpacity onPress={() => borrarPresupuesto.mutate({ id: p.id, procedimiento_id: proc.id })}>
                      <Text style={s.borrarTxt}>borrar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            {presupuestos.length > 0 && (
              <View style={s.presTotal}>
                <Text style={s.presTotalLbl}>TOTAL</Text>
                <Text style={s.presTotalVal}>{formatPeso(total)}</Text>
              </View>
            )}
          </View>

          <View style={s.accionesCol}>
            <TouchableOpacity style={s.btnAccionGrande} onPress={agendarConsulta}>
              <Text style={s.btnAccionGrandeTxt}>Agendar consulta en Calendario</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnAccionGrande, { backgroundColor: LAVANDA.rosaLavanda }]} onPress={crearMetaAhorro}>
              <Text style={s.btnAccionGrandeTxt}>Crear meta de ahorro en Finanzas</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ModalFormulario
          visible={showFormPres}
          titulo="Nueva partida"
          onGuardar={guardarPresupuesto}
          onCancelar={() => setShowFormPres(false)}
          guardando={crearPresupuesto.isPending}
        >
          <Text style={estilosCampo.etiqueta}>Concepto</Text>
          <TextInput style={estilosCampo.campo} value={concepto} onChangeText={setConcepto} placeholder="Honorarios / Anestesia…" placeholderTextColor={MORRIS.salviaMorris} />
          <Text style={estilosCampo.etiqueta}>Monto</Text>
          <TextInput style={estilosCampo.campo} value={monto} onChangeText={setMonto} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
          <Text style={estilosCampo.etiqueta}>Incluye (separado por comas)</Text>
          <TextInput style={estilosCampo.campo} value={incluye} onChangeText={setIncluye} placeholder="Material, sedación…" placeholderTextColor={MORRIS.salviaMorris} />
          <Text style={estilosCampo.etiqueta}>Vigencia (AAAA-MM-DD, opcional)</Text>
          <TextInput style={estilosCampo.campo} value={vigencia} onChangeText={setVigencia} keyboardType="numeric" placeholder="2026-12-31" placeholderTextColor={MORRIS.salviaMorris} />
        </ModalFormulario>
      </View>
    </Modal>
  );
}

function FormProcedimiento({ visible, editando, medicos, onClose }: {
  visible: boolean;
  editando: Procedimiento | null;
  medicos: Medico[];
  onClose: () => void;
}) {
  const crear = useCrearProcedimiento();
  const editar = useEditarProcedimiento();

  const [nombre, setNombre] = useState(editando?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoProcedimiento>(editando?.tipo ?? 'otro');
  const [medicoId, setMedicoId] = useState(editando?.medico_id ?? '');
  const [estado, setEstado] = useState<EstadoProcedimiento>(editando?.estado ?? 'explorando');
  const [fechaTent, setFechaTent] = useState(editando?.fecha_tentativa ?? '');
  const [notas, setNotas] = useState(editando?.notas ?? '');

  React.useEffect(() => {
    setNombre(editando?.nombre ?? '');
    setTipo(editando?.tipo ?? 'otro');
    setMedicoId(editando?.medico_id ?? '');
    setEstado(editando?.estado ?? 'explorando');
    setFechaTent(editando?.fecha_tentativa ?? '');
    setNotas(editando?.notas ?? '');
  }, [editando, visible]);

  async function guardar() {
    const datos = {
      nombre: nombre.trim(),
      tipo,
      medico_id: medicoId || null,
      estado,
      fecha_tentativa: fechaTent.trim() || null,
      notas: notas.trim() || null,
    };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario
      visible={visible}
      titulo={editando ? 'Editar procedimiento' : 'Nuevo procedimiento'}
      onGuardar={guardar}
      onCancelar={onClose}
      guardando={guardando}
    >
      <Text style={estilosCampo.etiqueta}>Nombre</Text>
      <TextInput style={estilosCampo.campo} value={nombre} onChangeText={setNombre} placeholder="Extracción muela…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Tipo</Text>
      <PillRow opciones={TIPOS_PROC} valor={tipo} onChange={setTipo} />
      <Text style={estilosCampo.etiqueta}>Estado</Text>
      <PillRow opciones={ESTADOS_PROC} valor={estado} onChange={setEstado} />
      {medicos.length > 0 && (
        <>
          <Text style={estilosCampo.etiqueta}>Médico (opcional)</Text>
          <PillRow
            opciones={['', ...medicos.map((m) => m.id)] as string[]}
            valor={medicoId}
            onChange={setMedicoId}
            etiqueta={(id) => id ? (medicos.find((m) => m.id === id)?.nombre ?? id) : '—'}
          />
        </>
      )}
      <Text style={estilosCampo.etiqueta}>Fecha tentativa (AAAA-MM-DD, opcional)</Text>
      <TextInput style={estilosCampo.campo} value={fechaTent} onChangeText={setFechaTent} keyboardType="numeric" placeholder="2026-08-01" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} placeholder="Observaciones…" placeholderTextColor={MORRIS.salviaMorris} multiline />
    </ModalFormulario>
  );
}

function SeccionProcedimientos() {
  const { data: procedimientos = [] } = useProcedimientos();
  const { data: medicos = [] } = useMedicos();
  const borrar = useBorrarProcedimiento();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Procedimiento | null>(null);
  const [detalle, setDetalle] = useState<Procedimiento | null>(null);

  const ORDEN: Record<EstadoProcedimiento, number> = {
    agendado: 0, cotizado: 1, explorando: 2, realizado: 3, descartado: 4,
  };
  const ordenados = [...procedimientos].sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]);

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {ordenados.length === 0 ? (
          <Text style={s.vacio}>sin procedimientos registrados</Text>
        ) : (
          ordenados.map((p) => {
            const medico = medicos.find((m) => m.id === p.medico_id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[s.procCard, { borderLeftColor: ESTADO_COLOR[p.estado], opacity: p.estado === 'descartado' ? 0.45 : 1 }]}
                onPress={() => setDetalle(p)}
              >
                <View style={s.medHeader}>
                  <Text style={s.medNombre}>{p.nombre}</Text>
                  <View style={[s.estadoPill, { backgroundColor: ESTADO_COLOR[p.estado] }]}>
                    <Text style={s.estadoPillTxt}>{p.estado}</Text>
                  </View>
                </View>
                <Text style={s.detalleTipo}>{p.tipo}{medico ? ` · ${medico.nombre}` : ''}</Text>
                {p.fecha_tentativa && <Text style={s.cobFecha}>{p.fecha_tentativa}</Text>}
                <View style={s.cobAcciones}>
                  <TouchableOpacity onPress={() => { setEditando(p); setShowForm(true); }}>
                    <Text style={[s.verTodas, { fontSize: 13 }]}>editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Alert.alert('Borrar procedimiento', '¿Eliminar?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(p.id) },
                  ])}>
                    <Text style={s.borrarTxt}>borrar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <FABMono onPress={() => { setEditando(null); setShowForm(true); }} />
      <FormProcedimiento visible={showForm} editando={editando} medicos={medicos} onClose={() => setShowForm(false)} />
      {detalle && (
        <DetalleProcedimiento proc={detalle} medicos={medicos} onClose={() => setDetalle(null)} />
      )}
    </>
  );
}

// ── Sección MÉDICOS ────────────────────────────────────────────────────────

function FormMedico({ visible, editando, onClose }: { visible: boolean; editando: Medico | null; onClose: () => void }) {
  const crear = useCrearMedico();
  const editar = useEditarMedico();

  const [nombre, setNombre] = useState(editando?.nombre ?? '');
  const [especialidad, setEspecialidad] = useState(editando?.especialidad ?? '');
  const [telefono, setTelefono] = useState(editando?.telefono ?? '');
  const [consultorio, setConsultorio] = useState(editando?.consultorio ?? '');
  const [tarifa, setTarifa] = useState(editando?.tarifa_consulta?.toString() ?? '');
  const [notas, setNotas] = useState(editando?.notas ?? '');

  React.useEffect(() => {
    setNombre(editando?.nombre ?? '');
    setEspecialidad(editando?.especialidad ?? '');
    setTelefono(editando?.telefono ?? '');
    setConsultorio(editando?.consultorio ?? '');
    setTarifa(editando?.tarifa_consulta?.toString() ?? '');
    setNotas(editando?.notas ?? '');
  }, [editando, visible]);

  async function guardar() {
    const datos = {
      nombre: nombre.trim(),
      especialidad: especialidad.trim(),
      telefono: telefono.trim() || null,
      consultorio: consultorio.trim() || null,
      tarifa_consulta: tarifa ? parseFloat(tarifa) : null,
      notas: notas.trim() || null,
    };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario
      visible={visible}
      titulo={editando ? 'Editar médico' : 'Nuevo médico'}
      onGuardar={guardar}
      onCancelar={onClose}
      guardando={guardando}
    >
      <Text style={estilosCampo.etiqueta}>Nombre</Text>
      <TextInput style={estilosCampo.campo} value={nombre} onChangeText={setNombre} placeholder="Dra. García…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Especialidad</Text>
      <TextInput style={estilosCampo.campo} value={especialidad} onChangeText={setEspecialidad} placeholder="Dermatología…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Teléfono (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholder="+52 55 1234 5678" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Consultorio (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={consultorio} onChangeText={setConsultorio} placeholder="Edificio Torre Médica…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Tarifa consulta (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={tarifa} onChangeText={setTarifa} keyboardType="decimal-pad" placeholder="800.00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} placeholder="Observaciones…" placeholderTextColor={MORRIS.salviaMorris} multiline />
    </ModalFormulario>
  );
}

function SeccionMedicos() {
  const { data: medicos = [] } = useMedicos();
  const borrar = useBorrarMedico();
  const crearEvento = useCrearEvento();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Medico | null>(null);

  async function agendarConsulta(m: Medico) {
    await crearEvento.mutateAsync({
      titulo: `Consulta: ${m.nombre}`,
      fecha: aISO(new Date()),
      hora: null,
      duracion_min: null,
      tipo: 'consulta',
      contexto: 'personal' as ContextoClave,
      lugar: m.consultorio ?? null,
      vinculo_id: null,
    });
    Alert.alert('Consulta creada', 'Aparecerá en el Calendario.');
  }

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {medicos.length === 0 ? (
          <Text style={s.vacio}>sin médicos registrados</Text>
        ) : (
          medicos.map((m) => (
            <View key={m.id} style={s.medicoCard}>
              <View style={s.medHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.medNombre}>{m.nombre}</Text>
                  <Text style={s.medDosis}>{m.especialidad}</Text>
                </View>
                {m.tarifa_consulta != null && (
                  <Text style={s.medDosis}>{formatPeso(m.tarifa_consulta)}</Text>
                )}
              </View>
              {m.consultorio && <Text style={s.medMotivo}>{m.consultorio}</Text>}
              {m.notas && <Text style={s.medMotivo}>{m.notas}</Text>}
              <View style={s.cobAcciones}>
                {m.telefono && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${m.telefono}`)}>
                    <Text style={s.verTodas}>{m.telefono}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.btnAccion} onPress={() => agendarConsulta(m)}>
                  <Text style={s.btnAccionTxt}>Agendar consulta</Text>
                </TouchableOpacity>
              </View>
              <View style={s.cobAcciones}>
                <TouchableOpacity onPress={() => { setEditando(m); setShowForm(true); }}>
                  <Text style={s.verTodas}>editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Borrar médico', '¿Eliminar?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(m.id) },
                ])}>
                  <Text style={s.borrarTxt}>borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <FABMono onPress={() => { setEditando(null); setShowForm(true); }} />
      <FormMedico visible={showForm} editando={editando} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function Salud() {
  const [seccion, setSeccion] = useState<Seccion>('Hoy');

  return (
    <FondoFloral>
      <BarraMorris titulo="Salud" subtitulo="cuerpo y bienestar" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.navPills}>
        <View style={s.navPillsRow}>
          {PILLS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.navPill, seccion === p && s.navPillActivo]}
              onPress={() => setSeccion(p)}
            >
              <Text style={[s.navPillTxt, seccion === p && s.navPillTxtActivo]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={s.cuerpo}>
        {seccion === 'Hoy'           && <SeccionHoy />}
        {seccion === 'Ciclo'         && <SeccionCiclo />}
        {seccion === 'Medicamentos'  && <SeccionMedicamentos />}
        {seccion === 'Procedimientos' && <SeccionProcedimientos />}
        {seccion === 'Médicos'       && <SeccionMedicos />}
      </View>
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

  // Hoy
  cicloPredict: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },
  tomaFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 12 },
  tomaCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: ACENTO, alignItems: 'center', justifyContent: 'center' },
  tomaCheckActivo: { backgroundColor: ACENTO },
  tomaCheckMark: { color: MORRIS.cremaMorris, fontSize: 14, fontWeight: '700' },
  tomaInfo: { flex: 1 },
  tomaMed: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },
  tomaHorario: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  consultaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  consultaHora: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.salviaMorris, width: 40 },
  consultaTit: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta, flex: 1 },

  // Ciclo
  cicloStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 12, padding: 14 },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { ...TIPOGRAFIA.titulo, fontSize: 28, color: MORRIS.tinta },
  statEtiq: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  btnRegistrarHoy: { backgroundColor: ACENTO, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnRegistrarHoyTxt: { ...TIPOGRAFIA.titulo, fontSize: 16, color: MORRIS.cremaMorris },
  cicloFila: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12, gap: 8 },
  cicloFilaInfo: { flex: 1, gap: 2 },
  cicloFecha: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta },
  cicloMetas: { flexDirection: 'row', gap: 8 },
  cicloMeta: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  cicloSintomas: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },
  sintomasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  sintomaChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, backgroundColor: SUCULENTAS.crema },
  sintomaChipActivo: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: ACENTO },
  sintomaChipTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.tinta },
  sintomaChipTxtActivo: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.cremaMorris },
  libreRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  btnAgregar: { backgroundColor: ACENTO, borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  btnAgregarTxt: { color: MORRIS.cremaMorris, fontSize: 22, lineHeight: 26 },

  // Medicamentos
  adherenciaRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  adherenciaPunto: { width: 8, height: 8, borderRadius: 4 },
  medCard: { backgroundColor: HOJAS.hueso, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, padding: 14, gap: 4 },
  medSuspendido: { opacity: 0.55 },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  medNombre: { ...TIPOGRAFIA.titulo, fontSize: 15, color: MORRIS.tinta, flex: 1 },
  medDosis: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.salviaMorris },
  medHorarios: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  medMotivo: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },
  suspendidoPill: { backgroundColor: HOJAS.vino, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  suspendidoTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: MORRIS.cremaMorris },
  horarioFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  horarioTxt: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },

  // Procedimientos
  procCard: { backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12, borderLeftWidth: 4, gap: 4 },
  detalleTipo: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  cobFecha: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  cobAcciones: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  estadoPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  estadoPillTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: SUCULENTAS.carbon },
  btnAccion: { backgroundColor: ACENTO, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnAccionTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.cremaMorris },

  // Detalle procedimiento
  detalleContainer: { flex: 1, backgroundColor: HOJAS.hueso },
  detalleHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: HOJAS.malvaGris, gap: 12 },
  detalleBack: { padding: 4 },
  detalleBackTxt: { ...TIPOGRAFIA.titulo, fontSize: 18, color: MORRIS.granate },
  detalleTitulo: { ...TIPOGRAFIA.titulo, fontSize: 17, color: MORRIS.tinta, flex: 1 },
  detalleInfo: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },
  presHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  presFila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: HOJAS.malvaGris },
  presConcepto: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },
  presIncluye: { ...TIPOGRAFIA.cuerpo, fontSize: 11, color: MORRIS.salviaMorris },
  presVigencia: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  presMonto: { ...TIPOGRAFIA.titulo, fontSize: 15, color: MORRIS.tinta },
  presTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1.5, borderTopColor: MORRIS.granate },
  presTotalLbl: { ...TIPOGRAFIA.etiqueta, fontSize: 11, color: MORRIS.granate },
  presTotalVal: { ...TIPOGRAFIA.titulo, fontSize: 18, color: MORRIS.granate },
  accionesCol: { gap: 10 },
  btnAccionGrande: { backgroundColor: SUCULENTAS.pizarra, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnAccionGrandeTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 11, color: MORRIS.cremaMorris },

  // Médicos
  medicoCard: { backgroundColor: HOJAS.hueso, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, padding: 14, gap: 6 },

  // Pill selector (forms)
  pillScroll: { marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  pillOpc: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, backgroundColor: SUCULENTAS.crema },
  pillOpcActivo: { backgroundColor: ACENTO, borderColor: ACENTO },
  pillOpcTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.tinta },
  pillOpcTxtActivo: { color: MORRIS.cremaMorris },

  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  check: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: HOJAS.malvaGris },
  checkActivo: { backgroundColor: ACENTO, borderColor: ACENTO },
  checkLabel: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },
});
