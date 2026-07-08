# PLAN_MAESTRO_AGENTE.md
## Secretaria digital de ci3l0 — fuente de verdad

**Proyecto:** `full_emms` (carpeta creada)
**Objetivo:** agente personal completo — proyectos, agenda/calendario, pendientes, finanzas, salud, bienestar, trabajo — con chat tipo secretaria que interpreta lenguaje natural, escribe en el módulo correcto y manda alertas.
**Plataformas:** web + Android (EAS build) + iPhone (PWA instalada, sin cuenta Apple Developer).

---

## 1. Stack (decidido por continuidad con Antioquia 43 y Los Cipreses)

| Capa | Tecnología |
|---|---|
| App | Expo SDK 54 + React Native + TypeScript, una sola base de código (nativo + web) |
| Backend | Supabase: PostgreSQL, Auth, RLS, Edge Functions, Realtime, Storage |
| Agente | Edge Function `secretaria` → API Anthropic (claude-sonnet-4-6) con tool use |
| Alertas | Tabla `alertas` + pg_cron (cada 15 min) → expo-notifications (Android) + Web Push (iOS PWA / web) |
| Estado local | TanStack Query + Supabase client |
| Entorno | Mac / VSCode / Terminal. Claude Code ejecuta archivos .md desde la raíz del repo |

**Costos reales:** Supabase free tier alcanza para una usuaria. API Anthropic: uso personal de chat ≈ pocos USD/mes (se monitorea en console.anthropic.com). EAS: builds gratuitos limitados/mes.

---

## 2. Identidad visual

- **Fondo global:** tapiz floral (celadón con ramas). **Barra principal:** tapiz Morris (pájaros visibles, corte a media flor).
- **Paletas (16 tonos, íntegras):**
  - Suculentas: `#EAE4DC` `#EFD4D8` `#B38EA1` `#333A3F` `#577079` `#AFBCB2`
  - Hojas: `#EEE7E1` `#C79D7A` `#76343E` `#634B5D` `#859289` `#C4B1B2`
  - Lavanda: `#99B1B4` `#B8CFCF` `#534556` `#D0B0BD` `#D3C1B0`
  - Morris (barra): granate `#672D38`, oliva `#76735D`, tinta `#43432F`, salvia `#979E90`, crema `#F5F0E4`, ocre `#C4A470`
- **Roles:** salvias/aquas = ambiente y contextos; oscuros (carbón, tinta, ciruela) = texto y navegación; vino = prioridad alta/vencidos; caramelo = media/acentos; rosas = notas y firma.
- **Tipografía:** Philosopher (títulos), Bricolage Grotesque (cuerpo), Nobile (etiquetas), Zeyada (acento manuscrito).
- **Acento dinámico por módulo** con transición (patrón ya implementado en el Gabinete HTML, que queda como prototipo visual de referencia; todas las ventanas y botones nuevos heredan este lenguaje).
- **Monos:** copa = agregar (FAB), sombrero de copa = respaldo/configuración.
- **Querubín = botón del chat secretaria:** burbuja flotante circular arrastrable a cualquier punto de la pantalla (gesto con react-native-gesture-handler + Reanimated), con imán suave a los bordes, badge de mensajes pendientes, y posición persistida en `preferencias`. Al tocarlo se expande la ventana de chat; al cerrarla vuelve a ser el querubín donde la usuaria lo dejó.
- **Assets (`assets/` del repo, entregados en assets_full_emms.zip):** `tapiz_floral.jpg` (fondo global), `tapiz_morris_barra.jpg` (barra principal, pájaros a media flor, x2 retina), `tapiz_morris_completo.jpg` (reserva), `mono_copa.jpg`, `mono_sombrero.jpg`, `querubin_chat.jpg`.

---

## 3. Modelo de datos (todas las tablas llevan `id uuid pk`, `user_id uuid`, `created_at`, `updated_at`; RLS: `user_id = auth.uid()` en todo)

### 3.1 Núcleo
- `proyectos` — nombre, contexto, estado (activo/pausado/completado), nota
- `pendientes` — titulo, contexto, prioridad (alta/media/baja), fecha_limite date?, hecho bool, proyecto_id?
- `eventos` — titulo, fecha, hora?, duracion_min?, contexto, lugar?, tipo (cita/entrevista/consulta/entreno/otro), vinculo_id? (fk polimórfica suave a consultas/entrevistas)
- `notas` — texto, contexto

### 3.2 Chat secretaria
- `conversaciones` — asunto (generado por el agente), iniciada_en, ultima_actividad
- `mensajes` — conversacion_id, rol (usuaria/agente), texto, adjuntos jsonb?
- `acciones_agente` — conversacion_id, tipo_accion, payload jsonb, estado (propuesta/confirmada/aplicada/rechazada), tabla_destino, registro_id?
- Índice full-text en español sobre `mensajes.texto` y `conversaciones.asunto` (búsqueda por nombre, fecha, asunto)

### 3.3 Finanzas
- `cuentas` — nombre, tipo (efectivo/débito/crédito/inversión/ahorro), saldo_inicial
- `movimientos` — cuenta_id, tipo (ingreso/gasto/transferencia), monto, categoria, fecha, concepto, contexto (permite ligar gastos a Antioquia 43, consultoría, etc.)
- `cobranzas` — deudor (ej. "Hab 06"), concepto, monto, fecha_limite, estado (pendiente/parcial/pagado/vencido), contexto
- `pagos_programados` — acreedor, concepto, monto, fecha_limite, recurrencia?, estado
- `metas` — nombre, monto_objetivo, monto_actual, fecha_objetivo?
- `deudas` — acreedor, monto_original, saldo, tasa?, pago_minimo?, fecha_corte?
- `inversiones` — instrumento, monto, fecha_entrada, rendimiento_esperado?, notas
- `historial_crediticio` — fecha_consulta, buro, score, notas (registro manual periódico)

### 3.4 Salud
- `ciclo` — fecha_inicio, duracion_dias?, sintomas jsonb?, notas → el agente calcula predicción y alerta
- `medicamentos` — nombre, dosis, frecuencia, horario jsonb, activo bool, motivo?
- `tomas` — medicamento_id, timestamp, tomada bool
- `medicos` — nombre, especialidad, telefono?, consultorio?, tarifa_consulta?
- `procedimientos` — nombre, tipo (cirugía/estética/láser/podología/dental/otro), medico_id?, fecha_tentativa?, estado (explorando/cotizado/agendado/realizado), notas
- `presupuestos_medicos` — procedimiento_id, concepto, monto, incluye jsonb (consulta, insumos, anestesia…), vigencia? → presupuesto total por procedimiento se arma sumando partidas; consultas agendadas se crean como `eventos` tipo consulta con vinculo_id
- `ahorro_medico` — vista sobre `metas` con etiqueta médica (no tabla nueva)

### 3.5 Bienestar
- `entrenamientos` — fecha, actividad (pesas/natación/pilates/barre/estiramientos/yoga/sprints/acondicionamiento/baile/otra — catálogo editable), duracion_min, lugar, intensidad (1–5), notas
- `nutricion` — fecha, registro texto libre + etiquetas jsonb (cómo comí), suplementos_tomados jsonb
- `suplementos` — nombre, dosis, existencias?, recompra_fecha?
- `animo` — fecha, nivel (1–5), texto (cómo me siento)
- `sueno` — fecha, hora_dormir, hora_despertar, calidad (1–5), higiene jsonb (checklist: pantallas, cafeína tarde, horario regular, cuarto oscuro…)
- `sustancias` — fecha, sustancia, cantidad, contexto_consumo?, notas → registro privado de la usuaria, cifrado
- Vista semanal agregada: tiempo total, distribución por actividad, lugares, intensidad media

### 3.6 Trabajo
- `contratos` — cliente/empresa, rol, tipo (consultoría/nómina/proyecto), inicio, fin?, tarifa?, estado
- `entrevistas` — empresa, puesto, fecha, hora, medio (presencial/videollamada), etapa, resultado?, notas → cada entrevista genera automáticamente un `evento`

### 3.7 Sistema
- `alertas` — origen (tabla+id), mensaje, dispara_en timestamptz, enviada bool, canal (push/badge)
- `preferencias` — jsonb (horas de silencio, canal por tipo de alerta, actividad física catálogo…)

---

## 4. Secretaria (Edge Function `secretaria`)

1. Recibe mensaje + historial de la conversación en turno.
2. Llama a la API Anthropic con **tools** (JSON schema): `crear_pendiente`, `crear_evento`, `registrar_gasto`, `registrar_cobranza`, `registrar_entrenamiento`, `registrar_sueno`, `agendar_consulta`, `crear_presupuesto_medico`, `consultar` (lectura), etc. Una tool por tabla de escritura.
3. Toda escritura se guarda primero como `acciones_agente.estado='propuesta'`; el chat muestra tarjeta de confirmación ("¿Agendo podólogo jueves 17:00?"). Al confirmar → `aplicada` y se inserta en la tabla destino. **La secretaria nunca escribe sin confirmación.**
4. Genera `asunto` de la conversación al cierre para el historial buscable.
5. Alertas proactivas: reglas SQL (pg_cron) — vencimientos de pendientes/cobranzas/pagos, tomas de medicamento, predicción de ciclo, entrevistas próximas, recompra de suplementos, recordatorio de registro de sueño/ánimo si hay 3+ días sin captura.

**UI del chat:** burbuja flotante estilo Messenger — minimizada es botón (mono de la copa con badge), expandida es ventana con la conversación en turno. Pestaña "Chats" con historial y buscador (nombre, fecha, asunto).

---

## 5. Seguridad y privacidad (no negociable, desde el día uno)

- RLS activa en el 100% de las tablas antes del primer insert. Sin excepciones tipo `isAdmin()` amplias (lección de Antioquia 43).
- Columnas sensibles (`sustancias`, `ciclo.sintomas`, `historial_crediticio.score`, montos si se decide) cifradas con pgsodium.
- API key de Anthropic solo en secrets de Edge Functions, jamás en el cliente.
- Respaldo: export JSON mensual automático a Storage privado.
- Migración inicial: importador del JSON del Gabinete HTML (proyectos, pendientes, eventos, notas).

---

## 6. Fases de ejecución (un .md por fase; el chat genera cada .md, Claude Code lo ejecuta)

| Fase | Archivo | Contenido | Cierre de fase |
|---|---|---|---|
| 0 | `00_setup.md` | Repo, Expo+TS, Supabase project, Auth, esquema de navegación, tema visual (paletas, fuentes, tapices) | app corre en web y Expo Go |
| 1 | `01_nucleo.md` | Tablas núcleo + RLS, CRUD proyectos/pendientes/notas, importador JSON del Gabinete | paridad con el Gabinete |
| 2 | `02_calendario.md` | Eventos, vistas mes/semana/día, panel resumen | agenda funcional |
| 3 | `03_finanzas.md` | 8 tablas finanzas, capturas, dashboard, cobranza Antioquia 43 | flujo de dinero visible |
| 4 | `04_salud.md` | Ciclo, medicamentos, médicos, procedimientos, presupuestos médicos | presupuesto estética end-to-end |
| 5 | `05_bienestar.md` | Entrenos, nutrición, suplementos, ánimo, sueño e higiene, sustancias, vista semanal | semana de bienestar completa |
| 6 | `06_trabajo.md` | Contratos, entrevistas → eventos automáticos | módulo trabajo |
| 7 | `07_secretaria.md` | Edge Function + tools + chat flotante + historial buscable + confirmaciones | "agéndame X" funciona |
| 8 | `08_alertas.md` | pg_cron, reglas, push Android + Web Push iOS PWA | notificaciones en ambos teléfonos |
| 9 | `09_release.md` | PWA manifest/instalación iPhone, EAS build Android, respaldos automáticos | instalada en los 3 dispositivos |

**Regla de dependencia:** la secretaria (fase 7) va después de los módulos porque necesita las tablas existentes para escribir en ellas.

---

## 7. Reglas de trabajo (heredadas, no negociables)

1. Un .md a la vez; confirmación antes de aplicar el siguiente.
2. Cada cambio: aplicar → `npx tsc --noEmit` → revisión de diff → commit → push.
3. Sin comentarios inline en código.
4. Diagnosticar antes de proponer arreglos.
5. Especificar dónde se ejecuta cada instrucción (Terminal Mac, Terminal VSCode, Supabase dashboard, navegador).
6. RANDOM no aplica aquí, pero la disciplina de nombres sí: tablas y columnas en español, snake_case.
7. Nada de features fuera del .md en turno.
8. Verbos explícitos en instrucciones de edición: CREA / REEMPLAZA / ELIMINA / EDITA + ruta del archivo.
9. Los módulos sellados de otros proyectos no se tocan; este repo es independiente.
10. Todo secreto va en `.env` local y en secrets de Supabase/EAS, nunca en el repo.

---

## 8. Estado actual

- ✅ Gabinete HTML v2 (puente): rediseño Morris, calendario mensual, transiciones, export/import JSON.
- ⬜ Fase 0 pendiente de arranque — requiere: crear proyecto Supabase nuevo y confirmar nombre definitivo del agente.
