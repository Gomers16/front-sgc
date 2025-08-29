// src/services/contratosPasosService.ts
// Servicio 100% alineado con el backend que expone:
// GET    /api/contratos/:contratoId/pasos
// POST   /api/contratos/:contratoId/pasos
// PUT    /api/contratos/:contratoId/pasos/:pasoId
// DELETE /api/contratos/:contratoId/pasos/:pasoId
//
// ✔ Usa FormData para crear/actualizar (soporte de archivo)
// ✔ Base URL por VITE_API_URL si existe
// ✔ Exporta funciones con los mismos nombres que ya usas
// ✔ Añadido: mapPaso() normaliza y ahora incluye usuario + createdAt
// ✔ Añadido: x-actor-id en headers + actorId dentro de FormData
// ✔ credentials: 'include' para sesiones con cookies

export interface PasoUsuario {
  id: number
  nombres: string
  apellidos: string
  correo: string
}

export interface ContratoPaso {
  id: number
  contratoId: number
  fase: 'inicio' | 'desarrollo' | 'fin'
  nombrePaso: string
  observacion?: string | null
  orden?: number | null
  completado: boolean
  fecha?: string | null // ISO yyyy-mm-dd
  archivoUrl?: string | null
  // 👇 NUEVO: actor precargado (o undefined si no existe)
  usuario?: PasoUsuario | null
  // 👇 NUEVO: para mostrar “creado el …” en UI si quieres
  createdAt?: string | null
  updatedAt?: string | null
}

const API_BASE =
  ((import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3333') + '/api'

// ===== Helpers =====
async function safeText(res: Response) {
  try { return await res.text() } catch { return '' }
}
async function ensureOk<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await safeText(res)
    throw new Error(t || `Error HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Lee actorId de storage (varios posibles lugares)
function getActorId(): number | null {
  const tryNum = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const direct =
    tryNum(localStorage.getItem('actorId')) ??
    tryNum(sessionStorage.getItem('actorId')) ??
    tryNum(localStorage.getItem('userId')) ??
    tryNum(sessionStorage.getItem('userId'))
  if (direct) return direct

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

// Agrega header x-actor-id si existe
function withActorHeaders(base?: HeadersInit): HeadersInit {
  const actorId = getActorId()
  const headers: Record<string, string> = { Accept: 'application/json', ...(base as any) }
  if (actorId) headers['x-actor-id'] = String(actorId)
  return headers
}

// Asegura que el FormData tenga actorId y añade headers con x-actor-id
function formOptions(method: 'POST' | 'PUT' | 'DELETE', form?: FormData): RequestInit {
  const fd = form ?? new FormData()
  const actorId = getActorId()
  if (actorId && !fd.has('actorId')) fd.append('actorId', String(actorId))
  return {
    method,
    headers: withActorHeaders(), // NO pongas Content-Type con FormData
    body: fd,
    credentials: 'include',
  }
}

// GET options con headers de actor
function getOptions(): RequestInit {
  return {
    headers: withActorHeaders(),
    credentials: 'include',
  }
}

// Normaliza snake_case -> camelCase y asegura tipos (incluye usuario y timestamps)
function mapPaso(raw: any): ContratoPaso {
  const usuarioRaw = raw.usuario ?? null
  const usuario: PasoUsuario | null =
    usuarioRaw && typeof usuarioRaw === 'object'
      ? {
          id: Number(usuarioRaw.id),
          nombres: String(usuarioRaw.nombres ?? ''),
          apellidos: String(usuarioRaw.apellidos ?? ''),
          correo: String(usuarioRaw.correo ?? ''),
        }
      : null

  // Lucid serializa DateTime a ISO string; caemos a null si no viene
  const createdAt = raw.createdAt ?? raw.created_at ?? null
  const updatedAt = raw.updatedAt ?? raw.updated_at ?? null

  return {
    id: Number(raw.id),
    contratoId: Number(raw.contratoId ?? raw.contrato_id ?? raw.contrato ?? 0),
    fase: (raw.fase || 'inicio') as 'inicio' | 'desarrollo' | 'fin',
    nombrePaso: String(raw.nombrePaso ?? raw.nombre_paso ?? ''),
    observacion: raw.observacion ?? null,
    orden: raw.orden != null ? Number(raw.orden) : null,
    completado: !!(raw.completado ?? false),
    fecha: raw.fecha ?? null,
    archivoUrl: raw.archivoUrl ?? raw.archivo_url ?? null,
    usuario,         // 👈 NUEVO
    createdAt,       // 👈 NUEVO
    updatedAt,       // 👈 NUEVO
  }
}

// ===== API =====

/** GET /api/contratos/:contratoId/pasos (todas las fases) */
export async function fetchPasosContrato(contratoId: number): Promise<ContratoPaso[]> {
  const res = await fetch(`${API_BASE}/contratos/${contratoId}/pasos`, getOptions())
  const data = await ensureOk<any[]>(res)
  return Array.isArray(data) ? data.map(mapPaso) : []
}

/** GET /api/contratos/:contratoId/pasos?fase=inicio (con filtro de respaldo en cliente) */
export async function fetchPasosInicio(contratoId: number): Promise<ContratoPaso[]> {
  const res = await fetch(`${API_BASE}/contratos/${contratoId}/pasos?fase=inicio`, getOptions())
  const data = await ensureOk<any[]>(res)
  const pasos = Array.isArray(data) ? data.map(mapPaso) : []
  return pasos.filter((p) => p.fase === 'inicio')
}

/** (Genérico) GET /api/contratos/:contratoId/pasos?fase={fase} (con filtro de respaldo) */
export async function fetchPasosPorFase(
  contratoId: number,
  fase: 'inicio' | 'desarrollo' | 'fin'
): Promise<ContratoPaso[]> {
  const res = await fetch(`${API_BASE}/contratos/${contratoId}/pasos?fase=${fase}`, getOptions())
  const data = await ensureOk<any[]>(res)
  const pasos = Array.isArray(data) ? data.map(mapPaso) : []
  return pasos.filter((p) => p.fase === fase)
}

/**
 * POST /api/contratos/:contratoId/pasos
 * body: FormData con campos:
 *  - fase ('inicio'|'desarrollo'|'fin') (req)
 *  - nombrePaso (req)
 *  - observacion? (string)
 *  - orden? (number)
 *  - completado? (boolean-like: 'true'|'false'|'1'|'0')
 *  - fecha? (yyyy-mm-dd)
 *  - archivo? (File)
 */
export async function crearPasoContrato(
  contratoId: number,
  data: FormData
): Promise<ContratoPaso> {
  const res = await fetch(
    `${API_BASE}/contratos/${contratoId}/pasos`,
    formOptions('POST', data)
  )
  const paso = await ensureOk<any>(res)
  return mapPaso(paso)
}

/**
 * PUT /api/contratos/:contratoId/pasos/:pasoId
 * body: FormData con los mismos campos que crear (solo envía lo que quieras actualizar).
 * Si adjuntas un archivo en 'archivo', reemplaza el anterior.
 */
export async function actualizarPasoContrato(
  contratoId: number,
  pasoId: number,
  data: FormData
): Promise<ContratoPaso> {
  const res = await fetch(
    `${API_BASE}/contratos/${contratoId}/pasos/${pasoId}`,
    formOptions('PUT', data)
  )
  const paso = await ensureOk<any>(res)
  return mapPaso(paso)
}

/** DELETE /api/contratos/:contratoId/pasos/:pasoId */
export async function eliminarPasoContrato(
  contratoId: number,
  pasoId: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/contratos/${contratoId}/pasos/${pasoId}`, {
    method: 'DELETE',
    headers: withActorHeaders(),
    credentials: 'include',
  })
  await ensureOk<unknown>(res)
}

// (Opcional) helper para construir FormData desde un objeto plano
export function buildPasoFormData(input: {
  fase?: 'inicio' | 'desarrollo' | 'fin'
  nombrePaso?: string
  observacion?: string | null
  orden?: number | null
  completado?: boolean
  fecha?: string | null
  archivo?: File | null
}): FormData {
  const fd = new FormData()
  if (input.fase !== undefined) fd.append('fase', input.fase)
  if (input.nombrePaso !== undefined) fd.append('nombrePaso', input.nombrePaso)
  if (input.observacion !== undefined && input.observacion !== null) fd.append('observacion', input.observacion)
  if (input.orden !== undefined && input.orden !== null) fd.append('orden', String(input.orden))
  if (input.completado !== undefined) fd.append('completado', input.completado ? 'true' : 'false')
  if (input.fecha !== undefined && input.fecha !== null) fd.append('fecha', input.fecha)
  if (input.archivo) fd.append('archivo', input.archivo)
  return fd
}
