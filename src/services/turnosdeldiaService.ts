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

/** 👇 Este es el formato “bonito” que usa la DB/backend (derivado del canal) */
export type MedioEnteroFinalDB = 'Redes Sociales' | 'Call Center' | 'Fachada' | 'Asesor Comercial'

export type CanalAtrib = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'

export type ServicioCodigo = 'RTM' | 'PREV' | 'PERI' | 'SOAT'

/** Mapeo Front -> DB (solo si el backend lo necesitara; hoy deriva desde canal) */
const MEDIO_MAP: Record<MedioEnteroFront, MedioEnteroFinalDB> = {
  redes_sociales: 'Redes Sociales',
  call_center: 'Call Center',
  fachada: 'Fachada',
  asesor: 'Asesor Comercial',
}

/** Mapeo Front -> Canal (para construir el campo `canal` si no viene) */
const MEDIO_TO_CANAL: Record<MedioEnteroFront, CanalAtrib> = {
  redes_sociales: 'REDES',
  call_center: 'TELE',
  fachada: 'FACHADA',
  asesor: 'ASESOR',
}

interface SiguienteTurnoResponse {
  siguiente: number               // consecutivo global por sede + día
  siguientePorServicio?: number   // consecutivo por sede + día + servicio
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
  tipo: 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO' | string
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

/* ========== INTERFACES PARA EXPORTACIÓN MÚLTIPLE ========== */
export interface ExportFiltersMultiple {
  fechaInicio?: string
  fechaFin?: string
  servicioCodigo?: ServicioCodigo
  servicioId?: number
  medioEntero?: MedioEnteroFinalDB
  serviciosCodigos?: ServicioCodigo[] | string
  serviciosIds?: number[] | string
  mediosEntero?: MedioEnteroFinalDB[] | string
}

/* ========== Payloads ==========\ */
export interface CreateTurnoPayload {
  placa: string
  tipoVehiculo: TipoVehiculoFrontend
  observaciones?: string | null
  fecha: string              // YYYY-MM-DD
  horaIngreso: string        // HH:mm o HH:mm:ss
  usuarioId: number
  servicioId?: number
  servicioCodigo?: ServicioCodigo

  // Atribución / captación
  canal?: CanalAtrib                    // recomendado
  agenteCaptacionId?: number | null     // opcional

  // Compat / conveniencia (si el front solo tiene “medio”)
  medioEntero?: MedioEnteroFront        // si viene, se mapea a `canal`

  // Datos cliente opcionales cuando no existe
  clienteNombre?: string
  clienteTelefono?: string
  clienteEmail?: string

  // Datos de “asesor manual” (opcional)
  asesorNombre?: string | null
  asesorTipo?: 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | null
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
  // También puedes permitir cambiar canal/agente desde la UI si lo necesitas:
  canal?: CanalAtrib
  agenteCaptacionId?: number | null
}

/* ================== SERVICE ================== */
class TurnosDelDiaService {
  private static readonly BASE = '/api/turnos-rtm'

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
   * Devuelve { siguiente, siguientePorServicio?, sedeId }
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
   * Recomendado: enviar `canal` ('FACHADA'|'ASESOR'|'TELE'|'REDES'). El backend derivará `medio_entero`.
   */
  public static async createTurno(payload: CreateTurnoPayload) {
    // Derivar canal desde medioEntero si no viene
    const canal: CanalAtrib =
      payload.canal ??
      (payload.medioEntero ? MEDIO_TO_CANAL[payload.medioEntero] : 'FACHADA')

    // Construir body limpio
    const body: Record<string, unknown> = {
      placa: payload.placa,
      tipoVehiculo: payload.tipoVehiculo,
      observaciones: payload.observaciones ?? null,
      fecha: payload.fecha,
      horaIngreso: payload.horaIngreso,
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

      // asesor manual (si quieres almacenarlo/usar en backend)
      ...(payload.asesorNombre ? { asesorNombre: payload.asesorNombre } : {}),
      ...(payload.asesorTipo ? { asesorTipo: payload.asesorTipo } : {}),
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

  /* ====== Exportaciones ====== */
  public static async exportTurnosExcel(filters: ExportFiltersMultiple): Promise<{ data: Blob; filename: string }> {
    const params: Record<string, string | number> = {}

    if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio
    if (filters.fechaFin) params.fechaFin = filters.fechaFin

    if (filters.serviciosIds) {
      params.serviciosIds = Array.isArray(filters.serviciosIds)
        ? (filters.serviciosIds as number[]).join(',')
        : (filters.serviciosIds as unknown as string)
    } else if (filters.serviciosCodigos) {
      params.serviciosCodigos = Array.isArray(filters.serviciosCodigos)
        ? (filters.serviciosCodigos as ServicioCodigo[]).join(',')
        : (filters.serviciosCodigos as unknown as string)
    } else if (typeof filters.servicioId === 'number') {
      params.servicioId = filters.servicioId
    } else if (filters.servicioCodigo) {
      params.servicioCodigo = filters.servicioCodigo
    }

    if (filters.mediosEntero) {
      params.mediosEntero = Array.isArray(filters.mediosEntero)
        ? (filters.mediosEntero as MedioEnteroFinalDB[]).join(',')
        : (filters.mediosEntero as unknown as string)
    } else if (filters.medioEntero) {
      params.medioEntero = filters.medioEntero
    }

    try {
      const blob = await download(`${this.BASE}/reporte/excel`, params)
      let filename = `reporte_captacion_${DateTime.local().toISODate()}`

      if (filters.serviciosCodigos || filters.serviciosIds) {
        filename += '_servicios_multiples'
      } else if (filters.servicioCodigo) {
        filename += `_${filters.servicioCodigo}`
      }

      if (filters.mediosEntero) {
        const mediosCount = Array.isArray(filters.mediosEntero)
          ? filters.mediosEntero.length
          : typeof filters.mediosEntero === 'string'
            ? (filters.mediosEntero as string).split(',').length
            : 1
        filename += `_medios_${mediosCount}items`
      } else if (filters.medioEntero) {
        filename += `_${filters.medioEntero.replace(/\s+/g, '_')}`
      }
      filename += '.xlsx'
      return { data: blob, filename }
    } catch (error) {
      console.error('Error en exportTurnosExcel:', error)
      throw error
    }
  }

  public static async exportTurnosExcelMultiple(options: {
    fechaInicio: string
    fechaFin: string
    serviciosSeleccionados?: ServicioCodigo[]
    mediosSeleccionados?: MedioEnteroFinalDB[]
  }): Promise<{ data: Blob; filename: string }> {
    const filters: ExportFiltersMultiple = {
      fechaInicio: options.fechaInicio,
      fechaFin: options.fechaFin,
    }
    if (options.serviciosSeleccionados?.length) filters.serviciosCodigos = options.serviciosSeleccionados
    if (options.mediosSeleccionados?.length) filters.mediosEntero = options.mediosSeleccionados
    return this.exportTurnosExcel(filters)
  }

  public static async exportTurnosByServicio(
    fechaInicio: string,
    fechaFin: string,
    servicioCodigo: ServicioCodigo
  ): Promise<{ data: Blob; filename: string }> {
    return this.exportTurnosExcel({ fechaInicio, fechaFin, servicioCodigo })
  }

  public static async exportTurnosByMedio(
    fechaInicio: string,
    fechaFin: string,
    medioEntero: MedioEnteroFinalDB
  ): Promise<{ data: Blob; filename: string }> {
    return this.exportTurnosExcel({ fechaInicio, fechaFin, medioEntero })
  }

  /* ====== Utils ====== */
  private static extractServerMessage(err: unknown): string {
    // axios-like error shape
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
