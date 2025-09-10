// src/services/contratoService.ts
import { get, post, patch, del, upload, download } from './http'

/* =========
   Tipos
=========== */

export interface Usuario {
  id: number
  nombres: string
  apellidos: string
  correo?: string
  nombreCompleto?: string
}

export interface Sede { id: number; nombre: string }
export interface Cargo { id: number; nombre: string }

export type EstadoContrato = 'activo' | 'inactivo'
export type TipoContrato = 'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'
export type TerminoContrato =
  | 'fijo'
  | 'obra_o_labor'
  | 'obra_o_labor_determinada'
  | 'indefinido'
  | null

export interface ContratoPaso {
  id?: number
  contratoId?: number
  nombrePaso?: string
  nombre?: string
  completado: boolean
  observacion?: string
  nombreArchivo?: string
  fecha?: string
  archivoUrl?: string
  archivoFile?: File | null
  fase: 'inicio' | 'desarrollo' | 'fin'
  orden?: number
  createdAt?: string
  updatedAt?: string
}

export interface ContratoSalarioPayload {
  contratoId: number
  salarioBasico: number
  bonoSalarial: number
  auxilioTransporte: number
  auxilioNoSalarial: number
  fechaEfectiva?: string // ISO
}

export interface HistorialEstadoContrato {
  id: number
  contratoId: number
  usuarioId: number | null
  usuario?: Usuario
  oldEstado: EstadoContrato
  newEstado: EstadoContrato
  fechaCambio: string
  fechaInicioContrato: string
  motivo?: string | null
}

export interface Contrato {
  id: number
  usuarioId: number
  razonSocialId: number
  identificacion?: string | null
  sedeId?: number | null
  sede?: Sede | null
  cargoId?: number | null
  cargo?: Cargo | null
  funcionesCargo?: string | null
  tipoContrato: TipoContrato
  terminoContrato?: TerminoContrato
  estado: EstadoContrato
  fechaInicio: string
  fechaTerminacion?: string | null
  periodoPrueba?: number | null
  horarioTrabajo?: string | null
  centroCosto?: string | null
  epsId?: number | null
  arlId?: number | null
  afpId?: number | null
  afcId?: number | null
  ccfId?: number | null
  nombreArchivoContratoFisico?: string | null
  rutaArchivoContratoFisico?: string | null
  tieneRecomendacionesMedicas?: boolean
  rutaArchivoRecomendacionMedica?: string | null
  pasos?: ContratoPaso[]
  historialEstados?: HistorialEstadoContrato[]
  salario?: number | null
  // Algunas APIs devuelven arreglo de salarios:
  salarios?: Array<{
    salarioBasico: number
    bonoSalarial: number
    auxilioTransporte: number
    auxilioNoSalarial: number
  }>
  createdAt: string
  updatedAt: string
}

export interface ContratoCreatePayload {
  usuarioId: number
  razonSocialId: number
  identificacion?: string | null
  sedeId?: number | null
  cargoId?: number | null
  funcionesCargo?: string | null
  fechaInicio: string
  fechaTerminacion?: string | null
  tipoContrato: TipoContrato
  terminoContrato?: TerminoContrato
  estado: EstadoContrato
  periodoPrueba?: number | null
  horarioTrabajo?: string | null
  centroCosto?: string | null
  epsId?: number | null
  arlId?: number | null
  afpId?: number | null
  afcId?: number | null
  ccfId?: number | null
  tieneRecomendacionesMedicas?: boolean
  salarioBasico?: number
  bonoSalarial?: number
  auxilioTransporte?: number
  auxilioNoSalarial?: number
}

export interface ContratoUpdatePayload extends Partial<ContratoCreatePayload> {
  motivoFinalizacion?: string | null
}

export interface AnexarContratoResponse {
  message: string
  contrato: Contrato
}

export interface ArchivoMetaData {
  url?: string | null
  nombreOriginal?: string | null
  filename?: string | null
  name?: string | null
}

export interface ArchivoMeta {
  data?: ArchivoMetaData
  url?: string | null
  path?: string | null
  nombreOriginal?: string | null
  mime?: string | null
  size?: number | null
  fechaEmision?: string | null
  fechaExpiracion?: string | null
  [k: string]: unknown
}

export type TipoAfiliacion = 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'

/* ==================
   Helpers utilitarios
=================== */

function toNumOrNull(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Lee actorId de storage (mismo criterio que pasos service)
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
      const obj = JSON.parse(raw) as any
      const id = obj?.id ?? obj?.user?.id ?? obj?.data?.id
      const n = toNumOrNull(id)
      if (n) return n
    } catch { /* ignore */ }
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

/** Convierte una ruta relativa del backend a URL absoluta pública usando VITE_API_BASE_URL o same-origin */
function toPublicUrl(maybePathOrUrl?: string | null): string | null {
  if (!maybePathOrUrl) return null
  if (/^https?:\/\//i.test(maybePathOrUrl)) return maybePathOrUrl
  const base =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}${maybePathOrUrl.startsWith('/') ? '' : '/'}${maybePathOrUrl}`
}

/* ==================
   Contratos (CRUD)
=================== */

export function crearContrato(payload: ContratoCreatePayload) {
  const actorId = getActorId()
  const body: any = { ...payload }
  if (actorId && body.actorId == null) body.actorId = actorId

  return post<Contrato, any>('/api/contratos', body, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function actualizarContrato(contratoId: number, payload: ContratoUpdatePayload) {
  const actorId = getActorId()
  const body: any = { ...payload }
  if (actorId && body.actorId == null) body.actorId = actorId

  return patch<Contrato, any>(`/api/contratos/${contratoId}`, body, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function cambiarEstadoContrato(contratoId: number, estado: EstadoContrato) {
  const actorId = getActorId()
  const payload: any = { estado }
  if (actorId) payload.actorId = actorId

  return patch<Contrato, any>(
    `/api/contratos/${contratoId}`,
    payload,
    {
      headers: withActorHeaders(),
      credentials: 'include',
    }
  )
}

export function eliminarContrato(id: number) {
  return del<{ message: string }>(`/api/contratos/${id}`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function obtenerContratoPorId(id: number) {
  return get<Contrato>(`/api/contratos/${id}`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function obtenerContratosPorUsuario(usuarioId: number) {
  return get<Contrato[]>(`/api/usuarios/${usuarioId}/contratos`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

/* =========================
   Anexar contrato / archivos
========================== */

export interface AnexarContratoForm {
  contratoId: number
  archivo: File
  razonSocialId?: number
  tieneRecomendacionesMedicas?: boolean
  archivoRecomendacionMedica?: File
}

/**
 * Fija 400 por validación de nombres: enviamos claves en camelCase y snake_case,
 * y el archivo tanto como `archivo` como `archivoContratoFisico` por compatibilidad.
 */
export function anexarContrato(form: AnexarContratoForm) {
  const fd = new FormData()

  // IDs (camel y snake)
  fd.append('contratoId', String(form.contratoId))
  fd.append('contrato_id', String(form.contratoId))

  // Archivo principal (dos nombres por compat)
  fd.append('archivo', form.archivo, form.archivo.name)
  fd.append('archivoContratoFisico', form.archivo, form.archivo.name)

  // Razón social opcional (camel y snake)
  if (typeof form.razonSocialId === 'number') {
    fd.append('razonSocialId', String(form.razonSocialId))
    fd.append('razon_social_id', String(form.razonSocialId))
  }

  // Recomendación médica opcional
  if (form.tieneRecomendacionesMedicas && form.archivoRecomendacionMedica) {
    fd.append('tieneRecomendacionesMedicas', 'true')
    fd.append('tiene_recomendaciones_medicas', 'true')
    fd.append(
      'archivoRecomendacionMedica',
      form.archivoRecomendacionMedica,
      form.archivoRecomendacionMedica.name
    )
  }

  // Asegurar actorId
  withActorForm(fd)

  return upload<AnexarContratoResponse>('/api/contratos/anexar-fisico', fd, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

/* =========================
   Salarios
========================== */

export function crearContratoSalario(payload: ContratoSalarioPayload) {
  const actorId = getActorId()
  const body: any = { ...payload }
  if (actorId && body.actorId == null) body.actorId = actorId

  return post(`/api/contratos/${payload.contratoId}/salarios`, body, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

/* =========================
   Recomendación Médica
========================== */

export function obtenerRecomendacionMedicaMeta(contratoId: number) {
  return get<ArchivoMeta>(`/api/contratos/${contratoId}/recomendacion/archivo`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

/** Variante segura: normaliza a null si no hay url/path real. */
export async function obtenerRecomendacionMedicaMetaSafe(contratoId: number) {
  const meta = await obtenerRecomendacionMedicaMeta(contratoId)
  return tieneArchivoRecomendacion(meta) ? meta : null
}

export function subirRecomendacionMedica(
  contratoId: number,
  archivo: File,
  extras?: { fechaEmision?: string; fechaExpiracion?: string }
) {
  const fd = new FormData()
  fd.append('archivo', archivo, archivo.name)
  if (extras?.fechaEmision) fd.append('fechaEmision', extras.fechaEmision)
  if (extras?.fechaExpiracion) fd.append('fechaExpiracion', extras.fechaExpiracion)
  withActorForm(fd)

  return upload<ArchivoMeta>(`/api/contratos/${contratoId}/recomendacion/archivo`, fd, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function eliminarRecomendacionMedica(contratoId: number) {
  return del<{ message: string }>(`/api/contratos/${contratoId}/recomendacion/archivo`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function descargarRecomendacionMedicaYAbrir(contratoId: number) {
  // download suele abrir nueva pestaña / blob; params quedan como antes
  return download(`/api/contratos/${contratoId}/recomendacion/descargar`, { contratoId })
}

/* =========================
   Contrato físico
========================== */

export function obtenerContratoArchivoMeta(contratoId: number) {
  return get<ArchivoMeta>(`/api/contratos/${contratoId}/archivo/meta`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function eliminarArchivoContrato(contratoId: number) {
  return del<{ message: string }>(`/api/contratos/${contratoId}/archivo`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function descargarContratoFisico(contratoId: number) {
  return download(`/api/contratos/${contratoId}/archivo`, { contratoId })
}

/* =========================
   Afiliaciones por contrato
========================== */

export interface AfiliacionArchivoMeta extends ArchivoMeta {
  tipo?: TipoAfiliacion
}

export function obtenerAfiliacionArchivoMeta(contratoId: number, tipo: TipoAfiliacion) {
  return get<AfiliacionArchivoMeta>(`/api/contratos/${contratoId}/afiliacion/${tipo}/archivo`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function subirAfiliacionArchivo(
  contratoId: number,
  tipo: TipoAfiliacion,
  archivo: File,
  entidadId?: number
) {
  const fd = new FormData()
  fd.append('archivo', archivo, archivo.name)
  if (typeof entidadId === 'number') fd.append('entidadId', String(entidadId))
  withActorForm(fd)

  return upload<AfiliacionArchivoMeta>(`/api/contratos/${contratoId}/afiliacion/${tipo}/archivo`, fd, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

export function eliminarAfiliacionArchivo(contratoId: number, tipo: TipoAfiliacion) {
  return del<{ message: string }>(`/api/contratos/${contratoId}/afiliacion/${tipo}/archivo`, {
    headers: withActorHeaders(),
    credentials: 'include',
  })
}

/* =========================
   Aliases (compatibilidad con vistas)
========================== */

export {
  // Afiliaciones
  obtenerAfiliacionArchivoMeta as obtenerAfiliacionContratoMeta,
  subirAfiliacionArchivo    as subirAfiliacionContrato,
  eliminarAfiliacionArchivo as eliminarAfiliacionContrato,
}

/* =========================
   Helpers de UI (compat)
========================== */

/** Verifica si existe archivo en la meta de afiliación (tolerante a varias claves). */
export function tieneArchivoAfiliacion(meta: unknown): boolean {
  try {
    const m = meta as ArchivoMeta | undefined
    const d = m?.data
    return Boolean(
      d?.url ||
      d?.nombreOriginal ||
      d?.filename ||
      d?.name ||
      m?.url ||
      m?.nombreOriginal ||
      m?.path
    )
  } catch {
    return false
  }
}

/** ✅ Recomendación Médica: hay archivo solo si existe url/path (o data.url/data.path) */
export function tieneArchivoRecomendacion(meta: unknown): boolean {
  try {
    const m = meta as ArchivoMeta | undefined
    const raw =
      m?.url ||
      m?.path ||
      m?.data?.url ||
      m?.data?.path
    return !!(raw && String(raw).trim())
  } catch {
    return false
  }
}

/** ✅ URL pública desde la meta de Recomendación Médica */
export function urlPublicaDesdeMetaRecomendacion(meta: unknown): string | null {
  try {
    const m = meta as ArchivoMeta | undefined
    const raw =
      m?.url ||
      m?.path ||
      m?.data?.url ||
      m?.data?.path ||
      null
    return toPublicUrl(raw)
  } catch {
    return null
  }
}

/** URL pública inmediata para abrir Recomendación Médica cuando el backend solo da 'ruta' */
export function obtenerUrlPublicaRecomendacionDesdeRuta(
  ruta: string | null | undefined
): string | null {
  return toPublicUrl(ruta ?? null)
}

/** URL pública inmediata para abrir Contrato físico cuando el backend solo da 'ruta' */
export function obtenerUrlPublicaContratoDesdeRuta(
  ruta: string | null | undefined
): string | null {
  return toPublicUrl(ruta ?? null)
}
