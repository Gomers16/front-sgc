// src/services/contratoHistorialEstadosService.ts
import { get, post } from './http'

export type EstadoContrato = 'activo' | 'inactivo' | string

export interface ContratoHistorialEstado {
  id: number
  contratoId: number
  oldEstado: EstadoContrato
  newEstado: EstadoContrato
  fechaCambio: string           // ISO: yyyy-mm-dd o ISO completa
  motivo?: string | null
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (isRecord(data)) {
    const dataProp = data['data']
    const rowsProp = data['rows']
    const itemsProp = data['items']
    if (Array.isArray(dataProp)) return dataProp as T[]
    if (Array.isArray(rowsProp)) return rowsProp as T[]
    if (Array.isArray(itemsProp)) return itemsProp as T[]
  }
  return []
}

/** GET /api/contratos/:contratoId/historial-estados */
export async function fetchHistorialEstados(contratoId: number) {
  const resp = await get<unknown>(`/api/contratos/${contratoId}/historial-estados`, {
    credentials: 'include',
  })
  return toArray<ContratoHistorialEstado>(resp)
}

/** POST /api/contratos/:contratoId/historial-estados */
export function crearHistorialEstado(
  contratoId: number,
  payload: {
    oldEstado: EstadoContrato
    newEstado: EstadoContrato
    fechaCambio?: string
    motivo?: string | null
  }
) {
  return post<ContratoHistorialEstado, typeof payload>(
    `/api/contratos/${contratoId}/historial-estados`,
    payload,
    {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  )
}
