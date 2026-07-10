import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ImageBackground, Image } from 'expo-image';
import { MORRIS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  titulo: string;
  subtitulo?: string;
  onAccion?: () => void;
};

export default function BarraMorris({ titulo, subtitulo, onAccion }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require('../../assets/tapiz_morris_barra.jpg')}
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentFit="cover"
      contentPosition="top"
    >
      <View style={styles.placa}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {onAccion ? (
        <TouchableOpacity onPress={onAccion} style={styles.accionBtn}>
          <Image
            source={require('../../assets/mono_sombrero.jpg')}
            style={styles.accionImg}
            contentFit="cover"
          />
        </TouchableOpacity>
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 12,
    borderBottomWidth: 4,
    borderBottomColor: MORRIS.granate,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  placa: {
    backgroundColor: 'rgba(245,240,228,0.88)',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  titulo: {
    ...TIPOGRAFIA.titulo,
    fontSize: 22,
    color: MORRIS.granate,
  },
  subtitulo: {
    ...TIPOGRAFIA.firma,
    fontSize: 16,
    color: MORRIS.oliva,
    marginTop: 2,
  },
  accionBtn: {
    position: 'absolute',
    right: 14,
    bottom: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: MORRIS.granate,
  },
  accionImg: { width: '100%', height: '100%' },
});
