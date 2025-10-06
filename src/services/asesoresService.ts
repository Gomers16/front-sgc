// src/services/asesoresService.ts
import { get } from '@/services/http'

/* ===== Tipos que usa tu vista ===== */
export type TipoAsesor =
  | 'ASESOR_INTERNO'
  | 'ASESOR_EXTERNO'
  | 'TELEMERCADEO'
  | 'INTERNO'
  | 'EXTERNO'

export interface Agente {
  id: number
  nombre: string
  tipo?: TipoAsesor | string | null
  activo?: boolean
}

/* ===== Tipos auxiliares ===== */
export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

/* Normalizador de respuestas tipo lista */
function normalizeListShape<T = any>(
  r: any,
  fallback: { page?: number; perPage?: number } = {}
): ListResponse<T> {
  const data: T[] = Array.isArray(r) ? r : (r?.data ?? r?.items ?? r?.rows ?? [])
  const total = Array.isArray(r)
    ? r.length
    : Number(r?.total ?? r?.meta?.total ?? r?.totalItems ?? r?.count ?? data.length) || 0
  const page = Number(r?.page ?? r?.meta?.current_page ?? fallback.page ?? 1)
  const perPage = Number(r?.perPage ?? r?.meta?.per_page ?? fallback.perPage ?? 10)
  return { data, total, page, perPage }
}

/* ===== API ===== */
const API = '/api'

/** Lista de asesores -> SIEMPRE retorna { data, total, page, perPage } */
export async function listAsesores(params: Record<string, any> = {}): Promise<ListResponse<Agente>> {
  const resp = await get<any>(`${API}/agentes-captacion`, {
    params: {
      q: params.q,
      // Si tu backend espera 'INTERNO'/'EXTERNO', quita prefijo ASESOR_
      tipo: params.tipo?.toString().replace(/^ASESOR_/, ''),
      activos:
        params.activo === '' || params.activo === undefined
          ? undefined
          : params.activo ? 1 : 0,
      page: params.page,
      perPage: params.perPage,
      sortBy: params.sortBy,
      order: params.order,
    },
  })

  const norm = normalizeListShape<any>(resp, params)

  // Asegura shape estable para la vista
  const mapped: Agente[] = (norm.data || []).map((a: any) => ({
    id: Number(a?.id),
    nombre: String(a?.nombre ?? ''),
    tipo: a?.tipo ?? a?.agente_tipo ?? null,
    activo: (a?.activo ?? a?.is_active ?? 1) ? true : false,
  }))

  return { ...norm, data: mapped }
}

/** Convenios del asesor (por defecto solo vigentes) */
export interface ConvenioLite {
  id: number
  nombre: string
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
}
export async function listConveniosDelAsesor(
  asesorId: number,
  vigente = true
): Promise<ConvenioLite[]> {
  const r = await get<any>(`${API}/agentes-captacion/${asesorId}/convenios`, {
    params: { vigente: vigente ? 1 : 0 },
  })
  const arr = Array.isArray(r) ? r : (r?.data ?? [])
  return arr.map((c: any) => ({
    id: Number(c?.id),
    nombre: String(c?.nombre ?? ''),
    vigencia_desde: c?.vigencia_desde ?? c?.asignacion?.fecha_asignacion ?? null,
    vigencia_hasta: c?.vigencia_hasta ?? c?.asignacion?.fecha_fin ?? null,
  }))
}

/* Export default para tus imports actuales */
const api = {
  listAsesores,
  listConveniosDelAsesor,
}
export default api
