// src/services/comisionesService.ts
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

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

async function apiFetch<T>(endpoint: string, opts: { method?: HttpMethod; body?: any; query?: Record<string, any>; headers?: HeadersInit } = {}) {
  const url = `${BASE}${endpoint}${buildQuery(opts.query)}`
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }

  // Si usas token Bearer en localStorage:
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

/* ===== Tipos ===== */
export type ComisionEstado = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'ANULADA'

export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'INTERNO' | 'EXTERNO'
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
}

export interface ComisionListItem {
  id: number
  estado: ComisionEstado
  cantidad: number
  valor_unitario: number
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

/* ===== Funciones ===== */

export async function listComisiones(params: ListParams) {
  return apiFetch<ListResponse<ComisionListItem>>('/comisiones', { query: params as any })
}

export async function getComision(id: number) {
  return apiFetch<ComisionDetail>(`/comisiones/${id}`)
}

export async function patchValores(id: number, payload: { cantidad: number; valor_unitario: number }) {
  return apiFetch<ComisionDetail>(`/comisiones/${id}/valores`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function aprobarComision(id: number) {
  return apiFetch<ComisionDetail>(`/comisiones/${id}/aprobar`, { method: 'POST' })
}

export async function pagarComision(id: number) {
  return apiFetch<ComisionDetail>(`/comisiones/${id}/pagar`, { method: 'POST' })
}

export async function anularComision(id: number) {
  return apiFetch<ComisionDetail>(`/comisiones/${id}/anular`, { method: 'POST' })
}

/** Opcional: catálogo de asesores para filtros */
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

/* Utilidad formato COP */
export function formatCOP(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
