import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image, ImageBackground } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MORRIS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';
import CampanaAlertas from './CampanaAlertas';

type Props = {
  titulo: string;
  subtitulo?: string;
  onAccion?: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const barraUri: string = require('../../assets/tapiz_morris_barra.jpg');

export default function BarraMorris({ titulo, subtitulo, onAccion }: Props) {
  const insets = useSafeAreaInsets();
  const pt = insets.top + 16;

  const innerContent = (
    <>
      <View style={s.placaRow}>
        <View style={s.placa}>
          <Text style={s.titulo}>{titulo}</Text>
          {subtitulo ? <Text style={s.subtitulo}>{subtitulo}</Text> : null}
        </View>
      </View>
      <View style={s.actionsRow}>
        <CampanaAlertas />
        {onAccion ? (
          <TouchableOpacity onPress={onAccion} style={[s.accionBtn, { marginLeft: 8 }]}>
            <Image
              source={require('../../assets/mono_sombrero.jpg')}
              style={s.accionImg}
              contentFit="cover"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[s.container, { paddingTop: pt }, s.webBg as any]}>
        {innerContent}
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/tapiz_morris_barra.jpg')}
      style={[s.container, { paddingTop: pt }]}
      contentFit="none"
      contentPosition="top left"
    >
      {innerContent}
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 4,
    borderBottomColor: MORRIS.granate,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  placaRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  placa: {
    backgroundColor: 'rgba(245,240,228,0.88)',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  titulo: { ...TIPOGRAFIA.titulo, fontSize: 22, color: MORRIS.granate },
  subtitulo: { ...TIPOGRAFIA.firma, fontSize: 16, color: MORRIS.oliva, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    minHeight: 48,
  },
  accionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: MORRIS.granate,
  },
  accionImg: { width: '100%', height: '100%' },
  webBg: {
    backgroundImage: `url(${barraUri})`,
    backgroundRepeat: 'repeat-x',
    backgroundSize: 'auto 100%',
    backgroundPosition: 'top left',
  } as any,
});
