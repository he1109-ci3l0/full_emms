import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { ImageBackground } from 'expo-image';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { MORRIS, HOJAS, SUCULENTAS } from '../src/theme/colores';
import { TIPOGRAFIA } from '../src/theme/tipografia';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/(tabs)/');
    }
  }

  return (
    <ImageBackground
      source={require('../assets/tapiz_floral.jpg')}
      style={styles.bg}
      contentFit="cover"
    >
      <View style={styles.velo} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centrar}
      >
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>full emms</Text>
          <TextInput
            style={styles.campo}
            placeholder="Correo"
            placeholderTextColor={MORRIS.salviaMorris}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.campo}
            placeholder="Contraseña"
            placeholderTextColor={MORRIS.salviaMorris}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.boton, loading && styles.botonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.botonTexto}>{loading ? 'Entrando…' : 'Entrar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  velo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(234,228,220,0.42)',
  },
  centrar: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  tarjeta: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: HOJAS.hueso,
    borderRadius: 12,
    borderTopWidth: 4,
    borderTopColor: MORRIS.granate,
    padding: 28,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  titulo: {
    ...TIPOGRAFIA.titulo,
    fontSize: 28,
    color: MORRIS.granate,
    textAlign: 'center',
    marginBottom: 8,
  },
  campo: {
    borderWidth: 1,
    borderColor: HOJAS.malvaGris,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: MORRIS.tinta,
    backgroundColor: SUCULENTAS.crema,
  },
  boton: {
    backgroundColor: MORRIS.granate,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botonDisabled: { opacity: 0.6 },
  botonTexto: {
    ...TIPOGRAFIA.etiqueta,
    color: MORRIS.cremaMorris,
    fontSize: 14,
  },
});
