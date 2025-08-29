// src/services/contratoEventosService.ts

const API_BASE_URL =
  ((import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3333') + '/api'

/* ===== Helpers ===== */

function getActorId(): number | null {
  const tryNum = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  // 1) claves directas comunes
  const direct =
    tryNum(localStorage.getItem('actorId')) ??
    tryNum(sessionStorage.getItem('actorId')) ??
    tryNum(localStorage.getItem('authUserId')) ??
    tryNum(sessionStorage.getItem('authUserId')) ??
    tryNum(localStorage.getItem('userId')) ??
    tryNum(sessionStorage.getItem('userId'))

  if (direct) return direct

  // 2) objetos comunes serializados
  const keys = ['user', 'usuario', 'authUser', 'currentUser', 'sessionUser']
  for (const k of keys) {
    const raw = localStorage.getItem(k) ?? sessionStorage.getItem(k)
    if (!raw) continue
    try {
      const obj = JSON.parse(raw)
      const id = obj?.id ?? obj?.user?.id ?? obj?.data?.id
      const n = tryNum(id)
      if (n) return n
    } catch {}
  }

  return null
}

async function fetchData<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(url, options)
  if (!resp.ok) {
    let msg = resp.statusText
    try {
      const j = await resp.json()
      msg = j?.message || j?.error || msg
    } catch {
      try {
        const t = await resp.text()
        if (t) msg = t
      } catch {}
    }
    throw new Error(msg)
  }
  if (resp.status === 204) return {} as T
  return resp.json()
}

function jsonOptions(method: string, data: any): RequestInit {
  const actorId = getActorId()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (actorId) headers['x-actor-id'] = String(actorId)
  // no forzamos actorId en el body si no viene; pero lo añadimos para compatibilidad
  const body = JSON.stringify({ ...(data ?? {}), actorId: (data?.actorId ?? actorId) ?? null })
  return { method, headers, body, credentials: 'include' }
}

function formOptions(method: string, form: FormData): RequestInit {
  const actorId = getActorId()
  if (actorId && !form.has('actorId')) form.append('actorId', String(actorId))
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)
  return { method, headers, body: form, credentials: 'include' }
}

/* ===== Tipos ===== */

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
  // opcional: backend puede incluir el usuario
  usuario?: { id: number; nombres: string; apellidos: string; correo?: string } | null
  createdAt: string
  updatedAt: string
}

/* ===== API ===== */

export async function obtenerEventosDeContrato(contratoId: number): Promise<ContratoEvento[]> {
  return fetchData<ContratoEvento[]>(`${API_BASE_URL}/contratos/${contratoId}/eventos`, {
    credentials: 'include',
  })
}

export async function crearEventoDeContrato(
  contratoId: number,
  eventData: Partial<ContratoEvento> | FormData
): Promise<ContratoEvento> {
  if (eventData instanceof FormData) {
    return fetchData<ContratoEvento>(
      `${API_BASE_URL}/contratos/${contratoId}/eventos`,
      formOptions('POST', eventData)
    )
  }
  return fetchData<ContratoEvento>(
    `${API_BASE_URL}/contratos/${contratoId}/eventos`,
    jsonOptions('POST', eventData)
  )
}

export async function actualizarEventoDeContrato(
  contratoId: number,
  eventId: number,
  eventData: Partial<ContratoEvento>
): Promise<ContratoEvento> {
  return fetchData<ContratoEvento>(
    `${API_BASE_URL}/contratos/${contratoId}/eventos/${eventId}`,
    jsonOptions('PUT', eventData)
  )
}

export async function eliminarEventoDeContrato(contratoId: number, eventId: number): Promise<void> {
  const actorId = getActorId()
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)

  await fetchData<void>(`${API_BASE_URL}/contratos/${contratoId}/eventos/${eventId}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })
}
