// src/services/dateosService.ts
import { get, post, put, del } from '@/services/http'

export type CanalCaptacion = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
export type ResultadoDateo = 'PENDIENTE' | 'EN_PROCESO' | 'EXITOSO' | 'NO_EXITOSO'
export type OrigenDateo = 'UI' | 'WHATSAPP' | 'IMPORT'

export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'INTERNO' | 'EXTERNO' | string
}

export interface ConvenioLight { // ✅
  id: number
  nombre: string
}

/** Metadatos de imagen que guardas en el dateo */
export interface DateoImagenMeta {
  imagen_url?: string | null
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
}

export interface Dateo extends DateoImagenMeta {
  id: number
  canal: CanalCaptacion
  created_at: string
  created_at_fmt?: string
  agente?: AgenteLight | null
  agente_id?: number | null
  convenio_id?: number | null
  convenio?: ConvenioLight | null // ✅
  placa?: string | null
  telefono?: string | null
  observacion?: string | null
  resultado?: ResultadoDateo
  consumido_turno_id?: number | null
  consumido_at?: string | null
  updated_at?: string
  origen?: OrigenDateo
}

export interface ListResponse<T> { data: T[]; total: number; page: number; perPage: number }

export interface ListParams {
  page?: number
  perPage?: number
  placa?: string
  telefono?: string
  canal?: CanalCaptacion | ''
  convenioId?: number // ✅
  agenteId?: number
  resultado?: ResultadoDateo | ''
  desde?: string
  hasta?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

type BackendListEnvelope<T> =
  | { data: T[]; total?: number; page?: number; perPage?: number; meta?: { total?: number; current_page?: number; per_page?: number } }
  | { items: T[]; total?: number; page?: number; perPage?: number; meta?: { total?: number; current_page?: number; per_page?: number } }
  | { rows: T[]; total?: number; page?: number; perPage?: number; meta?: { total?: number; current_page?: number; per_page?: number } }
  | { data: T[]; count?: number; totalItems?: number; page?: number; perPage?: number; meta?: { total?: number; current_page?: number; per_page?: number } }

export function formatDateTime(d?: string | null): string {
  if (!d) return '—'
  if (/AM|PM|a\. m\.|p\. m\./i.test(d)) return d
  try {
    const dt = new Date(d)
    const out = dt.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    return out.replace(/\s*a\.?\s*m\.?/i, ' AM').replace(/\s*p\.?\s*m\.?/i, ' PM')
  } catch {
    return d!
  }
}

export async function listDateos(params: ListParams) {
  const r = await get<BackendListEnvelope<Dateo>>('/api/captacion-dateos', {
    params: {
      ...params,
      convenio_id: params.convenioId, // ✅ backend espera convenio_id
    },
  })

  const data =
    ('data' in r && Array.isArray(r.data) && r.data) ||
    ('items' in r && Array.isArray(r.items) && r.items) ||
    ('rows' in r && Array.isArray((r as { rows?: Dateo[] }).rows) && (r as { rows: Dateo[] }).rows) ||
    []

  const meta = ('meta' in r && r.meta) || undefined
  const total =
    Number(
      ('total' in r && r.total) ??
      (meta?.total) ??
      (('totalItems' in r && (r as { totalItems?: number }).totalItems)) ??
      (('count' in r && (r as { count?: number }).count)) ??
      data.length
    ) || 0

  const page  = Number(
    ('page' in r && r.page) ??
    meta?.current_page ??
    params.page ??
    1
  )

  const perPage = Number(
    ('perPage' in r && r.perPage) ??
    meta?.per_page ??
    params.perPage ??
    10
  )

  return { data, total, page, perPage } as ListResponse<Dateo>
}

export function getDateo(id: number) {
  return get<Dateo>(`/api/captacion-dateos/${id}`)
}

export function createDateo(payload: Partial<Dateo>) {
  return post<Dateo, Partial<Dateo>>('/api/captacion-dateos', payload)
}

export function updateDateo(id: number, payload: Partial<Dateo>) {
  return put<Dateo, Partial<Dateo>>(`/api/captacion-dateos/${id}`, payload)
}

export function deleteDateo(id: number) {
  return del<{ ok: boolean }>(`/api/captacion-dateos/${id}`)
}

export async function listAgentesCaptacion() {
  try {
    const r = await get<{ data: AgenteLight[] }>(`/api/agentes-captacion`, {
      params: { activos: 1, select: 'id,nombre,tipo' },
    })
    return Array.isArray(r?.data) ? r.data : []
  } catch {
    return []
  }
}

/** ✅ Catálogo ligero de convenios para selects */
export async function listConveniosLight() {
  try {
    const r = await get<{ data: ConvenioLight[] }>(`/api/convenios`, {
      params: { activos: 1, select: 'id,nombre' },
    })
    const arr = Array.isArray(r?.data) ? r.data : []
    // Orden alfabético por UX
    return [...arr].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  } catch {
    return []
  }
}

/** Utilidad “auto desde convenio” (si lo usas en otro flujo) */
export function crearDateoAutoPorConvenio(payload: { placa?: string; telefono?: string; convenioId: number }) {
  return post<unknown, typeof payload>('/api/captacion-dateos/auto-convenio', payload)
}
