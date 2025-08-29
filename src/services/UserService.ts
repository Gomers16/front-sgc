// URL base para todas las peticiones a la API
const API_BASE_URL = '/api'

/* =========================
   Tipos / Interfaces
========================= */
export interface Rol { id: number; nombre: string }
export interface RazonSocial { id: number; nombre: string }
export interface Sede { id: number; nombre: string }
export interface Cargo { id: number; nombre: string }

export interface EntidadSalud {
  id: number
  nombre: string
  tipo: 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'
}

export interface DeleteResponse { message: string }

export interface ContratoPaso {
  id: number
  contratoId: number
  fase: 'inicio' | 'desarrollo' | 'fin'
  nombrePaso: string
  fecha?: string
  archivoUrl?: string
  observacion?: string
  orden: number
  completado: boolean
  createdAt: string
  updatedAt: string
}

export interface ContratoEvento {
  id: number
  contratoId: number
  tipo:
    | 'Incapacidad'
    | 'Suspension'
    | 'Licencia'
    | 'Permiso'
    | 'Vacaciones'
    | 'Cesantias'
    | 'Disciplinario'
    | 'Terminacion'
  subtipo?: string
  fechaInicio: string
  fechaFin?: string
  descripcion?: string
  documentoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Contrato {
  id: number
  usuarioId: number
  sedeId: number
  /** ⬅️ agregado 'aprendizaje' para alinear con la vista */
  tipoContrato: 'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'
  estado: 'activo' | 'inactivo'
  fechaInicio: string
  fechaFin?: string
  motivoFinalizacion?: string
  nombreArchivoContratoFisico?: string
  rutaArchivoContratoFisico?: string
  /** ⬅️ opcional por si el backend lo envía y la vista lo usa */
  terminoContrato?: 'fijo' | 'obra_o_labor_determinada' | 'indefinido' | string
  /** ⬅️ opcional para que la vista pueda leerla si viene */
  rutaArchivoRecomendacionMedica?: string | null
  eventos?: ContratoEvento[]
  pasos?: ContratoPaso[]
}

/** Metadatos de un archivo de afiliación en usuario */
export interface AfiliacionFileMeta {
  url: string
  nombreOriginal: string
  mime: string
  size: number
}

/** Respuesta GET /usuarios/:id/afiliacion/:tipo/archivo */
export interface AfiliacionFileResponse {
  userId: number
  tipo: 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'
  tieneArchivo: boolean
  data: AfiliacionFileMeta | null
}

export interface User {
  id: number
  nombres: string
  apellidos: string
  correo: string
  celularPersonal?: string
  celularCorporativo?: string
  direccion?: string
  centroCosto?: string
  recomendaciones?: boolean
  fotoPerfil?: string
  estado: 'activo' | 'inactivo'
  rolId: number
  rol?: Rol
  razonSocialId: number
  razonSocial?: RazonSocial
  sedeId: number
  sede?: Sede
  cargoId: number
  cargo?: Cargo
  epsId?: number
  eps?: EntidadSalud
  arlId?: number
  arl?: EntidadSalud
  afpId?: number
  afp?: EntidadSalud
  afcId?: number
  afc?: EntidadSalud
  ccfId?: number
  ccf?: EntidadSalud

  // Metadatos de archivos de afiliación (si backend los serializa en show/index):
  epsDocPath?: string | null; epsDocNombre?: string | null; epsDocMime?: string | null; epsDocSize?: number | null
  arlDocPath?: string | null; arlDocNombre?: string | null; arlDocMime?: string | null; arlDocSize?: number | null
  afpDocPath?: string | null; afpDocNombre?: string | null; afpDocMime?: string | null; afpDocSize?: number | null
  afcDocPath?: string | null; afcDocNombre?: string | null; afcDocMime?: string | null; afcDocSize?: number | null
  ccfDocPath?: string | null; ccfDocNombre?: string | null; ccfDocMime?: string | null; ccfDocSize?: number | null

  // Recomendación médica
  recomendacionMedica?: string | null
  recoMedDocPath?: string | null
  recoMedDocNombre?: string | null
  recoMedDocMime?: string | null
  recoMedDocSize?: number | null

  password?: string
  contratos?: Contrato[]
}

/* ================================
   Core fetch + helpers de descarga
================================ */
export async function fetchData<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData
  const fetchOptions: RequestInit = { ...options }

  if (!isFormData) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json',
    } as HeadersInit
  } else if (fetchOptions.headers) {
    delete (fetchOptions.headers as Record<string, string>)['Content-Type']
  }

  const response = await fetch(url, fetchOptions)
  if (!response.ok) {
    // intenta leer json, si no, texto plano
    let message = response.statusText
    try {
      const err = await response.json()
      message = err?.message || message
    } catch {
      try { message = await response.text() } catch {}
    }
    throw new Error(message || 'Error en la petición')
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const jsonResponse = await response.json()
    // algunos controladores devuelven {data: ...}
    return (jsonResponse?.data ?? jsonResponse) as T
  }

  return {} as T
}

async function fetchBlob(url: string, options: RequestInit = {}): Promise<Blob> {
  const resp = await fetch(url, options)
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(txt || resp.statusText || `HTTP ${resp.status}`)
  }
  return await resp.blob()
}

function triggerDownload(blob: Blob, filename: string) {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/* ================================
   Usuarios
================================ */
export async function obtenerUsuarios(razonSocialId?: number): Promise<User[]> {
  const url = new URL(`${API_BASE_URL}/usuarios`, window.location.origin)
  if (razonSocialId) url.searchParams.append('razon_social_id', razonSocialId.toString())
  return fetchData<User[]>(url.href)
}

export async function obtenerUsuarioPorId(id: number): Promise<User | null> {
  try {
    return await fetchData<User>(`${API_BASE_URL}/usuarios/${id}`)
  } catch (error: any) {
    if (error.message?.toLowerCase?.().includes('no encontrado') || error.message.includes('Not Found')) {
      console.warn(`Usuario con ID ${id} no encontrado.`)
      return null
    }
    throw error
  }
}

export async function crearUsuario(userData: Partial<User>): Promise<User> {
  return fetchData<User>(`${API_BASE_URL}/usuarios`, {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function actualizarUsuario(id: number, userData: Partial<User>): Promise<User> {
  return fetchData<User>(`${API_BASE_URL}/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  })
}

export async function eliminarUsuario(id: number): Promise<string> {
  const resp = await fetchData<DeleteResponse>(`${API_BASE_URL}/usuarios/${id}`, { method: 'DELETE' })
  return resp.message || 'Usuario eliminado correctamente.'
}

export async function uploadProfilePicture(userId: number, file: File): Promise<User> {
  const formData = new FormData()
  formData.append('foto', file)
  return fetchData<User>(`${API_BASE_URL}/usuarios/${userId}/upload-photo`, {
    method: 'POST',
    body: formData,
  })
}

/* ================================
   Contratos (resumen)
================================ */
export async function actualizarContrato(contratoId: number, data: Partial<Contrato>): Promise<Contrato> {
  return fetchData<Contrato>(`${API_BASE_URL}/contratos/${contratoId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function crearEventoDeContrato(
  contratoId: number,
  data: FormData | Partial<ContratoEvento>
): Promise<ContratoEvento> {
  return fetchData<ContratoEvento>(`${API_BASE_URL}/contratos/${contratoId}/eventos`, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  })
}

/* ================================
   Listas auxiliares
================================ */
export async function obtenerRoles(): Promise<Rol[]> {
  return fetchData<Rol[]>(`${API_BASE_URL}/roles`)
}

export async function obtenerRazonesSociales(): Promise<RazonSocial[]> {
  return fetchData<RazonSocial[]>(`${API_BASE_URL}/razones-sociales`)
}

export async function obtenerSedes(): Promise<Sede[]> {
  return fetchData<Sede[]>(`${API_BASE_URL}/sedes`)
}

export async function obtenerCargos(): Promise<Cargo[]> {
  return fetchData<Cargo[]>(`${API_BASE_URL}/cargos`)
}

/** Catálogo de entidades (para selects) */
export async function obtenerEntidadesSalud(): Promise<EntidadSalud[]> {
  // backend: /api/entidades-saluds  (incluye 'tipo')
  return fetchData<EntidadSalud[]>(`${API_BASE_URL}/entidades-saluds`)
}

/* ==========================================================
   Archivos por afiliación (EPS/ARL/AFP/AFC/CCF)
   Endpoints backend:
     - POST   /api/usuarios/:id/afiliacion/:tipo/archivo
     - GET    /api/usuarios/:id/afiliacion/:tipo/archivo
     - DELETE /api/usuarios/:id/afiliacion/:tipo/archivo
========================================================== */
export type TipoAfiliacion = 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'

/**
 * Sube/Reemplaza archivo de afiliación. Soporta metadatos extra vía 4to parámetro.
 */
export async function subirArchivoAfiliacion(
  userId: number,
  tipo: TipoAfiliacion,
  file: File,
  extraFields?: Record<string, any>
): Promise<AfiliacionFileResponse> {
  const form = new FormData()
  form.append('archivo', file, file.name)
  if (extraFields && typeof extraFields === 'object') {
    Object.entries(extraFields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, String(v))
    })
  }

  const raw = await fetchData<any>(`${API_BASE_URL}/usuarios/${userId}/afiliacion/${tipo}/archivo`, {
    method: 'POST',
    body: form,
  })

  // Normaliza (por si backend devuelve { message, data:{...} } o variaciones de nombres)
  const srcData = raw?.data ?? raw ?? {}

  const pathLike =
    srcData.url ?? srcData.path ?? srcData.ruta ?? srcData.archivoUrl ??
    srcData.epsDocPath ?? srcData.arlDocPath ?? srcData.afpDocPath ?? srcData.afcDocPath ?? srcData.ccfDocPath

  const nombreLike =
    srcData.nombreOriginal ?? srcData.filename ?? srcData.name ??
    srcData.epsDocNombre ?? srcData.arlDocNombre ?? srcData.afpDocNombre ?? srcData.afcDocNombre ?? srcData.ccfDocNombre

  return {
    userId: raw.userId ?? userId,
    tipo: raw.tipo ?? tipo,
    tieneArchivo: !!(raw?.tieneArchivo ?? pathLike ?? nombreLike),
    data: (pathLike || nombreLike)
      ? {
          url: String(pathLike || ''),
          nombreOriginal: String(nombreLike || ''),
          mime: srcData.mime ?? '',
          size: Number(srcData.size ?? 0),
        }
      : null,
  }
}

/**
 * Obtiene metadatos del archivo de afiliación y los normaliza a { url, nombreOriginal, mime, size }.
 */
export async function obtenerArchivoAfiliacionMeta(
  userId: number,
  tipo: TipoAfiliacion
): Promise<AfiliacionFileResponse> {
  // Cache-buster + no-store para evitar datos stale en el modal
  const url = `${API_BASE_URL}/usuarios/${userId}/afiliacion/${tipo}/archivo?ts=${Date.now()}`
  const raw = await fetchData<any>(url, { cache: 'no-store' as RequestCache })

  // Puede venir como { data:{...} } o directo
  const src = raw?.data ?? raw ?? {}

  const pathLike =
    src.url ?? src.path ?? src.ruta ?? src.archivoUrl ??
    src.epsDocPath ?? src.arlDocPath ?? src.afpDocPath ?? src.afcDocPath ?? src.ccfDocPath

  const nombreLike =
    src.nombreOriginal ?? src.filename ?? src.name ??
    src.epsDocNombre ?? src.arlDocNombre ?? src.afpDocNombre ?? src.afcDocNombre ?? src.ccfDocNombre

  const normalized: AfiliacionFileResponse = {
    userId: raw.userId ?? userId,
    tipo: (raw.tipo as any) ?? tipo,
    tieneArchivo: !!(raw?.tieneArchivo ?? pathLike ?? nombreLike),
    data: (pathLike || nombreLike)
      ? {
          url: String(pathLike || ''),
          nombreOriginal: String(nombreLike || ''),
          mime: src.mime ?? '',
          size: Number(src.size ?? 0),
        }
      : null,
  }

  return normalized
}

export async function eliminarArchivoAfiliacion(
  userId: number,
  tipo: TipoAfiliacion
): Promise<string> {
  const resp = await fetchData<DeleteResponse>(`${API_BASE_URL}/usuarios/${userId}/afiliacion/${tipo}/archivo`, {
    method: 'DELETE',
  })
  return resp.message || 'Archivo eliminado.'
}

/** Helper de UI: ¿hay archivo para ese tipo? (tolerante con claves alternativas) */
export function tieneArchivoAfiliacion(resp: AfiliacionFileResponse | null | undefined): boolean {
  const d: any = resp?.data
  return !!(
    resp?.tieneArchivo ||
    d?.url ||
    d?.nombreOriginal ||
    d?.path ||
    d?.ruta ||
    d?.archivoUrl
  )
}

/* ==========================================================
   Recomendación médica (texto + archivo)
========================================================== */
export async function upsertRecomendacionMedica(
  userId: number,
  recomendacionMedica: string | null
): Promise<{ message: string; recomendacionMedica: string | null }> {
  return fetchData<{ message: string; recomendacionMedica: string | null }>(
    `${API_BASE_URL}/usuarios/${userId}/recomendacion-medica`,
    { method: 'PUT', body: JSON.stringify({ recomendacionMedica }) }
  )
}

export async function subirArchivoRecomendacionMedica(
  userId: number,
  file: File
): Promise<{ message: string; url: string }> {
  const form = new FormData()
  form.append('archivo', file, file.name)
  return fetchData<{ message: string; url: string }>(
    `${API_BASE_URL}/usuarios/${userId}/recomendacion-medica/archivo`,
    { method: 'POST', body: form }
  )
}

export async function eliminarArchivoRecomendacionMedica(
  userId: number
): Promise<string> {
  const resp = await fetchData<DeleteResponse>(
    `${API_BASE_URL}/usuarios/${userId}/recomendacion-medica/archivo`,
    { method: 'DELETE' }
  )
  return resp.message || 'Archivo de recomendación médica eliminado.'
}

/* ==========================================================
   (Opcional) Historial de estados/cambios de contrato
========================================================== */
export interface ContratoHistorialEstado {
  id: number
  contratoId: number
  oldEstado: 'activo' | 'inactivo' | string
  newEstado: 'activo' | 'inactivo' | string
  fechaCambio: string
  motivo?: string | null
  usuarioId?: number | null
  realizadoPor?: string | null
}

export async function obtenerHistorialEstadosContrato(
  contratoId: number
): Promise<ContratoHistorialEstado[]> {
  return fetchData<ContratoHistorialEstado[]>(`${API_BASE_URL}/contratos/${contratoId}/historial-estados`)
}

export async function crearHistorialEstadoContrato(
  contratoId: number,
  payload: {
    oldEstado: string
    newEstado: string
    fechaCambio?: string
    motivo?: string | null
    usuarioId?: number | null
  }
): Promise<ContratoHistorialEstado> {
  return fetchData<ContratoHistorialEstado>(`${API_BASE_URL}/contratos/${contratoId}/historial-estados`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface ContratoCambio {
  id: number
  contratoId: number
  usuarioId?: number | null
  campo: string
  valorAnterior?: string | number | null
  valorNuevo?: string | number | null
  fechaCambio: string
  ip?: string | null
  userAgent?: string | null
  usuario?: { id: number; nombres: string; apellidos: string } | null
}

export async function obtenerHistorialCambiosContrato(
  contratoId: number
): Promise<ContratoCambio[]> {
  return fetchData<ContratoCambio[]>(`${API_BASE_URL}/contratos/${contratoId}/historial-cambios`)
}

export async function crearCambioContrato(
  contratoId: number,
  payload: {
    campo: string
    valorAnterior?: string | number | null
    valorNuevo?: string | number | null
    fechaCambio?: string
    usuarioId?: number | null
  }
): Promise<ContratoCambio> {
  return fetchData<ContratoCambio>(`${API_BASE_URL}/contratos/${contratoId}/historial-cambios`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
