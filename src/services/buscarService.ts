import { get, post } from '@/services/http'

/* ===== Tipos ===== */
export type CanalCaptacion = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
export type OrigenBusqueda = 'placa' | 'telefono'

export interface VehiculoLight {
  id: number
  placa: string
  clase?: { id: number; codigo: string; nombre: string } | null
  marca?: string | null
  linea?: string | null
  modelo?: string | number | null
}

export interface ClienteLight {
  id: number
  nombre: string
  doc_tipo?: string | null
  doc_numero?: string | null
  telefono?: string | null
  email?: string | null
  vehiculos?: Array<VehiculoLight>
}

export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'INTERNO' | 'EXTERNO'
}

export interface DateoLight {
  id: number
  canal: CanalCaptacion
  agente?: AgenteLight | null
  placa?: string | null
  telefono?: string | null
  origen?: string | null
  observacion?: string | null
  imagen_url?: string | null
  created_at: string
  consumido_turno_id?: number | null
  consumido_at?: string | null
}

export interface ReservaInfo {
  vigente: boolean
  bloqueaHasta: string | null
}

export interface CaptacionSugerida {
  canal: CanalCaptacion
  agente: AgenteLight | null
}

export interface BusquedaResponse {
  vehiculo?: VehiculoLight | null
  cliente?: ClienteLight | null
  dateoReciente?: DateoLight | null
  reserva?: ReservaInfo | null
  captacionSugerida?: CaptacionSugerida | null
  origenBusqueda: OrigenBusqueda
}

/** ===== Nuevos tipos para Asesor / vistas ===== */
export interface AsesorResumen {
  convenios: { vigentes: number; asignaciones: number; total: number }
  prospectos: { total: number; hoy: number; mes: number }
}

export interface ConvenioAsignado {
  id: number
  nombre: string
  tipo: string
  doc_tipo: string | null
  doc_numero: string | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  direccion: string | null
  activo: boolean
  vigencia_desde: string | null
  vigencia_hasta: string | null
  asignacion: {
    id: number
    fecha_asignacion: string | null
    fecha_fin: string | null
    activo: boolean
    motivo_fin: string | null
  }
}

export interface ProspectoLight {
  id: number
  placa?: string | null
  telefono?: string | null
  nombre?: string | null
  origen?: string | null
  created_at?: string | null
}

/* ===== Funciones ===== */

/** Buscar por placa o teléfono (sin Authorization ni cookies) */
export async function buscar(params: { placa?: string; telefono?: string }) {
  const query = {
    placa: params.placa?.trim().toUpperCase(),
    telefono: params.telefono?.trim(),
  }
  // Prefijo /api para que funcione aunque VITE_API_BASE_URL no lo tenga
  return get<BusquedaResponse>('/api/buscar', { params: query })
}

/** (Opcional) auto-dateo por convenio si el backend lo soporta */
export async function crearDateoAutoPorConvenio(payload: {
  placa?: string
  telefono?: string
  convenioId: number
}) {
  return post<any, typeof payload>('/api/captacion-dateos/auto-convenio', payload)
}

/** Resumen del asesor (convenios/prospectos) */
export async function getAsesorResumen(asesorId: number) {
  return get<AsesorResumen>(`/api/asesores/${asesorId}/resumen`)
}

/** Convenios asignados a un asesor (por defecto solo vigentes) */
export async function getConveniosByAsesor(asesorId: number, vigente = true) {
  return get<ConvenioAsignado[]>(`/api/agentes-captacion/${asesorId}/convenios`, {
    params: { vigente: vigente ? 1 : 0 },
  })
}

/** Prospectos creados por un asesor (filtro creadoPor) */
export async function getProspectosByCreador(asesorId: number) {
  return get<ProspectoLight[]>('/api/prospectos', { params: { creadoPor: asesorId } })
}
