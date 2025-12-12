// src/services/comisionesService.ts
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

function buildQuery(params?: Record<string, unknown>) {
  const q = new URLSearchParams()
  if (!params) return ''
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    q.append(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

async function apiFetch<T>(
  endpoint: string,
  opts: { method?: HttpMethod; body?: unknown; query?: Record<string, unknown>; headers?: HeadersInit } = {}
) {
  const url = `${BASE}${endpoint}${buildQuery(opts.query)}`

  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }

  // 🔐 Usar el MISMO almacenamiento que el http.ts
  const token =
    sessionStorage.getItem('token') || localStorage.getItem('token') // fallback por si algo aún quedó en local
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = (err as Record<string, unknown>)?.message as string || JSON.stringify(err)
    } catch {}
    throw new Error(msg)
  }
  return (await res.json()) as T
}

/* ============================ Tipos (Front/UI) ============================ */

export type ComisionEstado = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'ANULADA'

export interface AgenteLight {
  id: number
  nombre: string
  /** Puede ser INTERNO, EXTERNO, CONVENIO, etc. */
  tipo: 'INTERNO' | 'EXTERNO' | 'CONVENIO' | string
}

export interface ConvenioLight {
  id: number
  nombre: string
}

export interface ServicioLight {
  id?: number
  codigo?: string
  nombre?: string
}

export interface TurnoLight {
  id: number
  numero?: string | number
  fecha?: string
  placa?: string
  servicio?: ServicioLight | null

  numero_global?: number | string
  numero_servicio?: number | string
}

export interface ComisionListItem {
  tiene_desglose?: boolean
  desglose?: Record<string, unknown>[]
  id: number
  /** id del dateo en captacion_dateos (para enganchar con la tabla de dateos) */
  dateo_id?: number

  estado: ComisionEstado
  cantidad: number
  /** Comisión del ASESOR / CONVENIO */
  valor_unitario: number
  /** Comisión placa/cliente/convenio (16k / 20k o valor de base) */
  valor_cliente?: number | null
  /** Suma de asesor + placa */
  valor_total: number

  generado_at?: string
  asesor?: AgenteLight | null
  convenio?: ConvenioLight | null
  turno?: TurnoLight | null
}

export interface ComisionDetail extends ComisionListItem {
  aprobado_at?: string | null
  pagado_at?: string | null
  anulado_at?: string | null
  observacion?: string | null
}

export interface ListParams {
  page?: number
  perPage?: number
  mes?: string // 'YYYY-MM'
  asesorId?: number
  convenioId?: number // 👈 NUEVO: para filtrar por convenio_id (asesor convenio)
  estado?: ComisionEstado | ''
  sortBy?: string
  order?: 'asc' | 'desc'
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

/* ==================== Tipos para CONFIG de comisiones ==================== */

/**
 * Tipo de vehículo para las reglas/configuración de comisión
 */
export type TipoVehiculoComision = 'MOTO' | 'VEHICULO'

/**
 * DTO que devuelve el backend para una fila de configuración (es_config = true)
 * desde /api/comisiones/config
 */
export interface ComisionConfig {
  id: number
  es_config: true
  /** asesor o convenio (ambos están en agentes_captacions) */
  asesor_id: number | null
  tipo_vehiculo: TipoVehiculoComision | null
  valor_placa: number
  valor_dateo: number
  fecha_calculo?: string | null
}

/**
 * Payload que se envía al backend para crear/actualizar una regla
 * vía /api/comisiones/config
 */
export interface ComisionConfigPayload {
  asesor_id?: number | null
  tipo_vehiculo: TipoVehiculoComision
  valor_placa: number
  valor_dateo: number
}

/* =========== Tipos para Metas mensuales (resumen + config) =========== */

/**
 * Fila de metas mensuales devuelta por el backend.
 * Incluye tanto campos de CONFIG (meta_mensual, porcentaje_extra, valores RTM)
 * como posibles campos de RESUMEN (rtm_motos, rtm_vehiculos, meta_global_rtm, etc.)
 */
export interface MetaMensualRow {
  id?: number
  asesor_id?: number | null
  asesor_nombre?: string | null
  asesor_tipo?: string | null // 👈 tipo del agente (COMERCIAL / CONVENIO / etc.)
  mes?: string | null

  // Config meta
  tipo_vehiculo?: TipoVehiculoComision | null
  meta_mensual?: number
  porcentaje_extra?: number
  valor_rtm_moto?: number | null
  valor_rtm_vehiculo?: number | null
  fecha_actualizacion?: string | null

  // Campos de resumen (para la pestaña de metas en Comisiones.vue)
  rtm_motos?: number
  rtm_vehiculos?: number
  meta_rtm?: number | null
  meta_global_rtm?: number | null
  porcentaje_comision_meta?: number | null

  // Totales calculados por el backend (nueva lógica)
  total_rtm_motos?: number
  total_rtm_vehiculos?: number
  total_facturacion_motos?: number
  total_facturacion_vehiculos?: number
  total_facturacion_global?: number
}

/* ================= Helpers de mapeo (backend → UI) ================= */

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? Number(n) : 0
}

function mapServicio(apiServ: unknown): ServicioLight | null {
  if (!apiServ) return null
  const srv = apiServ as Record<string, unknown>
  return {
    id: (srv.id as number) ?? undefined,
    codigo: (srv.codigoServicio ?? srv.codigo) as string ?? undefined,
    nombre: (srv.nombreServicio ?? srv.nombre) as string ?? undefined,
  }
}

function mapTurno(api: unknown): TurnoLight | null {
  if (!api) return null
  const t = api as Record<string, unknown>
  const vehiculo = t.vehiculo as Record<string, unknown> | undefined

  return {
    id: (t.id ?? t.turno_id ?? t.numero ?? 0) as number,
    numero: (t.numero ?? t.id ?? t.turno_id) as string | number | undefined,
    fecha: (t.fecha ?? t.created_at ?? t.createdAt) as string | undefined,
    placa: (t.placa ?? vehiculo?.placa) as string | undefined,
    servicio: mapServicio(t.servicio),

    numero_global:
      (t.numero_global ?? t.numeroGlobal ?? t.turnoNumero) as number | string | undefined,
    numero_servicio:
      (t.numero_servicio ??
      t.numeroServicio ??
      t.turnoNumeroServicio ??
      t.turno_numero_servicio) as number | string | undefined,
  }
}

function mapAsesor(api: unknown): AgenteLight | null {
  if (!api) return null
  const a = api as Record<string, unknown>
  return {
    id: a.id as number,
    nombre: (a.nombre ?? a.nombre_completo ?? '—') as string,
    // dejamos que el backend marque tipo = 'CONVENIO' cuando aplique
    tipo: (a.tipo ?? a.tipo_agente ?? 'INTERNO') as string,
  }
}

function mapConvenio(api: unknown): ConvenioLight | null {
  if (!api) return null
  const c = api as Record<string, unknown>
  return { id: c.id as number, nombre: c.nombre as string }
}

/** 👇 Nuevo helper para agentes de captación (listados y /me) */
function mapAgenteCaptacion(api: unknown): AgenteLight | null {
  if (!api) return null
  const a = api as Record<string, unknown>
  return {
    id: a.id as number,
    nombre: (a.nombre ?? a.nombre_completo ?? a.nombreCompleto ?? '—') as string,
    tipo: (a.tipo ?? a.tipo_agente ?? a.tipoAgente ?? 'INTERNO') as string,
  }
}

function mapComisionToListItem(api: unknown): ComisionListItem {
  const a = api as Record<string, unknown>
  // API ya trae valor_unitario (monto asesor), valor_cliente (base convenio) y valor_total
  const valor_unitario = num(a.valor_unitario ?? a.monto ?? 0)
  const valor_cliente = a.valor_cliente != null ? num(a.valor_cliente) : null
  const valor_total =
    a.valor_total !== undefined
      ? num(a.valor_total)
      : valor_unitario + (valor_cliente ?? 0)

  const generado = a.generado_at ?? a.fecha_calculo ?? a.created_at ?? a.createdAt

  const turno = a.turno ? mapTurno(a.turno) : null
  const asesor = a.asesor ?? null
  const convenio = a.convenio ?? null

  const dateoId =
    a.dateo_id ??
    a.captacion_dateo_id ??
    a.captacionDateoId ??
    a.dateoId ??
    null

  return {
    id: a.id as number,
    dateo_id: dateoId != null ? Number(dateoId) : undefined,

    estado: (a.estado as ComisionEstado) ?? 'PENDIENTE',
    cantidad: num(a.cantidad ?? 1),
    valor_unitario,
    valor_cliente,
    valor_total,
    generado_at: generado ? String(generado) : undefined,
    asesor: asesor
      ? mapAsesor(asesor)
      : a.asesor_id
      ? { id: a.asesor_id as number, nombre: '—', tipo: 'INTERNO' }
      : null,
    convenio: convenio
      ? mapConvenio(convenio)
      : a.convenio_id
      ? { id: a.convenio_id as number, nombre: '—' }
      : null,
    turno,
  }
}

function mapComisionToDetail(api: unknown): ComisionDetail {
  const base = mapComisionToListItem(api)
  const a = api as Record<string, unknown>
  return {
    ...base,
    aprobado_at: (a.aprobado_at as string) ?? null,
    pagado_at: (a.pagado_at as string) ?? null,
    anulado_at: (a.anulado_at as string) ?? null,
    observacion: (a.observacion as string) ?? null,
  }
}

/**
 * Mapea una fila de configuración (es_config = true) del backend
 * al tipo ComisionConfig del front.
 */
function mapConfigToUi(api: unknown): ComisionConfig {
  const a = api as Record<string, unknown>
  return {
    id: a.id as number,
    es_config: true,
    asesor_id: (a.asesor_id ?? a.asesorId ?? null) as number | null,
    tipo_vehiculo: (a.tipo_vehiculo ?? a.tipoVehiculo ?? null) as TipoVehiculoComision | null,
    valor_placa: num(a.valor_placa ?? a.base),
    valor_dateo: num(a.valor_dateo ?? a.monto),
    fecha_calculo:
      (a.fecha_calculo ??
      a.fechaCalculo ??
      a.created_at ??
      a.createdAt ??
      null) as string | null,
  }
}

/** Mapea una fila de meta mensual (config + posible resumen) */
function mapMetaMensual(api: unknown): MetaMensualRow {
  const a = api as Record<string, unknown>
  const rtmMotos =
    a.rtm_motos != null
      ? num(a.rtm_motos)
      : a.rtmMotos != null
      ? num(a.rtmMotos)
      : undefined

  const rtmVehiculos =
    a.rtm_vehiculos != null
      ? num(a.rtm_vehiculos)
      : a.rtmVehiculos != null
      ? num(a.rtmVehiculos)
      : undefined

  return {
    id: a.id as number,
    asesor_id: (a.asesor_id ?? a.asesorId ?? null) as number | null,
    asesor_nombre: (a.asesor_nombre ?? a.asesorNombre ?? null) as string | null,
    asesor_tipo: (a.asesor_tipo ?? a.asesorTipo ?? null) as string | null, // 👈 importante para filtrar convenios en el front
    mes: (a.mes ?? null) as string | null,

    // Config de meta
    tipo_vehiculo: (a.tipo_vehiculo ?? a.tipoVehiculo ?? null) as TipoVehiculoComision | null,
    meta_mensual: num(a.meta_mensual ?? a.metaMensual ?? a.meta_rtm ?? 0),
    porcentaje_extra: num(
      a.porcentaje_extra ??
        a.porcentajeExtra ??
        a.porcentaje_comision_meta ??
        0
    ),
    valor_rtm_moto:
      a.valor_rtm_moto != null
        ? num(a.valor_rtm_moto)
        : a.valorRtmMoto != null
        ? num(a.valorRtmMoto)
        : null,
    valor_rtm_vehiculo:
      a.valor_rtm_vehiculo != null
        ? num(a.valor_rtm_vehiculo)
        : a.valorRtmVehiculo != null
        ? num(a.valorRtmVehiculo)
        : null,
    fecha_actualizacion:
      (a.fecha_actualizacion ??
      a.fechaActualizacion ??
      a.updated_at ??
      a.updatedAt ??
      a.created_at ??
      a.createdAt ??
      null) as string | null,

    // Campos de resumen (cantidades)
    rtm_motos: rtmMotos,
    rtm_vehiculos: rtmVehiculos,
    meta_rtm: (a.meta_rtm ?? null) as number | null,
    meta_global_rtm: (a.meta_global_rtm ?? null) as number | null,
    porcentaje_comision_meta:
      (a.porcentaje_comision_meta ?? a.porcentaje_extra ?? null) as number | null,

    // Totales (cantidad y dinero) calculados por el backend
    total_rtm_motos:
      a.total_rtm_motos != null ? num(a.total_rtm_motos) : rtmMotos,
    total_rtm_vehiculos:
      a.total_rtm_vehiculos != null ? num(a.total_rtm_vehiculos) : rtmVehiculos,
    total_facturacion_motos:
      a.total_facturacion_motos != null
        ? num(a.total_facturacion_motos)
        : undefined,
    total_facturacion_vehiculos:
      a.total_facturacion_vehiculos != null
        ? num(a.total_facturacion_vehiculos)
        : undefined,
    total_facturacion_global:
      a.total_facturacion_global != null
        ? num(a.total_facturacion_global)
        : undefined,
  }
}

/* ============================= Funciones ============================= */

/* ===== Comisiones reales ===== */

export async function listComisiones(params: ListParams) {
  const raw = await apiFetch<unknown>('/comisiones', { query: params as Record<string, unknown> })
  const r = raw as Record<string, unknown>

  if (Array.isArray(r?.data)) {
    const mapped = (r.data as unknown[]).map(mapComisionToListItem)
    return {
      data: mapped,
      total: num(r.total ?? (r.meta as Record<string, unknown>)?.total ?? mapped.length),
      page: num(r.page ?? (r.meta as Record<string, unknown>)?.current_page ?? params.page ?? 1),
      perPage: num(r.perPage ?? (r.meta as Record<string, unknown>)?.per_page ?? params.perPage ?? 10),
    } as ListResponse<ComisionListItem>
  } else if (Array.isArray(raw)) {
    const mapped = (raw as unknown[]).map(mapComisionToListItem)
    return {
      data: mapped,
      total: mapped.length,
      page: 1,
      perPage: mapped.length,
    }
  } else {
    const one = mapComisionToListItem(raw)
    return { data: [one], total: 1, page: 1, perPage: 10 }
  }
}

export async function getComision(id: number) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}`)
  return mapComisionToDetail(raw)
}

export async function patchValores(
  id: number,
  payload: { cantidad: number; valor_unitario: number }
) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/valores`, {
    method: 'PATCH',
    body: payload,
  })
  return mapComisionToDetail(raw)
}

export async function aprobarComision(id: number) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/aprobar`, {
    method: 'POST',
  })
  return mapComisionToDetail(raw)
}

export async function pagarComision(id: number) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/pagar`, {
    method: 'POST',
  })
  return mapComisionToDetail(raw)
}

export async function anularComision(id: number) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/anular`, {
    method: 'POST',
  })
  return mapComisionToDetail(raw)
}

/* ===== Configuración de comisiones (es_config = true) ===== */

/**
 * Lista las reglas de configuración de comisiones
 * GET /api/comisiones/config
 */
export async function listConfigsComision(params?: {
  /** asesor / convenio */
  asesorId?: number
  tipoVehiculo?: TipoVehiculoComision
}) {
  const raw = await apiFetch<{ data: unknown[] }>('/comisiones/config', {
    query: {
      asesorId: params?.asesorId,
      tipoVehiculo: params?.tipoVehiculo,
    } as Record<string, unknown>,
  })

  const rows = Array.isArray(raw?.data) ? raw.data : []
  return rows.map(mapConfigToUi)
}

/**
 * Crea o actualiza (upsert) una regla:
 *  - combinación (asesor_id, tipo_vehiculo)
 * POST /api/comisiones/config
 */
export async function upsertConfigComision(payload: ComisionConfigPayload) {
  const raw = await apiFetch<unknown>('/comisiones/config', {
    method: 'POST',
    body: payload,
  })
  return mapConfigToUi(raw)
}

/**
 * Actualiza una regla existente por id
 * PATCH /api/comisiones/config/:id
 */
export async function updateConfigComision(
  id: number,
  payload: Partial<ComisionConfigPayload>
) {
  const raw = await apiFetch<unknown>(`/comisiones/config/${id}`, {
    method: 'PATCH',
    body: payload,
  })
  return mapConfigToUi(raw)
}

/**
 * Elimina una regla de configuración
 * DELETE /api/comisiones/config/:id
 */
export async function deleteConfigComision(id: number) {
  await apiFetch<unknown>(`/comisiones/config/${id}`, {
    method: 'DELETE',
  })
}

/* ===== Catálogo de agentes (asesores + convenios) ===== */

export async function listAgentesCaptacion() {
  try {
    // 1) Intentar listado general (SUPER_ADMIN / GERENCIA)
    const res = await apiFetch<unknown>('/agentes-captacion', {
      query: { perPage: 200 },
    })

    const r = res as Record<string, unknown>
    const rows: unknown[] = Array.isArray(r?.data)
      ? r.data
      : Array.isArray(res)
      ? res as unknown[]
      : []

    if (rows.length > 0) {
      return rows
        .map(mapAgenteCaptacion)
        .filter((a): a is AgenteLight => !!a)
    }

    // 2) Fallback: si viene vacío, probar /me (asesor comercial)
    const me = await apiFetch<unknown>('/agentes-captacion/me')
    const agente = mapAgenteCaptacion(me)
    if (agente) {
      return [agente]
    }

    return []
  } catch (err) {
    console.error('Error cargando agentes de captación:', err)
    return []
  }
}

/* ===== Metas mensuales de asesores ===== */

/**
 * LISTADO:
 *
 * - Si envías `mes`: usa GET /api/comisiones/metas-mensuales (RESUMEN por mes).
 * - Si NO envías `mes`: usa GET /api/comisiones/metas (CONFIG de metas).
 *
 * En ambos casos devuelve un array de MetaMensualRow y también cuelga `.data`
 * para compatibilidad con las dos vistas:
 *  - Comisiones.vue        → usa `res.data`
 *  - ComisionesConfig.vue  → usa el array directamente
 */
export async function listMetasMensuales(params?: {
  asesorId?: number
  mes?: string
}) {
  const hasMes = !!params?.mes

  const endpoint = hasMes ? '/comisiones/metas-mensuales' : '/comisiones/metas'

  const raw = await apiFetch<{ data?: unknown[] } | unknown[]>(endpoint, {
    query: hasMes
      ? {
          asesorId: params?.asesorId,
          mes: params?.mes,
        }
      : {
          asesorId: params?.asesorId,
        },
  })

  const rawObj = raw as Record<string, unknown>
  const rowsRaw = Array.isArray(rawObj?.data)
    ? rawObj.data
    : Array.isArray(raw)
    ? raw as unknown[]
    : []

  const mapped = rowsRaw.map(mapMetaMensual)

  const arr: MetaMensualRow[] & { data: MetaMensualRow[] } = mapped as MetaMensualRow[] & { data: MetaMensualRow[] }
  arr.data = mapped // compatibilidad para la otra vista
  return arr
}

/**
 * Crea o actualiza (upsert) una meta mensual para un asesor.
 * POST /api/comisiones/metas
 */
export async function upsertMetaMensual(payload: {
  asesor_id: number
  tipo_vehiculo: TipoVehiculoComision | null
  meta_mensual: number
  porcentaje_extra: number
  valor_rtm_moto?: number
  valor_rtm_vehiculo?: number
}) {
  const raw = await apiFetch<unknown>('/comisiones/metas', {
    method: 'POST',
    body: payload,
  })
  return mapMetaMensual(raw)
}

/**
 * Actualiza una meta mensual existente por id.
 * PATCH /api/comisiones/metas/:id
 */
export async function updateMetaMensual(
  id: number,
  payload: Partial<{
    asesor_id: number
    tipo_vehiculo: TipoVehiculoComision | null
    meta_mensual: number
    porcentaje_extra: number
    valor_rtm_moto?: number
    valor_rtm_vehiculo?: number
  }>
) {
  const raw = await apiFetch<unknown>(`/comisiones/metas/${id}`, {
    method: 'PATCH',
    body: payload,
  })
  return mapMetaMensual(raw)
}

/**
 * Elimina una meta mensual.
 * DELETE /api/comisiones/metas/:id
 */
export async function deleteMetaMensual(id: number) {
  await apiFetch<unknown>(`/comisiones/metas/${id}`, {
    method: 'DELETE',
  })
}

/* ========================= Helpers generales ========================= */

export function formatCOP(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}
