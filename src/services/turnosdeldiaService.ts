// src/services/turnosdeldiaService.ts
import { DateTime } from 'luxon'
import { get, post, put, patch, download } from './http'

// Definimos los tipos de vehículo válidos una sola vez para reutilizar.
export type TipoVehiculoFrontend =
  | 'Liviano Particular'
  | 'Liviano Taxi'
  | 'Liviano Público'
  | 'Motocicleta'

interface SiguienteTurnoResponse {
  siguiente: number
  sedeId: number // Agregado para reflejar la respuesta del backend
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
  convenio: string | null
  referidoInterno: string | null
  referidoExterno: string | null
  medioEntero:
    | 'Redes Sociales'
    | 'Convenio o Referido Externo'
    | 'Call Center'
    | 'Fachada'
    | 'Referido Interno'
    | 'Asesor Comercial'
  observaciones: string | null
  funcionarioId: number
  tieneCita: boolean
  asesorComercial: string | null
  tiempoServicio: string | null
  usuario?: { id: number; nombres: string; apellidos: string }
  sede?: { id: number; nombre: string }
}

class TurnosDelDiaService {
  private static readonly BASE = '/api/turnos-rtm' // el motor le antepone VITE_API_BASE_URL

  /**
   * Obtiene el siguiente número de turno disponible para una sede específica del usuario.
   * GET /api/turnos-rtm/siguiente-turno?usuarioId=...
   */
  public static fetchNextTurnNumber(usuarioId: number) {
    return get<SiguienteTurnoResponse>(`${this.BASE}/siguiente-turno`, {
      params: { usuarioId },
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Lista turnos con filtros.
   * GET /api/turnos-rtm?fecha=YYYY-MM-DD&placa=...&tipoVehiculo=...&estado=...
   */
  public static async fetchTurnos(
    filters: Record<string, string | number | boolean> = {}
  ): Promise<Turno[]> {
    // Validamos tipoVehiculo si viene
    if (
      filters.tipoVehiculo &&
      !(
        ['Liviano Particular', 'Liviano Taxi', 'Liviano Público', 'Motocicleta'] as string[]
      ).includes(filters.tipoVehiculo as string)
    ) {
      // Si valor inválido, lo quitamos para no romper en backend
      // (o podrías lanzar Error si prefieres)
      delete filters.tipoVehiculo
    }

    return get<Turno[]>(this.BASE, {
      params: filters,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Obtiene un turno por ID.
   * GET /api/turnos-rtm/:id
   */
  public static fetchTurnoById(id: number) {
    return get<Turno>(`${this.BASE}/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Crea un turno.
   * POST /api/turnos-rtm
   */
  public static createTurno(turnoData: {
    placa: string
    tipoVehiculo: TipoVehiculoFrontend
    tieneCita?: boolean
    convenio?: string | null
    referidoInterno?: string | null
    referidoExterno?: string | null
    medioEntero: string // ej. 'redes_sociales'
    observaciones?: string | null
    asesorComercial?: string | null
    fecha: string
    horaIngreso: string
    usuarioId: number
  }) {
    return post<Turno, typeof turnoData>(this.BASE, turnoData, {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Actualiza un turno.
   * PUT /api/turnos-rtm/:id
   */
  public static updateTurno(
    id: number,
    turnoData: {
      placa?: string
      tipoVehiculo?: TipoVehiculoFrontend
      tieneCita?: boolean
      convenio?: string | null
      referidoInterno?: string | null
      referidoExterno?: string | null
      medioEntero?: string
      observaciones?: string | null
      usuarioId: number
      horaSalida?: string | null
      tiempoServicio?: string | null
      estado?: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
      asesorComercial?: string | null
    }
  ) {
    return put<Turno, typeof turnoData>(`${this.BASE}/${id}`, turnoData, {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Registra la salida.
   * PUT /api/turnos-rtm/:id/salida  { usuarioId }
   */
  public static registrarSalida(id: number, usuarioId: number) {
    return put<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/salida`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  /**
   * Activa turno.
   * PATCH /api/turnos-rtm/:id/activar  { usuarioId }
   */
  public static activarTurno(id: number, usuarioId: number) {
    return patch<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/activar`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  /**
   * Cancela turno.
   * PATCH /api/turnos-rtm/:id/cancelar  { usuarioId }
   */
  public static cancelarTurno(id: number, usuarioId: number) {
    return patch<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/cancelar`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  /**
   * Inhabilita (soft delete) turno.
   * PATCH /api/turnos-rtm/:id/inhabilitar  { usuarioId }
   */
  public static inhabilitarTurno(id: number, usuarioId: number) {
    return patch<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/inhabilitar`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  /**
   * Exporta a Excel.
   * GET /api/turnos-rtm/reporte/excel?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
   *
   * Con el motor, obtenemos el Blob. El nombre de archivo lo generamos por defecto,
   * ya que los headers (Content-Disposition) no están disponibles en la respuesta parseada.
   */
  public static async exportTurnosExcel(filters: {
    fechaInicio?: string
    fechaFin?: string
  }): Promise<{ data: Blob; filename: string }> {
    const blob = await download(`${this.BASE}/reporte/excel`, { ...filters })
    const filename = `reporte_captacion_${DateTime.local().toISODate()}.xlsx`
    return { data: blob, filename }
  }

  /**
   * (Alternativa opcional) Si necesitas sí o sí el filename del header,
   * usa fetch directo para esta única llamada:
   *
   * public static async exportTurnosExcelWithFilename(filters: { fechaInicio?: string; fechaFin?: string }) {
   *   const url = new URL(`${import.meta.env.VITE_API_BASE_URL}`.replace(/\/+$/,'') + `${this.BASE}/reporte/excel`)
   *   Object.entries(filters).forEach(([k,v]) => { if (v) url.searchParams.set(k, String(v)) })
   *   const res = await fetch(url.toString(), { method: 'GET', credentials: 'include' })
   *   if (!res.ok) throw new Error(await res.text())
   *   const cd = res.headers.get('content-disposition') || ''
   *   let filename = `reporte_captacion_${DateTime.local().toISODate()}.xlsx`
   *   const m = /filename\*?=(?:UTF-8''|")?([^"';]+)["']?/i.exec(cd)
   *   if (m?.[1]) { try { filename = decodeURIComponent(m[1]) } catch { filename = m[1] } }
   *   const data = await res.blob()
   *   return { data, filename }
   * }
   */
}

export default TurnosDelDiaService
