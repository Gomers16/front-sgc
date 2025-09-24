// src/services/clases_vehiculos_service.ts
import { get, post, put, del } from './http'

/**
 * CLASES DE VEHÍCULO
 * Endpoints:
 *  - GET    /api/clases-vehiculo?page=&perPage=&q=
 *  - GET    /api/clases-vehiculo/:id
 *  - POST   /api/clases-vehiculo   { codigo, nombre }
 *  - PUT    /api/clases-vehiculo/:id { codigo?, nombre? }
 *  - DELETE /api/clases-vehiculo/:id
 */
const base = 'api/clases-vehiculo'

export const ClasesVehiculosService = {
  /**
   * Lista paginada con filtro opcional `q`
   */
  list(params?: { page?: number; perPage?: number; q?: string }) {
    return get(`${base}`, { params })
  },

  /**
   * Obtiene una clase por id
   */
  getById(id: number | string) {
    return get(`${base}/${id}`)
  },

  /**
   * Crea una clase
   * body: { codigo: string, nombre: string }
   */
  create(body: { codigo: string; nombre: string }) {
    return post(`${base}`, body)
  },

  /**
   * Actualiza una clase
   * body parcial: { codigo?: string, nombre?: string }
   */
  update(id: number | string, body: { codigo?: string; nombre?: string }) {
    return put(`${base}/${id}`, body)
  },

  /**
   * Elimina una clase (si no está en uso por vehículos)
   */
  remove(id: number | string) {
    return del(`${base}/${id}`)
  },
}
