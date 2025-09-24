// src/services/dashboardService.ts
import { DateTime } from 'luxon'
import TurnosDelDiaService from './turnosdeldiaService'
import type { Turno } from './turnosdeldiaService'

export interface DashboardData {
  turnosEnProceso: number
  turnosFinalizados: number
  siguienteTurno: number
  /** En proceso del día, por servicio */
  turnosEnProcesoPorServicio: {
    rtm: number
    preventiva: number
    peritaje: number
  }
  /** 👇 NUEVO: totales del día (en proceso + finalizados), por servicio */
  turnosTotalesPorServicio: {
    rtm: number
    preventiva: number
    peritaje: number
  }
}

async function fetchTurnosDelDia(fechaISO: string): Promise<Turno[]> {
  try {
    return await TurnosDelDiaService.fetchTurnos({ fecha: fechaISO })
  } catch {
    return []
  }
}

async function fetchNextTurnNumberSafe(usuarioId: number): Promise<number> {
  try {
    const r = await TurnosDelDiaService.fetchNextTurnNumber(usuarioId)
    return typeof r?.siguiente === 'number' ? r.siguiente : 0
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.toLowerCase() : ''
    if (msg.includes('no tiene una sede asignada') || msg.includes('sede')) {
      return 0
    }
    throw e
  }
}

function computeMinExpectedNext(turnos: Turno[]): number {
  const numeros = (turnos as any[])
    .map((t) => Number((t as any)?.turnoNumero ?? (t as any)?.numero))
    .filter((n) => Number.isFinite(n)) as number[]
  const minByMaxNumero = numeros.length ? Math.max(...numeros) + 1 : null
  const minByCount = turnos.length + 1
  return minByMaxNumero ?? minByCount
}

/** helper: está "en proceso" = activo y sin horaSalida */
const isEnProceso = (t: Turno) => t.estado === 'activo' && !t.horaSalida

/** helper: normaliza el código del servicio de un turno */
function getServicioCode(t: Turno): string {
  const code = (t as any)?.servicio?.codigoServicio ?? (t as any)?.servicioCodigo
  return typeof code === 'string' ? code.toUpperCase() : ''
}

export async function fetchDashboard(usuarioId: number): Promise<DashboardData> {
  const todayISO = DateTime.local().setZone('America/Bogota').toISODate() || ''
  const turnos = await fetchTurnosDelDia(todayISO)

  const turnosEnProceso = turnos.filter(isEnProceso).length
  const turnosFinalizados = turnos.filter(
    (t) => t.estado === 'finalizado' || (t.estado === 'activo' && t.horaSalida)
  ).length

  const nextFromBackend = await fetchNextTurnNumberSafe(usuarioId)
  const minExpected = computeMinExpectedNext(turnos)
  const siguienteTurno = Math.max(nextFromBackend || 0, minExpected)

  // En proceso por servicio
  let rtmProc = 0, prevProc = 0, periProc = 0
  // Totales por servicio (en proceso + finalizados del día)
  let rtmTot = 0,  prevTot = 0,  periTot = 0

  for (const t of turnos) {
    const code = getServicioCode(t)
    // Totales (cuentan TODOS los turnos de hoy, sin importar estado)
    if (code === 'RTM') rtmTot++
    else if (code === 'PREV') prevTot++
    else if (code === 'PERI') periTot++

    // En proceso (como ya lo tenías)
    if (!isEnProceso(t)) continue
    if (code === 'RTM') rtmProc++
    else if (code === 'PREV') prevProc++
    else if (code === 'PERI') periProc++
  }

  return {
    turnosEnProceso,
    turnosFinalizados,
    siguienteTurno,
    turnosEnProcesoPorServicio: { rtm: rtmProc, preventiva: prevProc, peritaje: periProc },
    turnosTotalesPorServicio:  { rtm: rtmTot,  preventiva: prevTot,  peritaje: periTot  },
  }
}

export default { fetchDashboard }
