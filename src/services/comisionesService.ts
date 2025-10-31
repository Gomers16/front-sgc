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

async function apiFetch<T>(
  endpoint: string,
  opts: { method?: HttpMethod; body?: any; query?: Record<string, any>; headers?: HeadersInit } = {}
) {
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

/* ===== Tipos (Front/UI) ===== */
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

/* ===== Helpers de mapeo (backend → UI) =====
   Tu DB/modelo trae: monto (string DECIMAL), fecha_calculo, etc.
   La UI espera: cantidad, valor_unitario, valor_total, generado_at, ...
   Acá convertimos sin tocar vistas.
*/
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
  }
}

function mapAsesor(api: any): AgenteLight | null {
  if (!api) return null
  return {
    id: api.id,
    nombre: api.nombre,
    tipo: api.tipo || 'INTERNO',
  }
}

function mapConvenio(api: any): ConvenioLight | null {
  if (!api) return null
  return { id: api.id, nombre: api.nombre }
}

/** Map de un registro de comisión del backend (con `monto`) al shape que pide la tabla */
function mapComisionToListItem(api: any): ComisionListItem {
  // Política: por ahora tratamos la comisión como una sola línea “cantidad=1”.
  const valor = num(api.valor_total ?? api.monto ?? 0)
  const generado = api.generado_at ?? api.fecha_calculo ?? api.created_at ?? api.createdAt

  // Relaciones: algunos controladores devuelven anidados; si no, vienen como *_id
  const turno = api.turno ?? null
  const asesor = api.asesor ?? null
  const convenio = api.convenio ?? null

  return {
    id: api.id,
    estado: (api.estado as ComisionEstado) ?? 'PENDIENTE',
    cantidad: num(api.cantidad ?? 1),
    valor_unitario: num(api.valor_unitario ?? valor), // fallback: todo el valor en unitario
    valor_total: valor,
    generado_at: generado ? String(generado) : undefined,
    asesor: asesor ? mapAsesor(asesor) : (api.asesor_id ? { id: api.asesor_id, nombre: '—', tipo: 'INTERNO' } : null),
    convenio: convenio ? mapConvenio(convenio) : (api.convenio_id ? { id: api.convenio_id, nombre: '—' } : null),
    turno: turno ? mapTurno(turno) : (api.turno ? mapTurno(api.turno) : null),
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

/* ===== Funciones ===== */

export async function listComisiones(params: ListParams) {
  // Permitimos que el backend devuelva:
  // - Un ListResponse “clásico” con { data, total, page, perPage }
  // - O un array paginado custom; lo normalizamos acá.
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
    return { data: mapped, total: mapped.length, page: 1, perPage: mapped.length }
  } else {
    // Último recurso: intentar mapear raw como un solo item
    const one = mapComisionToListItem(raw)
    return { data: [one], total: 1, page: 1, perPage: 10 }
  }
}

export async function getComision(id: number) {
  const raw = await apiFetch<any>(`/comisiones/${id}`)
  return mapComisionToDetail(raw)
}

export async function patchValores(id: number, payload: { cantidad: number; valor_unitario: number }) {
  const raw = await apiFetch<any>(`/comisiones/${id}/valores`, {
    method: 'PATCH',
    body: payload,
  })
  return mapComisionToDetail(raw)
}

export async function aprobarComision(id: number) {
  const raw = await apiFetch<any>(`/comisiones/${id}/aprobar`, { method: 'POST' })
  return mapComisionToDetail(raw)
}

export async function pagarComision(id: number) {
  const raw = await apiFetch<any>(`/comisiones/${id}/pagar`, { method: 'POST' })
  return mapComisionToDetail(raw)
}

export async function anularComision(id: number) {
  const raw = await apiFetch<any>(`/comisiones/${id}/anular`, { method: 'POST' })
  return mapComisionToDetail(raw)
}

/** Catálogo de asesores para filtros */
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
