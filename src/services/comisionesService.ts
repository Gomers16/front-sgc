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

/* ===== Tipos (Front/UI) ===== */
export type ComisionEstado = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'ANULADA'

export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'INTERNO' | 'EXTERNO' | string
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
  estado: ComisionEstado
  cantidad: number
  valor_unitario: number          // asesor
  valor_cliente?: number | null   // convenio/cliente
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

/* ===== Helpers de mapeo (backend → UI) ===== */
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

    numero_global: api.numero_global ?? api.numeroGlobal ?? api.turnoNumero ?? undefined,
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
    nombre: api.nombre,
    tipo: api.tipo || 'INTERNO',
  }
}

function mapConvenio(api: any): ConvenioLight | null {
  if (!api) return null
  return { id: api.id, nombre: api.nombre }
}

function mapComisionToListItem(api: any): ComisionListItem {
  // API ya trae valor_unitario (monto asesor), valor_cliente (base convenio) y valor_total
  const valor_unitario = num(api.valor_unitario ?? api.monto ?? 0)
  const valor_cliente = num(api.valor_cliente ?? api.base ?? 0)
  const valor_total =
    api.valor_total !== undefined
      ? num(api.valor_total)
      : valor_unitario + valor_cliente

  const generado = api.generado_at ?? api.fecha_calculo ?? api.created_at ?? api.createdAt

  const turno = api.turno ? mapTurno(api.turno) : null
  const asesor = api.asesor ?? null
  const convenio = api.convenio ?? null

  return {
    id: api.id,
    estado: (api.estado as ComisionEstado) ?? 'PENDIENTE',
    cantidad: num(api.cantidad ?? 1),
    valor_unitario,
    valor_cliente,
    valor_total,
    generado_at: generado ? String(generado) : undefined,
    asesor: asesor ? mapAsesor(asesor) : (api.asesor_id ? { id: api.asesor_id, nombre: '—', tipo: 'INTERNO' } : null),
    convenio: convenio ? mapConvenio(convenio) : (api.convenio_id ? { id: api.convenio_id, nombre: '—' } : null),
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

/* ===== Funciones ===== */

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
    return { data: mapped, total: mapped.length, page: 1, perPage: mapped.length }
  } else {
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

export function formatCOP(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}
