// src/services/contratoService.ts

/* =========================
   Base URL (con VITE_API_URL)
========================== */
const API_BASE_URL =
  ((import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3333') + '/api'

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
/** En el front podemos usar 'obra_o_labor_determinada'. Normalizamos a 'obra_o_labor' al enviar. */
export type TerminoContrato = 'fijo' | 'obra_o_labor' | 'obra_o_labor_determinada' | 'indefinido' | null

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
  /** ISO, ej: '2025-08-11T00:00:00' */
  fechaEfectiva?: string
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

  /** 'YYYY-MM-DD' */
  fechaInicio: string
  /** 'YYYY-MM-DD' | null */
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
}

export interface ContratoUpdatePayload extends Partial<ContratoCreatePayload> {
  motivoFinalizacion?: string | null
}

export interface AnexarContratoResponse {
  message: string
  contrato: Contrato
}

/** Meta genérica para archivos (contrato/recomendación) */
export interface ArchivoMeta {
  /** URL absoluta si el backend la retorna; si no, será una ruta relativa tipo "/uploads/..." */
  url?: string | null
  /** Ruta relativa en servidor, si aplica */
  path?: string | null
  /** Nombre original subido por el usuario */
  nombreOriginal?: string | null
  /** MimeType (application/pdf, image/jpeg, etc.) */
  mime?: string | null
  /** Tamaño en bytes (opcional) */
  size?: number | null
  /** Fechas opcionales que puedas guardar */
  fechaEmision?: string | null
  fechaExpiracion?: string | null
  /** Cualquier otro dato que exponga tu backend */
  [k: string]: any
}

/* ==================
   Helpers
=================== */

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

/** Si el backend devuelve ruta relativa, construye URL absoluta */
function toPublicUrl(maybePathOrUrl?: string | null): string | null {
  if (!maybePathOrUrl) return null
  if (/^https?:\/\//i.test(maybePathOrUrl)) return maybePathOrUrl
  // es ruta relativa -> prefix con host de API (sin /api)
  const base = ((import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3333')
  return `${base}${maybePathOrUrl.startsWith('/') ? '' : '/'}${maybePathOrUrl}`
}

// ▶ Mejor manejo de errores
async function fetchData<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(url, options)

  const readBody = async () => {
    try { return await resp.clone().json() } catch {
      try { return await resp.text() } catch { return null }
    }
  }

  if (!resp.ok) {
    const body = await readBody()
    const data = typeof body === 'string' ? { text: body } : (body || {})
    const errorMsg =
      (data as any).error ||
      (data as any).message ||
      (data as any).text ||
      resp.statusText ||
      `HTTP ${resp.status}`

    const err = new Error(errorMsg)
    ;(err as any).status = resp.status
    ;(err as any).raw = data
    throw err
  }

  if (resp.status === 204) return {} as T
  return (await resp.json()) as T
}

/** Normaliza término: 'obra_o_labor_determinada' -> 'obra_o_labor' */
function normalizeTerminoContrato(t: TerminoContrato): TerminoContrato {
  if (t === 'obra_o_labor_determinada') return 'obra_o_labor'
  return t ?? null
}

/** Quita propiedades undefined (para PATCH limpios) */
function omitUndefined<T extends Record<string, any>>(obj: T): T {
  const out = { ...obj }
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k])
  return out
}

/** Construye opciones JSON con actor (solo header; NO body.actorId) */
function jsonOptions(method: string, data: any): RequestInit {
  const actorId = getActorId()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (actorId) headers['x-actor-id'] = String(actorId)
  const body = JSON.stringify({ ...(data ?? {}) })
  return { method, headers, body, credentials: 'include' }
}

/** Construye opciones FormData con actor (solo header; NO form.append('actorId')) */
function formOptions(method: string, form: FormData): RequestInit {
  const actorId = getActorId()
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)
  return { method, headers, body: form, credentials: 'include' }
}

/* ==================
   Contratos (CRUD)
=================== */

export async function crearContrato(payload: ContratoCreatePayload): Promise<Contrato> {
  // Enviamos alias fechaFin por compatibilidad con controladores antiguos
  const toSend: any = {
    ...payload,
    fechaFin: payload.fechaTerminacion ?? null,
    terminoContrato:
      payload.tipoContrato === 'prestacion' || payload.tipoContrato === 'aprendizaje'
        ? null
        : payload.terminoContrato
          ? normalizeTerminoContrato(payload.terminoContrato)
          : null,
  }

  return fetchData<Contrato>(`${API_BASE_URL}/contratos`, jsonOptions('POST', toSend))
}

export async function actualizarContrato(
  contratoId: number,
  payload: ContratoUpdatePayload & {
    fechaFin?: string | Date | null
    fechaFinalizacion?: string | Date | null
  }
): Promise<Contrato> {
  const toYMD = (v: any): string | undefined => {
    if (!v) return undefined
    if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return undefined
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
    const d = v instanceof Date ? v : new Date(v)
    if (Number.isNaN(d.getTime())) return undefined
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const fechaTerminacion =
    payload.fechaTerminacion ?? (payload as any).fechaFin ?? (payload as any).fechaFinalizacion

  const toBool = (v: any): boolean | undefined => {
    if (typeof v === 'boolean') return v
    if (v === 'true') return true
    if (v === 'false') return false
    return undefined
  }

  const raw: any = {
    identificacion: payload.identificacion,
    sedeId: payload.sedeId,
    cargoId: payload.cargoId,
    funcionesCargo: payload.funcionesCargo,
    tipoContrato: payload.tipoContrato,
    terminoContrato:
      (payload.tipoContrato === 'prestacion' || payload.tipoContrato === 'aprendizaje')
        ? null
        : (payload.terminoContrato === undefined ? undefined : normalizeTerminoContrato(payload.terminoContrato)),
    fechaInicio: toYMD(payload.fechaInicio as any),
    fechaTerminacion: toYMD(fechaTerminacion as any),
    periodoPrueba: payload.periodoPrueba,
    horarioTrabajo: payload.horarioTrabajo,
    centroCosto: payload.centroCosto,
    epsId: payload.epsId,
    arlId: payload.arlId,
    afpId: payload.afpId,
    afcId: payload.afcId,
    ccfId: payload.ccfId,
    estado: payload.estado,
    motivoFinalizacion: payload.motivoFinalizacion,
    salarioBasico: (payload as any).salarioBasico,
    bonoSalarial: (payload as any).bonoSalarial,
    auxilioTransporte: (payload as any).auxilioTransporte,
    auxilioNoSalarial: (payload as any).auxilioNoSalarial,
    tieneRecomendacionesMedicas: toBool(payload.tieneRecomendacionesMedicas as any),
    razonSocialId: payload.razonSocialId,
  }

  const toSend = omitUndefined(raw)
  return fetchData<Contrato>(`${API_BASE_URL}/contratos/${contratoId}`, jsonOptions('PATCH', toSend))
}

/** Activar/Inactivar contrato rápidamente (usa PATCH /contratos/:id) */
export async function cambiarEstadoContrato(
  contratoId: number,
  estado: EstadoContrato
): Promise<Contrato> {
  return actualizarContrato(contratoId, { estado })
}

export async function eliminarContrato(id: number): Promise<{ message: string }> {
  const actorId = getActorId()
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)

  return fetchData<{ message: string }>(`${API_BASE_URL}/contratos/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })
}

export async function obtenerContratoPorId(id: number): Promise<Contrato> {
  return fetchData<Contrato>(`${API_BASE_URL}/contratos/${id}`, { credentials: 'include' } as any)
}

export async function obtenerContratosPorUsuario(usuarioId: number): Promise<Contrato[]> {
  return fetchData<Contrato[]>(`${API_BASE_URL}/usuarios/${usuarioId}/contratos`, {
    credentials: 'include',
  } as any)
}

/* =========================
   Anexar contrato / archivos
========================== */

export async function anexarContrato(form: {
  contratoId: number
  archivo: File
  razonSocialId?: number
  tieneRecomendacionesMedicas?: boolean
  archivoRecomendacionMedica?: File
}): Promise<AnexarContratoResponse> {
  const fd = new FormData()
  fd.append('contratoId', String(form.contratoId))
  fd.append('archivo', form.archivo, form.archivo.name)

  if (form.razonSocialId != null) {
    fd.append('razonSocialId', String(form.razonSocialId))
  }
  if (form.tieneRecomendacionesMedicas && form.archivoRecomendacionMedica) {
    fd.append('tieneRecomendacionesMedicas', 'true')
    fd.append(
      'archivoRecomendacionMedica',
      form.archivoRecomendacionMedica,
      form.archivoRecomendacionMedica.name
    )
  }

  return fetchData<AnexarContratoResponse>(`${API_BASE_URL}/contratos/anexar-fisico`, formOptions('POST', fd))
}

/* =========================
   Salarios
========================== */

export async function crearContratoSalario(payload: ContratoSalarioPayload): Promise<any> {
  return fetchData<any>(`${API_BASE_URL}/contratos/${payload.contratoId}/salarios`, jsonOptions('POST', payload))
}

/* =========================
   Recomendación Médica (por CONTRATO)
   Endpoints reales según tus rutas:
   GET    /api/contratos/:id/recomendacion/archivo        -> meta (tieneArchivo, data)
   POST   /api/contratos/:id/recomendacion/archivo        -> subir/reemplazar (form-data: archivo)
   DELETE /api/contratos/:id/recomendacion/archivo        -> eliminar
   GET    /api/contratos/:id/recomendacion/descargar      -> descarga binaria
========================== */

/** Devuelve la meta/URL del archivo de recomendación médica (si existe) */
export async function obtenerRecomendacionMedicaMeta(contratoId: number): Promise<ArchivoMeta | null> {
  const meta = await fetchData<any>(`${API_BASE_URL}/contratos/${contratoId}/recomendacion/archivo`, {
    credentials: 'include',
  } as any)

  // Formato del backend:
  // { contratoId, tieneArchivo: boolean, data: { url, nombreOriginal, mime, size } | null }
  if (!meta || meta.tieneArchivo !== true || !meta.data) return null

  const raw = meta.data
  return {
    url: toPublicUrl(raw.url ?? raw.path ?? raw.ruta ?? null),
    path: raw.path ?? null,
    nombreOriginal: raw.nombreOriginal ?? raw.nombre ?? null,
    mime: raw.mime ?? raw.mimetype ?? null,
    size: raw.size ?? null,
    fechaEmision: raw.fechaEmision ?? null,
    fechaExpiracion: raw.fechaExpiracion ?? null,
    ...raw,
  } as ArchivoMeta
}

/** Sube o reemplaza la recomendación médica del contrato */
export async function subirRecomendacionMedica(
  contratoId: number,
  archivo: File,
  extras?: { fechaEmision?: string; fechaExpiracion?: string }
): Promise<ArchivoMeta> {
  const fd = new FormData()
  fd.append('archivo', archivo, archivo.name)
  if (extras?.fechaEmision) fd.append('fechaEmision', extras.fechaEmision)
  if (extras?.fechaExpiracion) fd.append('fechaExpiracion', extras.fechaExpiracion)

  const meta = await fetchData<any>(
    `${API_BASE_URL}/contratos/${contratoId}/recomendacion/archivo`,
    formOptions('POST', fd)
  )

  // El controlador devuelve:
  // { contratoId, tieneArchivo: true, data: { url, nombreOriginal, mime, size } }
  const raw = meta?.data ?? {}
  return {
    url: toPublicUrl(raw.url ?? raw.path ?? raw.ruta ?? null),
    path: raw.path ?? null,
    nombreOriginal: raw.nombreOriginal ?? raw.nombre ?? archivo.name,
    mime: raw.mime ?? raw.mimetype ?? null,
    size: raw.size ?? null,
    fechaEmision: raw.fechaEmision ?? extras?.fechaEmision ?? null,
    fechaExpiracion: raw.fechaExpiracion ?? extras?.fechaExpiracion ?? null,
    ...raw,
  } as ArchivoMeta
}

/** Elimina la recomendación médica del contrato */
export async function eliminarRecomendacionMedica(contratoId: number): Promise<{ message: string }> {
  const actorId = getActorId()
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)

  return fetchData<{ message: string }>(
    `${API_BASE_URL}/contratos/${contratoId}/recomendacion/archivo`,
    { method: 'DELETE', headers, credentials: 'include' }
  )
}

/** Descarga la recomendación médica y dispara descarga en el navegador */
export async function descargarRecomendacionMedicaYAbrir(contratoId: number): Promise<void> {
  const resp = await fetch(`${API_BASE_URL}/contratos/${contratoId}/recomendacion/descargar`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!resp.ok) {
    let detail = ''
    try { detail = (await resp.json())?.message ?? '' } catch {}
    throw new Error(`Error ${resp.status}${detail ? `: ${detail}` : ''}`)
  }
  const blob = await resp.blob()

  // Nombre desde content-disposition o por defecto
  const cd = resp.headers.get('content-disposition') || ''
  let filename = 'recomendacion-medica'
  const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd)
  if (m && m[1]) filename = decodeURIComponent(m[1].replace(/\"/g, ''))

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Devuelve una URL pública inmediata para usar con <a target="_blank"> cuando el backend solo te da path */
export function obtenerUrlPublicaRecomendacionDesdeRuta(ruta: string | null | undefined): string | null {
  return toPublicUrl(ruta ?? null)
}
