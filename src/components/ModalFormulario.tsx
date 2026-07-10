import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HOJAS, MORRIS, SUCULENTAS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';

type Props = {
  visible: boolean;
  titulo: string;
  onGuardar: () => void;
  onCancelar: () => void;
  onBorrar?: () => void;
  guardando?: boolean;
  children: React.ReactNode;
};

export default function ModalFormulario({
  visible,
  titulo,
  onGuardar,
  onCancelar,
  onBorrar,
  guardando,
  children,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <Pressable style={styles.backdrop} onPress={onCancelar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centrar}
        pointerEvents="box-none"
      >
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>{titulo}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.cuerpo}>
            {children}
          </ScrollView>
          <View style={styles.acciones}>
            {onBorrar ? (
              <TouchableOpacity style={styles.btnBorrar} onPress={onBorrar}>
                <Text style={styles.txtBorrar}>Borrar</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <View style={styles.derechas}>
              <TouchableOpacity style={styles.btnCancelar} onPress={onCancelar}>
                <Text style={styles.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnGuardar, guardando && styles.btnDisabled]}
                onPress={onGuardar}
                disabled={guardando}
              >
                <Text style={styles.txtGuardar}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(67,67,47,0.45)',
  },
  centrar: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: HOJAS.hueso,
    borderRadius: 14,
    borderTopWidth: 4,
    borderTopColor: HOJAS.caramelo,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
  },
  titulo: {
    ...TIPOGRAFIA.titulo,
    fontSize: 18,
    color: MORRIS.granate,
    marginBottom: 14,
  },
  cuerpo: {
    maxHeight: 360,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  derechas: {
    flexDirection: 'row',
    gap: 10,
  },
  btnGuardar: {
    backgroundColor: MORRIS.granate,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnDisabled: { opacity: 0.55 },
  txtGuardar: {
    ...TIPOGRAFIA.etiqueta,
    color: MORRIS.cremaMorris,
    fontSize: 12,
  },
  btnCancelar: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
  },
  txtCancelar: {
    ...TIPOGRAFIA.etiqueta,
    color: MORRIS.tinta,
    fontSize: 12,
  },
  btnBorrar: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  txtBorrar: {
    ...TIPOGRAFIA.etiqueta,
    color: HOJAS.vino,
    fontSize: 11,
  },
});

export const estilosCampo = StyleSheet.create({
  campo: {
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    borderRadius: 8,
    padding: 11,
    fontSize: 15,
    color: MORRIS.tinta,
    backgroundColor: SUCULENTAS.crema,
    marginBottom: 12,
    fontFamily: 'BricolageGrotesque_400Regular',
  },
  etiqueta: {
    ...TIPOGRAFIA.etiqueta,
    fontSize: 10,
    color: MORRIS.tinta,
    marginBottom: 4,
  },
});
