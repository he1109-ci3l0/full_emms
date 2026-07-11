import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import BarraMorris from '../../src/components/BarraMorris';
import ChipContexto from '../../src/components/ChipContexto';
import FABMono from '../../src/components/FABMono';
import FondoFloral from '../../src/components/FondoFloral';
import { useEventos, useNotas, usePendientes, useProyectos } from '../../src/lib/api/nucleo';
import { useMedicamentos, useTomas } from '../../src/lib/api/salud';
import { useEntrevistas } from '../../src/lib/api/trabajo';
import { predecirCiclo } from '../../src/lib/ciclo';
import { useCiclo } from '../../src/lib/api/salud';
import { CONTEXTOS } from '../../src/lib/contextos';
import { aISO, sumarDias } from '../../src/lib/fechas';
import { HOJAS, LAVANDA, MORRIS, SUCULENTAS } from '../../src/theme/colores';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import type { Evento, Pendiente } from '../../src/types/nucleo';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function ContadorAnimado({ valor, estilo }: { valor: number; estilo: object }) {
  const animado = useSharedValue(0);
  useEffect(() => {
    animado.value = withTiming(valor, { duration: 750, easing: Easing.out(Easing.quad) });
  }, [valor]);
  const props = useAnimatedProps(() => ({ value: Math.round(animado.value).toString() }));
  return <AnimatedTextInput animatedProps={props} editable={false} caretHidden style={estilo} />;
}

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function ItemVencimiento({ item }: { item: Pendiente }) {
  const colorCtx = CONTEXTOS[item.contexto]?.color ?? HOJAS.malvaGris;
  return (
    <View style={[styles.itemVenc, { borderLeftColor: colorCtx }]}>
      <Text style={styles.itemVencTit} numberOfLines={1}>{item.titulo}</Text>
      {item.fecha_limite ? (
        <Text style={styles.itemVencFecha}>{formatFecha(item.fecha_limite)}</Text>
      ) : null}
    </View>
  );
}

function ItemAgenda({ evento }: { evento: Evento }) {
  return (
    <View style={styles.agendaFila}>
      {evento.hora ? (
        <Text style={styles.agendaHora}>{evento.hora.slice(0, 5)}</Text>
      ) : (
        <Text style={styles.agendaHora}>—</Text>
      )}
      <Text style={styles.agendaTit} numberOfLines={1}>{evento.titulo}</Text>
      <ChipContexto contexto={evento.contexto} />
    </View>
  );
}

export default function Panel() {
  const router = useRouter();
  const today = aISO(new Date());
  const in7 = aISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const { data: pendientesActivos = [] } = usePendientes({ hecho: false });
  const { data: proyectos = [] } = useProyectos();
  const { data: notas = [] } = useNotas();
  const { data: eventosHoy = [] } = useEventos({ desde: today, hasta: today });
  const { data: ciclos = [] } = useCiclo();
  const { data: medicamentos = [] } = useMedicamentos();
  const { data: tomasHoy = [] } = useTomas(today);
  const { data: entrevistas = [] } = useEntrevistas();
  const manana = aISO(sumarDias(new Date(), 1));
  const entrevistasCercanas = entrevistas.filter((e) => e.fecha === today || e.fecha === manana);

  const prediccion = predecirCiclo(ciclos);
  const cicloProximo = prediccion !== null && prediccion.diasRestantes <= 3;
  const activos = medicamentos.filter((m) => m.activo);
  const tomasPendientes = activos.flatMap((m) => m.horarios).length - tomasHoy.length;
  const recordatoriosSalud = (cicloProximo ? 1 : 0) + (tomasPendientes > 0 ? 1 : 0);

  const vencidos = pendientesActivos.filter(
    (p) => p.fecha_limite && p.fecha_limite < today,
  ).length;
  const vencen7 = pendientesActivos.filter(
    (p) => p.fecha_limite && p.fecha_limite >= today && p.fecha_limite <= in7,
  ).length;
  const numActivos = pendientesActivos.length;
  const numProyActivos = proyectos.filter((p) => p.estado === 'activo').length;

  const proximosVencimientos = pendientesActivos.filter((p) => p.fecha_limite).slice(0, 5);
  const ultimasNotas = notas.slice(0, 3);

  return (
    <FondoFloral>
      <BarraMorris
        titulo="full emms"
        subtitulo="panel principal"
        onAccion={() => router.push('/respaldo')}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.kpis}>
          <KPICard etiqueta="Vencidos"    valor={vencidos}       color={HOJAS.vino} />
          <KPICard etiqueta="7 días"      valor={vencen7}        color={HOJAS.caramelo} />
          <KPICard etiqueta="Pendientes"  valor={numActivos}     color={SUCULENTAS.pizarra} />
          <KPICard etiqueta="Proyectos"   valor={numProyActivos} color={LAVANDA.ciruelaOscura} />
        </View>

        {/* Hoy en agenda */}
        <TouchableOpacity
          style={styles.seccion}
          onPress={() => router.push('/(tabs)/calendario?vista=dia')}
          activeOpacity={0.85}
        >
          <Text style={styles.seccionTit}>Hoy en agenda</Text>
          {eventosHoy.length === 0 ? (
            <Text style={styles.despejado}>día despejado</Text>
          ) : (
            eventosHoy.map((e) => <ItemAgenda key={e.id} evento={e} />)
          )}
        </TouchableOpacity>

        {proximosVencimientos.length > 0 ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTit}>Próximos vencimientos</Text>
            {proximosVencimientos.map((p) => (
              <ItemVencimiento key={p.id} item={p} />
            ))}
          </View>
        ) : null}

        {entrevistasCercanas.length > 0 && (
          <TouchableOpacity style={styles.seccion} onPress={() => router.push('/(tabs)/trabajo')} activeOpacity={0.85}>
            <Text style={styles.seccionTit}>Entrevistas próximas</Text>
            {entrevistasCercanas.map((e) => (
              <View key={e.id} style={styles.agendaFila}>
                <Text style={styles.agendaHora}>{e.fecha === today ? 'hoy' : 'mañana'}{e.hora ? ` · ${e.hora.slice(0, 5)}` : ''}</Text>
                <Text style={styles.agendaTit} numberOfLines={1}>{e.empresa} — {e.puesto}</Text>
              </View>
            ))}
          </TouchableOpacity>
        )}

        {recordatoriosSalud > 0 && (
          <TouchableOpacity style={styles.seccion} onPress={() => router.push('/(tabs)/salud')} activeOpacity={0.85}>
            <Text style={styles.seccionTit}>Salud: {recordatoriosSalud} recordatorio{recordatoriosSalud > 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.seccion}>
          <View style={styles.seccionCabecera}>
            <Text style={styles.seccionTit}>Últimas notas</Text>
            <TouchableOpacity onPress={() => router.push('/notas')}>
              <Text style={styles.verTodas}>ver todas</Text>
            </TouchableOpacity>
          </View>
          {ultimasNotas.length === 0 ? (
            <Text style={styles.vacio}>sin notas todavía…</Text>
          ) : (
            ultimasNotas.map((n) => (
              <View key={n.id} style={styles.notaCard}>
                <Text style={styles.notaTxt} numberOfLines={3}>{n.texto}</Text>
                <Text style={styles.notaFecha}>
                  {new Date(n.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <FABMono onPress={() => router.push('/notas')} />
    </FondoFloral>
  );
}

function KPICard({ etiqueta, valor, color }: { etiqueta: string; valor: number; color: string }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
      <ContadorAnimado valor={valor} estilo={[styles.kpiNum, { color }]} />
      <Text style={styles.kpiEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 14, paddingBottom: 100, gap: 16 },
  kpis: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flex: 1, backgroundColor: HOJAS.hueso, borderRadius: 10,
    borderTopWidth: 4, borderWidth: 1, borderColor: HOJAS.malvaGris,
    padding: 10, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  kpiNum: { ...TIPOGRAFIA.titulo, fontSize: 28, textAlign: 'center', minWidth: 40 },
  kpiEtiqueta: { ...TIPOGRAFIA.etiqueta, fontSize: 9, color: MORRIS.salviaMorris, textAlign: 'center' },
  seccion: {
    backgroundColor: 'rgba(238,231,225,0.80)',
    borderRadius: 12, padding: 14, gap: 8,
  },
  seccionCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seccionTit: { ...TIPOGRAFIA.titulo, fontSize: 15, color: MORRIS.granate },
  verTodas: { ...TIPOGRAFIA.firma, fontSize: 16, color: MORRIS.oliva },
  despejado: { ...TIPOGRAFIA.firma, fontSize: 18, color: HOJAS.salvia },
  agendaFila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  agendaHora: { ...TIPOGRAFIA.etiqueta, fontSize: 11, color: MORRIS.salviaMorris, minWidth: 40 },
  agendaTit: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta, flex: 1 },
  itemVenc: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 4, paddingLeft: 10, paddingVertical: 4,
  },
  itemVencTit: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta, flex: 1 },
  itemVencFecha: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.salviaMorris },
  notaCard: { backgroundColor: SUCULENTAS.rosaPalido, borderRadius: 8, padding: 10, gap: 4 },
  notaTxt: { ...TIPOGRAFIA.cuerpo, fontSize: 14, color: MORRIS.tinta },
  notaFecha: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.salviaMorris },
  vacio: { ...TIPOGRAFIA.firma, fontSize: 18, color: HOJAS.salvia, textAlign: 'center' },
});
