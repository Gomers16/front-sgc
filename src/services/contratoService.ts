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

  /** NUEVO: se refleja el salario básico vigente en el contrato */
  salario?: number | null

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

  // ⬇ Campos de salario para creación
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

/** Tipos de afiliación válidos para helpers */
export type TipoAfiliacion = 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'
/** Alias que a veces usas en la vista */
export type AfiliacionTipo = TipoAfiliacion

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
    tryNum(localStorage.getItem('authUserId')) ??
    tryNum(sessionStorage.getItem('authUserId')) ??
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

/** Valida y normaliza el término según el tipo de contrato. Lanza error si falta. */
function normalizeTerminoForTipo(
  tipo: TipoContrato,
  termino: TerminoContrato | undefined
): TerminoContrato {
  const tNorm = normalizeTerminoContrato(termino ?? null)

  if (tipo === 'prestacion') {
    // Requerido: 'fijo' u 'obra_o_labor'
    if (tNorm !== 'fijo' && tNorm !== 'obra_o_labor') {
      throw new Error("Para tipo 'prestacion' el 'terminoContrato' es obligatorio ('fijo' u 'obra_o_labor').")
    }
    return tNorm
  }

  if (tipo === 'temporal') {
    // Forzamos 'obra_o_labor'
    return 'obra_o_labor'
  }

  if (tipo === 'aprendizaje') {
    // Requerido: 'fijo'
    if (tNorm !== 'fijo') {
      throw new Error("Para tipo 'aprendizaje' el 'terminoContrato' debe ser 'fijo'.")
    }
    return 'fijo'
  }

  // 'laboral': permitido 'fijo' | 'obra_o_labor' | 'indefinido'
  if (tNorm && !['fijo', 'obra_o_labor', 'indefinido'].includes(tNorm)) {
    throw new Error("Para tipo 'laboral' el 'terminoContrato' debe ser 'fijo', 'obra_o_labor' o 'indefinido'.")
  }
  return tNorm ?? null
}

/** Quita propiedades undefined (para PATCH limpios) */
function omitUndefined<T extends Record<string, any>>(obj: T): T {
  const out = { ...obj }
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k])
  return out
}

/** Construye opciones JSON con actor: header + body.actorId */
function jsonOptions(method: string, data: any): RequestInit {
  const actorId = getActorId()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (actorId) headers['x-actor-id'] = String(actorId)

  // Inyectamos actorId en el body si no viene
  const bodyObj = { ...(data ?? {}) }
  if (actorId != null && bodyObj.actorId == null) bodyObj.actorId = actorId

  const body = JSON.stringify(bodyObj)
  return { method, headers, body, credentials: 'include' }
}

/** Construye opciones FormData con actor (header; el body lo adjunta quien llama) */
function formOptions(method: string, form: FormData): RequestInit {
  const actorId = getActorId()
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)
  return { method, headers, body: form, credentials: 'include' }
}

/** Asegura que el filename termine en .pdf (sin tocar el File). */
function ensurePdfFileName(file: File): string {
  const raw = file?.name || 'contrato'
  const base = raw.replace(/\.[^/.]+$/g, '') || 'contrato'
  return raw.toLowerCase().endsWith('.pdf') ? raw : `${base}.pdf`
}

/* ==================
   Contratos (CRUD)
=================== */

export async function crearContrato(payload: ContratoCreatePayload): Promise<Contrato> {
  // Validación rápida para evitar 400 desde el backend
  if (payload.salarioBasico == null || Number.isNaN(Number(payload.salarioBasico))) {
    throw new Error("El salario básico es obligatorio")
  }
  if (!payload.tipoContrato) {
    throw new Error("El tipo de contrato es obligatorio")
  }

  // ✅ Normaliza/valida término según el tipo (incluye 'prestacion')
  const terminoNormalizado = normalizeTerminoForTipo(payload.tipoContrato, payload.terminoContrato)

  // Enviamos alias fechaFin por compatibilidad con controladores antiguos
  const toSend: any = {
    ...payload,
    fechaFin: payload.fechaTerminacion ?? null,
    terminoContrato: terminoNormalizado,

    // Campos salariales (el backend ahora siempre los acepta)
    salarioBasico: payload.salarioBasico,
    bonoSalarial: payload.bonoSalarial,
    auxilioTransporte: payload.auxilioTransporte,
    auxilioNoSalarial: payload.auxilioNoSalarial,
  }

  return fetchData<Contrato>(`${API_BASE_URL}/contratos`, jsonOptions('POST', toSend))
}

export async function actualizarContrato(
  contratoId: number,
  payload: ContratoUpdatePayload & {
    fechaFin?: string | Date | null
    fechaFinalizacion?: string | Date | null
    actorId?: number | null
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

  // ✅ Si viene tipo o término, los normalizamos juntos.
  let terminoNormalizado: TerminoContrato | undefined = undefined
  if (payload.tipoContrato || payload.terminoContrato !== undefined) {
    const tipo = (payload.tipoContrato as TipoContrato) ?? 'laboral' // fallback neutro
    terminoNormalizado = normalizeTerminoForTipo(tipo, payload.terminoContrato)
  }

  const raw: any = {
    identificacion: payload.identificacion,
    sedeId: payload.sedeId,
    cargoId: payload.cargoId,
    funcionesCargo: payload.funcionesCargo,
    tipoContrato: payload.tipoContrato,
    terminoContrato: terminoNormalizado, // <-- no ponemos null forzado
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

    // ⬇️ MUY IMPORTANTE para “Realizado por”
    actorId: payload.actorId ?? getActorId(),
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

  // ⬇️ Aseguramos filename .pdf y enviamos TRES aliases: archivo, archivoContrato, archivoContratoFisico
  const pdfName = ensurePdfFileName(form.archivo)
  fd.append('archivo', form.archivo, pdfName)
  fd.append('archivoContrato', form.archivo, pdfName)
  fd.append('archivoContratoFisico', form.archivo, pdfName)

  if (form.razonSocialId != null) {
    fd.append('razonSocialId', String(form.razonSocialId))
  }

  if (form.tieneRecomendacionesMedicas && form.archivoRecomendacionMedica) {
    fd.append('tieneRecomendacionesMedicas', 'true')
    // La recomendación puede no ser pdf; dejamos su filename tal cual
    fd.append(
      'archivoRecomendacionMedica',
      form.archivoRecomendacionMedica,
      form.archivoRecomendacionMedica.name || 'recomendacion'
    )
  }

  // También inyectamos actorId por compatibilidad
  const actorId = getActorId()
  if (actorId) fd.append('actorId', String(actorId))

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
========================== */

export async function obtenerRecomendacionMedicaMeta(contratoId: number): Promise<ArchivoMeta | null> {
  const meta = await fetchData<any>(`${API_BASE_URL}/contratos/${contratoId}/recomendacion/archivo`, {
    credentials: 'include',
  } as any)

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

export async function subirRecomendacionMedica(
  contratoId: number,
  archivo: File,
  extras?: { fechaEmision?: string; fechaExpiracion?: string }
): Promise<ArchivoMeta> {
  const fd = new FormData()
  fd.append('archivo', archivo, archivo.name)
  if (extras?.fechaEmision) fd.append('fechaEmision', extras.fechaEmision)
  if (extras?.fechaExpiracion) fd.append('fechaExpiracion', extras.fechaExpiracion)

  const actorId = getActorId()
  if (actorId) fd.append('actorId', String(actorId))

  const meta = await fetchData<any>(
    `${API_BASE_URL}/contratos/${contratoId}/recomendacion/archivo`,
    formOptions('POST', fd)
  )

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

export async function eliminarRecomendacionMedica(contratoId: number): Promise<{ message: string }> {
  const actorId = getActorId()
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)

  return fetchData<{ message: string }>(
    `${API_BASE_URL}/contratos/${contratoId}/recomendacion/archivo`,
    { method: 'DELETE', headers, credentials: 'include' }
  )
}

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

/* =========================
   Reemplazo por PATCH (opcional)
========================== */
export async function reemplazarRecomendacionMedicaPorPatch(
  contratoId: number,
  archivo: File
): Promise<Contrato> {
  const fd = new FormData()
  fd.append('archivo', archivo, archivo.name)
  const actorId = getActorId()
  if (actorId) fd.append('actorId', String(actorId))

  return fetchData<Contrato>(
    `${API_BASE_URL}/contratos/${contratoId}/recomendacion-medica`,
    formOptions('PATCH', fd)
  )
}

/* =========================
   Contrato físico (visor/descarga/eliminar)
========================== */

export async function obtenerContratoArchivoMeta(contratoId: number): Promise<ArchivoMeta | null> {
  const meta = await fetchData<any>(
    `${API_BASE_URL}/contratos/${contratoId}/archivo/meta`,
    { credentials: 'include' } as any
  )

  if (!meta || meta.tieneArchivo !== true || !meta.data) return null

  const raw = meta.data
  return {
    url: toPublicUrl(raw.url ?? raw.path ?? raw.ruta ?? null),
    path: raw.path ?? null,
    nombreOriginal: raw.nombreOriginal ?? raw.nombre ?? null,
    mime: raw.mime ?? raw.mimetype ?? 'application/pdf',
    size: raw.size ?? null,
    ...raw,
  }
}

export async function eliminarArchivoContrato(contratoId: number): Promise<{ message: string }> {
  const actorId = getActorId()
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)

  return fetchData<{ message: string }>(`${API_BASE_URL}/contratos/${contratoId}/archivo`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })
}

export async function descargarContratoFisico(contratoId: number): Promise<void> {
  const resp = await fetch(`${API_BASE_URL}/contratos/${contratoId}/archivo`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!resp.ok) {
    let detail = ''
    try { detail = (await resp.json())?.message ?? '' } catch {}
    throw new Error(`Error ${resp.status}${detail ? `: ${detail}` : ''}`)
  }
  const blob = await resp.blob()

  const cd = resp.headers.get('content-disposition') || ''
  let filename = 'contrato.pdf'
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

/** Helper para visor: URL pública del contrato cuando el backend solo te da path */
export function obtenerUrlPublicaContratoDesdeRuta(ruta: string | null | undefined): string | null {
  return toPublicUrl(ruta ?? null)
}

/** Devuelve una URL pública inmediata para usar con <a target="_blank"> cuando el backend solo te da path (recomendación) */
export function obtenerUrlPublicaRecomendacionDesdeRuta(ruta: string | null | undefined): string | null {
  return toPublicUrl(ruta ?? null)
}

/* =========================
   Afiliaciones por contrato (EPS/ARL/AFP/AFC/CCF)
========================== */

export interface AfiliacionArchivoMeta extends ArchivoMeta {
  tipo?: TipoAfiliacion
}

export async function obtenerAfiliacionArchivoMeta(
  contratoId: number,
  tipo: TipoAfiliacion
): Promise<AfiliacionArchivoMeta | null> {
  const meta = await fetchData<any>(
    `${API_BASE_URL}/contratos/${contratoId}/afiliacion/${tipo}/archivo`,
    { credentials: 'include' } as any
  )

  if (!meta || meta.tieneArchivo !== true || !meta.data) return null

  const raw = meta.data
  return {
    tipo,
    url: toPublicUrl(raw.url ?? raw.path ?? raw.ruta ?? null),
    path: raw.path ?? null,
    nombreOriginal: raw.nombreOriginal ?? raw.nombre ?? null,
    mime: raw.mime ?? raw.mimetype ?? null,
    size: raw.size ?? null,
    ...raw,
  }
}

export async function subirAfiliacionArchivo(
  contratoId: number,
  tipo: TipoAfiliacion,
  archivo: File
): Promise<AfiliacionArchivoMeta> {
  const fd = new FormData()
  fd.append('archivo', archivo, archivo.name)

  const actorId = getActorId()
  if (actorId) fd.append('actorId', String(actorId))

  const meta = await fetchData<any>(
    `${API_BASE_URL}/contratos/${contratoId}/afiliacion/${tipo}/archivo`,
    formOptions('POST', fd)
  )

  const raw = meta?.data ?? {}
  return {
    tipo,
    url: toPublicUrl(raw.url ?? raw.path ?? raw.ruta ?? null),
    path: raw.path ?? null,
    nombreOriginal: raw.nombreOriginal ?? raw.nombre ?? archivo.name,
    mime: raw.mime ?? raw.mimetype ?? null,
    size: raw.size ?? null,
    ...raw,
  }
}

export async function eliminarAfiliacionArchivo(
  contratoId: number,
  tipo: TipoAfiliacion
): Promise<{ message: string }> {
  const actorId = getActorId()
  const headers: Record<string, string> = {}
  if (actorId) headers['x-actor-id'] = String(actorId)

  return fetchData<{ message: string }>(
    `${API_BASE_URL}/contratos/${contratoId}/afiliacion/${tipo}/archivo`,
    { method: 'DELETE', headers, credentials: 'include' }
  )
}

/** Helper para la vista: detecta si hay archivo en la meta */
export function tieneArchivoAfiliacion(meta: any) {
  try {
    return Boolean(
      meta?.data?.url ||
      meta?.data?.nombreOriginal ||
      meta?.url ||
      meta?.nombreOriginal
    )
  } catch {
    return false
  }
}

/* =========
   Aliases de export para compatibilidad con la vista
=========== */
export { obtenerAfiliacionArchivoMeta as obtenerAfiliacionContratoMeta }
export { subirAfiliacionArchivo as subirAfiliacionContrato }
export { eliminarAfiliacionArchivo as eliminarAfiliacionContrato }
