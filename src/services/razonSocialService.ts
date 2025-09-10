// src/services/razonSocialService.ts
import { get } from './http'

/**
 * Tipos
 */
export interface RazonSocial {
  id: number
  nombre: string
  // agrega aquí otros campos que devuelva tu backend
}

export interface Usuario {
  id: number
  nombres: string
  apellidos: string
  correo: string
  cargo?: { id: number; nombre: string }
  rol?: { id: number; nombre: string }
  contratos?: Array<{ id: number; estado: string }>
}

/**
 * Helper para extraer { data } si el backend envuelve la respuesta.
 */
function pickData<T>(resp: unknown): T {
  if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
    return (resp as { data: T }).data
  }
  return resp as T
}

/**
 * GET /api/razones-sociales
 */
export async function listarRazonesSociales(): Promise<RazonSocial[]> {
  const resp = await get<unknown>('/api/razones-sociales', {
    headers: { 'Cache-Control': 'no-store' },
    credentials: 'include',
  })
  return pickData<RazonSocial[]>(resp) ?? []
}

/**
 * GET /api/razones-sociales/:id
 */
export async function obtenerRazonSocialPorId(
  id: string | number
): Promise<RazonSocial | null> {
  const resp = await get<unknown>(`/api/razones-sociales/${id}`, {
    headers: { 'Cache-Control': 'no-store' },
    credentials: 'include',
  })
  const data = pickData<RazonSocial | null>(resp)
  return data ?? null
}

/**
 * GET /api/razones-sociales/:id/usuarios
 */
export async function fetchUsuariosPorRazonSocial(
  razonSocialId: string | number
): Promise<Usuario[]> {
  const resp = await get<unknown>(`/api/razones-sociales/${razonSocialId}/usuarios`, {
    headers: { 'Cache-Control': 'no-store' },
    credentials: 'include',
  })
  return pickData<Usuario[]>(resp) ?? []
}
