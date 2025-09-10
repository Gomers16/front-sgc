// src/services/contratoCambiosService.ts
import { get, post } from '@/services/http'

export interface UsuarioMin {
  id: number
  nombres: string
  apellidos: string
}

export interface ContratoCambio {
  id: number
  contratoId: number
  usuarioId: number | null
  campo: string
  valorAnterior: string | null
  valorNuevo: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  usuario?: UsuarioMin | null
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

/** GET /api/contratos/:contratoId/cambios */
export async function listarCambiosContrato(contratoId: number) {
  const resp = await get<unknown>(`/api/contratos/${contratoId}/cambios`)
  return toArray<ContratoCambio>(resp)
}

/** POST /api/contratos/:contratoId/cambios */
export function crearCambioContrato(
  contratoId: number,
  payload: Pick<ContratoCambio, 'campo' | 'valorAnterior' | 'valorNuevo'> & {
    metadata?: Record<string, unknown>
  }
) {
  return post<ContratoCambio, typeof payload>(`/api/contratos/${contratoId}/cambios`, payload)
}
