// src/services/userService.ts

// URL base para todas las peticiones a la API
const API_BASE_URL = '/api'

// --- Interfaces para tipado de datos ---
export interface Rol {
  id: number
  nombre: string
}
export interface RazonSocial {
  id: number
  nombre: string
}
export interface Sede {
  id: number
  nombre: string
}
export interface Cargo {
  id: number
  nombre: string
}
export interface EntidadSalud {
  id: number
  nombre: string
  tipo: string

  // ───── Metadatos opcionales del certificado (si el backend los devuelve) ─────
  certificadoNombreOriginal?: string | null
  certificadoMime?: string | null
  certificadoTamanio?: number | null
  certificadoFechaEmision?: string | null
  certificadoFechaExpiracion?: string | null
  /** URL firmada/absoluta si el backend la expone */
  certificadoDownloadUrl?: string | null
}

// Interfaz para la respuesta de una operación de eliminación
export interface DeleteResponse {
  message: string
}

/**
 * Interfaz para un paso de contrato.
 * Agregada para ser utilizada en el componente.
 */
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

/**
 * Interfaz para un evento de contrato.
 */
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
  subtipo?: string
  fechaInicio: string
  fechaFin?: string
  descripcion?: string
  documentoUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * Interfaz para un contrato.
 */
export interface Contrato {
  id: number
  usuarioId: number
  sedeId: number
  tipoContrato: 'prestacion' | 'temporal' | 'laboral'
  estado: 'activo' | 'inactivo'
  fechaInicio: string
  fechaFin?: string
  motivoFinalizacion?: string
  nombreArchivoContratoFisico?: string
  rutaArchivoContratoFisico?: string
  eventos?: ContratoEvento[]     // relación con eventos
  pasos?: ContratoPaso[]         // relación con pasos
}

// Interfaz principal para el objeto de Usuario
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
  password?: string
  contratos?: Contrato[]         // relación con contratos
}

/**
 * Función genérica para manejar peticiones HTTP y errores.
 * @param url La URL del endpoint de la API.
 * @param options Opciones de la petición (método, headers, body, etc.).
 * @returns Una promesa que resuelve con los datos JSON.
 */
export async function fetchData<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData

  // Clonamos las opciones para no mutar el objeto original
  const fetchOptions = { ...options }

  // Si no es un FormData, nos aseguramos de que el Content-Type sea JSON
  if (!isFormData) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json',
    } as HeadersInit
  } else {
    // Si es FormData, eliminamos Content-Type para que el navegador lo añada correctamente
    if (fetchOptions.headers) {
      delete (fetchOptions.headers as Record<string, string>)['Content-Type']
    }
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(errorData.message || 'Error en la petición')
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const jsonResponse = await response.json()
    // Devuelve jsonResponse.data si existe; si no, la respuesta completa
    return jsonResponse.data || jsonResponse
  }

  return {} as T
}

/* ================================
   Helpers de descarga (Blob)
================================ */
async function fetchBlob(url: string, options: RequestInit = {}): Promise<Blob> {
  const resp = await fetch(url, options)
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(txt || resp.statusText || `HTTP ${resp.status}`)
  }
  return await resp.blob()
}

/** Dispara una descarga en el navegador */
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

// --- Funciones para el manejo de usuarios ---

/**
 * Obtiene una lista de todos los usuarios o filtrados por razón social.
 */
export async function obtenerUsuarios(razonSocialId?: number): Promise<User[]> {
  try {
    const url = new URL(`${API_BASE_URL}/usuarios`, window.location.origin)
    if (razonSocialId) {
      url.searchParams.append('razon_social_id', razonSocialId.toString())
    }
    const response = await fetchData<User[]>(url.href)
    return response
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    throw error
  }
}

/**
 * Obtiene los detalles de un usuario específico por su ID.
 */
export async function obtenerUsuarioPorId(id: number): Promise<User | null> {
  try {
    const response = await fetchData<User>(`${API_BASE_URL}/usuarios/${id}`)
    return response
  } catch (error: any) {
    if (error.message.includes('Not Found')) {
      console.warn(`Usuario con ID ${id} no encontrado.`)
      return null
    }
    console.error(`Error al obtener usuario con ID ${id}:`, error)
    throw error
  }
}

/**
 * Crea un nuevo usuario en la base de datos.
 */
export async function crearUsuario(userData: Partial<User>): Promise<User> {
  try {
    const response = await fetchData<User>(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    return response
  } catch (error) {
    console.error('Error al crear usuario:', error)
    throw error
  }
}

/**
 * Actualiza los datos de un usuario existente.
 */
export async function actualizarUsuario(id: number, userData: Partial<User>): Promise<User> {
  try {
    const response = await fetchData<User>(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
    return response
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${id}:`, error)
    throw error
  }
}

/**
 * Elimina un usuario por su ID.
 */
export async function eliminarUsuario(id: number): Promise<string> {
  try {
    const response = await fetchData<DeleteResponse>(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'DELETE',
    })
    return response.message || 'Usuario eliminado correctamente.'
  } catch (error) {
    console.error(`Error al eliminar usuario con ID ${id}:`, error)
    throw error
  }
}

/**
 * Actualiza la foto de perfil de un usuario.
 */
export async function uploadProfilePicture(userId: number, file: File): Promise<User> {
  try {
    const formData = new FormData()
    formData.append('foto', file)

    const response = await fetchData<User>(`${API_BASE_URL}/usuarios/${userId}/upload-photo`, {
      method: 'POST',
      body: formData,
    })

    return response
  } catch (error) {
    console.error(`Error al subir la foto de perfil para el usuario ${userId}:`, error)
    throw error
  }
}

// --- Funciones para el manejo de contratos ---

/**
 * Actualiza los datos de un contrato existente, incluyendo su estado.
 */
export async function actualizarContrato(contratoId: number, data: Partial<Contrato>): Promise<Contrato> {
  try {
    const response = await fetchData<Contrato>(`${API_BASE_URL}/contratos/${contratoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response
  } catch (error) {
    console.error(`Error al actualizar contrato con ID ${contratoId}:`, error)
    throw error
  }
}

/**
 * Crea un nuevo evento para un contrato.
 */
export async function crearEventoDeContrato(contratoId: number, data: FormData | Partial<ContratoEvento>): Promise<ContratoEvento> {
  try {
    const response = await fetchData<ContratoEvento>(`${API_BASE_URL}/contratos/${contratoId}/eventos`, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
    return response
  } catch (error) {
    console.error(`Error al crear evento para el contrato ${contratoId}:`, error)
    throw error
  }
}

// --- Funciones para obtener listas auxiliares ---

export async function obtenerRoles(): Promise<Rol[]> {
  try {
    const response = await fetchData<Rol[]>(`${API_BASE_URL}/roles`)
    return response
  } catch (error) {
    console.error('Error al obtener roles:', error)
    throw error
  }
}

export async function obtenerRazonesSociales(): Promise<RazonSocial[]> {
  try {
    const response = await fetchData<RazonSocial[]>(`${API_BASE_URL}/razones-sociales`)
    return response
  } catch (error) {
    console.error('Error al obtener razones sociales:', error)
    throw error
  }
}

export async function obtenerSedes(): Promise<Sede[]> {
  try {
    const response = await fetchData<Sede[]>(`${API_BASE_URL}/sedes`)
    return response
  } catch (error) {
    console.error('Error al obtener sedes:', error)
    throw error
  }
}

export async function obtenerCargos(): Promise<Cargo[]> {
  try {
    const response = await fetchData<Cargo[]>(`${API_BASE_URL}/cargos`)
    return response
  } catch (error) {
    console.error('Error al obtener cargos:', error)
    throw error
  }
}

export async function obtenerEntidadesSalud(): Promise<EntidadSalud[]> {
  try {
    // 🔧 FIX: ruta correcta en el backend para el listado (plural con 's'): /api/entidades-saluds
    const response = await fetchData<EntidadSalud[]>(`${API_BASE_URL}/entidades-saluds`)
    return response
  } catch (error) {
    console.error('Error al obtener entidades de salud:', error)
    throw error
  }
}

/* ============================================================================================
   NUEVO: Certificados de ENTIDADES DE SALUD
   Endpoints usados en backend:
     - GET    /api/entidades-salud/:id
     - POST   /api/entidades-salud/:id/certificado           (multipart: archivo, fechaEmision?, fechaExpiracion?)
     - GET    /api/entidades-salud/:id/certificado/download  (descargar)
     - DELETE /api/entidades-salud/:id/certificado
   ============================================================================================ */

/** GET /api/entidades-salud/:id */
export async function obtenerEntidadSaludPorId(id: number): Promise<EntidadSalud> {
  return fetchData<EntidadSalud>(`${API_BASE_URL}/entidades-salud/${id}`)
}

/**
 * POST /api/entidades-salud/:id/certificado
 * Sube o reemplaza el certificado (PDF/JPG/PNG/WEBP).
 */
export async function subirCertificadoEntidadSalud(
  entidadId: number,
  file: File,
  meta?: { fechaEmision?: string; fechaExpiracion?: string }
): Promise<EntidadSalud> {
  const form = new FormData()
  form.append('archivo', file, file.name)
  if (meta?.fechaEmision) form.append('fechaEmision', meta.fechaEmision)
  if (meta?.fechaExpiracion) form.append('fechaExpiracion', meta.fechaExpiracion)

  return fetchData<EntidadSalud>(`${API_BASE_URL}/entidades-salud/${entidadId}/certificado`, {
    method: 'POST',
    body: form,
  })
}

/**
 * GET /api/entidades-salud/:id/certificado/download
 * Descarga el certificado como archivo (dispara descarga en el navegador).
 */
export async function descargarCertificadoEntidadSalud(
  entidadId: number,
  nombreDescarga?: string
): Promise<void> {
  const blob = await fetchBlob(`${API_BASE_URL}/entidades-salud/${entidadId}/certificado/download`, {
    method: 'GET',
  })
  const suggested =
    nombreDescarga ||
    `certificado_entidad_${entidadId}${blob.type && blob.type.includes('pdf') ? '.pdf' : ''}`
  triggerDownload(blob, suggested)
}

/**
 * DELETE /api/entidades-salud/:id/certificado
 * Elimina el certificado y limpia los metadatos en la entidad.
 */
export async function eliminarCertificadoEntidadSalud(entidadId: number): Promise<string> {
  const resp = await fetchData<{ message: string }>(
    `${API_BASE_URL}/entidades-salud/${entidadId}/certificado`,
    { method: 'DELETE' }
  )
  return resp?.message || 'Certificado eliminado correctamente.'
}

/** Utilidad: saber si la entidad tiene certificado cargado */
export function entidadTieneCertificado(e: Partial<EntidadSalud> | null | undefined): boolean {
  return !!e?.certificadoNombreOriginal || !!e?.certificadoDownloadUrl
}

/* ============================================================================================
   NUEVO: Historial de ESTADOS del contrato (activo/inactivo) y CAMBIOS campo-a-campo
   Endpoints esperados en backend:
     - GET  /api/contratos/:contratoId/historial-estados
     - POST /api/contratos/:contratoId/historial-estados
     - GET  /api/contratos/:contratoId/historial-cambios
     - POST /api/contratos/:contratoId/historial-cambios
   ============================================================================================ */

// ===== Historial de ESTADOS de contrato =====
export interface ContratoHistorialEstado {
  id: number
  contratoId: number
  oldEstado: 'activo' | 'inactivo' | string
  newEstado: 'activo' | 'inactivo' | string
  fechaCambio: string           // ISO
  motivo?: string | null
  // opcionales (si backend los provee)
  usuarioId?: number | null
  realizadoPor?: string | null
}

/** GET /api/contratos/:contratoId/historial-estados */
export async function obtenerHistorialEstadosContrato(
  contratoId: number
): Promise<ContratoHistorialEstado[]> {
  return fetchData<ContratoHistorialEstado[]>(
    `${API_BASE_URL}/contratos/${contratoId}/historial-estados`
  )
}

/** POST /api/contratos/:contratoId/historial-estados */
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
  return fetchData<ContratoHistorialEstado>(
    `${API_BASE_URL}/contratos/${contratoId}/historial-estados`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

// ===== Historial de CAMBIOS (campo a campo) =====
export interface ContratoCambio {
  id: number
  contratoId: number
  usuarioId?: number | null
  campo: string                       // p.ej. 'epsId', 'salarioBasico', 'sedeId'
  valorAnterior?: string | number | null
  valorNuevo?: string | number | null
  fechaCambio: string                 // ISO
  ip?: string | null
  userAgent?: string | null
  // si tu backend lo envía:
  usuario?: { id: number; nombres: string; apellidos: string } | null
}

/** GET /api/contratos/:contratoId/historial-cambios */
export async function obtenerHistorialCambiosContrato(
  contratoId: number
): Promise<ContratoCambio[]> {
  return fetchData<ContratoCambio[]>(
    `${API_BASE_URL}/contratos/${contratoId}/historial-cambios`
  )
}

/** POST /api/contratos/:contratoId/historial-cambios (opcional/manual) */
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
  return fetchData<ContratoCambio>(
    `${API_BASE_URL}/contratos/${contratoId}/historial-cambios`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}
