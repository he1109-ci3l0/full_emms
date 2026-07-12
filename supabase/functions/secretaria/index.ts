import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const TZ = 'America/Mexico_City';

function fechaHoy(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TZ });
}

function fechaManana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('sv-SE', { timeZone: TZ });
}

// Tablas y columnas que se pueden escribir (lista blanca)
const TABLAS_ESCRITURA: Record<string, string[]> = {
  pendientes: ['titulo', 'contexto', 'prioridad', 'fecha_limite', 'proyecto_id', 'notas'],
  eventos: ['titulo', 'fecha', 'hora', 'duracion_min', 'contexto', 'lugar', 'tipo', 'vinculo_id'],
  notas: ['texto', 'contexto', 'proyecto_id'],
  movimientos: ['cuenta_id', 'fecha', 'concepto', 'monto', 'tipo', 'contexto', 'etiquetas', 'notas'],
  cobranzas: ['cliente', 'concepto', 'monto', 'fecha_emision', 'fecha_vencimiento', 'estado', 'notas'],
  pagos_programados: ['concepto', 'monto', 'periodicidad', 'proximo_pago', 'activo', 'notas'],
  entrenamientos: ['fecha', 'actividad', 'duracion_min', 'lugar', 'intensidad', 'notas'],
  sueno: ['fecha', 'hora_dormir', 'hora_despertar', 'calidad', 'higiene'],
  animo: ['fecha', 'nivel', 'texto'],
  procedimientos: ['titulo', 'fecha', 'medico_id', 'resultado', 'notas'],
  consultas: ['fecha', 'hora', 'medico_id', 'motivo', 'notas'],
  entrevistas: ['empresa', 'puesto', 'fecha', 'hora', 'medio', 'etapa', 'resultado', 'notas'],
};

const TABLAS_LECTURA = [
  'pendientes', 'eventos', 'notas', 'proyectos', 'movimientos', 'cuentas',
  'cobranzas', 'pagos_programados', 'entrenamientos', 'sueno', 'animo',
  'nutricion', 'suplementos', 'medicamentos', 'tomas', 'procedimientos',
  'consultas', 'medicos', 'contratos', 'entrevistas', 'conversaciones', 'mensajes',
];

const tools: Anthropic.Tool[] = [
  {
    name: 'crear_pendiente',
    description: 'Crea un pendiente nuevo para la usuaria.',
    input_schema: {
      type: 'object' as const,
      properties: {
        titulo: { type: 'string' },
        contexto: { type: 'string', enum: ['portafolio','antioquia','cipreses','consultoria','legal','bootcamp','personal'] },
        prioridad: { type: 'string', enum: ['alta','media','baja'] },
        fecha_limite: { type: 'string', description: 'AAAA-MM-DD' },
        notas: { type: 'string' },
      },
      required: ['titulo', 'contexto'],
    },
  },
  {
    name: 'completar_pendiente',
    description: 'Marca un pendiente como completado por su ID.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'crear_evento',
    description: 'Crea un evento en el calendario.',
    input_schema: {
      type: 'object' as const,
      properties: {
        titulo: { type: 'string' },
        fecha: { type: 'string', description: 'AAAA-MM-DD' },
        hora: { type: 'string', description: 'HH:MM' },
        duracion_min: { type: 'number' },
        contexto: { type: 'string', enum: ['portafolio','antioquia','cipreses','consultoria','legal','bootcamp','personal'] },
        lugar: { type: 'string' },
        tipo: { type: 'string', enum: ['cita','entrevista','consulta','entreno','otro'] },
      },
      required: ['titulo', 'fecha', 'contexto'],
    },
  },
  {
    name: 'crear_nota',
    description: 'Guarda una nota.',
    input_schema: {
      type: 'object' as const,
      properties: {
        texto: { type: 'string' },
        contexto: { type: 'string', enum: ['portafolio','antioquia','cipreses','consultoria','legal','bootcamp','personal'] },
      },
      required: ['texto', 'contexto'],
    },
  },
  {
    name: 'registrar_movimiento',
    description: 'Registra un movimiento financiero (ingreso o egreso).',
    input_schema: {
      type: 'object' as const,
      properties: {
        cuenta_id: { type: 'string' },
        fecha: { type: 'string', description: 'AAAA-MM-DD' },
        concepto: { type: 'string' },
        monto: { type: 'number' },
        tipo: { type: 'string', enum: ['ingreso','egreso','traspaso'] },
        contexto: { type: 'string', enum: ['portafolio','antioquia','cipreses','consultoria','legal','bootcamp','personal'] },
        notas: { type: 'string' },
      },
      required: ['cuenta_id', 'fecha', 'concepto', 'monto', 'tipo', 'contexto'],
    },
  },
  {
    name: 'crear_cobranza',
    description: 'Crea una cobranza / factura a cobrar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cliente: { type: 'string' },
        concepto: { type: 'string' },
        monto: { type: 'number' },
        fecha_emision: { type: 'string' },
        fecha_vencimiento: { type: 'string' },
        notas: { type: 'string' },
      },
      required: ['cliente', 'concepto', 'monto', 'fecha_emision'],
    },
  },
  {
    name: 'registrar_pago_cobranza',
    description: 'Marca una cobranza como pagada parcial o totalmente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'ID de la cobranza' },
        estado: { type: 'string', enum: ['pagado','parcial','cancelado'] },
      },
      required: ['id', 'estado'],
    },
  },
  {
    name: 'crear_pago_programado',
    description: 'Crea un pago recurrente programado.',
    input_schema: {
      type: 'object' as const,
      properties: {
        concepto: { type: 'string' },
        monto: { type: 'number' },
        periodicidad: { type: 'string', enum: ['diario','semanal','quincenal','mensual','anual'] },
        proximo_pago: { type: 'string' },
        notas: { type: 'string' },
      },
      required: ['concepto', 'monto', 'periodicidad', 'proximo_pago'],
    },
  },
  {
    name: 'registrar_entrenamiento',
    description: 'Registra una sesión de entrenamiento.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fecha: { type: 'string' },
        actividad: { type: 'string' },
        duracion_min: { type: 'number' },
        lugar: { type: 'string' },
        intensidad: { type: 'number', minimum: 1, maximum: 5 },
        notas: { type: 'string' },
      },
      required: ['fecha', 'actividad', 'duracion_min', 'intensidad'],
    },
  },
  {
    name: 'registrar_sueno',
    description: 'Registra el sueño de una noche.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fecha: { type: 'string' },
        hora_dormir: { type: 'string', description: 'HH:MM' },
        hora_despertar: { type: 'string', description: 'HH:MM' },
        calidad: { type: 'number', minimum: 1, maximum: 5 },
        higiene: { type: 'array', items: { type: 'string' } },
      },
      required: ['fecha'],
    },
  },
  {
    name: 'registrar_animo',
    description: 'Registra el estado de ánimo del día.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fecha: { type: 'string' },
        nivel: { type: 'number', minimum: 1, maximum: 5 },
        texto: { type: 'string' },
      },
      required: ['fecha', 'nivel'],
    },
  },
  {
    name: 'crear_procedimiento',
    description: 'Registra un procedimiento médico.',
    input_schema: {
      type: 'object' as const,
      properties: {
        titulo: { type: 'string' },
        fecha: { type: 'string' },
        resultado: { type: 'string' },
        notas: { type: 'string' },
      },
      required: ['titulo', 'fecha'],
    },
  },
  {
    name: 'agendar_consulta',
    description: 'Agenda una consulta médica.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fecha: { type: 'string' },
        hora: { type: 'string' },
        motivo: { type: 'string' },
        notas: { type: 'string' },
      },
      required: ['fecha', 'motivo'],
    },
  },
  {
    name: 'crear_entrevista',
    description: 'Crea una entrevista de trabajo.',
    input_schema: {
      type: 'object' as const,
      properties: {
        empresa: { type: 'string' },
        puesto: { type: 'string' },
        fecha: { type: 'string' },
        hora: { type: 'string' },
        medio: { type: 'string', enum: ['presencial','videollamada','telefonica'] },
        etapa: { type: 'string', enum: ['screening','primera','tecnica','final','oferta'] },
        notas: { type: 'string' },
      },
      required: ['empresa', 'puesto', 'fecha'],
    },
  },
  {
    name: 'consultar',
    description: 'Lee datos de una tabla. Devuelve máximo 20 filas.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tabla: { type: 'string' },
        filtros: {
          type: 'object',
          description: 'Pares columna:valor para filtrar (eq)',
          additionalProperties: { type: 'string' },
        },
        columnas: { type: 'string', description: 'Columnas a seleccionar, por defecto *' },
        orden_por: { type: 'string' },
        orden_desc: { type: 'boolean' },
      },
      required: ['tabla'],
    },
  },
];

function nombreLegibleAccion(tipo: string, payload: Record<string, unknown>): string {
  const p = payload as Record<string, string | number>;
  switch (tipo) {
    case 'crear_pendiente': return `Pendiente: ${p.titulo ?? ''}`;
    case 'completar_pendiente': return `Completar pendiente: ${p.id ?? ''}`;
    case 'crear_evento': return `Evento: ${p.titulo ?? ''} · ${p.fecha ?? ''}${p.hora ? ` · ${p.hora}` : ''}${p.contexto ? ` · ${p.contexto}` : ''}`;
    case 'crear_nota': return `Nota: ${String(p.texto ?? '').slice(0, 60)}`;
    case 'registrar_movimiento': return `Movimiento: ${p.concepto ?? ''} · $${p.monto ?? ''} (${p.tipo ?? ''})`;
    case 'crear_cobranza': return `Cobranza: ${p.cliente ?? ''} · ${p.concepto ?? ''} · $${p.monto ?? ''}`;
    case 'registrar_pago_cobranza': return `Pago cobranza: ${p.id ?? ''} → ${p.estado ?? ''}`;
    case 'crear_pago_programado': return `Pago programado: ${p.concepto ?? ''} · $${p.monto ?? ''} / ${p.periodicidad ?? ''}`;
    case 'registrar_entrenamiento': return `Entreno: ${p.actividad ?? ''} · ${p.duracion_min ?? ''}min`;
    case 'registrar_sueno': return `Sueño: ${p.fecha ?? ''}${p.hora_dormir ? ` · ${p.hora_dormir}–${p.hora_despertar}` : ''}`;
    case 'registrar_animo': return `Ánimo: ${p.nivel ?? ''}/5 ${p.fecha ?? ''}`;
    case 'crear_procedimiento': return `Procedimiento: ${p.titulo ?? ''} · ${p.fecha ?? ''}`;
    case 'agendar_consulta': return `Consulta: ${p.motivo ?? ''} · ${p.fecha ?? ''}${p.hora ? ` · ${p.hora}` : ''}`;
    case 'crear_entrevista': return `Entrevista: ${p.empresa ?? ''} — ${p.puesto ?? ''} · ${p.fecha ?? ''}`;
    default: return tipo;
  }
}

function tablaDeAccion(tipo: string, payload: Record<string, unknown>): string {
  const map: Record<string, string> = {
    crear_pendiente: 'pendientes',
    crear_evento: 'eventos',
    crear_nota: 'notas',
    registrar_movimiento: 'movimientos',
    crear_cobranza: 'cobranzas',
    crear_pago_programado: 'pagos_programados',
    registrar_entrenamiento: 'entrenamientos',
    registrar_sueno: 'sueno',
    registrar_animo: 'animo',
    crear_procedimiento: 'procedimientos',
    agendar_consulta: 'consultas',
    crear_entrevista: 'entrevistas',
    completar_pendiente: 'pendientes',
    registrar_pago_cobranza: 'cobranzas',
  };
  return map[tipo] ?? 'pendientes';
}

async function cargarContextoHoy(sb: ReturnType<typeof createClient>): Promise<string> {
  const hoy = fechaHoy();
  const en7 = new Date(); en7.setDate(en7.getDate() + 7);
  const en7str = en7.toLocaleDateString('sv-SE', { timeZone: TZ });

  const [{ data: pendientes }, { data: eventos }] = await Promise.all([
    sb.from('pendientes').select('titulo,fecha_limite,prioridad,contexto').eq('hecho', false).order('fecha_limite', { ascending: true }).limit(10),
    sb.from('eventos').select('titulo,fecha,hora,tipo,contexto').gte('fecha', hoy).lte('fecha', en7str).order('fecha').order('hora').limit(10),
  ]);

  const linesPend = (pendientes ?? []).map((p: Record<string, unknown>) =>
    `- [${p.prioridad}] ${p.titulo}${p.fecha_limite ? ` (${p.fecha_limite})` : ''} [${p.contexto}]`
  ).join('\n');

  const linesEv = (eventos ?? []).map((e: Record<string, unknown>) =>
    `- ${e.fecha}${e.hora ? ` ${String(e.hora).slice(0, 5)}` : ''}: ${e.titulo} [${e.contexto}]`
  ).join('\n');

  return `Pendientes activos:\n${linesPend || 'ninguno'}\n\nEventos esta semana:\n${linesEv || 'ninguno'}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'no autorizado' }), { status: 401 });
  }

  const body = await req.json();
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // ── Confirmar / rechazar acción ────────────────────────────────────────
  if (body.accion === 'confirmar' && body.accion_id) {
    const { data: accion, error } = await sb
      .from('acciones_agente').select('*').eq('id', body.accion_id).single();
    if (error || !accion) return new Response(JSON.stringify({ error: 'acción no encontrada' }), { status: 404 });
    if (accion.estado !== 'propuesta') return new Response(JSON.stringify({ error: 'acción ya procesada' }), { status: 400 });

    const tabla = accion.tabla_destino as string;
    if (!TABLAS_ESCRITURA[tabla]) return new Response(JSON.stringify({ error: 'tabla no permitida' }), { status: 400 });

    const columnasPermitidas = TABLAS_ESCRITURA[tabla];
    const payload = accion.payload as Record<string, unknown>;
    const payloadFiltrado: Record<string, unknown> = {};
    for (const col of columnasPermitidas) {
      if (payload[col] !== undefined) payloadFiltrado[col] = payload[col];
    }

    let registroId: string | null = null;

    if (accion.tipo_accion === 'completar_pendiente') {
      await sb.from('pendientes').update({ hecho: true, fecha_hecho: fechaHoy() }).eq('id', payload.id as string);
      registroId = payload.id as string;
    } else if (accion.tipo_accion === 'registrar_pago_cobranza') {
      await sb.from('cobranzas').update({ estado: payload.estado as string }).eq('id', payload.id as string);
      registroId = payload.id as string;
    } else {
      const { data: nuevo, error: insErr } = await sb.from(tabla).insert(payloadFiltrado).select('id').single();
      if (insErr) return new Response(JSON.stringify({ error: insErr.message }), { status: 500 });
      registroId = (nuevo as { id: string }).id;
    }

    await sb.from('acciones_agente').update({ estado: 'aplicada', registro_id: registroId }).eq('id', body.accion_id);
    return new Response(JSON.stringify({ ok: true, registro_id: registroId }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (body.accion === 'rechazar' && body.accion_id) {
    await sb.from('acciones_agente').update({ estado: 'rechazada' }).eq('id', body.accion_id);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // ── Enviar mensaje ─────────────────────────────────────────────────────
  const { conversacion_id, mensaje } = body as { conversacion_id: string; mensaje: string };
  if (!conversacion_id || !mensaje) {
    return new Response(JSON.stringify({ error: 'faltan campos' }), { status: 400 });
  }

  await sb.from('mensajes').insert({ conversacion_id, rol: 'usuaria', texto: mensaje });

  const { data: historialRaw } = await sb
    .from('mensajes')
    .select('rol,texto')
    .eq('conversacion_id', conversacion_id)
    .order('created_at', { ascending: true })
    .limit(30);

  const historial = (historialRaw ?? []) as { rol: string; texto: string }[];
  const contexto = await cargarContextoHoy(sb);
  const hoy = fechaHoy();

  const messages: Anthropic.MessageParam[] = historial.map((m) => ({
    role: m.rol === 'usuaria' ? 'user' : 'assistant',
    content: m.texto,
  }));

  const systemPrompt = `Eres la secretaria personal de la usuaria. Hoy es ${hoy} (America/Mexico_City).

Contexto actual:
${contexto}

Reglas:
- Responde breve y directo en español.
- Cuando necesites crear o modificar datos, usa las tools disponibles. NUNCA afirmes haber hecho algo que no pasó por confirmación de la usuaria.
- Las tools de escritura generan propuestas que la usuaria confirma antes de ejecutarse.
- La tool "consultar" lee datos en tiempo real y puedes usarla libremente para responder preguntas.
- Si la usuaria pide algo que requiere un ID que no tienes, usa "consultar" primero para obtenerlo.`;

  let respuestaTexto = '';
  const propuestas: { id: string; tipo_accion: string; descripcion: string }[] = [];

  let continuar = true;
  let mensajesActuales = [...messages];

  while (continuar) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: mensajesActuales,
    });

    const toolUses: Anthropic.ToolUseBlock[] = [];
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        respuestaTexto += block.text;
      } else if (block.type === 'tool_use') {
        toolUses.push(block);
        const input = block.input as Record<string, unknown>;

        if (block.name === 'consultar') {
          const tabla = input.tabla as string;
          if (!TABLAS_LECTURA.includes(tabla)) {
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'tabla no permitida' });
            continue;
          }
          let q = sb.from(tabla).select((input.columnas as string) ?? '*').limit(20);
          if (input.filtros) {
            for (const [col, val] of Object.entries(input.filtros as Record<string, string>)) {
              q = q.eq(col, val);
            }
          }
          if (input.orden_por) {
            q = q.order(input.orden_por as string, { ascending: !(input.orden_desc as boolean) });
          }
          const { data, error } = await q;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: error ? `Error: ${error.message}` : JSON.stringify(data ?? []),
          });
        } else {
          const tabla = tablaDeAccion(block.name, input);
          const { data: accion } = await sb.from('acciones_agente').insert({
            conversacion_id,
            tipo_accion: block.name,
            tabla_destino: tabla,
            payload: input,
          }).select('id').single();

          const accionId = (accion as { id: string } | null)?.id ?? '';
          propuestas.push({
            id: accionId,
            tipo_accion: block.name,
            descripcion: nombreLegibleAccion(block.name, input),
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Propuesta guardada con id ${accionId}. La usuaria debe confirmarla.`,
          });
        }
      }
    }

    if (toolUses.length > 0) {
      mensajesActuales = [
        ...mensajesActuales,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
    }

    continuar = response.stop_reason === 'tool_use';
  }

  if (respuestaTexto) {
    await sb.from('mensajes').insert({ conversacion_id, rol: 'agente', texto: respuestaTexto });
  }

  // Actualizar última actividad de la conversación
  await sb.from('conversaciones').update({ ultima_actividad: new Date().toISOString() }).eq('id', conversacion_id);

  // Generar asunto automático cada 10 mensajes si sigue siendo el default
  const { count } = await sb.from('mensajes').select('*', { count: 'exact', head: true }).eq('conversacion_id', conversacion_id);
  if ((count ?? 0) % 10 === 0) {
    const { data: conv } = await sb.from('conversaciones').select('asunto').eq('id', conversacion_id).single();
    if ((conv as { asunto: string } | null)?.asunto === 'Conversación nueva') {
      const { data: primerosMsgs } = await sb.from('mensajes').select('texto').eq('conversacion_id', conversacion_id).order('created_at').limit(4);
      const resumen = (primerosMsgs ?? []).map((m: { texto: string }) => m.texto).join(' ');
      const asuntoResp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 32,
        messages: [{ role: 'user', content: `Resume en máximo 6 palabras este inicio de conversación: "${resumen.slice(0, 300)}"` }],
      });
      const asunto = asuntoResp.content[0].type === 'text' ? asuntoResp.content[0].text.trim() : null;
      if (asunto) await sb.from('conversaciones').update({ asunto }).eq('id', conversacion_id);
    }
  }

  return new Response(
    JSON.stringify({ texto: respuestaTexto, propuestas }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
  );
});
