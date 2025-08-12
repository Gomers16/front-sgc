// src/services/contratoHistorialEstadosService.ts

// Interface del historial de estados de un contrato
export interface ContratoHistorialEstado {
  id: number
  contratoId: number
  oldEstado: 'activo' | 'inactivo' | string
  newEstado: 'activo' | 'inactivo' | string
  fechaCambio: string           // ISO: yyyy-mm-dd o fecha ISO completa
  motivo?: string | null
  // opcionalmente podrías tener:
  // usuarioId?: number | null
  // realizadoPor?: string | null
}

const API_BASE =
  ((import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3333') + '/api'

// Helpers
async function safeText(res: Response) {
  try { return await res.text() } catch { return '' }
}
async function ensureOk<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await safeText(res)
    throw new Error(t || `Error HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

/**
 * GET /api/contratos/:contratoId/historial-estados
 * Devuelve la lista cronológica de cambios de estado de un contrato.
 */
export async function fetchHistorialEstados(
  contratoId: number
): Promise<ContratoHistorialEstado[]> {
  const res = await fetch(`${API_BASE}/contratos/${contratoId}/historial-estados`)
  return ensureOk<ContratoHistorialEstado[]>(res)
}

/**
 * POST /api/contratos/:contratoId/historial-estados
 * Crea un registro manual en el historial (por si tu backend lo permite).
 * body JSON:
 * {
 *   oldEstado: 'activo' | 'inactivo',
 *   newEstado: 'activo' | 'inactivo',
 *   fechaCambio?: 'yyyy-mm-dd' | ISO,
 *   motivo?: string
 * }
 */
export async function crearHistorialEstado(
  contratoId: number,
  payload: Partial<ContratoHistorialEstado> & {
    oldEstado: string
    newEstado: string
    fechaCambio?: string
    motivo?: string | null
  }
): Promise<ContratoHistorialEstado> {
  const res = await fetch(`${API_BASE}/contratos/${contratoId}/historial-estados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return ensureOk<ContratoHistorialEstado>(res)
}
