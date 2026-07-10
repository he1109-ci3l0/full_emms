import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BarraMorris from '../../src/components/BarraMorris';
import FABMono from '../../src/components/FABMono';
import FilaPendiente from '../../src/components/FilaPendiente';
import FondoFloral from '../../src/components/FondoFloral';
import ModalFormulario, { estilosCampo } from '../../src/components/ModalFormulario';
import {
  useCrearPendiente,
  useEditarPendiente,
  useBorrarPendiente,
  usePendientes,
  useProyectos,
  useToggleHecho,
} from '../../src/lib/api/nucleo';
import { CONTEXTOS_LISTA } from '../../src/lib/contextos';
import { HOJAS, LAVANDA, MORRIS, SUCULENTAS } from '../../src/theme/colores';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import type { ContextoClave, Pendiente, Prioridad } from '../../src/types/nucleo';

type FiltroEstado = 'activos' | 'hechos' | 'todos';

const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

function pillEstado(actual: FiltroEstado, valor: FiltroEstado, label: string) {
  const activo = actual === valor;
  return { activo, label, valor };
}

export default function Pendientes() {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('activos');
  const [filtroCtx, setFiltroCtx] = useState<ContextoClave | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Pendiente | null>(null);

  const [titulo, setTitulo] = useState('');
  const [contexto, setContexto] = useState<ContextoClave>('personal');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [fechaLimite, setFechaLimite] = useState('');
  const [proyectoId, setProyectoId] = useState<string | undefined>(undefined);

  const filtros = {
    hecho: filtroEstado === 'todos' ? undefined : filtroEstado === 'hechos',
    contexto: filtroCtx,
  };
  const { data: pendientes = [] } = usePendientes(filtros);
  const { data: proyectos = [] } = useProyectos();
  const crear = useCrearPendiente();
  const editar = useEditarPendiente();
  const borrar = useBorrarPendiente();
  const toggle = useToggleHecho();

  const proyectosActivos = proyectos.filter((p) => p.estado === 'activo');

  function abrirNuevo() {
    setEditando(null);
    setTitulo('');
    setContexto('personal');
    setPrioridad('media');
    setFechaLimite('');
    setProyectoId(undefined);
    setModalVisible(true);
  }

  function abrirEditar(p: Pendiente) {
    setEditando(p);
    setTitulo(p.titulo);
    setContexto(p.contexto);
    setPrioridad(p.prioridad);
    setFechaLimite(p.fecha_limite ?? '');
    setProyectoId(p.proyecto_id ?? undefined);
    setModalVisible(true);
  }

  function cerrar() {
    setModalVisible(false);
    setEditando(null);
  }

  async function guardar() {
    const datos = {
      titulo: titulo.trim(),
      contexto,
      prioridad,
      fecha_limite: fechaLimite.trim() || null,
      proyecto_id: proyectoId ?? null,
      hecho: editando?.hecho ?? false,
    };
    if (editando) {
      await editar.mutateAsync({ id: editando.id, ...datos });
    } else {
      await crear.mutateAsync(datos);
    }
    cerrar();
  }

  async function handleBorrar() {
    if (!editando) return;
    await borrar.mutateAsync(editando.id);
    cerrar();
  }

  const guardando = crear.isPending || editar.isPending;

  const estadoPills: { activo: boolean; label: string; valor: FiltroEstado }[] = [
    pillEstado(filtroEstado, 'activos', 'Activos'),
    pillEstado(filtroEstado, 'hechos', 'Hechos'),
    pillEstado(filtroEstado, 'todos', 'Todos'),
  ];

  return (
    <FondoFloral>
      <BarraMorris titulo="Pendientes" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.barraFiltros}
        contentContainerStyle={styles.barraFiltrosInner}
      >
        {estadoPills.map(({ activo, label, valor }) => (
          <TouchableOpacity
            key={valor}
            style={[styles.pill, activo && styles.pillActivo]}
            onPress={() => setFiltroEstado(valor)}
          >
            <Text style={[styles.pillTxt, activo && styles.pillTxtActivo]}>{label}</Text>
          </TouchableOpacity>
        ))}

        {CONTEXTOS_LISTA.map((c) => {
          const activo = filtroCtx === c.clave;
          return (
            <TouchableOpacity
              key={c.clave}
              style={[styles.pill, activo && styles.pillActivo]}
              onPress={() => setFiltroCtx(activo ? undefined : c.clave)}
            >
              <Text style={[styles.pillTxt, activo && styles.pillTxtActivo]}>{c.etiqueta}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={pendientes}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <FilaPendiente
            item={item}
            onToggle={() => toggle.mutate({ id: item.id, hecho: !item.hecho })}
            onEditar={() => abrirEditar(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>sin pendientes por aquí…</Text>
        }
      />

      <FABMono onPress={abrirNuevo} />

      <ModalFormulario
        visible={modalVisible}
        titulo={editando ? 'Editar pendiente' : 'Nuevo pendiente'}
        onGuardar={guardar}
        onCancelar={cerrar}
        onBorrar={editando ? handleBorrar : undefined}
        guardando={guardando}
      >
        <Text style={estilosCampo.etiqueta}>Qué hay que hacer</Text>
        <TextInput
          style={estilosCampo.campo}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Título"
          placeholderTextColor={MORRIS.salviaMorris}
          multiline
        />

        <Text style={estilosCampo.etiqueta}>Prioridad</Text>
        <View style={styles.selectorRow}>
          {PRIORIDADES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.opcion, prioridad === p && styles.opcionActiva]}
              onPress={() => setPrioridad(p)}
            >
              <Text style={[styles.opcionTxt, prioridad === p && styles.opcionTxtActivo]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={estilosCampo.etiqueta}>Contexto</Text>
        <View style={styles.selectorRow}>
          {CONTEXTOS_LISTA.map((c) => (
            <TouchableOpacity
              key={c.clave}
              style={[styles.opcion, contexto === c.clave && styles.opcionActiva]}
              onPress={() => setContexto(c.clave)}
            >
              <Text style={[styles.opcionTxt, contexto === c.clave && styles.opcionTxtActivo]}>
                {c.etiqueta}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={estilosCampo.etiqueta}>Fecha límite (AAAA-MM-DD, opcional)</Text>
        <TextInput
          style={estilosCampo.campo}
          value={fechaLimite}
          onChangeText={setFechaLimite}
          placeholder="2025-12-31"
          placeholderTextColor={MORRIS.salviaMorris}
          keyboardType="numeric"
        />

        {proyectosActivos.length > 0 ? (
          <>
            <Text style={estilosCampo.etiqueta}>Proyecto (opcional)</Text>
            <View style={styles.selectorRow}>
              <TouchableOpacity
                style={[styles.opcion, !proyectoId && styles.opcionActiva]}
                onPress={() => setProyectoId(undefined)}
              >
                <Text style={[styles.opcionTxt, !proyectoId && styles.opcionTxtActivo]}>
                  Ninguno
                </Text>
              </TouchableOpacity>
              {proyectosActivos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.opcion, proyectoId === p.id && styles.opcionActiva]}
                  onPress={() => setProyectoId(p.id)}
                >
                  <Text style={[styles.opcionTxt, proyectoId === p.id && styles.opcionTxtActivo]}>
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}
      </ModalFormulario>
    </FondoFloral>
  );
}

const styles = StyleSheet.create({
  barraFiltros: { maxHeight: 48 },
  barraFiltrosInner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  pillActivo: {
    backgroundColor: LAVANDA.ciruelaOscura,
    borderColor: LAVANDA.ciruelaOscura,
  },
  pillTxt: {
    ...TIPOGRAFIA.etiqueta,
    fontSize: 10,
    color: MORRIS.tinta,
  },
  pillTxtActivo: { color: HOJAS.hueso },
  lista: { padding: 12, paddingBottom: 100 },
  vacio: {
    ...TIPOGRAFIA.firma,
    fontSize: 20,
    color: HOJAS.salvia,
    textAlign: 'center',
    marginTop: 40,
  },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  opcion: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    backgroundColor: SUCULENTAS.crema,
  },
  opcionActiva: {
    backgroundColor: MORRIS.granate,
    borderColor: MORRIS.granate,
  },
  opcionTxt: {
    ...TIPOGRAFIA.etiqueta,
    fontSize: 10,
    color: MORRIS.tinta,
  },
  opcionTxtActivo: { color: HOJAS.hueso },
});
