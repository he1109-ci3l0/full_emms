import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BarraMorris from '../../src/components/BarraMorris';
import ChipContexto from '../../src/components/ChipContexto';
import FABMono from '../../src/components/FABMono';
import FondoFloral from '../../src/components/FondoFloral';
import ModalFormulario, { estilosCampo } from '../../src/components/ModalFormulario';
import {
  useBorrarProyecto,
  useCrearProyecto,
  useEditarProyecto,
  useProyectos,
} from '../../src/lib/api/nucleo';
import { CONTEXTOS_LISTA } from '../../src/lib/contextos';
import { HOJAS, MORRIS, SUCULENTAS } from '../../src/theme/colores';
import { TIPOGRAFIA } from '../../src/theme/tipografia';
import type { ContextoClave, EstadoProyecto, Proyecto } from '../../src/types/nucleo';

const ESTADOS: EstadoProyecto[] = ['activo', 'pausado', 'completado'];

const ETIQUETA_ESTADO: Record<EstadoProyecto, string> = {
  activo: 'Activo',
  pausado: 'Pausado',
  completado: 'Completado',
};

export default function Proyectos() {
  const { data: proyectos = [] } = useProyectos();
  const crear = useCrearProyecto();
  const editar = useEditarProyecto();
  const borrar = useBorrarProyecto();

  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Proyecto | null>(null);

  const [nombre, setNombre] = useState('');
  const [contexto, setContexto] = useState<ContextoClave>('personal');
  const [estado, setEstado] = useState<EstadoProyecto>('activo');
  const [nota, setNota] = useState('');

  function abrirNuevo() {
    setEditando(null);
    setNombre('');
    setContexto('personal');
    setEstado('activo');
    setNota('');
    setModalVisible(true);
  }

  function abrirEditar(p: Proyecto) {
    setEditando(p);
    setNombre(p.nombre);
    setContexto(p.contexto);
    setEstado(p.estado);
    setNota(p.nota ?? '');
    setModalVisible(true);
  }

  function cerrar() {
    setModalVisible(false);
    setEditando(null);
  }

  async function guardar() {
    const datos = {
      nombre: nombre.trim(),
      contexto,
      estado,
      nota: nota.trim() || null,
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

  return (
    <FondoFloral>
      <BarraMorris titulo="Proyectos" />

      <FlatList
        data={proyectos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <TarjetaProyecto proyecto={item} onEditar={() => abrirEditar(item)} />
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>sin proyectos aún…</Text>
        }
      />

      <FABMono onPress={abrirNuevo} />

      <ModalFormulario
        visible={modalVisible}
        titulo={editando ? 'Editar proyecto' : 'Nuevo proyecto'}
        onGuardar={guardar}
        onCancelar={cerrar}
        onBorrar={editando ? handleBorrar : undefined}
        guardando={guardando}
      >
        <Text style={estilosCampo.etiqueta}>Nombre</Text>
        <TextInput
          style={estilosCampo.campo}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del proyecto"
          placeholderTextColor={MORRIS.salviaMorris}
        />

        <Text style={estilosCampo.etiqueta}>Estado</Text>
        <View style={styles.selectorRow}>
          {ESTADOS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.opcion, estado === e && styles.opcionActiva]}
              onPress={() => setEstado(e)}
            >
              <Text style={[styles.opcionTxt, estado === e && styles.opcionTxtActivo]}>
                {ETIQUETA_ESTADO[e]}
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

        <Text style={estilosCampo.etiqueta}>Nota de avance (opcional)</Text>
        <TextInput
          style={[estilosCampo.campo, { height: 80, textAlignVertical: 'top' }]}
          value={nota}
          onChangeText={setNota}
          placeholder="Estado actual, próximo paso…"
          placeholderTextColor={MORRIS.salviaMorris}
          multiline
        />
      </ModalFormulario>
    </FondoFloral>
  );
}

function TarjetaProyecto({
  proyecto,
  onEditar,
}: {
  proyecto: Proyecto;
  onEditar: () => void;
}) {
  const { CONTEXTOS } = require('../../src/lib/contextos');
  const colorContexto: string = CONTEXTOS[proyecto.contexto]?.color ?? HOJAS.malvaGris;

  return (
    <View style={[styles.tarjeta, { borderLeftColor: colorContexto }]}>
      <View style={styles.cabecera}>
        <Text style={styles.nombre} numberOfLines={2}>{proyecto.nombre}</Text>
        <TouchableOpacity onPress={onEditar} style={styles.btnEditar}>
          <Text style={styles.editarTxt}>✎</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.fila}>
        <ChipContexto contexto={proyecto.contexto} />
        <View style={styles.estadoBadge}>
          <Text style={styles.estadoTxt}>{ETIQUETA_ESTADO[proyecto.estado]}</Text>
        </View>
      </View>
      {proyecto.nota ? (
        <Text style={styles.nota} numberOfLines={3}>{proyecto.nota}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { padding: 12, paddingBottom: 100 },
  vacio: {
    ...TIPOGRAFIA.firma,
    fontSize: 20,
    color: HOJAS.salvia,
    textAlign: 'center',
    marginTop: 40,
  },
  tarjeta: {
    backgroundColor: HOJAS.hueso,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    borderLeftWidth: 6,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nombre: { ...TIPOGRAFIA.titulo, fontSize: 16, color: MORRIS.tinta, flex: 1 },
  btnEditar: { paddingLeft: 8 },
  editarTxt: { fontSize: 18, color: MORRIS.salviaMorris },
  fila: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  estadoBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: SUCULENTAS.salviaClara,
  },
  estadoTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: SUCULENTAS.carbon },
  nota: { ...TIPOGRAFIA.cuerpo, fontSize: 13, color: MORRIS.oliva },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  opcion: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    backgroundColor: SUCULENTAS.crema,
  },
  opcionActiva: { backgroundColor: MORRIS.granate, borderColor: MORRIS.granate },
  opcionTxt: { ...TIPOGRAFIA.etiqueta, fontSize: 10, color: MORRIS.tinta },
  opcionTxtActivo: { color: HOJAS.hueso },
});
