// src/services/asesoresService.ts
import { get } from '@/services/http'

/* ===== Tipos que usa tu vista ===== */
export type TipoAsesor =
  | 'ASESOR_COMERCIAL'
  | 'ASESOR_CONVENIO'
  | 'ASESOR_TELEMERCADEO'

export interface Agente {
  id: number
  nombre: string
  tipo?: TipoAsesor | string | null
  telefono?: string | null
  docTipo?: 'CC' | 'NIT' | null
  docNumero?: string | null
  activo?: boolean
  created_at?: string | null
  updated_at?: string | null
}

/* ===== Tipos auxiliares ===== */
export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export interface ResumenAsesor {
  convenios: {
    total: number
    vigentes: number
    asignaciones?: number
  }
  prospectos: {
    total: number
    vigentes?: number
    hoy: number
    mes: number
  }
}

export interface ProspectoLite {
  id: number
  placa?: string | null
  telefono?: string | null
  nombre?: string | null
  convenio_id?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ConvenioLite {
  id: number
  nombre: string
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
}

/* ===== Normalizadores ===== */
function normalizeListShape<T = any>(
  r: any,
  fallback: { page?: number; perPage?: number } = {}
): ListResponse<T> {
  const data: T[] = Array.isArray(r) ? r : (r?.data ?? r?.items ?? r?.rows ?? [])
  const total = Array.isArray(r)
    ? data.length
    : Number(r?.total ?? r?.meta?.total ?? r?.totalItems ?? r?.count ?? data.length) || 0
  const page = Number(r?.page ?? r?.meta?.current_page ?? fallback.page ?? 1)
  const perPage = Number(r?.perPage ?? r?.meta?.per_page ?? fallback.perPage ?? 10)
  return { data, total, page, perPage }
}

function normalizeTipo(value?: string | null): TipoAsesor | string | null {
  if (!value) return value ?? null
  const v = String(value).toUpperCase()
  if (v === 'ASESOR_INTERNO' || v === 'INTERNO') return 'ASESOR_COMERCIAL'
  if (v === 'ASESOR_EXTERNO' || v === 'EXTERNO') return 'ASESOR_CONVENIO'
  if (v === 'TELEMERCADEO') return 'ASESOR_TELEMERCADEO'
  if (v === 'ASESOR_COMERCIAL' || v === 'ASESOR_CONVENIO' || v === 'ASESOR_TELEMERCADEO') {
    return v as TipoAsesor
  }
  return value
}

function normalizeBool(v: any): boolean {
  if (v === true || v === 1 || v === '1') return true
  if (typeof v === 'string' && v.toLowerCase() === 'true') return true
  return false
}

function mapAgente(raw: any): Agente {
  const created = raw?.created_at ?? raw?.createdAt ?? null
  const updated = raw?.updated_at ?? raw?.updatedAt ?? null

  // ✅ PRIORIDAD CORRECTA:
  // 1) activo_calc (cálculo con usuarios.estado)
  // 2) activo de la tabla (para convenios)
  // 3) otros alias posibles
  let activoFinal: boolean | undefined

  if (raw?.activo_calc !== undefined) {
    activoFinal = normalizeBool(raw.activo_calc)
  } else if (raw?.usuario_estado !== undefined) {
    // por si el backend envía el estado textual del usuario
    const s = String(raw.usuario_estado || '').toLowerCase()
    if (s === 'activo') activoFinal = true
    else if (s === 'inactivo') activoFinal = false
  }

  if (activoFinal === undefined) {
    const fallback = raw?.activo ?? raw?.is_active ?? raw?.isActive ?? null
    activoFinal = normalizeBool(fallback)
  }

  return {
    id: Number(raw?.id),
    nombre: String(raw?.nombre ?? ''),
    tipo: normalizeTipo(raw?.tipo ?? raw?.agente_tipo ?? null),
    telefono: raw?.telefono ?? null,
    docTipo: raw?.docTipo ?? raw?.doc_tipo ?? null,
    docNumero: raw?.docNumero ?? raw?.doc_numero ?? null,
    activo: !!activoFinal,
    created_at: typeof created === 'string' ? created : (created?.toString?.() ?? null),
    updated_at: typeof updated === 'string' ? updated : (updated?.toString?.() ?? null),
  }
}

function mapProspecto(raw: any): ProspectoLite {
  return {
    id: Number(raw?.id),
    placa: raw?.placa ?? null,
    telefono: raw?.telefono ?? null,
    nombre: raw?.nombre ?? null,
    convenio_id: raw?.convenio_id ?? raw?.convenioId ?? null,
    created_at: raw?.created_at ?? raw?.createdAt ?? null,
    updated_at: raw?.updated_at ?? raw?.updatedAt ?? null,
  }
}

function mapConvenio(raw: any): ConvenioLite {
  return {
    id: Number(raw?.id),
    nombre: String(raw?.nombre ?? ''),
    vigencia_desde:
      raw?.vigencia_desde ??
      raw?.pivot_fecha_inicio ??
      raw?.asignacion?.fecha_asignacion ??
      null,
    vigencia_hasta:
      raw?.vigencia_hasta ??
      raw?.pivot_fecha_fin ??
      raw?.asignacion?.fecha_fin ??
      null,
  }
}

/* ===== API base ===== */
const API = '/api'

/** Lista de asesores -> SIEMPRE retorna { data, total, page, perPage } */
export async function listAsesores(
  params: {
    q?: string
    tipo?: TipoAsesor | 'INTERNO' | 'EXTERNO' | 'TELEMERCADEO'
    activo?: '' | 0 | 1 | boolean
    page?: number
    perPage?: number
    sortBy?: string
    order?: 'asc' | 'desc'
  } = {}
): Promise<ListResponse<Agente>> {
  // Normaliza 'tipo' a lo que espera el backend
  let tipoParam = params.tipo ? String(params.tipo).toUpperCase() : undefined
  if (tipoParam === 'INTERNO') tipoParam = 'ASESOR_COMERCIAL'
  if (tipoParam === 'EXTERNO') tipoParam = 'ASESOR_CONVENIO'
  if (tipoParam === 'TELEMERCADEO') tipoParam = 'ASESOR_TELEMERCADEO'

  // Backend espera activo como 'true'/'false'
  const activoParam =
    params.activo === '' || params.activo === undefined
      ? undefined
      : (params.activo === true || params.activo === 1) ? 'true' : 'false'

  const resp = await get<any>(`${API}/agentes-captacion`, {
    params: {
      q: params.q,
      tipo: tipoParam,
      activo: activoParam,
      page: params.page,
      perPage: params.perPage,
      sortBy: params.sortBy,
      order: params.order,
    },
  })

  const norm = normalizeListShape<any>(resp, params)
  const mapped: Agente[] = (norm.data || []).map(mapAgente)
  return { ...norm, data: mapped }
}

/** Detalle de asesor */
export async function getAsesorById(id: number): Promise<Agente> {
  const r = await get<any>(`${API}/agentes-captacion/${id}`)
  return mapAgente(r)
}

/** Resumen por asesor (conteos convenios y prospectos) */
export async function getResumenAsesor(id: number): Promise<ResumenAsesor> {
  const r = await get<any>(`${API}/agentes-captacion/${id}/resumen`)
  return {
    convenios: {
      total: Number(r?.convenios?.total ?? r?.convenios?.asignaciones ?? 0),
      vigentes: Number(r?.convenios?.vigentes ?? 0),
      asignaciones: Number(r?.convenios?.asignaciones ?? r?.convenios?.total ?? 0),
    },
    prospectos: {
      total: Number(r?.prospectos?.total ?? r?.prospectos?.vigentes ?? 0),
      vigentes: r?.prospectos?.vigentes !== undefined ? Number(r?.prospectos?.vigentes) : undefined,
      hoy: Number(r?.prospectos?.hoy ?? 0),
      mes: Number(r?.prospectos?.mes ?? 0),
    },
  }
}

/** Prospectos del asesor (por defecto solo asignación vigente) */
export async function listProspectosDelAsesor(
  asesorId: number,
  params: { vigente?: '' | 0 | 1 | boolean; q?: string } = {}
): Promise<ProspectoLite[]> {
  const vigenteParam =
    params.vigente === '' || params.vigente === undefined
      ? 1
      : (params.vigente === true || params.vigente === 1) ? 1 : 0

  const r = await get<any>(`${API}/agentes-captacion/${asesorId}/prospectos`, {
    params: { vigente: vigenteParam, q: params.q },
  })
  const arr = Array.isArray(r) ? r : (r?.data ?? [])
  return arr.map(mapProspecto)
}

/** Convenios del asesor (por defecto solo vigentes) */
export async function listConveniosDelAsesor(
  asesorId: number,
  vigente = true
): Promise<ConvenioLite[]> {
  const r = await get<any>(`${API}/agentes-captacion/${asesorId}/convenios`, {
    params: { vigente: vigente ? 1 : 0 },
  })
  const arr = Array.isArray(r) ? r : (r?.data ?? [])
  return arr.map(mapConvenio)
}

/* Export default para compatibilidad con imports existentes */
const api = {
  listAsesores,
  getAsesorById,
  getResumenAsesor,
  listProspectosDelAsesor,
  listConveniosDelAsesor,
}
export default api
