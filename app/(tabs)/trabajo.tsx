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
  useBorrarContrato,
  useBorrarEntrevista,
  useContratos,
  useCrearContrato,
  useCrearEntrevista,
  useEditarContrato,
  useEditarEntrevista,
  useEntrevistas,
} from '../../src/lib/api/trabajo';
import { aISO, sumarDias } from '../../src/lib/fechas';
import { HOJAS, MORRIS, SUCULENTAS } from '../../src/theme/colores';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import type { Contrato, Entrevista, EtapaEntrevista } from '../../src/types/trabajo';
import { ETAPAS, siguienteEtapa } from '../../src/types/trabajo';

// ── Constantes ─────────────────────────────────────────────────────────────

const ACENTO = SUCULENTAS.pizarra;

type Seccion = 'Panorama' | 'Contratos' | 'Entrevistas';
const PILLS: Seccion[] = ['Panorama', 'Contratos', 'Entrevistas'];

const TIPO_CONTRATO = ['consultoria', 'nomina', 'proyecto', 'iguala'] as const;
const ESTADO_CONTRATO = ['prospecto', 'activo', 'terminado'] as const;
const PERIODICIDAD = ['hora', 'proyecto', 'mensual'] as const;
const MEDIO_ENTREVISTA = ['presencial', 'videollamada', 'telefonica'] as const;
const RESULTADO_ENTREVISTA = ['pendiente', 'avanzo', 'rechazada', 'oferta_recibida', 'declinada'] as const;

const COLOR_ESTADO: Record<string, string> = {
  prospecto: HOJAS.caramelo,
  activo: HOJAS.salvia,
  terminado: HOJAS.malvaGris,
};

const COLOR_RESULTADO: Record<string, string> = {
  avanzo: HOJAS.salvia,
  pendiente: HOJAS.caramelo,
  rechazada: HOJAS.malvaGris,
  oferta_recibida: MORRIS.granate,
  declinada: HOJAS.malvaGris,
};

// ── PillRow ────────────────────────────────────────────────────────────────

function PillRow<T extends string>({
  opciones, valor, onChange,
}: { opciones: readonly T[]; valor: T; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll}>
      <View style={s.pillRow}>
        {opciones.map((o) => (
          <TouchableOpacity key={o} style={[s.pillOpc, valor === o && s.pillOpcActivo]} onPress={() => onChange(o)}>
            <Text style={[s.pillOpcTxt, valor === o && s.pillOpcTxtActivo]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Sección PANORAMA ───────────────────────────────────────────────────────

function SeccionPanorama({ onAbrirContrato, onAbrirEntrevista }: {
  onAbrirContrato: () => void;
  onAbrirEntrevista: () => void;
}) {
  const { data: contratos = [] } = useContratos();
  const { data: entrevistas = [] } = useEntrevistas();
  const hoy = aISO(new Date());
  const enSieteDias = aISO(sumarDias(new Date(), 7));

  const activos = contratos.filter((c) => c.estado === 'activo');
  const proximas = entrevistas.filter((e) => e.fecha >= hoy && e.fecha <= enSieteDias);
  const ofertas = entrevistas.filter((e) => e.resultado === 'oferta_recibida');

  return (
    <ScrollView contentContainerStyle={s.seccionPad}>
      <View style={s.statsRow}>
        <View style={s.statItem}><Text style={s.statVal}>{activos.length}</Text><Text style={s.statEtiq}>contratos activos</Text></View>
        <View style={s.statItem}><Text style={s.statVal}>{proximas.length}</Text><Text style={s.statEtiq}>entrevistas esta semana</Text></View>
        <View style={s.statItem}><Text style={s.statVal}>{ofertas.length}</Text><Text style={s.statEtiq}>ofertas abiertas</Text></View>
      </View>

      {activos.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTit}>Actualmente contratada</Text>
          {activos.map((c) => (
            <View key={c.id} style={s.panFila}>
              <Text style={s.panCliente}>{c.cliente}</Text>
              <Text style={s.panRol}>{c.rol} · {c.tipo}</Text>
              {c.tarifa != null && (
                <Text style={s.panTarifa}>${c.tarifa.toLocaleString()} / {c.periodicidad_tarifa}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {proximas.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTit}>Entrevistas esta semana</Text>
          {proximas.map((e) => (
            <View key={e.id} style={s.panFila}>
              <Text style={s.panCliente}>{e.empresa}</Text>
              <Text style={s.panRol}>{e.puesto} · {e.etapa}</Text>
              <Text style={s.panTarifa}>{e.fecha}{e.hora ? ` · ${e.hora.slice(0, 5)}` : ''} · {e.medio}</Text>
            </View>
          ))}
        </View>
      )}

      {activos.length === 0 && proximas.length === 0 && (
        <Text style={s.vacio}>sin contratos activos ni entrevistas próximas</Text>
      )}

      <View style={s.panBtns}>
        <TouchableOpacity style={[s.panBtn, { backgroundColor: COLOR_ESTADO.activo }]} onPress={onAbrirContrato}>
          <Text style={s.panBtnTxt}>+ Contrato</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.panBtn, { backgroundColor: ACENTO }]} onPress={onAbrirEntrevista}>
          <Text style={s.panBtnTxt}>+ Entrevista</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Form Contrato ──────────────────────────────────────────────────────────

function FormContrato({ visible, editando, onClose }: { visible: boolean; editando: Contrato | null; onClose: () => void }) {
  const crear = useCrearContrato();
  const editar = useEditarContrato();
  const hoy = aISO(new Date());

  const [cliente, setCliente] = useState(editando?.cliente ?? '');
  const [rol, setRol] = useState(editando?.rol ?? '');
  const [tipo, setTipo] = useState<typeof TIPO_CONTRATO[number]>(editando?.tipo ?? 'consultoria');
  const [inicio, setInicio] = useState(editando?.inicio ?? hoy);
  const [fin, setFin] = useState(editando?.fin ?? '');
  const [tarifa, setTarifa] = useState(editando?.tarifa?.toString() ?? '');
  const [periodicidad, setPeriodicidad] = useState<typeof PERIODICIDAD[number]>(editando?.periodicidad_tarifa ?? 'mensual');
  const [estado, setEstado] = useState<typeof ESTADO_CONTRATO[number]>(editando?.estado ?? 'activo');
  const [notas, setNotas] = useState(editando?.notas ?? '');

  React.useEffect(() => {
    setCliente(editando?.cliente ?? ''); setRol(editando?.rol ?? '');
    setTipo(editando?.tipo ?? 'consultoria'); setInicio(editando?.inicio ?? hoy);
    setFin(editando?.fin ?? ''); setTarifa(editando?.tarifa?.toString() ?? '');
    setPeriodicidad(editando?.periodicidad_tarifa ?? 'mensual'); setEstado(editando?.estado ?? 'activo');
    setNotas(editando?.notas ?? '');
  }, [editando, visible]);

  async function guardar() {
    const datos = {
      cliente: cliente.trim(), rol: rol.trim(), tipo,
      inicio, fin: fin.trim() || null,
      tarifa: tarifa ? parseFloat(tarifa) : null,
      periodicidad_tarifa: tarifa ? periodicidad : null,
      estado, notas: notas.trim() || null,
    };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo={editando ? 'Editar contrato' : 'Nuevo contrato'} onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending || editar.isPending}>
      <Text style={estilosCampo.etiqueta}>Cliente</Text>
      <TextInput style={estilosCampo.campo} value={cliente} onChangeText={setCliente} placeholder="Empresa…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Rol</Text>
      <TextInput style={estilosCampo.campo} value={rol} onChangeText={setRol} placeholder="Consultora, Dev…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Tipo</Text>
      <PillRow opciones={TIPO_CONTRATO} valor={tipo} onChange={setTipo} />
      <Text style={estilosCampo.etiqueta}>Estado</Text>
      <PillRow opciones={ESTADO_CONTRATO} valor={estado} onChange={setEstado} />
      <Text style={estilosCampo.etiqueta}>Inicio (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={inicio} onChangeText={setInicio} keyboardType="numeric" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fin (AAAA-MM-DD, opcional)</Text>
      <TextInput style={estilosCampo.campo} value={fin} onChangeText={setFin} keyboardType="numeric" placeholder="—" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Tarifa (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={tarifa} onChangeText={setTarifa} keyboardType="numeric" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      {!!tarifa && (
        <>
          <Text style={estilosCampo.etiqueta}>Periodicidad</Text>
          <PillRow opciones={PERIODICIDAD} valor={periodicidad} onChange={setPeriodicidad} />
        </>
      )}
      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} multiline placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

// ── Sección CONTRATOS ──────────────────────────────────────────────────────

function SeccionContratos({ showForm, setShowForm, editando, setEditando }: {
  showForm: boolean; setShowForm: (v: boolean) => void;
  editando: Contrato | null; setEditando: (v: Contrato | null) => void;
}) {
  const { data: contratos = [] } = useContratos();
  const borrar = useBorrarContrato();

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {contratos.length === 0 ? (
          <Text style={s.vacio}>sin contratos registrados</Text>
        ) : (
          contratos.map((c) => {
            const color = COLOR_ESTADO[c.estado] ?? HOJAS.malvaGris;
            return (
              <TouchableOpacity key={c.id} style={[s.entCard, { borderLeftColor: color }]} onPress={() => { setEditando(c); setShowForm(true); }}>
                <View style={s.entHeader}>
                  <Text style={s.entActividad}>{c.cliente}</Text>
                  <View style={[s.estadoPill, { backgroundColor: color }]}>
                    <Text style={s.estadoPillTxt}>{c.estado}</Text>
                  </View>
                </View>
                <Text style={s.entFecha}>{c.rol} · {c.tipo}</Text>
                <Text style={s.entFecha}>{c.inicio}{c.fin ? ` → ${c.fin}` : ''}</Text>
                {c.tarifa != null && (
                  <Text style={s.entFecha}>${c.tarifa.toLocaleString()} / {c.periodicidad_tarifa}</Text>
                )}
                {c.notas && <Text style={s.entNotas}>{c.notas}</Text>}
                <TouchableOpacity onPress={() => Alert.alert('Borrar contrato', '¿Eliminar?', [
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
      <FABMono onPress={() => { setEditando(null); setShowForm(true); }} />
    </>
  );
}

// ── Form Entrevista ────────────────────────────────────────────────────────

function FormEntrevista({ visible, editando, onClose }: { visible: boolean; editando: Entrevista | null; onClose: () => void }) {
  const crear = useCrearEntrevista();
  const editar = useEditarEntrevista();
  const hoy = aISO(new Date());

  const [empresa, setEmpresa] = useState(editando?.empresa ?? '');
  const [puesto, setPuesto] = useState(editando?.puesto ?? '');
  const [fecha, setFecha] = useState(editando?.fecha ?? hoy);
  const [hora, setHora] = useState(editando?.hora ?? '');
  const [medio, setMedio] = useState<typeof MEDIO_ENTREVISTA[number]>(editando?.medio ?? 'videollamada');
  const [etapa, setEtapa] = useState<EtapaEntrevista>(editando?.etapa ?? 'primera');
  const [resultado, setResultado] = useState<typeof RESULTADO_ENTREVISTA[number]>(editando?.resultado ?? 'pendiente');
  const [notas, setNotas] = useState(editando?.notas ?? '');

  React.useEffect(() => {
    setEmpresa(editando?.empresa ?? ''); setPuesto(editando?.puesto ?? '');
    setFecha(editando?.fecha ?? hoy); setHora(editando?.hora ?? '');
    setMedio(editando?.medio ?? 'videollamada'); setEtapa(editando?.etapa ?? 'primera');
    setResultado(editando?.resultado ?? 'pendiente'); setNotas(editando?.notas ?? '');
  }, [editando, visible]);

  async function guardar() {
    const datos = {
      empresa: empresa.trim(), puesto: puesto.trim(),
      fecha, hora: hora.trim() || null, medio, etapa,
      resultado: resultado || null,
      evento_id: editando?.evento_id ?? null,
      notas: notas.trim() || null,
    };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo={editando ? 'Editar entrevista' : 'Nueva entrevista'} onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending || editar.isPending}>
      <Text style={estilosCampo.etiqueta}>Empresa</Text>
      <TextInput style={estilosCampo.campo} value={empresa} onChangeText={setEmpresa} placeholder="Nombre empresa…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Puesto</Text>
      <TextInput style={estilosCampo.campo} value={puesto} onChangeText={setPuesto} placeholder="Dev Senior…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={fecha} onChangeText={setFecha} keyboardType="numeric" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Hora (HH:MM, opcional)</Text>
      <TextInput style={estilosCampo.campo} value={hora} onChangeText={setHora} keyboardType="numeric" placeholder="10:00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Medio</Text>
      <PillRow opciones={MEDIO_ENTREVISTA} valor={medio} onChange={setMedio} />
      <Text style={estilosCampo.etiqueta}>Etapa</Text>
      <PillRow opciones={ETAPAS} valor={etapa} onChange={setEtapa} />
      <Text style={estilosCampo.etiqueta}>Resultado</Text>
      <PillRow opciones={RESULTADO_ENTREVISTA} valor={resultado} onChange={setResultado} />
      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} multiline placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

// ── Sección ENTREVISTAS ────────────────────────────────────────────────────

function SeccionEntrevistas({ showForm, setShowForm, editando, setEditando }: {
  showForm: boolean; setShowForm: (v: boolean) => void;
  editando: Entrevista | null; setEditando: (v: Entrevista | null) => void;
}) {
  const { data: entrevistas = [] } = useEntrevistas();
  const borrar = useBorrarEntrevista();
  const crear = useCrearEntrevista();

  const porEtapa = ETAPAS.map((etapa) => ({
    etapa,
    items: entrevistas.filter((e) => e.etapa === etapa),
  })).filter((g) => g.items.length > 0);

  async function avanzarEtapa(e: Entrevista) {
    const sig = siguienteEtapa(e.etapa);
    if (!sig) return;
    await crear.mutateAsync({
      empresa: e.empresa, puesto: e.puesto,
      fecha: e.fecha, hora: e.hora,
      medio: e.medio, etapa: sig,
      resultado: 'pendiente', evento_id: null, notas: null,
    });
  }

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {entrevistas.length === 0 ? (
          <Text style={s.vacio}>sin entrevistas registradas</Text>
        ) : (
          porEtapa.map(({ etapa, items }) => (
            <View key={etapa}>
              <Text style={s.etapaTit}>{etapa.toUpperCase()}</Text>
              {items.map((e) => {
                const colorRes = e.resultado ? (COLOR_RESULTADO[e.resultado] ?? HOJAS.malvaGris) : HOJAS.malvaGris;
                const opacidad = (e.resultado === 'rechazada' || e.resultado === 'declinada') ? 0.5 : 1;
                return (
                  <TouchableOpacity key={e.id} style={[s.entCard, { borderLeftColor: ACENTO, opacity: opacidad }]} onPress={() => { setEditando(e); setShowForm(true); }}>
                    <View style={s.entHeader}>
                      <Text style={s.entActividad}>{e.empresa}</Text>
                      {e.resultado && (
                        <View style={[s.estadoPill, { backgroundColor: colorRes }]}>
                          <Text style={s.estadoPillTxt}>{e.resultado}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.entFecha}>{e.puesto}</Text>
                    <Text style={s.entFecha}>{e.fecha}{e.hora ? ` · ${e.hora.slice(0, 5)}` : ''} · {e.medio}</Text>
                    {e.notas && <Text style={s.entNotas}>{e.notas}</Text>}
                    <View style={s.entAcciones}>
                      {e.resultado === 'avanzo' && siguienteEtapa(e.etapa) && (
                        <TouchableOpacity onPress={() => Alert.alert(
                          'Siguiente etapa',
                          `¿Crear entrada para etapa "${siguienteEtapa(e.etapa)}"?`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Crear', onPress: () => avanzarEtapa(e) },
                          ],
                        )}>
                          <Text style={s.avanzarTxt}>→ {siguienteEtapa(e.etapa)}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => Alert.alert('Borrar entrevista', '¿Eliminar?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate({ id: e.id, evento_id: e.evento_id }) },
                      ])}>
                        <Text style={s.borrarTxt}>borrar</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
      <FABMono onPress={() => { setEditando(null); setShowForm(true); }} />
    </>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function Trabajo() {
  const [seccion, setSeccion] = useState<Seccion>('Panorama');
  const [showFormContrato, setShowFormContrato] = useState(false);
  const [editandoContrato, setEditandoContrato] = useState<Contrato | null>(null);
  const [showFormEntrevista, setShowFormEntrevista] = useState(false);
  const [editandoEntrevista, setEditandoEntrevista] = useState<Entrevista | null>(null);

  return (
    <FondoFloral>
      <BarraMorris titulo="Trabajo" subtitulo="contratos y entrevistas" />

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
        {seccion === 'Panorama' && (
          <SeccionPanorama
            onAbrirContrato={() => { setEditandoContrato(null); setShowFormContrato(true); }}
            onAbrirEntrevista={() => { setEditandoEntrevista(null); setShowFormEntrevista(true); }}
          />
        )}
        {seccion === 'Contratos' && (
          <SeccionContratos
            showForm={showFormContrato} setShowForm={setShowFormContrato}
            editando={editandoContrato} setEditando={setEditandoContrato}
          />
        )}
        {seccion === 'Entrevistas' && (
          <SeccionEntrevistas
            showForm={showFormEntrevista} setShowForm={setShowFormEntrevista}
            editando={editandoEntrevista} setEditando={setEditandoEntrevista}
          />
        )}
      </View>

      <FormContrato visible={showFormContrato} editando={editandoContrato} onClose={() => setShowFormContrato(false)} />
      <FormEntrevista visible={showFormEntrevista} editando={editandoEntrevista} onClose={() => setShowFormEntrevista(false)} />
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
  avanzarTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: ACENTO },

  // Panorama
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 12, padding: 14 },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { ...TIPOGRAFIA.titulo, fontSize: 22, color: MORRIS.tinta },
  statEtiq: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris, textAlign: 'center' },
  panFila: { gap: 2, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: HOJAS.malvaGris },
  panCliente: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta },
  panRol: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },
  panTarifa: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.ocre },
  panBtns: { flexDirection: 'row', gap: 10 },
  panBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  panBtnTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.cremaMorris },

  // Cards
  entCard: { backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12, borderLeftWidth: 4, gap: 4 },
  entHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entActividad: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta, flex: 1 },
  entFecha: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },
  entNotas: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.tinta },
  entAcciones: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 },
  estadoPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  estadoPillTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.cremaMorris },
  etapaTit: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris, letterSpacing: 1.5, paddingVertical: 6 },

  // Pills
  pillScroll: { marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  pillOpc: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, backgroundColor: SUCULENTAS.crema },
  pillOpcActivo: { backgroundColor: ACENTO, borderColor: ACENTO },
  pillOpcTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.tinta },
  pillOpcTxtActivo: { color: MORRIS.cremaMorris },
});
