// src/services/clientes_service.ts
import { get, post, put, del } from './http'

/**
 * CLIENTES
 * Endpoints:
 *  - GET    /api/clientes?page=&perPage=&q=
 *  - GET    /api/clientes/:id
 *  - POST   /api/clientes   { nombre?, doc_tipo?, doc_numero?, telefono, email?, ciudad_id? }
 *  - PUT    /api/clientes/:id { nombre?, doc_tipo?, doc_numero?, telefono?, email?, ciudad_id? }
 *  - DELETE /api/clientes/:id
 */
const base = 'api/clientes'

export const ClientesService = {
  /**
   * Lista paginada con búsqueda opcional (q busca por nombre/telefono/doc_numero)
   */
  list(params?: { page?: number; perPage?: number; q?: string }) {
    return get(`${base}`, { params })
  },

  /**
   * Obtiene un cliente por id
   */
  getById(id: number | string) {
    return get(`${base}/${id}`)
  },

  /**
   * Crea un cliente
   * body mínimo: { telefono }
   * opcionales: { nombre?, doc_tipo?, doc_numero?, email?, ciudad_id? }
   */
  create(body: {
    nombre?: string | null
    doc_tipo?: 'CC' | 'NIT' | 'CE' | 'PAS' | null
    doc_numero?: string | null
    telefono: string
    email?: string | null
    ciudad_id?: number | null
  }) {
    return post(`${base}`, body)
  },

  /**
   * Actualiza un cliente (parcial)
   */
  update(
    id: number | string,
    body: {
      nombre?: string | null
      doc_tipo?: 'CC' | 'NIT' | 'CE' | 'PAS' | null
      doc_numero?: string | null
      telefono?: string
      email?: string | null
      ciudad_id?: number | null
    }
  ) {
    return put(`${base}/${id}`, body)
  },

  /**
   * Elimina un cliente (bloquea si tiene vehículos asociados)
   */
  remove(id: number | string) {
    return del(`${base}/${id}`)
  },
}
