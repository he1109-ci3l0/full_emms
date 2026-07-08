# 00_setup.md — Fase 0 de full_emms
## Scaffold, tema visual, Supabase y navegación base

**Para Claude Code.** Ejecuta este archivo dentro de la carpeta `full_emms` (ya existe). No avances a ninguna funcionalidad de módulos: esta fase termina con la app corriendo vacía pero con identidad visual, login y navegación.

## Reglas de esta sesión (no negociables)
1. Un paso a la vez, en el orden de este archivo.
2. Después de cada bloque de código: `npx tsc --noEmit`. Si falla, arreglar antes de continuar.
3. Sin comentarios inline en el código.
4. Todo secreto va en `.env`; jamás en el repo.
5. Al terminar: commit y push a `master` (no `main`).
6. La usuaria no tiene formación formal en programación: cuando un paso sea manual (navegador, dashboard de Supabase), detente y dale la instrucción exacta indicando dónde se hace (Terminal de VSCode, navegador, etc.) y espera su confirmación.

---

## Paso 1 — Verificación de entorno
**Dónde: Terminal de VSCode, dentro de `full_emms`.**
```bash
node -v
npm -v
git --version
```
Se requiere Node 20+. Si falta algo, detente e indica a la usuaria cómo instalarlo con Homebrew.

## Paso 2 — Scaffold Expo
**Dónde: Terminal de VSCode, dentro de `full_emms`.**
```bash
npx create-expo-app@latest . --template blank-typescript
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npx expo install react-native-gesture-handler react-native-reanimated
npx expo install expo-font expo-image expo-secure-store
npm install @supabase/supabase-js @tanstack/react-query
npm install @expo-google-fonts/philosopher @expo-google-fonts/bricolage-grotesque @expo-google-fonts/nobile @expo-google-fonts/zeyada
```
Si alguno de los paquetes `@expo-google-fonts/*` no existe en el registro, descargar los TTF de Google Fonts a `assets/fonts/` y cargarlos con `expo-font`; no bloquear la fase por esto.

Configurar `package.json` con `"main": "expo-router/entry"` y habilitar el plugin de Reanimated en `babel.config.js`.

## Paso 3 — Estructura de carpetas
CREA esta estructura:
```
full_emms/
  app/                 (rutas expo-router)
    _layout.tsx
    login.tsx
    (tabs)/
      _layout.tsx
      index.tsx        (Panel)
      proyectos.tsx
      pendientes.tsx
      calendario.tsx
      finanzas.tsx
      salud.tsx
      bienestar.tsx
      trabajo.tsx
  src/
    theme/
      colores.ts
      tipografia.ts
      acentos.ts
    lib/
      supabase.ts
    components/
      BarraMorris.tsx
      Tarjeta.tsx
  assets/              (la usuaria descomprime aquí assets_full_emms.zip)
  supabase/
    migrations/        (vacía en esta fase)
  .env
  .env.example
```
**Paso manual para la usuaria:** descomprimir `assets_full_emms.zip` dentro de `assets/` (doble clic al zip en Finder y arrastrar los 6 archivos). Confirmar antes de seguir.

## Paso 4 — Tema visual
CREA `src/theme/colores.ts` exportando las cuatro paletas como constantes tipadas:
```ts
export const SUCULENTAS = {
  crema: '#EAE4DC', rosaPalido: '#EFD4D8', malva: '#B38EA1',
  carbon: '#333A3F', pizarra: '#577079', salviaClara: '#AFBCB2',
} as const;

export const HOJAS = {
  hueso: '#EEE7E1', caramelo: '#C79D7A', vino: '#76343E',
  ciruela: '#634B5D', salvia: '#859289', malvaGris: '#C4B1B2',
} as const;

export const LAVANDA = {
  aqua: '#99B1B4', celeste: '#B8CFCF', ciruelaOscura: '#534556',
  rosaLavanda: '#D0B0BD', arena: '#D3C1B0',
} as const;

export const MORRIS = {
  granate: '#672D38', oliva: '#76735D', tinta: '#43432F',
  salviaMorris: '#979E90', cremaMorris: '#F5F0E4', ocre: '#C4A470',
} as const;
```
CREA `src/theme/acentos.ts` con el acento por módulo (mismo patrón del prototipo):
panel `MORRIS.oliva`, proyectos `SUCULENTAS.malva`, pendientes `HOJAS.vino`, calendario `HOJAS.caramelo`, finanzas `LAVANDA.aqua`, salud `LAVANDA.rosaLavanda`, bienestar `HOJAS.salvia`, trabajo `SUCULENTAS.pizarra`, chat `MORRIS.granate`.

CREA `src/theme/tipografia.ts` con los roles: `titulo` Philosopher 700, `cuerpo` BricolageGrotesque 400, `etiqueta` Nobile 500 (mayúsculas, letter-spacing), `firma` Zeyada.

## Paso 5 — Supabase (proyecto nuevo)
**Paso manual para la usuaria, en el navegador:**
1. Entrar a supabase.com → New project → nombre `full-emms`, región más cercana, contraseña de base de datos generada y guardada en su gestor de contraseñas.
2. En Project Settings → API: copiar `Project URL` y `anon public key`.
3. En Authentication → Providers: dejar solo Email habilitado. En Authentication → Users → Add user: crear su usuario con su correo y contraseña.

CREA `.env` (y `.env.example` sin valores):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```
AGREGA `.env` a `.gitignore`.

CREA `src/lib/supabase.ts` con el cliente usando `expo-secure-store` como storage de sesión en nativo y el storage por defecto en web.

## Paso 6 — Login y navegación
CREA `app/login.tsx`: pantalla con `tapiz_floral.jpg` de fondo (velo crema `rgba(234,228,220,0.42)`), tarjeta central estilo prototipo (fondo `HOJAS.hueso`, borde superior 4px del acento, radio 12), campos correo/contraseña, botón granate. Login con `supabase.auth.signInWithPassword`. Sin registro público: los usuarios se crean solo desde el dashboard.

CREA `src/components/BarraMorris.tsx`: header con `tapiz_morris_barra.jpg` como `ImageBackground` (repetición horizontal, pájaros visibles arriba), placa crema translúcida con el título en Philosopher granate y subtítulo Zeyada oliva, borde inferior 4px granate.

CREA `app/(tabs)/_layout.tsx`: tabs con las 8 rutas, protegidas por sesión (sin sesión → redirect a login). Barra de tabs fondo `MORRIS.tinta` con ítem activo en crema/granate. Cada pantalla usa `BarraMorris` y por ahora solo muestra una `Tarjeta` con el nombre del módulo y su color de acento, con transición de opacidad al entrar (Reanimated `FadeInDown`).

CREA `src/components/Tarjeta.tsx`: contenedor reutilizable idéntico al prototipo (hueso, borde `HOJAS.malvaGris`, borde superior 4px en el acento recibido por prop, sombra suave, radio 12).

El querubín del chat NO se implementa en esta fase (es fase 7); no crear placeholders.

## Paso 7 — Git
**Dónde: Terminal de VSCode.**
```bash
git init -b master
git add -A
git commit -m "fase 0: scaffold, tema visual, supabase, navegacion"
```
**Paso manual para la usuaria:** crear repo privado `full_emms` en GitHub (cuenta he1109-ci3l0) y confirmar. Luego:
```bash
git remote add origin git@github.com:he1109-ci3l0/full_emms.git
git push -u origin master
```

## Cierre de fase (checklist — todos deben pasar)
- [ ] `npx tsc --noEmit` sin errores.
- [ ] `npx expo start --web`: login funciona con el usuario creado y se ven las 8 pestañas con sus acentos y fuentes correctas.
- [ ] `npx expo start` + Expo Go en el teléfono Android: misma verificación.
- [ ] La barra Morris muestra los pájaros y el texto de la placa se lee perfecto.
- [ ] `.env` NO aparece en `git status`.
- [ ] Push a `master` hecho.

Al completar el checklist, la usuaria vuelve al chat de planeación y confirma para recibir `01_nucleo.md`.
