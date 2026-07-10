import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MORRIS } from '../theme/colores';
import { TIPOGRAFIA } from '../theme/tipografia';

type AvisoCtxValue = { mostrar: (msg: string) => void };
const AvisoCtx = createContext<AvisoCtxValue>({ mostrar: () => {} });

export function useAviso() {
  return useContext(AvisoCtx);
}

export function AvisoProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mostrar = useCallback((texto: string) => {
    setMsg(texto);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3500);
  }, []);

  return (
    <AvisoCtx.Provider value={{ mostrar }}>
      {children}
      {msg ? (
        <View pointerEvents="none" style={styles.pill}>
          <Text style={styles.texto}>{msg}</Text>
        </View>
      ) : null}
    </AvisoCtx.Provider>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: MORRIS.tinta,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    maxWidth: '80%',
    zIndex: 999,
  },
  texto: {
    ...TIPOGRAFIA.etiqueta,
    color: MORRIS.cremaMorris,
    fontSize: 13,
    textAlign: 'center',
  },
});
