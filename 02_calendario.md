# 02_calendario.md — Fase 2 de full_emms
## Calendario mes / semana / día y agenda en el Panel

**Para Claude Code.** Requiere Fase 1 cerrada (checklist de `01_nucleo.md` completo). La tabla `eventos` ya existe desde la migración `0001_nucleo.sql`; esta fase no toca la base de datos. Si el repo no coincide con lo especificado en las fases 0 y 1, detente y repórtalo.

## Reglas de esta sesión
Las mismas de siempre: un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales con confirmación, commit y push a `master` al cerrar.

---

## Paso 1 — Utilidades de fecha
CREA `src/lib/fechas.ts` sin dependencias externas:
- Semana inicia en lunes. Helpers: `lunesDe(fecha)`, `rangoSemana(fecha)`, `rangoMes(fecha)`, `aISO(fecha)`, `esHoy(iso)`, formateadores en español (`7 jul`, `martes 7 de julio 2026`, meses y días abreviados en minúsculas como el prototipo).
- Todo en hora local del dispositivo; las fechas de eventos son `date` + `time` separados, nunca convertir a UTC.

## Paso 2 — Selector de vista
EDITA `app/(tabs)/calendario.tsx`: control segmentado arriba (pills estilo filtros del prototipo): **Mes | Semana | Día**, estado persistido en memoria de la sesión. Debajo, navegación `← anterior · [rango actual en Philosopher] · siguiente →` y botón "hoy" que regresa a la fecha actual. La vista activa se guarda para volver a ella al reabrir la pestaña.

## Paso 3 — Vista Mes
- Grid 7 columnas, encabezados lun–dom en etiqueta Nobile.
- Celdas: número en Philosopher, hasta 2 eventos en mini-pills (hora + título truncado, borde izquierdo pizarra), "+N más" en vino si hay más. Día de hoy con fondo celeste y borde pizarra. Días fuera del mes atenuados.
- En pantallas angostas (nativo), las celdas muestran solo número + punto vino si hay eventos.
- Tocar un día abre el **detalle de día** (Paso 5).

## Paso 4 — Vista Semana y vista Día
- **Semana:** 7 columnas (2 en móvil, como el prototipo), cada día lista sus eventos ordenados por hora; tocar evento lo edita, tocar el encabezado del día abre el detalle de día.
- **Día:** lista vertical del día seleccionado con hora, título, chip de contexto, chip de tipo (cita/entrevista/consulta/entreno/otro — cada tipo con color: entrevista pizarra, consulta rosa lavanda, entreno salvia, cita caramelo, otro malva gris), lugar si existe, y duración. Vacío en Zeyada salvia.

## Paso 5 — Detalle de día y formulario de evento
- Detalle de día: modal con la fecha completa en Philosopher, lista de eventos con botón editar, y botón granate "Agregar evento" con la fecha prellenada.
- Formulario (reutiliza `ModalFormulario`): título, fecha, hora opcional, duración en minutos opcional, tipo, contexto, lugar opcional. Crear, editar y borrar con confirmación.
- El FAB del mono en la pestaña Calendario abre el formulario con la fecha visible actualmente seleccionada.

## Paso 6 — Panel
EDITA `app/(tabs)/index.tsx`: agregar sección "Hoy en agenda" arriba de "Próximos vencimientos": eventos de hoy ordenados por hora con chip de contexto; vacío muestra "día despejado" en Zeyada. Tocar la sección navega a la pestaña Calendario en vista Día.

## Paso 7 — Sincronización visual
Invalidación de queries al crear/editar/borrar eventos para que Mes, Semana, Día y Panel queden consistentes sin recargar. Animación `FadeInDown` al cambiar de vista, respetando `prefers-reduced-motion` en web.

## Cierre de fase (checklist)
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Web y Android: crear un evento desde Mes, editarlo desde Semana, borrarlo desde Día — las tres vistas y el Panel reflejan cada cambio.
- [ ] Navegación de meses y semanas correcta cruzando cambio de año.
- [ ] "Hoy" resaltado correcto en las tres vistas y el botón "hoy" regresa desde cualquier fecha.
- [ ] Un evento creado en el teléfono aparece en web al recargar.
- [ ] Commit y push a `master`.

Al pasar el checklist, confirmar en el chat de planeación para recibir `03_finanzas.md`.
