// src/services/contratoEventosService.ts
import { get, post, put, del } from './http'

/* ===== Helpers ===== */

function toNumOrNull(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (typeof v === 'number' ? v : NaN)
  return Number.isFinite(n) && n > 0 ? n : null
}

function getActorId(): number | null {
  const read = (k: string): string | null =>
    localStorage.getItem(k) ?? sessionStorage.getItem(k)

  const direct =
    toNumOrNull(read('actorId')) ??
    toNumOrNull(read('authUserId')) ??
    toNumOrNull(read('userId'))

  if (direct) return direct

  const keys = ['user', 'usuario', 'authUser', 'currentUser', 'sessionUser']
  for (const k of keys) {
    const raw = read(k)
    if (!raw) continue
    try {
      const obj: unknown = JSON.parse(raw)
      if (typeof obj === 'object' && obj !== null) {
        const maybeId =
          (obj as { id?: unknown }).id ??
          (obj as { user?: { id?: unknown } }).user?.id ??
          (obj as { data?: { id?: unknown } }).data?.id
        const n = toNumOrNull(maybeId)
        if (n) return n
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

function withActorHeaders(extra?: Record<string, string>) {
  const actorId = getActorId()
  return actorId
    ? { ...(extra || {}), 'x-actor-id': String(actorId) }
    : { ...(extra || {}) }
}

function withActorBody<T extends Record<string, unknown>>(data: T | undefined) {
  const actorId = getActorId()
  return {
    ...(data ?? ({} as T)),
    actorId: (data as Record<string, unknown> | undefined)?.actorId ?? actorId ?? null,
  } as T & { actorId: number | null }
}

function withActorForm(form: FormData) {
  const actorId = getActorId()
  if (actorId && !form.has('actorId')) form.append('actorId', String(actorId))
  return form
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (isRecord(data)) {
    const dataProp = data['data']
    const rowsProp = data['rows']
    const itemsProp = data['items']
    if (Array.isArray(dataProp)) return dataProp as T[]
    if (Array.isArray(rowsProp)) return rowsProp as T[]
    if (Array.isArray(itemsProp)) return itemsProp as T[]
  }
  return []
}

/* ===== Tipos ===== */

export interface UsuarioLite {
  id: number
  nombres: string
  apellidos: string
  correo?: string
}

export interface ContratoEvento {
  id: number
  contratoId: number
  tipo:
    | 'incapacidad'
    | 'suspension'
    | 'licencia'
    | 'permiso'
    | 'vacaciones'
    | 'cesantias'
    | 'disciplinario'
    | 'terminacion'
  subtipo?: string | null
  fechaInicio: string // YYYY-MM-DD
  fechaFin?: string | null
  descripcion?: string | null
  documentoUrl?: string | null
  usuario?: UsuarioLite | null
  createdAt: string
  updatedAt: string
}

/* ===== API (vía motor http.ts) ===== */

export async function obtenerEventosDeContrato(contratoId: number) {
  const resp = await get<unknown>(`/api/contratos/${contratoId}/eventos`, {
    credentials: 'include',
  })
  return toArray<ContratoEvento>(resp)
}

export function crearEventoDeContrato(
  contratoId: number,
  eventData: Partial<ContratoEvento> | FormData
) {
  if (eventData instanceof FormData) {
    return post<ContratoEvento, FormData>(
      `/api/contratos/${contratoId}/eventos`,
      withActorForm(eventData),
      {
        headers: withActorHeaders(),
        credentials: 'include',
      }
    )
  }
  return post<ContratoEvento, Partial<ContratoEvento>>(
    `/api/contratos/${contratoId}/eventos`,
    withActorBody(eventData),
    {
      headers: withActorHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
    }
  )
}

export function actualizarEventoDeContrato(
  contratoId: number,
  eventId: number,
  eventData: Partial<ContratoEvento> | FormData
) {
  if (eventData instanceof FormData) {
    return put<ContratoEvento, FormData>(
      `/api/contratos/${contratoId}/eventos/${eventId}`,
      withActorForm(eventData),
      {
        headers: withActorHeaders(),
        credentials: 'include',
      }
    )
  }
  return put<ContratoEvento, Partial<ContratoEvento>>(
    `/api/contratos/${contratoId}/eventos/${eventId}`,
    withActorBody(eventData),
    {
      headers: withActorHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
    }
  )
}

export function eliminarEventoDeContrato(contratoId: number, eventId: number) {
  return del<void>(`/api/contratos/${contratoId}/eventos/${eventId}`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}
