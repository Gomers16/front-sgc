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
export type TipoContrato = 'prestacion' | 'temporal' | 'laboral'
/**
 * En el front usamos "obra_o_labor_determinada". El backend podría esperar "obra_o_labor".
 * Más abajo normalizamos antes de enviar.
 */
export type TerminoContrato = 'fijo' | 'obra_o_labor' | 'obra_o_labor_determinada' | 'indefinido' | null

export interface ContratoPaso {
  id?: number
  contratoId?: number
  nombrePaso?: string             // backend guarda como nombrePaso
  nombre?: string                 // alias en front
  completado: boolean
  observacion?: string
  nombreArchivo?: string
  fecha?: string                  // backend usa 'fecha'
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

  fechaInicio: string            // ISO desde backend
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

/* ==================
   Helpers
=================== */

async function fetchData<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(url, options)
  if (!resp.ok) {
    // Intenta leer JSON, luego texto, luego statusText
    let errorMsg = resp.statusText
    try {
      const data = await resp.json()
      errorMsg = data?.message || data?.error || errorMsg
    } catch {
      try {
        const t = await resp.text()
        if (t) errorMsg = t
      } catch {
        /* ignore */
      }
    }
    throw new Error(errorMsg)
  }
  if (resp.status === 204) return {} as T
  return resp.json()
}

/**
 * Asegura que el término que viaja al backend sea el que espera.
 * Front puede usar 'obra_o_labor_determinada', normalizamos a 'obra_o_labor'
 */
function normalizeTerminoContrato(t: TerminoContrato): TerminoContrato {
  if (t === 'obra_o_labor_determinada') return 'obra_o_labor'
  return t ?? null
}

/* ==================
   Contratos (CRUD)
=================== */

export async function crearContrato(payload: ContratoCreatePayload): Promise<Contrato> {
  const toSend: ContratoCreatePayload = {
    ...payload,
    terminoContrato: payload.terminoContrato
      ? normalizeTerminoContrato(payload.terminoContrato)
      : null,
  }

  return fetchData<Contrato>(`${API_BASE_URL}/contratos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toSend),
  })
}

export async function actualizarContrato(
  contratoId: number,
  payload: ContratoUpdatePayload
): Promise<Contrato> {
  const toSend: ContratoUpdatePayload = {
    ...payload,
    terminoContrato: payload.terminoContrato
      ? normalizeTerminoContrato(payload.terminoContrato)
      : payload.terminoContrato,
  }

  return fetchData<Contrato>(`${API_BASE_URL}/contratos/${contratoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toSend),
  })
}

/** Activar/Inactivar contrato rápidamente (usa PATCH /contratos/:id) */
export async function cambiarEstadoContrato(
  contratoId: number,
  estado: EstadoContrato
): Promise<Contrato> {
  return actualizarContrato(contratoId, { estado })
}

export async function eliminarContrato(id: number): Promise<{ message: string }> {
  return fetchData<{ message: string }>(`${API_BASE_URL}/contratos/${id}`, {
    method: 'DELETE',
  })
}

export async function obtenerContratoPorId(id: number): Promise<Contrato> {
  return fetchData<Contrato>(`${API_BASE_URL}/contratos/${id}`)
}

export async function obtenerContratosPorUsuario(usuarioId: number): Promise<Contrato[]> {
  return fetchData<Contrato[]>(`${API_BASE_URL}/usuarios/${usuarioId}/contratos`)
}

/* =========================
   Anexar contrato / archivos
========================== */

/**
 * Dual mode: anexar archivo(s) a contrato existente.
 * Requiere:
 *  - contratoId
 *  - archivo (PDF)
 * Opcional:
 *  - razonSocialId
 *  - tieneRecomendacionesMedicas y archivoRecomendacionMedica
 */
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

  return fetchData<AnexarContratoResponse>(`${API_BASE_URL}/contratos/anexar-fisico`, {
    method: 'POST',
    body: fd,
  })
}

/* =========================
   Salarios
========================== */

export async function crearContratoSalario(payload: ContratoSalarioPayload): Promise<any> {
  return fetchData<any>(`${API_BASE_URL}/contratos/${payload.contratoId}/salarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/* ======================
   Pasos (mínimos)
====================== */

export async function actualizarPasoContrato(
  contratoId: number,
  pasoId: number,
  payload: { completado: boolean; observacion?: string; archivo?: File }
): Promise<ContratoPaso> {
  const fd = new FormData()
  fd.append('completado', String(payload.completado))
  if (payload.observacion) fd.append('observacion', payload.observacion)
  if (payload.archivo) fd.append('archivo', payload.archivo, payload.archivo.name)

  return fetchData<ContratoPaso>(`${API_BASE_URL}/contratos/${contratoId}/pasos/${pasoId}`, {
    method: 'PUT',
    body: fd,
  })
}

export async function obtenerPasosContrato(contratoId: number): Promise<ContratoPaso[]> {
  return fetchData<ContratoPaso[]>(`${API_BASE_URL}/contratos/${contratoId}/pasos`)
}
