// src/services/conveniosService.ts
import { get, post } from '@/services/http'

const API = '/api'

/* ===== Tipos ===== */
export interface Convenio {
  id: number
  nombre: string
  activo?: boolean | 0 | 1
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
  agente_captacion_id?: number | null
  created_at?: string
  updated_at?: string
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
  texto?: string
  activo?: '' | 0 | 1 | boolean
  sortBy?: string
  order?: 'asc' | 'desc'
}

export interface AgenteLight { id: number; nombre: string; tipo: 'INTERNO'|'EXTERNO' }

export interface AsesorActivoResp {
  convenio_id?: number
  convenioId?: number
  activo?: boolean
  asesor: { id: number; nombre: string; tipo?: string } | null
  asignado_at?: string | null
}

/* ===== Helpers ===== */
function normalizeListShape<T = any>(r: any, fallback: ListParams): ListResponse<T> {
  const data: T[] = Array.isArray(r) ? r : (r?.data ?? r?.items ?? r?.rows ?? [])
  const total = Array.isArray(r)
    ? r.length
    : Number(r?.total ?? r?.meta?.total ?? r?.totalItems ?? r?.count ?? data.length) || 0
  const page = Number(r?.page ?? r?.meta?.current_page ?? fallback.page ?? 1)
  const perPage = Number(r?.perPage ?? r?.meta?.per_page ?? fallback.perPage ?? 10)
  return { data, total, page, perPage }
}

export function formatDate(d?: string | Date | null) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return isNaN(dt.getTime()) ? String(d ?? '') : dt.toLocaleDateString()
}
export function formatDateTime(d?: string | Date | null) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return isNaN(dt.getTime()) ? String(d ?? '') : dt.toLocaleString()
}

/* ===== Convenios: LIST ===== */
export async function listConvenios(params: ListParams = {}) {
  const activoParam =
    params.activo === '' || params.activo === undefined
      ? undefined
      : (params.activo === true || params.activo === 1 ? 'true' : 'false')

  const r = await get<any>(`${API}/convenios`, {
    params: {
      q: params.texto || undefined,
      activo: activoParam,
      page: params.page,
      perPage: params.perPage,
      sortBy: params.sortBy,
      order: params.order,
    },
  })
  return normalizeListShape<Convenio>(r, params)
}

export async function getConvenio(id: number) {
  return get<Convenio>(`${API}/convenios/${id}`)
}

/* ===== Catálogo de Agentes ===== */
export async function listAgentesCaptacion() {
  try {
    const r = await get<{ data: AgenteLight[] }>(`${API}/agentes-captacion`, {
      params: { activos: 1, select: 'id,nombre,tipo' },
    })
    return r?.data ?? []
  } catch { return [] }
}

/* ===== Asesor activo del convenio ===== */
export async function getAsesorActivo(convenioId: number): Promise<AsesorActivoResp> {
  const r = await get<any>(`${API}/convenios/${convenioId}/asesor-activo`)
  return {
    convenio_id: r?.convenio_id ?? r?.convenioId ?? convenioId,
    activo: r?.activo ?? Boolean(r?.asesor),
    asesor: r?.asesor ?? null,
    asignado_at: r?.asignado_at ?? r?.desde ?? null,
  }
}

/* ===== Asignar/Retirar asesor del convenio =====
   -> Usa exactamente estas rutas:
      POST /api/convenios/:id/asignar
      POST /api/convenios/:id/retirar
*/
export async function asignarAsesorConvenio(convenioId: number, payload: { asesor_id: number }) {
  return post<any, any>(`${API}/convenios/${convenioId}/asignar`, {
    asesor_id: payload.asesor_id,
    // alias por compatibilidad, si el backend acepta otras keys:
    asesorId: payload.asesor_id,
    agente_captacion_id: payload.asesor_id,
    agenteCaptacionId: payload.asesor_id,
  })
}

export async function retirarAsesorConvenio(convenioId: number, payload?: { motivo?: string }) {
  return post<any, any>(`${API}/convenios/${convenioId}/retirar`, {
    motivo: payload?.motivo,
  })
}
