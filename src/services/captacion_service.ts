// src/services/agentes_captacion_service.ts
import { get, post, put, del } from './http'

/**
 * AGENTES DE CAPTACIÓN
 * Endpoints:
 *  - GET    /api/agentes-captacion?page=&perPage=&q=&tipo=&activo=
 *  - GET    /api/agentes-captacion/:id
 *  - POST   /api/agentes-captacion   { tipo, nombre, telefono?, doc_tipo?, doc_numero?, activo? }
 *  - PUT    /api/agentes-captacion/:id { tipo?, nombre?, telefono?, doc_tipo?, doc_numero?, activo? }
 *  - DELETE /api/agentes-captacion/:id
 */
const base = 'api/agentes-captacion'

export const AgentesCaptacionService = {
  /**
   * Lista paginada con filtros opcionales:
   *  - q        → busca por nombre/telefono/doc_numero
   *  - tipo     → 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO'
   *  - activo   → true | false
   */
  list(params?: {
    page?: number
    perPage?: number
    q?: string
    tipo?: 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO'
    activo?: boolean
  }) {
    return get(`${base}`, { params })
  },

  /** Obtiene un agente por id */
  getById(id: number | string) {
    return get(`${base}/${id}`)
  },

  /**
   * Crea un agente
   * body mínimo: { tipo, nombre }
   * opcionales:  { telefono?, doc_tipo?, doc_numero?, activo? }
   * - tipo: 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO'
   * - doc_tipo: 'CC' | 'NIT'
   */
  create(body: {
    tipo: 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO'
    nombre: string
    telefono?: string | null
    doc_tipo?: 'CC' | 'NIT' | null
    doc_numero?: string | null
    activo?: boolean
  }) {
    return post(`${base}`, body)
  },

  /**
   * Actualiza un agente (parcial)
   */
  update(
    id: number | string,
    body: {
      tipo?: 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO'
      nombre?: string
      telefono?: string | null
      doc_tipo?: 'CC' | 'NIT' | null
      doc_numero?: string | null
      activo?: boolean
    }
  ) {
    return put(`${base}/${id}`, body)
  },

  /** Elimina un agente (bloquea si tiene dateos asociados) */
  remove(id: number | string) {
    return del(`${base}/${id}`)
  },
}
