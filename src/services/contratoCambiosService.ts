// src/services/contratoCambiosService.ts
import { fetchData } from './UserService'

const API_BASE =
  ((import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3333') + '/api'

export interface ContratoCambio {
  id: number
  contratoId: number
  usuarioId: number | null
  campo: string                              // ej: 'epsId', 'salarioBasico', 'estado', etc.
  valorAnterior: string | null               // guardado como string (normaliza en backend)
  valorNuevo: string | null
  metadata?: any | null                      // opcional: etiquetas 'oldLabel'/'newLabel', etc.
  createdAt: string                          // ISO
  usuario?: { id: number; nombres: string; apellidos: string } | null
}

/** GET /api/contratos/:contratoId/cambios */
export async function listarCambiosContrato(contratoId: number): Promise<ContratoCambio[]> {
  return fetchData<ContratoCambio[]>(`${API_BASE}/contratos/${contratoId}/cambios`)
}

/** (opcional) POST manual si quieres registrar algo desde el front */
export async function crearCambioContrato(
  contratoId: number,
  payload: Pick<ContratoCambio, 'campo' | 'valorAnterior' | 'valorNuevo'> & { metadata?: any }
): Promise<ContratoCambio> {
  return fetchData<ContratoCambio>(`${API_BASE}/contratos/${contratoId}/cambios`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}
