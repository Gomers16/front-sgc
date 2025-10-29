// src/services/turnosdeldiaService.ts
import { DateTime } from 'luxon'
import { get, post, put, patch, download } from './http'

/* ================= Tipos base ================= */
export type TipoVehiculoFrontend =
  | 'Liviano Particular'
  | 'Liviano Taxi'
  | 'Liviano Público'
  | 'Motocicleta'

export type MedioEnteroFront = 'redes_sociales' | 'call_center' | 'fachada' | 'asesor'

/** 👇 Formato final que guarda la DB (derivado del canal) */
export type MedioEnteroFinalDB = 'Redes Sociales' | 'Call Center' | 'Fachada' | 'Asesor Comercial'

export type CanalAtrib = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
export type ServicioCodigo = 'RTM' | 'PREV' | 'PERI' | 'SOAT'

/** Mapeo Front -> DB (informativo) */
const MEDIO_MAP: Record<MedioEnteroFront, MedioEnteroFinalDB> = {
  redes_sociales: 'Redes Sociales',
  call_center: 'Call Center',
  fachada: 'Fachada',
  asesor: 'Asesor Comercial',
}

/** Mapeo Front -> Canal (para construir `canal` si no llega explícito) */
const MEDIO_TO_CANAL: Record<MedioEnteroFront, CanalAtrib> = {
  redes_sociales: 'REDES',
  call_center: 'TELE',
  fachada: 'FACHADA',
  asesor: 'ASESOR',
}

interface SiguienteTurnoResponse {
  siguiente: number
  siguientePorServicio?: number
  sedeId: number
}

/* ====== Catálogo de Servicios (para el select) ====== */
export interface ServicioCatalog {
  id: number
  codigo: ServicioCodigo | string
  nombre: string
}

interface ServicioEnTurno {
  id: number
  codigoServicio: string
  nombreServicio: string
}

interface UsuarioLite { id: number; nombres: string; apellidos: string }
interface SedeLite { id: number; nombre: string }

export interface AgenteCaptacionLite {
  id: number
  nombre: string
  // 👇 Alineado con tu backend:
  tipo: 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'ASESOR_TELEMERCADEO' | string
}

export interface Turno {
  id: number
  turnoNumero: number
  placa: string
  tipoVehiculo: TipoVehiculoFrontend
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  horaIngreso: string | null
  horaSalida: string | null
  fecha: string
  medioEntero: MedioEnteroFinalDB
  observaciones: string | null
  funcionarioId: number
  tiempoServicio: string | null

  servicioId?: number
  servicio?: ServicioEnTurno | null
  usuario?: UsuarioLite
  sede?: SedeLite

  // nuevos campos útiles en UI
  canalAtribucion?: CanalAtrib
  agenteCaptacion?: AgenteCaptacionLite | null
}

/* ========== Filtros de exportación alineados al backend ========== */
export interface ExportFilters {
  fechaInicio: string
  fechaFin: string
  servicioCodigo?: ServicioCodigo
  servicioId?: number
  canalAtribucion?: CanalAtrib
  agenteId?: number
  agenteTipo?: 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'ASESOR_TELEMERCADEO'
}

/* ========== Payloads ==========\ */
export interface CreateTurnoPayload {
  placa: string
  tipoVehiculo: TipoVehiculoFrontend
  observaciones?: string | null
  fecha: string              // YYYY-MM-DD
  horaIngreso: string        // HH:mm o HH:mm:ss o hh:mm(:ss) AM/PM
  usuarioId: number
  servicioId?: number
  servicioCodigo?: ServicioCodigo

  // Atribución / captación
  canal?: CanalAtrib                    // recomendado
  agenteCaptacionId?: number | null     // opcional

  // Compat/front (si en UI solo manejas “medio”)
  medioEntero?: MedioEnteroFront        // si viene, se mapea a `canal`

  // Datos cliente opcionales cuando no existe
  clienteNombre?: string
  clienteTelefono?: string
  clienteEmail?: string
}

export interface UpdateTurnoPayload {
  placa?: string
  tipoVehiculo?: TipoVehiculoFrontend
  observaciones?: string | null
  usuarioId: number
  horaSalida?: string | null
  tiempoServicio?: string | null
  estado?: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  servicioId?: number
  servicioCodigo?: ServicioCodigo
  canal?: CanalAtrib
  agenteCaptacionId?: number | null
}

/* ===== Helpers front ===== */
function normalizePlate(v?: string) {
  return v ? v.replace(/[\s-]/g, '').toUpperCase() : ''
}
function to24hFrom12(s?: string) {
  if (!s) return ''
  const clean = s.trim().replace(/\./g, ':').toUpperCase()
  const rx = /^(\d{1,2})(?::?(\d{2}))?(?::?(\d{2}))?\s*(AM|PM)$/i
  const m = clean.match(rx)
  if (!m) return s // ya venía en 24h
  let h = Number(m[1]); const mm = m[2] ?? '00'; const ss = m[3] ?? '00'; const ap = (m[4] || 'AM').toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2,'0')}:${mm}:${ss}`
}

/* ================== SERVICE ================== */
class TurnosDelDiaService {
  private static readonly BASE = '/api/turnos-rtm'
  // ⚠️ Asegúrate que tu routes.ts mapea GET `${BASE}/export-excel` al método exportExcel del controlador.
  // Si lo tienes como `/reporte/excel`, cambia aquí la constante.
  private static readonly EXPORT_PATH = `${TurnosDelDiaService.BASE}/export-excel`

  /* ====== Servicios catálogo ====== */
  public static obtenerServicios() {
    return get<ServicioCatalog[]>('/api/servicios', {
      headers: { Accept: 'application/json' },
    })
  }
  public static getServicios() {
    return this.obtenerServicios()
  }

  /**
   * GET /api/turnos-rtm/siguiente-turno?usuarioId=...&servicioId=...
   */
  public static fetchNextTurnNumber(usuarioId: number, servicioId?: number) {
    const params: Record<string, string | number> = { usuarioId }
    if (typeof servicioId === 'number') params.servicioId = servicioId
    return get<SiguienteTurnoResponse>(`${this.BASE}/siguiente-turno`, {
      params,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
  }

  /** GET /api/turnos-rtm */
  public static async fetchTurnos(
    filters: Record<string, string | number | boolean> = {}
  ): Promise<Turno[]> {
    // Sanitizar tipoVehiculo si viene
    if (
      filters.tipoVehiculo &&
      !(
        ['Liviano Particular', 'Liviano Taxi', 'Liviano Público', 'Motocicleta'] as string[]
      ).includes(filters.tipoVehiculo as string)
    ) {
      delete filters.tipoVehiculo
    }

    return get<Turno[]>(this.BASE, {
      params: filters,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
  }

  /** GET /api/turnos-rtm/:id */
  public static fetchTurnoById(id: number) {
    return get<Turno>(`${this.BASE}/${id}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
  }

  /**
   * POST /api/turnos-rtm
   * Enviar UNO de: servicioId ó servicioCodigo ('RTM' | 'PREV' | 'PERI' | 'SOAT')
   * Recomendado: enviar `canal` ('FACHADA'|'ASESOR'|'TELE'|'REDES').
   */
  public static async createTurno(payload: CreateTurnoPayload) {
    // Derivar canal desde medioEntero si no viene
    const canal: CanalAtrib =
      payload.canal ?? (payload.medioEntero ? MEDIO_TO_CANAL[payload.medioEntero] : 'FACHADA')

    // Normalizar placa y hora a 24h si el front la envía en AM/PM
    const placaOk = normalizePlate(payload.placa)
    const horaOk =
      /^\d{2}:\d{2}(:\d{2})?$/.test(String(payload.horaIngreso))
        ? payload.horaIngreso
        : to24hFrom12(String(payload.horaIngreso))

    const body: Record<string, unknown> = {
      placa: placaOk,
      tipoVehiculo: payload.tipoVehiculo,
      observaciones: payload.observaciones ?? null,
      fecha: payload.fecha,
      horaIngreso: horaOk || payload.horaIngreso,
      usuarioId: payload.usuarioId,
      canal, // <- importante para backend

      // servicio
      ...(payload.servicioId ? { servicioId: payload.servicioId } : {}),
      ...(payload.servicioCodigo ? { servicioCodigo: payload.servicioCodigo } : {}),

      // agente captación
      ...(payload.agenteCaptacionId !== undefined
        ? { agenteCaptacionId: payload.agenteCaptacionId }
        : {}),

      // datos cliente opcionales
      ...(payload.clienteNombre ? { clienteNombre: payload.clienteNombre } : {}),
      ...(payload.clienteTelefono ? { clienteTelefono: payload.clienteTelefono } : {}),
      ...(payload.clienteEmail ? { clienteEmail: payload.clienteEmail } : {}),
    }

    try {
      return await post<Turno, typeof body>(this.BASE, body, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })
    } catch (err: unknown) {
      const serverMsg = TurnosDelDiaService.extractServerMessage(err)
      console.error('createTurno() falló:', serverMsg, err)
      throw new Error(serverMsg)
    }
  }

  /** PUT /api/turnos-rtm/:id */
  public static updateTurno(id: number, turnoData: UpdateTurnoPayload) {
    const body: Record<string, unknown> = { ...turnoData }
    return put<Turno, typeof body>(`${this.BASE}/${id}`, body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
  }

  /** PUT /api/turnos-rtm/:id/salida  { usuarioId } */
  public static registrarSalida(id: number, usuarioId: number) {
    return put<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/salida`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
  }

  /** PATCH /api/turnos-rtm/:id/activar  { usuarioId } */
  public static activarTurno(id: number, usuarioId: number) {
    return patch<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/activar`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
  }

  /** PATCH /api/turnos-rtm/:id/cancelar  { usuarioId } */
  public static cancelarTurno(id: number, usuarioId: number) {
    return patch<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/cancelar`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
  }

  /** PATCH /api/turnos-rtm/:id/inhabilitar  { usuarioId } */
  public static inhabilitarTurno(id: number, usuarioId: number) {
    return patch<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/inhabilitar`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
  }

  /* ====== Exportaciones (alineadas al controlador) ====== */
  public static async exportTurnosExcel(filters: ExportFilters): Promise<{ data: Blob; filename: string }> {
    const params: Record<string, string | number> = {}

    if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio
    if (filters.fechaFin) params.fechaFin = filters.fechaFin

    if (typeof filters.servicioId === 'number') params.servicioId = filters.servicioId
    else if (filters.servicioCodigo) params.servicioCodigo = filters.servicioCodigo

    if (filters.canalAtribucion) params.canalAtribucion = filters.canalAtribucion
    if (typeof filters.agenteId === 'number') params.agenteId = filters.agenteId
    if (filters.agenteTipo) params.agenteTipo = filters.agenteTipo

    try {
      const blob = await download(this.EXPORT_PATH, params)
      let filename = `reporte_turnos_${DateTime.local().toISODate()}`
      if (filters.servicioCodigo) filename += `_${filters.servicioCodigo}`
      if (filters.canalAtribucion) filename += `_${filters.canalAtribucion}`
      filename += '.xlsx'
      return { data: blob, filename }
    } catch (error) {
      console.error('Error en exportTurnosExcel:', error)
      throw error
    }
  }

  /* ====== Utils ====== */
  private static extractServerMessage(err: unknown): string {
    const maybe = err as { response?: { data?: unknown } ; message?: string }
    const data = maybe?.response?.data
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      const msg =
        (typeof d.message === 'string' && d.message) ||
        (typeof d.error === 'string' && d.error)
      if (msg) return msg
    }
    return maybe?.message || 'Error desconocido'
  }
}

export default TurnosDelDiaService
