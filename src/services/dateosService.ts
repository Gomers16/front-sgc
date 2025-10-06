// src/services/dateosService.ts
import { get, post, put, del } from '@/services/http'

export type CanalCaptacion = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
export type ResultadoDateo = 'PENDIENTE' | 'EXITOSO' | 'NO_EXITOSO'

export interface AgenteLight { id: number; nombre: string; tipo: 'INTERNO'|'EXTERNO' }
export interface Dateo {
  id: number; canal: CanalCaptacion; created_at: string;
  agente?: AgenteLight | null; agente_id?: number | null; convenio_id?: number | null;
  placa?: string | null; telefono?: string | null; observacion?: string | null; imagen_url?: string | null;
  resultado?: ResultadoDateo; consumido_turno_id?: number | null; consumido_at?: string | null; updated_at?: string;
}
export interface ListResponse<T> { data: T[]; total: number; page: number; perPage: number }
export interface ListParams {
  page?: number; perPage?: number; placa?: string; telefono?: string;
  canal?: CanalCaptacion | ''; agenteId?: number; resultado?: ResultadoDateo | '';
  desde?: string; hasta?: string; sortBy?: string; order?: 'asc'|'desc';
}

export function formatDateTime(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return d! }
}

export async function listDateos(params: ListParams) {
  const r = await get<any>('/api/captacion-dateos', { params })

  const data = r?.data ?? r?.items ?? r?.rows ?? []
  const total = Number(r?.total ?? r?.meta?.total ?? r?.totalItems ?? r?.count ?? data.length) || 0
  const page  = Number(r?.page ?? r?.meta?.current_page ?? params.page ?? 1)
  const perPage = Number(r?.perPage ?? r?.meta?.per_page ?? params.perPage ?? 10)

  const res: ListResponse<Dateo> = { data, total, page, perPage }
  return res
}

export async function getDateo(id: number) {
  return get<Dateo>(`/api/captacion-dateos/${id}`)
}
export async function createDateo(payload: Partial<Dateo>) {
  return post<Dateo, Partial<Dateo>>('/api/captacion-dateos', payload)
}
export async function updateDateo(id: number, payload: Partial<Dateo>) {
  return put<Dateo, Partial<Dateo>>(`/api/captacion-dateos/${id}`, payload)
}
export async function deleteDateo(id: number) {
  return del<{ ok: boolean }>(`/api/captacion-dateos/${id}`)
}

export async function listAgentesCaptacion() {
  try {
    const r = await get<{ data: AgenteLight[] }>(`/api/agentes-captacion`, {
      params: { activos: 1, select: 'id,nombre,tipo' },
    })
    return r?.data ?? []
  } catch { return [] }
}

// (opcional, si lo usas)
export async function crearDateoAutoPorConvenio(payload: { placa?: string; telefono?: string; convenioId: number }) {
  return post<any, typeof payload>('/api/captacion-dateos/auto-convenio', payload)
}
