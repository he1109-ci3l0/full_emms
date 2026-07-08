# 09_release.md — Fase 9 de full_emms
## Release: PWA en iPhone, build Android, respaldos y cierre

**Para Claude Code.** Requiere Fases 0–8 cerradas.

## Paso 0 — Verificación (obligatorio)
Verifica que todos los módulos funcionen en `npx expo start --web` y que las dos Edge Functions estén desplegadas. Si algo difiere, DETENTE y reporta desviaciones.

## Reglas de esta sesión
Un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales con confirmación, commit y push a `master`.

---

## Paso 1 — Identidad de la app
- Íconos: generar `icon.png` (1024×1024) y `adaptive-icon.png` a partir de `querubin_chat.jpg` centrado sobre fondo `MORRIS.cremaMorris` con anillo granate; splash con `tapiz_floral.jpg` y la placa del título.
- `app.json`: nombre "Emms", slug `full-emms`, scheme `fullemms`, colores de tema (statusBar tinta, fondo crema).

## Paso 2 — Web / PWA
- Export estático: `npx expo export --platform web`.
- `public/manifest.json`: nombre, íconos 192/512 (maskable), `display: standalone`, `theme_color` `#43432F`, `background_color` `#F5F0E4`; enlazar el service worker de la Fase 8 (push) + caché básica de assets para apertura sin red (los datos siguen requiriendo conexión).
- **Hosting (paso manual con la usuaria):** Vercel — importar el repo `full_emms` de GitHub, framework "Other", build `npx expo export --platform web`, output `dist`. Variables de entorno `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en el dashboard de Vercel. Confirmar que la URL pública carga y el login funciona.
- **Instalación en iPhone (instrucción para la usuaria):** abrir la URL en Safari → botón compartir → "Agregar a pantalla de inicio". Abrir desde el ícono (modo standalone) y en Ajustes → Activar notificaciones para registrar el push de iOS.

## Paso 3 — Android con EAS
**Pasos manuales con la usuaria:**
1. Cuenta en expo.dev (gratuita) y `npx eas login` en la Terminal de VSCode.
2. `npx eas init` para ligar el proyecto (genera `projectId`, necesario también para los push tokens de la Fase 8 — si la Fase 8 se probó con Expo Go, revalidar el token aquí).
3. CREA `eas.json` con perfil `preview` (APK instalable directo) y `production` (AAB).
4. `npx eas build -p android --profile preview` → descargar el APK del enlace e instalarlo en el Android (permitir instalación de origen desconocido).
5. Verificar notificaciones push en el build instalado (no en Expo Go).

## Paso 4 — Respaldo automático
CREA `supabase/functions/respaldo_mensual/index.ts`: con service role, exporta todas las tablas de la usuaria a un JSON y lo guarda en un bucket privado `respaldos` (crear bucket con política solo-service-role) con nombre `respaldo_YYYY_MM.json`; conservar los últimos 12. Programarla con pg_cron el día 1 de cada mes a las 03:00. En Ajustes → Respaldo: botón para descargar el último respaldo y el export/import manual existente.

## Paso 5 — Cierre del proyecto
- CREA `README.md`: qué es Emms, stack, estructura, cómo correr local, cómo desplegar (Vercel + EAS + Edge Functions), y el mapa de las 10 fases con sus .md.
- CREA `MANTENIMIENTO.md`: rotación de claves, cómo agregar una actividad física nueva, cómo agregar una tool nueva a la secretaria, cómo restaurar un respaldo, y qué revisar si algo falla (login, push, cron).
- Limpieza: `git grep` de claves, `.env.example` actualizado, dependencias sin usar fuera.

## Cierre de fase (checklist final del proyecto)
- [ ] Web en Vercel: login y los 8 módulos funcionan desde la URL pública.
- [ ] PWA instalada en el iPhone en modo standalone con notificaciones activas.
- [ ] APK instalado en el Android con notificaciones activas.
- [ ] La secretaria responde y ejecuta confirmaciones desde los tres dispositivos.
- [ ] Un cambio hecho en el iPhone aparece en web y Android.
- [ ] Respaldo mensual generado (ejecutar la función manualmente una vez y verificar el archivo en el bucket).
- [ ] README y MANTENIMIENTO completos; push final a `master`.

**Emms queda en producción.**
