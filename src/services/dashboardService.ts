import { get, post } from '@/services/http'

const API = '/api'

/* ===== Tipos ===== */
export interface Convenio {
  id: number
  nombre: string
  codigo?: string | null
  tipo?: string | null
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

export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'INTERNO' | 'EXTERNO' | 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO' | string
}

export interface AsesorActivoResp {
  convenio_id?: number
  convenioId?: number
  activo?: boolean
  asesor: { id: number; nombre: string; tipo?: string } | null
  asignado_at?: string | null
  asignacion_id?: number | null
}

/* Convenio simple (id, nombre) */
export interface ConvenioSimple {
  id: number
  nombre: string
}

export interface AsignarAsesorPayload {
  asesor_id: number
  asesorId: number
  agente_captacion_id: number
  agenteCaptacionId: number
}

export interface RetirarAsesorPayload {
  motivo?: string
}

/* ===== Helpers ===== */
function normalizeListShape<T = unknown>(r: unknown, fallback: ListParams): ListResponse<T> {
  const rObj = r as Record<string, unknown>
  const data: T[] = Array.isArray(r) ? r : (rObj?.data ?? rObj?.items ?? rObj?.rows ?? []) as T[]
  const total = Array.isArray(r)
    ? data.length
    : Number(rObj?.total ?? (rObj?.meta as Record<string, unknown>)?.total ?? rObj?.totalItems ?? rObj?.count ?? data.length) || 0
  const page = Number(rObj?.page ?? (rObj?.meta as Record<string, unknown>)?.current_page ?? fallback.page ?? 1)
  const perPage = Number(rObj?.perPage ?? (rObj?.meta as Record<string, unknown>)?.per_page ?? fallback.perPage ?? 10)
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
      : params.activo === true || params.activo === 1
        ? 'true'
        : 'false'

  const vigenteParam = params.activo === undefined ? undefined : params.activo ? 'true' : 'false';

  const r = await get<unknown>(`${API}/convenios`, {
    params: {
      q: params.texto || undefined, // tu controlador usa 'q'
      activo: activoParam,          // tu controlador espera 'activo'
      page: params.page,
      perPage: params.perPage,
      sortBy: params.sortBy,
      order: params.order,
      vigente: vigenteParam  // Pasamos el parámetro vigente correctamente
    },
  })
  return normalizeListShape<Convenio>(r, params)
}

export async function getConvenio(id: number) {
  return get<Convenio>(`${API}/convenios/${id}`)
}

/* ===== Catálogo de Agentes (opc. para UI) ===== */
export async function listAgentesCaptacion() {
  try {
    const r = await get<{ data?: AgenteLight[] } | AgenteLight[]>(`${API}/agentes-captacion`, {
      params: { activo: 1, perPage: 200 }, // tu backend usa 'activo'
    })
    return Array.isArray(r) ? r : (r?.data ?? [])
  } catch {
    return []
  }
}

/* ===== Asesor activo del convenio ===== */
export async function getAsesorActivo(convenioId: number): Promise<AsesorActivoResp> {
  const r = await get<unknown>(`${API}/convenios/${convenioId}/asesor-activo`)
  const rObj = r as Record<string, unknown>
  return {
    convenio_id: (rObj?.convenio_id ?? rObj?.convenioId ?? convenioId) as number,
    activo: (rObj?.activo ?? Boolean(rObj?.asesor)) as boolean,
    asesor: (rObj?.asesor ?? null) as { id: number; nombre: string; tipo?: string } | null,
    asignado_at: (rObj?.asignado_at ?? rObj?.desde ?? null) as string | null,           // el controller devuelve 'desde'
    asignacion_id: (rObj?.asignacion_id ?? rObj?.asignacionId ?? null) as number | null // si viene en la respuesta
  }
}

/* ===== Vincular / desvincular asesor activo =====
   -> Coinciden con tus rutas:
      POST /api/convenios/:id/asignar
      POST /api/convenios/:id/retirar
*/
export async function asignarAsesorConvenio(convenioId: number, payload: { asesor_id: number }) {
  return post<unknown, AsignarAsesorPayload>(`${API}/convenios/${convenioId}/asignar`, {
    asesor_id: payload.asesor_id,
    // alias por compatibilidad; tu controller acepta 'asesor_id'
    asesorId: payload.asesor_id,
    agente_captacion_id: payload.asesor_id,
    agenteCaptacionId: payload.asesor_id,
  })
}

export async function retirarAsesorConvenio(convenioId: number, payload?: { motivo?: string }) {
  return post<unknown, RetirarAsesorPayload>(`${API}/convenios/${convenioId}/retirar`, {
    motivo: payload?.motivo,
  })
}

/* ===== Crear dateo auto por convenio =====
   -> Usa tu endpoint general de dateos: POST /api/captacion-dateos
   -> Bandera detectado_por_convenio para que backend lo vincule
*/
export interface CrearDateoAutoInput {
  convenio_id: number
  placa?: string | null
  telefono?: string | null
  origen?: 'UI' | 'IMPORT' | 'WHATSAPP'
  canal?: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
  agente_id?: number | null
  observacion?: string | null
}

export interface CrearDateoPayload {
  canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
  origen: 'UI' | 'IMPORT' | 'WHATSAPP'
  agente_id: number | null
  placa: string | null
  telefono: string | null
  observacion: string | null
  detectado_por_convenio: number
}

export async function crearDateoAutoPorConvenio(body: CrearDateoAutoInput) {
  const payload: CrearDateoPayload = {
    canal: body.canal ?? 'ASESOR',
    origen: body.origen ?? 'UI',
    agente_id: body.agente_id ?? null,
    placa: body.placa ?? null,
    telefono: body.telefono ?? null,
    observacion: body.observacion ?? null,
    detectado_por_convenio: body.convenio_id, // 👈 clave que tu backend debe leer
  }
  return post<unknown, CrearDateoPayload>(`${API}/captacion-dateos`, payload)
}

/* ===== Convenios asignados a un asesor comercial =====
   GET /api/convenios/asignados?asesor_id=:id
*/
export async function listConveniosAsignados(asesorId: number): Promise<ConvenioSimple[]> {
  if (!asesorId) return []

  const r = await get<unknown>(`${API}/convenios/asignados`, {
    params: { asesor_id: asesorId },
  })

  if (Array.isArray(r)) return r as ConvenioSimple[]
  const rObj = r as Record<string, unknown>
  if (Array.isArray(rObj?.data)) return rObj.data as ConvenioSimple[]
  return []
}
