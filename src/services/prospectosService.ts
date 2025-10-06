// src/services/prospectosService.ts
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

/** Une BASE y endpoint garantizando que haya exactamente un "/api" en la URL final */
function buildUrl(path: string) {
  const baseHasApi = /\/api\/?$/.test(RAW_BASE)
  const p = path.startsWith('/') ? path : `/${path}`
  const pathHasApi = /^\/api(\/|$)/.test(p)

  // Queremos exactamente una vez /api:
  let finalPath = p
  if (baseHasApi && pathHasApi) finalPath = p.replace(/^\/api/, '')
  if (!baseHasApi && !pathHasApi) finalPath = `/api${p}`

  return `${RAW_BASE}${finalPath}`
}

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
  opts: { method?: HttpMethod; body?: any; query?: Record<string, any>; headers?: HeadersInit } = {},
) {
  const url = `${buildUrl(endpoint)}${buildQuery(opts.query)}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  // ❌ SIN Authorization Bearer

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
  return (await res.json()) as T
}

/* ===== Tipos ===== */
export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'INTERNO' | 'EXTERNO'
}

export interface ConvenioLight {
  id: number
  nombre: string
}

export interface Prospecto {
  id: number
  placa?: string | null
  telefono?: string | null
  nombre?: string | null
  soat_vigente: boolean
  soat_vencimiento?: string | null
  tecno_vigente: boolean
  tecno_vencimiento?: string | null
  convenio_id?: number | null
  created_at?: string
  updated_at?: string
}

export interface Asignacion {
  id: number
  prospecto_id: number
  asesor: AgenteLight
  asignado_por?: string | null
  fecha_asignacion: string
  fecha_fin?: string | null
  motivo_fin?: string | null
  activo: boolean
}

export interface ProspectoDetail extends Prospecto {
  asignacion_activa?: Asignacion | null
  historial_asignaciones?: Asignacion[]
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
  vigente?: '' | 0 | 1 | boolean // asignación activa
  desde?: string // YYYY-MM-DD
  hasta?: string // YYYY-MM-DD
  sortBy?: string
  order?: 'asc' | 'desc'
}

/* ===== Helpers ===== */
export function formatDate(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString() } catch { return d! }
}
export function formatDateTime(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return d! }
}

/* ===== Normalizador de listas (soporta array plano o shape con data/meta) ===== */
function normalizeListShape<T = any>(r: any, fallback: ListParams): ListResponse<T> {
  const data: T[] = Array.isArray(r) ? r : (r?.data ?? r?.items ?? r?.rows ?? [])
  const total = Array.isArray(r)
    ? r.length
    : Number(r?.total ?? r?.meta?.total ?? r?.totalItems ?? r?.count ?? data.length) || 0
  const page = Number(r?.page ?? r?.meta?.current_page ?? fallback.page ?? 1)
  const perPage = Number(r?.perPage ?? r?.meta?.per_page ?? fallback.perPage ?? 10)
  return { data, total, page, perPage }
}

/* ===== API ===== */
export async function listProspectos(params: ListParams) {
  // Mapea filtros del front a los que probablemente espera tu backend
  // - nombre -> q (además dejamos nombre por si tu API lo soporta)
  // - convenioId/asesorId -> convenio_id/asesor_id (duplicamos por compatibilidad)
  // - vigente -> 'true' | 'false' (también mandamos 1/0 por si acaso)
  const vigenteBool =
    params.vigente === '' || params.vigente === undefined
      ? undefined
      : (params.vigente === true || params.vigente === 1)

  const query: Record<string, any> = {
    placa: params.placa || undefined,
    telefono: params.telefono || undefined,
    nombre: params.nombre || undefined,
    q: params.nombre || undefined,
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
  return normalizeListShape<Prospecto>(r, params)
}

export async function getProspecto(id: number) {
  return apiFetch<ProspectoDetail>('/prospectos/' + id)
}

export async function createProspecto(payload: Partial<Prospecto>) {
  return apiFetch<Prospecto>('/prospectos', { method: 'POST', body: payload })
}

export async function patchProspecto(id: number, payload: Partial<Prospecto>) {
  return apiFetch<Prospecto>('/prospectos/' + id, { method: 'PATCH', body: payload })
}

export async function asignarAsesor(prospectoId: number, payload: { asesor_id: number }) {
  return apiFetch<{ ok: boolean }>(`/prospectos/${prospectoId}/asignar`, {
    method: 'POST',
    body: {
      asesor_id: payload.asesor_id,
      asesorId: payload.asesor_id, // compat
    },
  })
}

export async function retirarAsesor(prospectoId: number, payload: { motivo?: string }) {
  return apiFetch<{ ok: boolean }>(`/prospectos/${prospectoId}/retirar`, {
    method: 'POST',
    body: { motivo: payload?.motivo },
  })
}

/* Catálogos */
export async function listAgentesCaptacion() {
  try {
    const res = await apiFetch<{ data: AgenteLight[] } | AgenteLight[]>('/agentes-captacion', {
      query: { activos: 1, select: 'id,nombre,tipo' },
    })
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch { return [] }
}

export async function listConveniosLight() {
  try {
    const res = await apiFetch<{ data: ConvenioLight[] } | ConvenioLight[]>('/convenios', {
      query: { activo: 1, select: 'id,nombre', perPage: 100 },
    })
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch { return [] }
}
