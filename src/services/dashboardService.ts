// src/services/dashboardService.ts
import { DateTime } from 'luxon'
import TurnosDelDiaService from './turnosdeldiaService'
import type { Turno } from './turnosdeldiaService'  // type-only import

export interface DashboardData {
  turnosEnProceso: number
  turnosFinalizados: number
  siguienteTurno: number
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
    // si el backend avisa que el usuario no tiene sede, suavizamos a 0
    if (msg.includes('no tiene una sede asignada') || msg.includes('sede')) {
      return 0
    }
    throw e
  }
}

/** calcula el mínimo válido según los turnos existentes hoy */
function computeMinExpectedNext(turnos: Turno[]): number {
  const numeros = (turnos as any[])
    .map((t) => Number((t as any)?.turnoNumero ?? (t as any)?.numero))
    .filter((n) => Number.isFinite(n)) as number[]

  const minByMaxNumero = numeros.length ? Math.max(...numeros) + 1 : null
  const minByCount = turnos.length + 1
  return minByMaxNumero ?? minByCount
}

export async function fetchDashboard(usuarioId: number): Promise<DashboardData> {
  const todayISO = DateTime.local().setZone('America/Bogota').toISODate() || ''

  // turnos del día (para KPIs y para normalizar “siguiente”)
  const turnos = await fetchTurnosDelDia(todayISO)

  const turnosEnProceso = turnos.filter(
    (t) => t.estado === 'activo' && !t.horaSalida
  ).length

  const turnosFinalizados = turnos.filter(
    (t) => t.estado === 'finalizado' || (t.estado === 'activo' && t.horaSalida)
  ).length

  // valor que entrega el backend (por sede/usuario)
  const nextFromBackend = await fetchNextTurnNumberSafe(usuarioId)

  // mínimo válido según lo que YA existe hoy
  const minExpected = computeMinExpectedNext(turnos)

  // normalización: nunca menor que lo que ya existe hoy
  const siguienteTurno = Math.max(nextFromBackend || 0, minExpected)

  return { turnosEnProceso, turnosFinalizados, siguienteTurno }
}

export default { fetchDashboard }
