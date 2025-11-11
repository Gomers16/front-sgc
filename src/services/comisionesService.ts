// src/services/comisionesService.ts
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

function buildQuery(params?: Record<string, any>) {
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
  opts: { method?: HttpMethod; body?: any; query?: Record<string, any>; headers?: HeadersInit } = {}
) {
  const url = `${BASE}${endpoint}${buildQuery(opts.query)}`

  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }

  const token = localStorage.getItem('token')
  if (token) (headers as any).Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = err?.message || JSON.stringify(err)
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
  asesor_tipo?: string | null   // 👈 tipo del agente (COMERCIAL / CONVENIO / etc.)
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

  [key: string]: any
}

/* ================= Helpers de mapeo (backend → UI) ================= */

function num(v: any): number {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? Number(n) : 0
}

function mapServicio(apiServ: any): ServicioLight | null {
  if (!apiServ) return null
  return {
    id: apiServ.id ?? undefined,
    codigo: apiServ.codigoServicio ?? apiServ.codigo ?? undefined,
    nombre: apiServ.nombreServicio ?? apiServ.nombre ?? undefined,
  }
}

function mapTurno(api: any): TurnoLight | null {
  if (!api) return null
  return {
    id: api.id ?? api.turno_id ?? api.numero ?? 0,
    numero: api.numero ?? api.id ?? api.turno_id,
    fecha: api.fecha ?? api.created_at ?? api.createdAt ?? undefined,
    placa: api.placa ?? api.vehiculo?.placa ?? undefined,
    servicio: mapServicio(api.servicio),

    numero_global:
      api.numero_global ??
      api.numeroGlobal ??
      api.turnoNumero ??
      undefined,
    numero_servicio:
      api.numero_servicio ??
      api.numeroServicio ??
      api.turnoNumeroServicio ??
      api.turno_numero_servicio ??
      undefined,
  }
}

function mapAsesor(api: any): AgenteLight | null {
  if (!api) return null
  return {
    id: api.id,
    nombre: api.nombre ?? api.nombre_completo ?? '—',
    // dejamos que el backend marque tipo = 'CONVENIO' cuando aplique
    tipo: api.tipo ?? api.tipo_agente ?? 'INTERNO',
  }
}

function mapConvenio(api: any): ConvenioLight | null {
  if (!api) return null
  return { id: api.id, nombre: api.nombre }
}

function mapComisionToListItem(api: any): ComisionListItem {
  // API ya trae valor_unitario (monto asesor), valor_cliente (base convenio) y valor_total
  const valor_unitario = num(api.valor_unitario ?? api.monto ?? 0)
  const valor_cliente = api.valor_cliente != null ? num(api.valor_cliente) : null
  const valor_total =
    api.valor_total !== undefined
      ? num(api.valor_total)
      : valor_unitario + (valor_cliente ?? 0)

  const generado = api.generado_at ?? api.fecha_calculo ?? api.created_at ?? api.createdAt

  const turno = api.turno ? mapTurno(api.turno) : null
  const asesor = api.asesor ?? null
  const convenio = api.convenio ?? null

  const dateoId =
    api.dateo_id ??
    api.captacion_dateo_id ??
    api.captacionDateoId ??
    api.dateoId ??
    null

  return {
    id: api.id,
    dateo_id: dateoId != null ? Number(dateoId) : undefined,

    estado: (api.estado as ComisionEstado) ?? 'PENDIENTE',
    cantidad: num(api.cantidad ?? 1),
    valor_unitario,
    valor_cliente,
    valor_total,
    generado_at: generado ? String(generado) : undefined,
    asesor: asesor
      ? mapAsesor(asesor)
      : api.asesor_id
      ? { id: api.asesor_id, nombre: '—', tipo: 'INTERNO' }
      : null,
    convenio: convenio
      ? mapConvenio(convenio)
      : api.convenio_id
      ? { id: api.convenio_id, nombre: '—' }
      : null,
    turno,
  }
}

function mapComisionToDetail(api: any): ComisionDetail {
  const base = mapComisionToListItem(api)
  return {
    ...base,
    aprobado_at: api.aprobado_at ?? null,
    pagado_at: api.pagado_at ?? null,
    anulado_at: api.anulado_at ?? null,
    observacion: api.observacion ?? null,
  }
}

/**
 * Mapea una fila de configuración (es_config = true) del backend
 * al tipo ComisionConfig del front.
 */
function mapConfigToUi(api: any): ComisionConfig {
  return {
    id: api.id,
    es_config: true,
    asesor_id: api.asesor_id ?? api.asesorId ?? null,
    tipo_vehiculo:
      api.tipo_vehiculo ??
      api.tipoVehiculo ??
      null,
    valor_placa: num(api.valor_placa ?? api.base),
    valor_dateo: num(api.valor_dateo ?? api.monto),
    fecha_calculo:
      api.fecha_calculo ??
      api.fechaCalculo ??
      api.created_at ??
      api.createdAt ??
      null,
  }
}

/** Mapea una fila de meta mensual (config + posible resumen) */
function mapMetaMensual(api: any): MetaMensualRow {
  const rtmMotos =
    api.rtm_motos != null
      ? num(api.rtm_motos)
      : api.rtmMotos != null
      ? num(api.rtmMotos)
      : undefined

  const rtmVehiculos =
    api.rtm_vehiculos != null
      ? num(api.rtm_vehiculos)
      : api.rtmVehiculos != null
      ? num(api.rtmVehiculos)
      : undefined

  return {
    id: api.id,
    asesor_id: api.asesor_id ?? api.asesorId ?? null,
    asesor_nombre: api.asesor_nombre ?? api.asesorNombre ?? null,
    asesor_tipo: api.asesor_tipo ?? api.asesorTipo ?? null, // 👈 importante para filtrar convenios en el front
    mes: api.mes ?? null,

    // Config de meta
    tipo_vehiculo: api.tipo_vehiculo ?? api.tipoVehiculo ?? null,
    meta_mensual: num(api.meta_mensual ?? api.metaMensual ?? api.meta_rtm ?? 0),
    porcentaje_extra: num(
      api.porcentaje_extra ??
        api.porcentajeExtra ??
        api.porcentaje_comision_meta ??
        0,
    ),
    valor_rtm_moto:
      api.valor_rtm_moto != null
        ? num(api.valor_rtm_moto)
        : api.valorRtmMoto != null
        ? num(api.valorRtmMoto)
        : null,
    valor_rtm_vehiculo:
      api.valor_rtm_vehiculo != null
        ? num(api.valor_rtm_vehiculo)
        : api.valorRtmVehiculo != null
        ? num(api.valorRtmVehiculo)
        : null,
    fecha_actualizacion:
      api.fecha_actualizacion ??
      api.fechaActualizacion ??
      api.updated_at ??
      api.updatedAt ??
      api.created_at ??
      api.createdAt ??
      null,

    // Campos de resumen (cantidades)
    rtm_motos: rtmMotos,
    rtm_vehiculos: rtmVehiculos,
    meta_rtm: api.meta_rtm ?? null,
    meta_global_rtm: api.meta_global_rtm ?? null,
    porcentaje_comision_meta:
      api.porcentaje_comision_meta ?? api.porcentaje_extra ?? null,

    // Totales (cantidad y dinero) calculados por el backend
    total_rtm_motos:
      api.total_rtm_motos != null
        ? num(api.total_rtm_motos)
        : rtmMotos,
    total_rtm_vehiculos:
      api.total_rtm_vehiculos != null
        ? num(api.total_rtm_vehiculos)
        : rtmVehiculos,
    total_facturacion_motos:
      api.total_facturacion_motos != null
        ? num(api.total_facturacion_motos)
        : undefined,
    total_facturacion_vehiculos:
      api.total_facturacion_vehiculos != null
        ? num(api.total_facturacion_vehiculos)
        : undefined,
    total_facturacion_global:
      api.total_facturacion_global != null
        ? num(api.total_facturacion_global)
        : undefined,
  }
}

/* ============================= Funciones ============================= */

/* ===== Comisiones reales ===== */

export async function listComisiones(params: ListParams) {
  const raw = await apiFetch<any>('/comisiones', { query: params as any })

  if (Array.isArray(raw?.data)) {
    const mapped = (raw.data as any[]).map(mapComisionToListItem)
    return {
      data: mapped,
      total: num(raw.total ?? raw.meta?.total ?? mapped.length),
      page: num(raw.page ?? raw.meta?.current_page ?? params.page ?? 1),
      perPage: num(raw.perPage ?? raw.meta?.per_page ?? params.perPage ?? 10),
    } as ListResponse<ComisionListItem>
  } else if (Array.isArray(raw)) {
    const mapped = (raw as any[]).map(mapComisionToListItem)
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
  const raw = await apiFetch<any>(`/comisiones/${id}`)
  return mapComisionToDetail(raw)
}

export async function patchValores(
  id: number,
  payload: { cantidad: number; valor_unitario: number },
) {
  const raw = await apiFetch<any>(`/comisiones/${id}/valores`, {
    method: 'PATCH',
    body: payload,
  })
  return mapComisionToDetail(raw)
}

export async function aprobarComision(id: number) {
  const raw = await apiFetch<any>(`/comisiones/${id}/aprobar`, {
    method: 'POST',
  })
  return mapComisionToDetail(raw)
}

export async function pagarComision(id: number) {
  const raw = await apiFetch<any>(`/comisiones/${id}/pagar`, {
    method: 'POST',
  })
  return mapComisionToDetail(raw)
}

export async function anularComision(id: number) {
  const raw = await apiFetch<any>(`/comisiones/${id}/anular`, {
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
  const raw = await apiFetch<{ data: any[] }>('/comisiones/config', {
    query: {
      asesorId: params?.asesorId,
      tipoVehiculo: params?.tipoVehiculo,
    } as any,
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
  const raw = await apiFetch<any>('/comisiones/config', {
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
  payload: Partial<ComisionConfigPayload>,
) {
  const raw = await apiFetch<any>(`/comisiones/config/${id}`, {
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
  await apiFetch<any>(`/comisiones/config/${id}`, {
    method: 'DELETE',
  })
}

/* ===== Catálogo de agentes (asesores + convenios) ===== */

export async function listAgentesCaptacion() {
  try {
    const res = await apiFetch<{ data: AgenteLight[] }>('/agentes-captacion', {
      query: { activos: 1, select: 'id,nombre,tipo' },
    })
    return res?.data || []
  } catch {
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

  const endpoint = hasMes
    ? '/comisiones/metas-mensuales'
    : '/comisiones/metas'

  const raw = await apiFetch<{ data?: any[] } | any[]>(
    endpoint,
    {
      query: hasMes
        ? {
            asesorId: params?.asesorId,
            mes: params?.mes,
          }
        : {
            asesorId: params?.asesorId,
          },
    },
  )

  const rowsRaw = Array.isArray((raw as any)?.data)
    ? (raw as any).data
    : Array.isArray(raw)
    ? raw
    : []

  const mapped = rowsRaw.map(mapMetaMensual)

  const arr: any = mapped
  ;(arr as any).data = mapped // compatibilidad para la otra vista
  return arr as MetaMensualRow[] & { data: MetaMensualRow[] }
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
  const raw = await apiFetch<any>('/comisiones/metas', {
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
  }>,
) {
  const raw = await apiFetch<any>(`/comisiones/metas/${id}`, {
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
  await apiFetch<any>(`/comisiones/metas/${id}`, {
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
