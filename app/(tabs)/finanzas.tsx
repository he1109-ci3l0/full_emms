import React, { useCallback, useState } from 'react';
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
  useAbonarMeta,
  useBorrarCobranza,
  useBorrarCuenta,
  useBorrarDeuda,
  useBorrarInversion,
  useBorrarMeta,
  useBorrarMovimiento,
  useBorrarPago,
  useBorrarRegistroCrediticio,
  useCobranzas,
  useCrearCobranza,
  useCrearCuenta,
  useCrearDeuda,
  useCrearInversion,
  useCrearMeta,
  useCrearMovimiento,
  useCrearPago,
  useCrearRegistroCrediticio,
  useCuentas,
  useDeudas,
  useEditarCuenta,
  useEditarDeuda,
  useEditarMovimiento,
  useHistorialCrediticio,
  useInversiones,
  useMarcarPagado,
  useMetas,
  useMovimientos,
  usePagosProgramados,
  useRegistrarPagoCobranza,
} from '../../src/lib/api/finanzas';
import { CATEGORIAS } from '../../src/lib/categorias';
import { CONTEXTOS_LISTA } from '../../src/lib/contextos';
import { aISO } from '../../src/lib/fechas';
import { HOJAS, LAVANDA, MORRIS, SUCULENTAS } from '../../src/theme/colores';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import type { ContextoClave } from '../../src/types/nucleo';
import type {
  Cobranza,
  CuentaConSaldo,
  Deuda,
  EtiquetaMeta,
  EstadoPago,
  Inversion,
  Meta,
  Movimiento,
  PagoProgramado,
  RecurrenciaPago,
  TipoCuenta,
  TipoMovimiento,
} from '../../src/types/finanzas';

// ── Helpers ────────────────────────────────────────────────────────────────

const ACENTO = LAVANDA.aqua;

type Seccion = 'Resumen' | 'Movimientos' | 'Cobranza' | 'Pagos' | 'Metas' | 'Deudas' | 'Inversión' | 'Crédito';
const PILLS: Seccion[] = ['Resumen', 'Movimientos', 'Cobranza', 'Pagos', 'Metas', 'Deudas', 'Inversión', 'Crédito'];

const ESTADO_COBR_COLOR: Record<string, string> = {
  pendiente: HOJAS.caramelo,
  parcial:   LAVANDA.aqua,
  pagado:    HOJAS.salvia,
  vencido:   HOJAS.vino,
};

const CAT_COLORES = [
  LAVANDA.aqua, HOJAS.caramelo, SUCULENTAS.malva, HOJAS.salvia,
  LAVANDA.rosaLavanda, SUCULENTAS.pizarra, HOJAS.vino, HOJAS.ciruela,
  LAVANDA.celeste, HOJAS.malvaGris,
];

const ETIQ_META: Record<EtiquetaMeta, string> = {
  general: 'General', medica: 'Médica', viaje: 'Viaje', equipo: 'Equipo', colchon: 'Colchón',
};
const META_COLOR: Record<EtiquetaMeta, string> = {
  general: LAVANDA.aqua, medica: LAVANDA.rosaLavanda, viaje: HOJAS.caramelo,
  equipo: SUCULENTAS.pizarra, colchon: HOJAS.salvia,
};

const TIPOS_CUENTA: TipoCuenta[] = ['efectivo', 'debito', 'credito', 'inversion', 'ahorro'];
const RECURRENCIAS: (RecurrenciaPago | 'ninguna')[] = ['ninguna', 'mensual', 'quincenal', 'anual'];

function formatPeso(n: number): string {
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mesAnioHoy(): { mes: number; anio: number } {
  const hoy = new Date();
  return { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() };
}

function mesLabel(mes: number, anio: number): string {
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${MESES[mes - 1]} ${anio}`;
}

function navMes(mes: number, anio: number, d: 1 | -1): { mes: number; anio: number } {
  let m = mes + d;
  let a = anio;
  if (m > 12) { m = 1; a += 1; }
  if (m < 1) { m = 12; a -= 1; }
  return { mes: m, anio: a };
}

// ── Pill selector row ──────────────────────────────────────────────────────

function PillRow<T extends string>({
  opciones, valor, onChange, etiqueta,
}: { opciones: T[]; valor: T; onChange: (v: T) => void; etiqueta?: (v: T) => string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRowScroll}>
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

// ── Sección Resumen ────────────────────────────────────────────────────────

function SeccionResumen() {
  const { mes, anio } = mesAnioHoy();
  const hoy = aISO(new Date());
  const in7 = aISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const { data: cuentas = [] } = useCuentas();
  const { data: movs = [] } = useMovimientos({ mes, anio });
  const { data: cobranzas = [] } = useCobranzas();
  const { data: pagos = [] } = usePagosProgramados();

  const saldoTotal = cuentas.reduce((s, c) => s + c.saldo, 0);
  const gastosMes = movs.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + Number(m.monto), 0);
  const porCobrarVencido = cobranzas
    .filter((c) => c.estado === 'vencido')
    .reduce((s, c) => s + (Number(c.monto) - Number(c.monto_pagado)), 0);
  const pagosPróximos = pagos.filter(
    (p) => p.estado === 'pendiente' && p.fecha_limite >= hoy && p.fecha_limite <= in7,
  ).length;

  const gastosCat: Record<string, number> = {};
  movs.filter((m) => m.tipo === 'gasto').forEach((m) => {
    gastosCat[m.categoria] = (gastosCat[m.categoria] ?? 0) + Number(m.monto);
  });
  const catEntries = Object.entries(gastosCat).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const maxCat = catEntries[0]?.[1] ?? 1;

  return (
    <ScrollView contentContainerStyle={s.seccionPad}>
      <View style={s.kpisRow}>
        <KPIFin etiqueta="Saldo total"       valor={formatPeso(saldoTotal)}      color={SUCULENTAS.pizarra} />
        <KPIFin etiqueta="Gastos mes"        valor={formatPeso(gastosMes)}       color={HOJAS.vino} />
        <KPIFin etiqueta="Por cobrar vencido" valor={formatPeso(porCobrarVencido)} color={MORRIS.granate} />
        <KPIFin etiqueta="Pagos 7 días"      valor={String(pagosPróximos)}       color={HOJAS.caramelo} />
      </View>

      {catEntries.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTit}>Gastos por categoría</Text>
          {catEntries.map(([cat, monto], i) => (
            <View key={cat} style={s.barFila}>
              <Text style={s.barLabel}>{cat}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(monto / maxCat) * 100}%`, backgroundColor: CAT_COLORES[i % CAT_COLORES.length] }]} />
              </View>
              <Text style={s.barMonto}>{formatPeso(monto)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.card}>
        <Text style={s.cardTit}>Cuentas</Text>
        {cuentas.length === 0 ? (
          <Text style={s.vacio}>sin cuentas todavía…</Text>
        ) : (
          cuentas.map((c) => (
            <View key={c.id} style={s.cuentaFila}>
              <Text style={s.cuentaNombre}>{c.nombre}</Text>
              <Text style={s.cuentaTipo}>{c.tipo}</Text>
              <Text style={[s.cuentaSaldo, { color: c.saldo >= 0 ? SUCULENTAS.pizarra : HOJAS.vino }]}>
                {formatPeso(c.saldo)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function KPIFin({ etiqueta, valor, color }: { etiqueta: string; valor: string; color: string }) {
  return (
    <View style={[s.kpiFin, { borderTopColor: color }]}>
      <Text style={[s.kpiFinVal, { color }]} numberOfLines={1} adjustsFontSizeToFit>{valor}</Text>
      <Text style={s.kpiFinEtiq}>{etiqueta}</Text>
    </View>
  );
}

// ── Form Movimiento ────────────────────────────────────────────────────────

type FormMovimientoProps = {
  visible: boolean;
  editando: Movimiento | null;
  cuentas: CuentaConSaldo[];
  onClose: () => void;
};

function FormMovimiento({ visible, editando, cuentas, onClose }: FormMovimientoProps) {
  const crear = useCrearMovimiento();
  const editar = useEditarMovimiento();
  const borrar = useBorrarMovimiento();

  const hoy = aISO(new Date());
  const [tipo, setTipo] = useState<TipoMovimiento>(editando?.tipo ?? 'gasto');
  const [cuentaId, setCuentaId] = useState(editando?.cuenta_id ?? cuentas[0]?.id ?? '');
  const [monto, setMonto] = useState(editando?.monto?.toString() ?? '');
  const [categoria, setCategoria] = useState(editando?.categoria ?? 'general');
  const [catLibre, setCatLibre] = useState('');
  const [fecha, setFecha] = useState(editando?.fecha ?? hoy);
  const [concepto, setConcepto] = useState(editando?.concepto ?? '');
  const [contexto, setContexto] = useState<ContextoClave>(editando?.contexto as ContextoClave ?? 'personal');
  const [cuentaDestinoId, setCuentaDestinoId] = useState(editando?.cuenta_destino_id ?? '');

  React.useEffect(() => {
    setTipo(editando?.tipo ?? 'gasto');
    setCuentaId(editando?.cuenta_id ?? cuentas[0]?.id ?? '');
    setMonto(editando?.monto?.toString() ?? '');
    setCategoria(editando?.categoria ?? 'general');
    setCatLibre('');
    setFecha(editando?.fecha ?? hoy);
    setConcepto(editando?.concepto ?? '');
    setContexto(editando?.contexto as ContextoClave ?? 'personal');
    setCuentaDestinoId(editando?.cuenta_destino_id ?? '');
  }, [editando, visible, cuentas]);

  const catFinal = catLibre.trim() || categoria;

  async function guardar() {
    const datos = {
      cuenta_id: cuentaId,
      tipo,
      monto: parseFloat(monto),
      categoria: catFinal,
      fecha,
      concepto: concepto.trim() || null,
      contexto,
      cuenta_destino_id: tipo === 'transferencia' ? cuentaDestinoId || null : null,
    };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  function handleBorrar() {
    if (!editando) return;
    Alert.alert('Borrar movimiento', '¿Eliminar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => { await borrar.mutateAsync(editando.id); onClose(); } },
    ]);
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario
      visible={visible}
      titulo={editando ? 'Editar movimiento' : 'Nuevo movimiento'}
      onGuardar={guardar}
      onCancelar={onClose}
      onBorrar={editando ? handleBorrar : undefined}
      guardando={guardando}
    >
      <Text style={estilosCampo.etiqueta}>Tipo</Text>
      <PillRow opciones={['ingreso', 'gasto', 'transferencia'] as TipoMovimiento[]} valor={tipo} onChange={setTipo} />

      <Text style={estilosCampo.etiqueta}>Cuenta</Text>
      <PillRow opciones={cuentas.map((c) => c.id)} valor={cuentaId} onChange={setCuentaId} etiqueta={(id) => cuentas.find((c) => c.id === id)?.nombre ?? id} />

      {tipo === 'transferencia' && (
        <>
          <Text style={estilosCampo.etiqueta}>Cuenta destino</Text>
          <PillRow opciones={cuentas.filter((c) => c.id !== cuentaId).map((c) => c.id)} valor={cuentaDestinoId} onChange={setCuentaDestinoId} etiqueta={(id) => cuentas.find((c) => c.id === id)?.nombre ?? id} />
        </>
      )}

      <Text style={estilosCampo.etiqueta}>Monto</Text>
      <TextInput style={estilosCampo.campo} value={monto} onChangeText={setMonto} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />

      <Text style={estilosCampo.etiqueta}>Categoría</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRowScroll}>
        <View style={s.pillRow}>
          {CATEGORIAS.map((c) => (
            <TouchableOpacity key={c} style={[s.pillOpc, categoria === c && !catLibre && s.pillOpcActivo]} onPress={() => { setCategoria(c); setCatLibre(''); }}>
              <Text style={[s.pillOpcTxt, categoria === c && !catLibre && s.pillOpcTxtActivo]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TextInput style={estilosCampo.campo} value={catLibre} onChangeText={setCatLibre} placeholder="Otra categoría…" placeholderTextColor={MORRIS.salviaMorris} />

      <Text style={estilosCampo.etiqueta}>Fecha (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={fecha} onChangeText={setFecha} keyboardType="numeric" placeholder={hoy} placeholderTextColor={MORRIS.salviaMorris} />

      <Text style={estilosCampo.etiqueta}>Concepto (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={concepto} onChangeText={setConcepto} placeholder="Descripción…" placeholderTextColor={MORRIS.salviaMorris} />

      <Text style={estilosCampo.etiqueta}>Contexto</Text>
      <PillRow opciones={CONTEXTOS_LISTA.map((c) => c.clave) as ContextoClave[]} valor={contexto} onChange={setContexto} etiqueta={(k) => CONTEXTOS_LISTA.find((c) => c.clave === k)?.etiqueta ?? k} />
    </ModalFormulario>
  );
}

// ── Sección Movimientos ────────────────────────────────────────────────────

function SeccionMovimientos() {
  const [{ mes, anio }, setMesAnio] = useState(mesAnioHoy);
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Movimiento | null>(null);

  const { data: movs = [], isLoading } = useMovimientos({ mes, anio, tipo: filtroTipo || undefined });
  const { data: cuentas = [] } = useCuentas();

  const totalIngresos = movs.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0);
  const totalGastos = movs.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + Number(m.monto), 0);

  const TIPO_COLOR: Record<TipoMovimiento, string> = { ingreso: HOJAS.salvia, gasto: HOJAS.vino, transferencia: LAVANDA.aqua };

  return (
    <>
      <View style={s.navMes}>
        <TouchableOpacity onPress={() => setMesAnio((p) => navMes(p.mes, p.anio, -1))} style={s.navBtn}>
          <Text style={s.navBtnTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navMesTxt}>{mesLabel(mes, anio)}</Text>
        <TouchableOpacity onPress={() => setMesAnio((p) => navMes(p.mes, p.anio, 1))} style={s.navBtn}>
          <Text style={s.navBtnTxt}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRowScroll}>
        <View style={[s.pillRow, { paddingHorizontal: 16 }]}>
          {(['', 'ingreso', 'gasto', 'transferencia'] as (TipoMovimiento | '')[]).map((t) => (
            <TouchableOpacity key={t || 'todos'} style={[s.pillOpc, filtroTipo === t && s.pillOpcActivo]} onPress={() => setFiltroTipo(t)}>
              <Text style={[s.pillOpcTxt, filtroTipo === t && s.pillOpcTxtActivo]}>{t || 'todos'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={s.resumenRow}>
        <Text style={[s.resumenNum, { color: HOJAS.salvia }]}>+{formatPeso(totalIngresos)}</Text>
        <Text style={[s.resumenNum, { color: HOJAS.vino }]}>-{formatPeso(totalGastos)}</Text>
      </View>

      <ScrollView contentContainerStyle={[s.seccionPad, { paddingTop: 0 }]}>
        {isLoading ? (
          <Text style={s.vacio}>cargando…</Text>
        ) : movs.length === 0 ? (
          <Text style={s.vacio}>sin movimientos este mes</Text>
        ) : (
          movs.map((m) => {
            const cuenta = cuentas.find((c) => c.id === m.cuenta_id);
            return (
              <TouchableOpacity key={m.id} style={s.movFila} onPress={() => { setEditando(m); setShowForm(true); }}>
                <View style={[s.movTipoBar, { backgroundColor: TIPO_COLOR[m.tipo] }]} />
                <View style={s.movInfo}>
                  <Text style={s.movCategoria}>{m.categoria}</Text>
                  {m.concepto ? <Text style={s.movConcepto} numberOfLines={1}>{m.concepto}</Text> : null}
                  <Text style={s.movCuenta}>{cuenta?.nombre ?? '—'} · {m.fecha}</Text>
                </View>
                <Text style={[s.movMonto, { color: TIPO_COLOR[m.tipo] }]}>
                  {m.tipo === 'ingreso' ? '+' : '-'}{formatPeso(Number(m.monto))}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <FABMono onPress={() => { setEditando(null); setShowForm(true); }} />
      <FormMovimiento visible={showForm} editando={editando} cuentas={cuentas} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Form Cobranza ──────────────────────────────────────────────────────────

function FormCobranza({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const crear = useCrearCobranza();
  const [deudor, setDeudor] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  React.useEffect(() => {
    if (!visible) { setDeudor(''); setConcepto(''); setMonto(''); setFechaLimite(''); }
  }, [visible]);

  async function guardar() {
    await crear.mutateAsync({
      deudor: deudor.trim(),
      concepto: concepto.trim(),
      monto: parseFloat(monto),
      monto_pagado: 0,
      fecha_limite: fechaLimite.trim() || null,
      estado: 'pendiente',
      contexto: 'antioquia',
    });
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo="Nueva cobranza" onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending}>
      <Text style={estilosCampo.etiqueta}>Deudor</Text>
      <TextInput style={estilosCampo.campo} value={deudor} onChangeText={setDeudor} placeholder="Hab 01 / Nombre" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Concepto</Text>
      <TextInput style={estilosCampo.campo} value={concepto} onChangeText={setConcepto} placeholder="Renta julio…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Monto</Text>
      <TextInput style={estilosCampo.campo} value={monto} onChangeText={setMonto} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha límite (AAAA-MM-DD, opcional)</Text>
      <TextInput style={estilosCampo.campo} value={fechaLimite} onChangeText={setFechaLimite} keyboardType="numeric" placeholder="2026-07-31" placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

function ModalPagoCobranza({ cobranza, onClose }: { cobranza: Cobranza | null; onClose: () => void }) {
  const registrar = useRegistrarPagoCobranza();
  const [abono, setAbono] = useState('');
  React.useEffect(() => { setAbono(''); }, [cobranza]);

  if (!cobranza) return null;
  const nuevoPagado = Number(cobranza.monto_pagado) + parseFloat(abono || '0');

  async function guardar() {
    await registrar.mutateAsync({ id: cobranza!.id, monto_pagado: nuevoPagado, monto: cobranza!.monto });
    onClose();
  }

  return (
    <ModalFormulario visible={!!cobranza} titulo="Registrar pago" onGuardar={guardar} onCancelar={onClose} guardando={registrar.isPending}>
      <Text style={s.modalInfo}>Adeudo: {formatPeso(cobranza.monto)} · Pagado: {formatPeso(cobranza.monto_pagado)}</Text>
      <Text style={estilosCampo.etiqueta}>Abono</Text>
      <TextInput style={estilosCampo.campo} value={abono} onChangeText={setAbono} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

// ── Sección Cobranza ───────────────────────────────────────────────────────

function SeccionCobranza() {
  const { data: cobranzas = [] } = useCobranzas();
  const borrar = useBorrarCobranza();
  const [showForm, setShowForm] = useState(false);
  const [pagoTarget, setPagoTarget] = useState<Cobranza | null>(null);

  const totalPorCobrar = cobranzas
    .filter((c) => c.estado !== 'pagado')
    .reduce((s, c) => s + (Number(c.monto) - Number(c.monto_pagado)), 0);

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        <Text style={s.totalRow}>Por cobrar: <Text style={{ color: HOJAS.vino }}>{formatPeso(totalPorCobrar)}</Text></Text>
        {cobranzas.length === 0 ? (
          <Text style={s.vacio}>sin cobranzas</Text>
        ) : (
          cobranzas.map((c) => (
            <View key={c.id} style={[s.cobCard, { borderLeftColor: ESTADO_COBR_COLOR[c.estado] }]}>
              <View style={s.cobHeader}>
                <Text style={s.cobDeudor}>{c.deudor}</Text>
                <View style={[s.estadoPill, { backgroundColor: ESTADO_COBR_COLOR[c.estado] }]}>
                  <Text style={s.estadoPillTxt}>{c.estado}</Text>
                </View>
              </View>
              <Text style={s.cobConcepto}>{c.concepto}</Text>
              <Text style={s.cobMontos}>{formatPeso(c.monto_pagado)} / {formatPeso(c.monto)}</Text>
              {c.fecha_limite ? <Text style={s.cobFecha}>vence {c.fecha_limite}</Text> : null}
              <View style={s.cobAcciones}>
                {c.estado !== 'pagado' && (
                  <TouchableOpacity style={s.btnAccion} onPress={() => setPagoTarget(c)}>
                    <Text style={s.btnAccionTxt}>Registrar pago</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => Alert.alert('Borrar cobranza', '¿Eliminar?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(c.id) },
                ])}>
                  <Text style={s.borrarTxt}>borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <FABMono onPress={() => setShowForm(true)} />
      <FormCobranza visible={showForm} onClose={() => setShowForm(false)} />
      <ModalPagoCobranza cobranza={pagoTarget} onClose={() => setPagoTarget(null)} />
    </>
  );
}

// ── Form Pago ──────────────────────────────────────────────────────────────

function FormPago({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const crear = useCrearPago();
  const [acreedor, setAcreedor] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [recurrencia, setRecurrencia] = useState<RecurrenciaPago | 'ninguna'>('ninguna');

  React.useEffect(() => {
    if (!visible) { setAcreedor(''); setConcepto(''); setMonto(''); setFecha(''); setRecurrencia('ninguna'); }
  }, [visible]);

  async function guardar() {
    await crear.mutateAsync({
      acreedor: acreedor.trim(),
      concepto: concepto.trim(),
      monto: parseFloat(monto),
      fecha_limite: fecha.trim(),
      recurrencia: recurrencia === 'ninguna' ? null : recurrencia,
      estado: 'pendiente',
    });
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo="Nuevo pago programado" onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending}>
      <Text style={estilosCampo.etiqueta}>Acreedor</Text>
      <TextInput style={estilosCampo.campo} value={acreedor} onChangeText={setAcreedor} placeholder="Banco / servicio" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Concepto</Text>
      <TextInput style={estilosCampo.campo} value={concepto} onChangeText={setConcepto} placeholder="Descripción" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Monto</Text>
      <TextInput style={estilosCampo.campo} value={monto} onChangeText={setMonto} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha límite (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={fecha} onChangeText={setFecha} keyboardType="numeric" placeholder="2026-07-31" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Recurrencia</Text>
      <PillRow opciones={RECURRENCIAS} valor={recurrencia} onChange={setRecurrencia} />
    </ModalFormulario>
  );
}

// ── Sección Pagos ──────────────────────────────────────────────────────────

function SeccionPagos() {
  const { data: pagos = [] } = usePagosProgramados();
  const marcar = useMarcarPagado();
  const borrar = useBorrarPago();
  const [showForm, setShowForm] = useState(false);
  const hoy = aISO(new Date());
  const in7 = aISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const pendientes = pagos.filter((p) => p.estado === 'pendiente');
  const pagados = pagos.filter((p) => p.estado === 'pagado');

  function colorPago(p: PagoProgramado): string {
    if (p.fecha_limite < hoy) return HOJAS.vino;
    if (p.fecha_limite <= in7) return HOJAS.caramelo;
    return MORRIS.tinta;
  }

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {pendientes.length === 0 ? (
          <Text style={s.vacio}>sin pagos pendientes</Text>
        ) : (
          pendientes.map((p) => (
            <View key={p.id} style={s.pagoFila}>
              <View style={s.pagoInfo}>
                <Text style={[s.pagoAcreedor, { color: colorPago(p) }]}>{p.acreedor}</Text>
                <Text style={s.pagoConcepto}>{p.concepto}</Text>
                <Text style={s.pagoFecha}>{p.fecha_limite}{p.recurrencia ? ` · ${p.recurrencia}` : ''}</Text>
              </View>
              <View style={s.pagoAcciones}>
                <Text style={[s.pagoMonto, { color: colorPago(p) }]}>{formatPeso(p.monto)}</Text>
                <TouchableOpacity style={s.btnPagado} onPress={() => marcar.mutate(p)}>
                  <Text style={s.btnPagadoTxt}>✓ Pagado</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        {pagados.length > 0 && (
          <Text style={[s.cardTit, { marginTop: 16 }]}>Pagados este ciclo</Text>
        )}
        {pagados.map((p) => (
          <View key={p.id} style={[s.pagoFila, { opacity: 0.5 }]}>
            <View style={s.pagoInfo}>
              <Text style={s.pagoAcreedor}>{p.acreedor}</Text>
              <Text style={s.pagoConcepto}>{p.concepto}</Text>
            </View>
            <View style={s.pagoAcciones}>
              <Text style={s.pagoMonto}>{formatPeso(p.monto)}</Text>
              <TouchableOpacity onPress={() => borrar.mutate(p.id)}>
                <Text style={s.borrarTxt}>borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <FABMono onPress={() => setShowForm(true)} />
      <FormPago visible={showForm} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Form Meta ──────────────────────────────────────────────────────────────

const ETIQUETAS_META: EtiquetaMeta[] = ['general', 'medica', 'viaje', 'equipo', 'colchon'];

function FormMeta({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const crear = useCrearMeta();
  const [nombre, setNombre] = useState('');
  const [etiqueta, setEtiqueta] = useState<EtiquetaMeta>('general');
  const [objetivo, setObjetivo] = useState('');
  const [fechaObj, setFechaObj] = useState('');

  React.useEffect(() => {
    if (!visible) { setNombre(''); setEtiqueta('general'); setObjetivo(''); setFechaObj(''); }
  }, [visible]);

  async function guardar() {
    await crear.mutateAsync({
      nombre: nombre.trim(),
      etiqueta,
      monto_objetivo: parseFloat(objetivo),
      monto_actual: 0,
      fecha_objetivo: fechaObj.trim() || null,
    });
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo="Nueva meta" onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending}>
      <Text style={estilosCampo.etiqueta}>Nombre</Text>
      <TextInput style={estilosCampo.campo} value={nombre} onChangeText={setNombre} placeholder="Colchón de emergencia…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Etiqueta</Text>
      <PillRow opciones={ETIQUETAS_META} valor={etiqueta} onChange={setEtiqueta} etiqueta={(e) => ETIQ_META[e]} />
      <Text style={estilosCampo.etiqueta}>Monto objetivo</Text>
      <TextInput style={estilosCampo.campo} value={objetivo} onChangeText={setObjetivo} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha objetivo (AAAA-MM-DD, opcional)</Text>
      <TextInput style={estilosCampo.campo} value={fechaObj} onChangeText={setFechaObj} keyboardType="numeric" placeholder="2026-12-31" placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

function ModalAbonar({ meta, onClose }: { meta: Meta | null; onClose: () => void }) {
  const abonar = useAbonarMeta();
  const crear = useCrearMovimiento();
  const { data: cuentas = [] } = useCuentas();
  const [abono, setAbono] = useState('');
  const [registrarGasto, setRegistrarGasto] = useState(false);
  const [cuentaId, setCuentaId] = useState('');
  React.useEffect(() => { setAbono(''); setRegistrarGasto(false); setCuentaId(cuentas[0]?.id ?? ''); }, [meta, cuentas]);

  if (!meta) return null;

  const pct = Math.min(100, Math.round((Number(meta.monto_actual) / Number(meta.monto_objetivo)) * 100));

  async function guardar() {
    const nuevoActual = Number(meta!.monto_actual) + parseFloat(abono || '0');
    await abonar.mutateAsync({ id: meta!.id, monto_actual: nuevoActual });
    if (registrarGasto && cuentaId) {
      await crear.mutateAsync({
        cuenta_id: cuentaId,
        tipo: 'gasto',
        monto: parseFloat(abono),
        categoria: 'ahorro',
        fecha: aISO(new Date()),
        concepto: `Abono a meta: ${meta!.nombre}`,
        contexto: 'personal',
        cuenta_destino_id: null,
      });
    }
    onClose();
  }

  return (
    <ModalFormulario visible={!!meta} titulo={`Abonar a: ${meta.nombre}`} onGuardar={guardar} onCancelar={onClose} guardando={abonar.isPending}>
      <Text style={s.modalInfo}>Avance actual: {pct}% · {formatPeso(meta.monto_actual)} / {formatPeso(meta.monto_objetivo)}</Text>
      <Text style={estilosCampo.etiqueta}>Abono</Text>
      <TextInput style={estilosCampo.campo} value={abono} onChangeText={setAbono} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      <TouchableOpacity style={s.checkRow} onPress={() => setRegistrarGasto((v) => !v)}>
        <View style={[s.check, registrarGasto && s.checkActivo]} />
        <Text style={s.checkLabel}>Registrar también como gasto</Text>
      </TouchableOpacity>
      {registrarGasto && (
        <>
          <Text style={estilosCampo.etiqueta}>Cuenta</Text>
          <PillRow opciones={cuentas.map((c) => c.id)} valor={cuentaId} onChange={setCuentaId} etiqueta={(id) => cuentas.find((c) => c.id === id)?.nombre ?? id} />
        </>
      )}
    </ModalFormulario>
  );
}

// ── Sección Metas ──────────────────────────────────────────────────────────

function SeccionMetas() {
  const { data: metas = [] } = useMetas();
  const borrar = useBorrarMeta();
  const [showForm, setShowForm] = useState(false);
  const [abonarTarget, setAbonarTarget] = useState<Meta | null>(null);

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {metas.length === 0 ? (
          <Text style={s.vacio}>sin metas todavía</Text>
        ) : (
          metas.map((m) => {
            const pct = Math.min(100, Math.round((Number(m.monto_actual) / Number(m.monto_objetivo)) * 100));
            const color = META_COLOR[m.etiqueta];
            return (
              <View key={m.id} style={[s.metaCard, { borderTopColor: color }]}>
                <View style={s.metaHeader}>
                  <Text style={s.metaNombre}>{m.nombre}</Text>
                  <View style={[s.estadoPill, { backgroundColor: color }]}>
                    <Text style={s.estadoPillTxt}>{ETIQ_META[m.etiqueta]}</Text>
                  </View>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
                <View style={s.metaFooter}>
                  <Text style={s.metaMonto}>{formatPeso(m.monto_actual)} / {formatPeso(m.monto_objetivo)}</Text>
                  <Text style={s.metaPct}>{pct}%</Text>
                </View>
                {m.fecha_objetivo ? <Text style={s.cobFecha}>objetivo {m.fecha_objetivo}</Text> : null}
                <View style={s.cobAcciones}>
                  <TouchableOpacity style={s.btnAccion} onPress={() => setAbonarTarget(m)}>
                    <Text style={s.btnAccionTxt}>Abonar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Alert.alert('Borrar meta', '¿Eliminar?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(m.id) },
                  ])}>
                    <Text style={s.borrarTxt}>borrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <FABMono onPress={() => setShowForm(true)} />
      <FormMeta visible={showForm} onClose={() => setShowForm(false)} />
      <ModalAbonar meta={abonarTarget} onClose={() => setAbonarTarget(null)} />
    </>
  );
}

// ── Form Deuda ─────────────────────────────────────────────────────────────

function FormDeuda({ visible, editando, onClose }: { visible: boolean; editando: Deuda | null; onClose: () => void }) {
  const crear = useCrearDeuda();
  const editar = useEditarDeuda();
  const [acreedor, setAcreedor] = useState(editando?.acreedor ?? '');
  const [montoOrig, setMontoOrig] = useState(editando?.monto_original?.toString() ?? '');
  const [saldo, setSaldo] = useState(editando?.saldo?.toString() ?? '');
  const [tasa, setTasa] = useState(editando?.tasa_anual?.toString() ?? '');
  const [pagoMin, setPagoMin] = useState(editando?.pago_minimo?.toString() ?? '');
  const [corte, setCorte] = useState(editando?.fecha_corte?.toString() ?? '');

  React.useEffect(() => {
    setAcreedor(editando?.acreedor ?? '');
    setMontoOrig(editando?.monto_original?.toString() ?? '');
    setSaldo(editando?.saldo?.toString() ?? '');
    setTasa(editando?.tasa_anual?.toString() ?? '');
    setPagoMin(editando?.pago_minimo?.toString() ?? '');
    setCorte(editando?.fecha_corte?.toString() ?? '');
  }, [editando, visible]);

  async function guardar() {
    const datos = {
      acreedor: acreedor.trim(),
      monto_original: parseFloat(montoOrig),
      saldo: parseFloat(saldo),
      tasa_anual: tasa ? parseFloat(tasa) : null,
      pago_minimo: pagoMin ? parseFloat(pagoMin) : null,
      fecha_corte: corte ? parseInt(corte, 10) : null,
    };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario visible={visible} titulo={editando ? 'Editar deuda' : 'Nueva deuda'} onGuardar={guardar} onCancelar={onClose} guardando={guardando}>
      <Text style={estilosCampo.etiqueta}>Acreedor</Text>
      <TextInput style={estilosCampo.campo} value={acreedor} onChangeText={setAcreedor} placeholder="Banco / persona" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Monto original</Text>
      <TextInput style={estilosCampo.campo} value={montoOrig} onChangeText={setMontoOrig} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Saldo actual</Text>
      <TextInput style={estilosCampo.campo} value={saldo} onChangeText={setSaldo} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Tasa anual % (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={tasa} onChangeText={setTasa} keyboardType="decimal-pad" placeholder="24.0" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Pago mínimo (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={pagoMin} onChangeText={setPagoMin} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha de corte (1–31, opcional)</Text>
      <TextInput style={estilosCampo.campo} value={corte} onChangeText={setCorte} keyboardType="numeric" placeholder="15" placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

// ── Sección Deudas ─────────────────────────────────────────────────────────

function SeccionDeudas() {
  const { data: deudas = [] } = useDeudas();
  const borrar = useBorrarDeuda();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Deuda | null>(null);

  const totalSaldo = deudas.reduce((s, d) => s + Number(d.saldo), 0);

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        <Text style={s.totalRow}>Deuda total: <Text style={{ color: HOJAS.vino }}>{formatPeso(totalSaldo)}</Text></Text>
        {deudas.length === 0 ? (
          <Text style={s.vacio}>sin deudas registradas</Text>
        ) : (
          deudas.map((d) => (
            <TouchableOpacity key={d.id} style={s.deudaCard} onPress={() => { setEditando(d); setShowForm(true); }}>
              <View style={s.metaHeader}>
                <Text style={s.metaNombre}>{d.acreedor}</Text>
                <Text style={[s.cobMontos, { color: HOJAS.vino, fontWeight: '700' }]}>{formatPeso(d.saldo)}</Text>
              </View>
              <View style={s.deudaDetalle}>
                {d.tasa_anual != null ? <Text style={s.deudaDato}>Tasa: {d.tasa_anual}% anual</Text> : null}
                {d.pago_minimo != null ? <Text style={s.deudaDato}>Pago mín: {formatPeso(d.pago_minimo)}</Text> : null}
                {d.fecha_corte != null ? <Text style={s.deudaDato}>Corte: día {d.fecha_corte}</Text> : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <FABMono onPress={() => { setEditando(null); setShowForm(true); }} />
      <FormDeuda visible={showForm} editando={editando} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Sección Inversión ──────────────────────────────────────────────────────

function FormInversion({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const crear = useCrearInversion();
  const [instrumento, setInstrumento] = useState('');
  const [monto, setMonto] = useState('');
  const [fechaEntrada, setFechaEntrada] = useState(aISO(new Date()));
  const [rendimiento, setRendimiento] = useState('');
  const [notas, setNotas] = useState('');

  React.useEffect(() => {
    if (!visible) { setInstrumento(''); setMonto(''); setFechaEntrada(aISO(new Date())); setRendimiento(''); setNotas(''); }
  }, [visible]);

  async function guardar() {
    await crear.mutateAsync({
      instrumento: instrumento.trim(),
      monto: parseFloat(monto),
      fecha_entrada: fechaEntrada.trim(),
      rendimiento_esperado: rendimiento ? parseFloat(rendimiento) : null,
      notas: notas.trim() || null,
    });
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo="Nueva inversión" onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending}>
      <Text style={estilosCampo.etiqueta}>Instrumento</Text>
      <TextInput style={estilosCampo.campo} value={instrumento} onChangeText={setInstrumento} placeholder="CETES / FIBRA / Fondo…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Monto invertido</Text>
      <TextInput style={estilosCampo.campo} value={monto} onChangeText={setMonto} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha de entrada (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={fechaEntrada} onChangeText={setFechaEntrada} keyboardType="numeric" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Rendimiento esperado % (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={rendimiento} onChangeText={setRendimiento} keyboardType="decimal-pad" placeholder="8.5" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} placeholder="Vence en…" placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

function SeccionInversion() {
  const { data: inversiones = [] } = useInversiones();
  const borrar = useBorrarInversion();
  const [showForm, setShowForm] = useState(false);

  const totalInvertido = inversiones.reduce((s, i) => s + Number(i.monto), 0);

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        <Text style={s.totalRow}>Total invertido: <Text style={{ color: SUCULENTAS.pizarra }}>{formatPeso(totalInvertido)}</Text></Text>
        {inversiones.length === 0 ? (
          <Text style={s.vacio}>sin inversiones registradas</Text>
        ) : (
          inversiones.map((inv: Inversion) => (
            <View key={inv.id} style={s.invCard}>
              <View style={s.metaHeader}>
                <Text style={s.metaNombre}>{inv.instrumento}</Text>
                <Text style={[s.cobMontos, { color: SUCULENTAS.pizarra }]}>{formatPeso(inv.monto)}</Text>
              </View>
              <View style={s.deudaDetalle}>
                <Text style={s.deudaDato}>{inv.fecha_entrada}</Text>
                {inv.rendimiento_esperado != null ? <Text style={s.deudaDato}>{inv.rendimiento_esperado}% esperado</Text> : null}
                {inv.notas ? <Text style={s.deudaDato}>{inv.notas}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Borrar inversión', '¿Eliminar?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Borrar', style: 'destructive', onPress: () => borrar.mutate(inv.id) },
              ])}>
                <Text style={s.borrarTxt}>borrar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
      <FABMono onPress={() => setShowForm(true)} />
      <FormInversion visible={showForm} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Sección Crédito ────────────────────────────────────────────────────────

function FormCredito({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const crear = useCrearRegistroCrediticio();
  const [buro, setBuro] = useState('');
  const [score, setScore] = useState('');
  const [notas, setNotas] = useState('');
  const [fecha, setFecha] = useState(aISO(new Date()));

  React.useEffect(() => {
    if (!visible) { setBuro(''); setScore(''); setNotas(''); setFecha(aISO(new Date())); }
  }, [visible]);

  async function guardar() {
    await crear.mutateAsync({
      buro: buro.trim(),
      score: score ? parseInt(score, 10) : null,
      notas: notas.trim() || null,
      fecha_consulta: fecha.trim(),
    });
    onClose();
  }

  return (
    <ModalFormulario visible={visible} titulo="Registrar score" onGuardar={guardar} onCancelar={onClose} guardando={crear.isPending}>
      <Text style={estilosCampo.etiqueta}>Buró</Text>
      <TextInput style={estilosCampo.campo} value={buro} onChangeText={setBuro} placeholder="Buró de Crédito / Círculo" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Score</Text>
      <TextInput style={estilosCampo.campo} value={score} onChangeText={setScore} keyboardType="numeric" placeholder="680" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Fecha consulta (AAAA-MM-DD)</Text>
      <TextInput style={estilosCampo.campo} value={fecha} onChangeText={setFecha} keyboardType="numeric" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Notas (opcional)</Text>
      <TextInput style={estilosCampo.campo} value={notas} onChangeText={setNotas} placeholder="Observaciones…" placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

function SeccionCredito() {
  const { data: historial = [] } = useHistorialCrediticio();
  const borrar = useBorrarRegistroCrediticio();
  const [showForm, setShowForm] = useState(false);

  const conScore = historial.filter((h) => h.score != null);
  const maxScore = conScore.reduce((m, h) => Math.max(m, h.score ?? 0), 850);

  return (
    <>
      <ScrollView contentContainerStyle={s.seccionPad}>
        {historial.length === 0 ? (
          <Text style={s.vacio}>sin historial registrado</Text>
        ) : (
          <>
            {conScore.length > 1 && (
              <View style={s.card}>
                <Text style={s.cardTit}>Evolución del score</Text>
                {conScore.slice(0, 12).reverse().map((h, i) => (
                  <View key={h.id} style={s.scoreBarFila}>
                    <Text style={s.scoreLabel}>{h.fecha_consulta.slice(5)}</Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, {
                        width: `${((h.score ?? 0) / maxScore) * 100}%`,
                        backgroundColor: (h.score ?? 0) >= 700 ? HOJAS.salvia : (h.score ?? 0) >= 600 ? HOJAS.caramelo : HOJAS.vino,
                      }]} />
                    </View>
                    <Text style={s.scoreVal}>{h.score}</Text>
                  </View>
                ))}
              </View>
            )}
            {historial.map((h) => (
              <View key={h.id} style={s.creditoFila}>
                <View style={s.movInfo}>
                  <Text style={s.pagoAcreedor}>{h.buro}</Text>
                  <Text style={s.pagoFecha}>{h.fecha_consulta}</Text>
                  {h.notas ? <Text style={s.movConcepto}>{h.notas}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {h.score != null && (
                    <Text style={[s.pagoMonto, {
                      color: h.score >= 700 ? HOJAS.salvia : h.score >= 600 ? HOJAS.caramelo : HOJAS.vino,
                    }]}>{h.score}</Text>
                  )}
                  <TouchableOpacity onPress={() => borrar.mutate(h.id)}>
                    <Text style={s.borrarTxt}>borrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <FABMono onPress={() => setShowForm(true)} />
      <FormCredito visible={showForm} onClose={() => setShowForm(false)} />
    </>
  );
}

// ── Form Cuenta (sección Resumen tiene botón "Cuentas") ────────────────────

function FormCuenta({ visible, editando, onClose }: { visible: boolean; editando: CuentaConSaldo | null; onClose: () => void }) {
  const crear = useCrearCuenta();
  const editar = useEditarCuenta();
  const borrar = useBorrarCuenta();
  const [nombre, setNombre] = useState(editando?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoCuenta>(editando?.tipo ?? 'debito');
  const [saldoInicial, setSaldoInicial] = useState(editando?.saldo_inicial?.toString() ?? '0');

  React.useEffect(() => {
    setNombre(editando?.nombre ?? '');
    setTipo(editando?.tipo ?? 'debito');
    setSaldoInicial(editando?.saldo_inicial?.toString() ?? '0');
  }, [editando, visible]);

  async function guardar() {
    const datos = { nombre: nombre.trim(), tipo, saldo_inicial: parseFloat(saldoInicial), activa: true };
    if (editando) await editar.mutateAsync({ id: editando.id, ...datos });
    else await crear.mutateAsync(datos);
    onClose();
  }

  function handleBorrar() {
    if (!editando) return;
    Alert.alert('Borrar cuenta', '¿Eliminar la cuenta y todos sus movimientos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => { await borrar.mutateAsync(editando.id); onClose(); } },
    ]);
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <ModalFormulario visible={visible} titulo={editando ? 'Editar cuenta' : 'Nueva cuenta'} onGuardar={guardar} onCancelar={onClose} onBorrar={editando ? handleBorrar : undefined} guardando={guardando}>
      <Text style={estilosCampo.etiqueta}>Nombre</Text>
      <TextInput style={estilosCampo.campo} value={nombre} onChangeText={setNombre} placeholder="Efectivo / BBVA…" placeholderTextColor={MORRIS.salviaMorris} />
      <Text style={estilosCampo.etiqueta}>Tipo</Text>
      <PillRow opciones={TIPOS_CUENTA} valor={tipo} onChange={setTipo} />
      <Text style={estilosCampo.etiqueta}>Saldo inicial</Text>
      <TextInput style={estilosCampo.campo} value={saldoInicial} onChangeText={setSaldoInicial} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={MORRIS.salviaMorris} />
    </ModalFormulario>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function Finanzas() {
  const [seccion, setSeccion] = useState<Seccion>('Resumen');
  const [showCuenta, setShowCuenta] = useState(false);
  const [editandoCuenta, setEditandoCuenta] = useState<CuentaConSaldo | null>(null);
  const { data: cuentas = [] } = useCuentas();

  const abrirCuenta = useCallback((c?: CuentaConSaldo) => {
    setEditandoCuenta(c ?? null);
    setShowCuenta(true);
  }, []);

  return (
    <FondoFloral>
      <BarraMorris titulo="Finanzas" subtitulo="dinero" onAccion={() => abrirCuenta()} />

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
        {seccion === 'Resumen' && <SeccionResumen />}
        {seccion === 'Movimientos' && <SeccionMovimientos />}
        {seccion === 'Cobranza' && <SeccionCobranza />}
        {seccion === 'Pagos' && <SeccionPagos />}
        {seccion === 'Metas' && <SeccionMetas />}
        {seccion === 'Deudas' && <SeccionDeudas />}
        {seccion === 'Inversión' && <SeccionInversion />}
        {seccion === 'Crédito' && <SeccionCredito />}
      </View>

      <FormCuenta visible={showCuenta} editando={editandoCuenta} onClose={() => setShowCuenta(false)} />
    </FondoFloral>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  navPills: { borderBottomWidth: 1, borderBottomColor: HOJAS.malvaGris, backgroundColor: HOJAS.hueso },
  navPillsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  navPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: ACENTO,
  },
  navPillActivo: { backgroundColor: ACENTO },
  navPillTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: ACENTO },
  navPillTxtActivo: { color: MORRIS.cremaMorris },

  cuerpo: { flex: 1 },
  seccionPad: { padding: 14, paddingBottom: 100, gap: 12 },

  // KPIs
  kpisRow: { flexDirection: 'row', gap: 8 },
  kpiFin: {
    flex: 1, backgroundColor: HOJAS.hueso, borderRadius: 10,
    borderTopWidth: 4, borderWidth: 1, borderColor: HOJAS.malvaGris,
    padding: 8, alignItems: 'center', gap: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  kpiFinVal: { ...TIPOGRAFIA.titulo, fontSize: 14, textAlign: 'center' },
  kpiFinEtiq: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: MORRIS.salviaMorris, textAlign: 'center' },

  // Cards
  card: { backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 12, padding: 14, gap: 8 },
  cardTit: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.granate },
  vacio: { ...TIPOGRAFIA.firma, fontSize: 18, color: HOJAS.salvia, textAlign: 'center', paddingVertical: 20 },

  // Barras horizontales
  barFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { ...TIPOGRAFIA.cuerpo, fontSize: 11, color: MORRIS.tinta, width: 90 },
  barTrack: { flex: 1, height: 10, backgroundColor: HOJAS.malvaGris, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barMonto: { ...TIPOGRAFIA.cuerpo, fontSize: 11, color: MORRIS.tinta, width: 74, textAlign: 'right' },

  // Cuentas en resumen
  cuentaFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  cuentaNombre: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta, flex: 1 },
  cuentaTipo: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  cuentaSaldo: { ...TIPOGRAFIA.titulo, fontSize: 14 },

  // Movimientos
  navMes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 16, backgroundColor: 'rgba(238,231,225,0.7)' },
  navBtn: { padding: 8 },
  navBtnTxt: { ...TIPOGRAFIA.titulo, fontSize: 22, color: MORRIS.granate },
  navMesTxt: { ...TIPOGRAFIA.titulo, fontSize: 16, color: MORRIS.tinta },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, backgroundColor: 'rgba(238,231,225,0.5)' },
  resumenNum: { ...TIPOGRAFIA.titulo, fontSize: 15 },
  movFila: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(238,231,225,0.85)',
    borderRadius: 10, overflow: 'hidden', gap: 10,
  },
  movTipoBar: { width: 4, alignSelf: 'stretch' },
  movInfo: { flex: 1, paddingVertical: 10 },
  movCategoria: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.tinta },
  movConcepto: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },
  movCuenta: { ...TIPOGRAFIA.cuerpo, fontSize: 11, color: MORRIS.salviaMorris },
  movMonto: { ...TIPOGRAFIA.titulo, fontSize: 14, paddingRight: 12 },

  // Pill selector
  pillRowScroll: { marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  pillOpc: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, backgroundColor: SUCULENTAS.crema },
  pillOpcActivo: { backgroundColor: ACENTO, borderColor: ACENTO },
  pillOpcTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.tinta },
  pillOpcTxtActivo: { color: MORRIS.cremaMorris },

  // Cobranza
  cobCard: {
    backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12,
    borderLeftWidth: 4, gap: 4,
  },
  cobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cobDeudor: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta },
  cobConcepto: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },
  cobMontos: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },
  cobFecha: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  cobAcciones: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  estadoPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  estadoPillTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 8, color: SUCULENTAS.carbon },
  btnAccion: { backgroundColor: ACENTO, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnAccionTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.cremaMorris },
  borrarTxt: { ...TIPOGRAFIA.firma, fontSize: 14, color: HOJAS.vino },
  modalInfo: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta, marginBottom: 12 },
  totalRow: { ...TIPOGRAFIA.titulo, fontSize: 15, color: MORRIS.tinta, textAlign: 'right' },

  // Pagos
  pagoFila: { flexDirection: 'row', backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12, gap: 10 },
  pagoInfo: { flex: 1, gap: 2 },
  pagoAcreedor: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta },
  pagoConcepto: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },
  pagoFecha: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris },
  pagoAcciones: { alignItems: 'flex-end', gap: 6 },
  pagoMonto: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta },
  btnPagado: { backgroundColor: HOJAS.salvia, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  btnPagadoTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.cremaMorris },

  // Metas
  metaCard: { backgroundColor: HOJAS.hueso, borderRadius: 12, borderTopWidth: 4, borderWidth: 1, borderColor: HOJAS.malvaGris, padding: 14, gap: 6 },
  metaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaNombre: { ...TIPOGRAFIA.titulo, fontSize: 15, color: MORRIS.tinta, flex: 1 },
  metaFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  metaMonto: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },
  metaPct: { ...TIPOGRAFIA.titulo, fontSize: 14, color: MORRIS.tinta },

  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  check: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: HOJAS.malvaGris },
  checkActivo: { backgroundColor: ACENTO, borderColor: ACENTO },
  checkLabel: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.tinta },

  // Deudas
  deudaCard: { backgroundColor: HOJAS.hueso, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, padding: 14, gap: 6 },
  deudaDetalle: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deudaDato: { ...TIPOGRAFIA.cuerpo, fontSize: 12, color: MORRIS.salviaMorris },

  // Inversión
  invCard: { backgroundColor: HOJAS.hueso, borderRadius: 12, borderWidth: 1, borderColor: HOJAS.malvaGris, padding: 14, gap: 6 },

  // Crédito
  creditoFila: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(238,231,225,0.85)', borderRadius: 10, padding: 12 },
  scoreBarFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreLabel: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris, width: 40 },
  scoreVal: { ...TIPOGRAFIA.titulo, fontSize: 12, color: MORRIS.tinta, width: 36, textAlign: 'right' },
});
