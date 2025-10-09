// src/services/prospectosService.ts

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

/** Fuerza que la URL final quede con UN solo "/api" (ni doble ni ausente) */
function buildUrl(path: string) {
  const baseHasApi = /\/api\/?$/.test(RAW_BASE)
  const p = path.startsWith('/') ? path : `/${path}`
  const pathHasApi = /^\/api(\/|$)/.test(p)

  let finalPath = p
  if (baseHasApi && pathHasApi) finalPath = p.replace(/^\/api/, '')
  if (!baseHasApi && !pathHasApi) finalPath = `/api${p}`

  return `${RAW_BASE}${finalPath}`
}

function buildQuery(params?: Record<string, any>) {
  if (!params) return ''
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    q.append(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** Bearer desde session/localStorage (solo si existe) */
function getAuthHeader(): HeadersInit {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function apiFetch<T>(
  endpoint: string,
  opts: { method?: HttpMethod; body?: any; query?: Record<string, any>; headers?: HeadersInit } = {},
) {
  const url = `${buildUrl(endpoint)}${buildQuery(opts.query)}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(opts.headers || {}),
  }

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { msg = (await res.json())?.message || msg } catch {}
    throw new Error(msg)
  }

  // Algunos endpoints pueden devolver 204 (sin cuerpo)
  try { return (await res.json()) as T } catch { return undefined as T }
}

/* ============================
   Tipos
============================ */
export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'TELEMERCADEO' | string
}

export interface ConvenioLight {
  id: number
  nombre: string
}

export type EstadoVigencia = 'vigente' | 'vencido' | 'sin_datos'

export interface ProspectoResumenVigencias {
  soat: { estado: EstadoVigencia, vencimiento: string | null, dias_restantes: number | null }
  rtm:  { estado: EstadoVigencia, vencimiento: string | null, dias_restantes: number | null }
  preventiva: { estado: EstadoVigencia, vencimiento: string | null, dias_restantes: number | null }
  peritaje:   { estado: 'sin_datos' | 'registrado', fecha: string | null }
}

export interface Prospecto {
  id: number

  // snake_case (compat vistas)
  placa?: string | null
  telefono?: string | null
  nombre?: string | null
  soat_vigente?: boolean | null
  soat_vencimiento?: string | null
  tecno_vigente?: boolean | null
  tecno_vencimiento?: string | null
  preventiva_vigente?: boolean | null
  preventiva_vencimiento?: string | null
  peritaje_ultima_fecha?: string | null
  convenio_id?: number | null
  creado_por?: number | null
  origen?: 'IMPORT' | 'CAMPO' | 'EVENTO' | 'OTRO'
  created_at?: string | null
  updated_at?: string | null

  // camelCase (por serialize de Adonis)
  convenioId?: number | null
  soatVigente?: boolean | null
  soatVencimiento?: string | null
  tecnoVigente?: boolean | null
  tecnoVencimiento?: string | null
  preventivaVigente?: boolean | null
  preventivaVencimiento?: string | null
  peritajeUltimaFecha?: string | null
  creadoPor?: number | null
  createdAt?: string | null
  updatedAt?: string | null

  // computados (si el backend los expone)
  diasSoatRestantes?: number | null
  diasTecnoRestantes?: number | null
  diasPreventivaRestantes?: number | null
}

export interface Asignacion {
  id: number
  prospecto_id: number
  asesor: AgenteLight
  asignado_por?: string | number | null
  fecha_asignacion: string | null
  fecha_fin?: string | null
  motivo_fin?: string | null
  activo: boolean
}

export interface ProspectoDetail extends Prospecto {
  asignacion_activa?: Asignacion | null
  historial_asignaciones?: Asignacion[]
  resumenVigencias?: ProspectoResumenVigencias
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export interface ListParams {
  page?: number
  perPage?: number
  placa?: string
  telefono?: string
  nombre?: string
  convenioId?: number
  asesorId?: number
  vigente?: '' | 0 | 1 | boolean
  desde?: string
  hasta?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

/* ============================
   Helpers de fecha
============================ */
export function formatDate(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString() } catch { return d! }
}
export function formatDateTime(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return d! }
}

/* ============================
   Normalizadores
============================ */
function mapAsignacion(raw: any): Asignacion {
  return {
    id: Number(raw?.id),
    prospecto_id: Number(raw?.prospecto_id ?? raw?.prospectoId),
    asesor: {
      id: Number(raw?.asesor?.id ?? raw?.asesor_id ?? raw?.asesorId),
      nombre: String(raw?.asesor?.nombre ?? raw?.asesor_nombre ?? '—'),
      tipo: String(raw?.asesor?.tipo ?? raw?.asesor_tipo ?? ''),
    },
    asignado_por: raw?.asignado_por ?? raw?.asignadoPor ?? null,
    fecha_asignacion:
      raw?.fecha_asignacion ??
      raw?.fechaAsignacion ??
      raw?.created_at ??
      raw?.createdAt ??
      null,
    fecha_fin: raw?.fecha_fin ?? raw?.fechaFin ?? null,
    motivo_fin: raw?.motivo_fin ?? raw?.motivoFin ?? null,
    activo: Boolean(raw?.activo ?? (raw?.fecha_fin == null)),
  }
}

/** Unifica snake_case y camelCase. Si vienen 'asignaciones', deriva asignacion_activa. */
function unifyProspecto<T extends Record<string, any>>(p: T): ProspectoDetail {
  const out: any = { ...p }

  // alias básicos
  out.soat_vigente       = out.soat_vigente       ?? out.soatVigente       ?? null
  out.soat_vencimiento   = out.soat_vencimiento   ?? out.soatVencimiento   ?? null
  out.tecno_vigente      = out.tecno_vigente      ?? out.tecnoVigente      ?? null
  out.tecno_vencimiento  = out.tecno_vencimiento  ?? out.tecnoVencimiento  ?? null
  out.preventiva_vigente = out.preventiva_vigente ?? out.preventivaVigente ?? null
  out.preventiva_vencimiento = out.preventiva_vencimiento ?? out.preventivaVencimiento ?? null
  out.peritaje_ultima_fecha  = out.peritaje_ultima_fecha  ?? out.peritajeUltimaFecha    ?? null

  out.convenio_id = out.convenio_id ?? out.convenioId ?? null
  out.creado_por  = out.creado_por  ?? out.creadoPor  ?? null
  out.created_at  = out.created_at  ?? out.createdAt  ?? null
  out.updated_at  = out.updated_at  ?? out.updatedAt  ?? null

  // asignaciones → activa + historial
  if (!out.asignacion_activa && Array.isArray(out.asignaciones)) {
    const hist = out.asignaciones.map(mapAsignacion)
    out.historial_asignaciones = hist
    out.asignacion_activa = hist.find((a) => a.activo && !a.fecha_fin) ?? null
  }

  return out as ProspectoDetail
}

function normalizeListShape<T = any>(r: any, fallback: ListParams): ListResponse<T> {
  const rawData: any[] = Array.isArray(r) ? r : (r?.data ?? r?.items ?? r?.rows ?? [])
  const data = rawData.map(unifyProspecto)
  const total = Array.isArray(r)
    ? data.length
    : Number(r?.total ?? r?.meta?.total ?? r?.totalItems ?? r?.count ?? data.length) || 0
  const page = Number(r?.page ?? r?.meta?.current_page ?? fallback.page ?? 1)
  const perPage = Number(r?.perPage ?? r?.meta?.per_page ?? fallback.perPage ?? 10)
  return { data: data as unknown as T[], total, page, perPage }
}

/* ============================
   API
============================ */
export async function listProspectos(params: ListParams) {
  const vigenteBool =
    params.vigente === '' || params.vigente === undefined
      ? undefined
      : (params.vigente === true || params.vigente === 1)

  const query: Record<string, any> = {
    placa: params.placa || undefined,
    telefono: params.telefono || undefined,
    nombre: params.nombre || undefined,
    q: params.nombre || undefined, // compat
    convenioId: params.convenioId || undefined,
    convenio_id: params.convenioId || undefined,
    asesorId: params.asesorId || undefined,
    asesor_id: params.asesorId || undefined,
    vigente: vigenteBool === undefined ? undefined : String(vigenteBool),
    vigente_num: vigenteBool === undefined ? undefined : (vigenteBool ? 1 : 0),
    desde: params.desde || undefined,
    hasta: params.hasta || undefined,
    page: params.page,
    perPage: params.perPage,
    sortBy: params.sortBy,
    order: params.order,
  }

  const r = await apiFetch<any>('/prospectos', { query })
  return normalizeListShape<ProspectoDetail>(r, params)
}

export async function getProspecto(id: number) {
  const r = await apiFetch<any>('/prospectos/' + id)
  return unifyProspecto(r)
}

// Alias por compatibilidad
export const getProspectoById = getProspecto

export async function createProspecto(payload: Partial<Prospecto>) {
  const r = await apiFetch<any>('/prospectos', { method: 'POST', body: payload })
  return unifyProspecto(r)
}

export async function patchProspecto(id: number, payload: Partial<Prospecto>) {
  const r = await apiFetch<any>('/prospectos/' + id, { method: 'PATCH', body: payload })
  return unifyProspecto(r)
}

export async function asignarAsesor(prospectoId: number, payload: { asesor_id: number }) {
  // backend acepta { asesor_id }; dejamos alias asesorId para compat
  return apiFetch<{ ok?: boolean; message?: string; id?: number; asignacionId?: number }>(
    `/prospectos/${prospectoId}/asignar`,
    { method: 'POST', body: { asesor_id: payload.asesor_id, asesorId: payload.asesor_id } },
  )
}

export async function retirarAsesor(prospectoId: number, payload: { motivo?: string }) {
  return apiFetch<{ ok?: boolean; message?: string }>(`/prospectos/${prospectoId}/retirar`, {
    method: 'POST',
    body: { motivo: payload?.motivo },
  })
}

/* Catálogos */
export async function listAgentesCaptacion() {
  try {
    // ⚠️ tu backend usa 'activo' (no 'activos')
    const res = await apiFetch<{ data: AgenteLight[] } | AgenteLight[]>('/agentes-captacion', {
      query: { activo: 1, perPage: 200, select: 'id,nombre,tipo' },
    })
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch { return [] }
}

export async function listConveniosLight() {
  try {
    const res = await apiFetch<{ data: ConvenioLight[] } | ConvenioLight[]>('/convenios', {
      query: { activo: 1, perPage: 200, select: 'id,nombre' },
    })
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch { return [] }
}
