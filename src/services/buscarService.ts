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
  tipo: 'INTERNO' | 'EXTERNO' | string
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

/** ===== Tipos para Asesor / vistas ===== */
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

/** Prospecto por placa (detalle reducido para la vista) */
export interface ProspectoByPlaca {
  exists: boolean
  id?: number
  placa?: string
  telefono?: string | null
  nombre?: string | null
  origen?: string | null
  creado_por?: { id: number | null; nombre: string } | null
  created_at?: string | null
  asignacion_activa?: {
    id: number
    asesor_id: number
    fecha_asignacion: string | null
    asesor?: { id?: number; nombre?: string | null } | null
  } | null
  resumenVigencias?: any
}

/* ===== Funciones ===== */

/** Buscar por placa o teléfono (sin Authorization ni cookies) */
export async function buscar(params: { placa?: string; telefono?: string }) {
  const query = {
    placa: params.placa?.trim().toUpperCase(),
    telefono: params.telefono?.trim(),
  }
  return get<BusquedaResponse>('/api/buscar', { params: query })
}

/** Verificar si una placa corresponde a un prospecto y traer su info básica */
export async function getProspectoByPlaca(placa: string) {
  return get<ProspectoByPlaca>('/api/prospectos/by-placa', {
    params: { placa: placa?.trim().toUpperCase() },
  })
}

/** (Opcional) auto-dateo por convenio si el backend lo soporta */
export async function crearDateoAutoPorConvenio(payload: {
  placa?: string
  telefono?: string
  convenioId?: number // opcional para permitir inferencia en backend
}) {
  return post<any, typeof payload>('/api/captacion-dateos/auto-convenio', payload)
}

/**
 * Resumen del asesor:
 * - Primero intenta la ruta nueva: /api/agentes-captacion/:id/resumen
 * - Mapea su respuesta a {convenios:{vigentes, asignaciones, total}, prospectos:{total, hoy, mes}}
 * - Si falla, usa la legacy /api/asesores/:id/resumen
 */
export async function getAsesorResumen(asesorId: number) {
  try {
    const r = await get<{
      convenios: { total: number; vigentes: number }
      prospectos: { total: number; vigentes?: number; hoy: number; mes: number }
    }>(`/api/agentes-captacion/${asesorId}/resumen`)

    const convenios = {
      vigentes: Number(r.convenios?.vigentes ?? 0),
      asignaciones: Number(r.convenios?.total ?? 0),
      total: Number(r.convenios?.total ?? 0),
    }
    const prospectos = {
      total: Number(r.prospectos?.total ?? r.prospectos?.vigentes ?? 0),
      hoy: Number(r.prospectos?.hoy ?? 0),
      mes: Number(r.prospectos?.mes ?? 0),
    }
    return { convenios, prospectos } as AsesorResumen
  } catch {
    // fallback legacy
    return get<AsesorResumen>(`/api/asesores/${asesorId}/resumen`)
  }
}

/** Convenios asignados a un asesor (por defecto solo vigentes) */
export async function getConveniosByAsesor(asesorId: number, vigente = true) {
  return get<ConvenioAsignado[]>(`/api/agentes-captacion/${asesorId}/convenios`, {
    params: { vigente: vigente ? 1 : 0 },
  })
}

/**
 * Prospectos del asesor (asignación vigente al asesor).
 * ✅ Ahora usamos el endpoint que devuelve ARRAY directo:
 *    GET /api/prospectos/asesor/:id/list?vigente=1
 * Además, normalizamos created_at por si llega como createdAt.
 */
export async function getProspectosByCreador(asesorId: number) {
  const raw = await get<any[]>(`/api/prospectos/asesor/${asesorId}/list`, {
    params: { vigente: 1 },
  })
  if (!Array.isArray(raw)) return []
  return raw.map((p) => ({
    id: p.id,
    placa: p.placa ?? null,
    telefono: p.telefono ?? null,
    nombre: p.nombre ?? null,
    origen: p.origen ?? null,
    created_at: p.created_at ?? p.createdAt ?? null,
  })) as ProspectoLight[]
}
