// src/services/contratosPasosService.ts
// Usa el motor central (http.ts) y rutas relativas (/api/...)
import { get, post, put, del } from './http'

/* ===== Tipos ===== */

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
  // Actor/usuario que creó/actualizó (si backend lo retorna)
  usuario?: PasoUsuario | null
  createdAt?: string | null
  updatedAt?: string | null
}

/* ===== Helpers ===== */

function toNumOrNull(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Lee actorId de varios posibles lugares de storage
function getActorId(): number | null {
  const direct =
    toNumOrNull(localStorage.getItem('actorId')) ??
    toNumOrNull(sessionStorage.getItem('actorId')) ??
    toNumOrNull(localStorage.getItem('userId')) ??
    toNumOrNull(sessionStorage.getItem('userId'))
  if (direct) return direct

  const keys = ['user', 'usuario', 'authUser', 'currentUser', 'sessionUser']
  for (const k of keys) {
    const raw = localStorage.getItem(k) ?? sessionStorage.getItem(k)
    if (!raw) continue
    try {
      const obj = JSON.parse(raw) as unknown
      const id =
        (obj as { id?: unknown })?.id ??
        (obj as { user?: { id?: unknown } })?.user?.id ??
        (obj as { data?: { id?: unknown } })?.data?.id
      const n = toNumOrNull(id)
      if (n) return n
    } catch {
      /* ignore */
    }
  }
  return null
}

// Agrega header x-actor-id si existe
function withActorHeaders(extra?: Record<string, string>) {
  const actorId = getActorId()
  return actorId ? { ...(extra || {}), 'x-actor-id': String(actorId) } : { ...(extra || {}) }
}

// Asegura que el FormData tenga actorId
function withActorForm(form: FormData) {
  const actorId = getActorId()
  if (actorId && !form.has('actorId')) form.append('actorId', String(actorId))
  return form
}

// Normaliza snake_case -> camelCase y asegura tipos (incluye usuario y timestamps)
function mapPaso(raw: unknown): ContratoPaso {
  const r = raw as Record<string, unknown>

  const u = r.usuario as Record<string, unknown> | null | undefined
  const usuario: PasoUsuario | null = u
    ? {
        id: Number(u.id),
        nombres: String(u.nombres ?? ''),
        apellidos: String(u.apellidos ?? ''),
        correo: String(u.correo ?? ''),
      }
    : null

  const createdAt = (r.createdAt ?? r.created_at ?? null) as string | null
  const updatedAt = (r.updatedAt ?? r.updated_at ?? null) as string | null

  return {
    id: Number(r.id),
    contratoId: Number(r.contratoId ?? r.contrato_id ?? r.contrato ?? 0),
    fase: (r.fase || 'inicio') as 'inicio' | 'desarrollo' | 'fin',
    nombrePaso: String(r.nombrePaso ?? r.nombre_paso ?? ''),
    observacion: (r.observacion as string | null | undefined) ?? null,
    orden: r.orden != null ? Number(r.orden) : null,
    completado: Boolean(r.completado ?? false),
    fecha: (r.fecha as string | null | undefined) ?? null,
    archivoUrl: (r.archivoUrl ?? r.archivo_url ?? null) as string | null,
    usuario,
    createdAt,
    updatedAt,
  }
}

/* ===== API (vía motor http.ts) ===== */

/** GET /api/contratos/:contratoId/pasos (todas las fases) */
export async function fetchPasosContrato(contratoId: number): Promise<ContratoPaso[]> {
  const data = await get<unknown[]>(`/api/contratos/${contratoId}/pasos`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
  return Array.isArray(data) ? data.map(mapPaso) : []
}

/** GET /api/contratos/:contratoId/pasos?fase=inicio (con filtro de respaldo) */
export async function fetchPasosInicio(contratoId: number): Promise<ContratoPaso[]> {
  const data = await get<unknown[]>(`/api/contratos/${contratoId}/pasos`, {
    headers: withActorHeaders(),
    credentials: 'include',
    params: { fase: 'inicio' },
  })
  const pasos = Array.isArray(data) ? data.map(mapPaso) : []
  return pasos.filter((p) => p.fase === 'inicio')
}

/** GET genérico con fase */
export async function fetchPasosPorFase(
  contratoId: number,
  fase: 'inicio' | 'desarrollo' | 'fin'
): Promise<ContratoPaso[]> {
  const data = await get<unknown[]>(`/api/contratos/${contratoId}/pasos`, {
    headers: withActorHeaders(),
    credentials: 'include',
    params: { fase },
  })
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
 *  - completado? ('true'|'false'|'1'|'0')
 *  - fecha? (yyyy-mm-dd)
 *  - archivo? (File)
 */
export function crearPasoContrato(contratoId: number, data: FormData): Promise<ContratoPaso> {
  return post<unknown, FormData>(
    `/api/contratos/${contratoId}/pasos`,
    withActorForm(data),
    { headers: withActorHeaders(), credentials: 'include' }
  ).then(mapPaso)
}

/**
 * PUT /api/contratos/:contratoId/pasos/:pasoId
 * body: FormData con los mismos campos que crear (solo envía lo que quieras actualizar).
 * Si adjuntas un archivo en 'archivo', reemplaza el anterior.
 */
export function actualizarPasoContrato(
  contratoId: number,
  pasoId: number,
  data: FormData
): Promise<ContratoPaso> {
  return put<unknown, FormData>(
    `/api/contratos/${contratoId}/pasos/${pasoId}`,
    withActorForm(data),
    { headers: withActorHeaders(), credentials: 'include' }
  ).then(mapPaso)
}

/** DELETE /api/contratos/:contratoId/pasos/:pasoId */
export function eliminarPasoContrato(contratoId: number, pasoId: number) {
  return del<void>(`/api/contratos/${contratoId}/pasos/${pasoId}`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

/* ===== Helper para construir FormData desde un objeto plano ===== */
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
  return withActorForm(fd)
}
