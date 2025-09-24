// src/services/busquedas_service.ts
import { get } from './http'

/**
 * BÚSQUEDA UNIFICADA
 * Endpoint:
 *  - GET /api/buscar?placa=ABC123
 *  - GET /api/buscar?telefono=3XXXXXXXXX
 *
 * Respuesta (shape esperado, sin tipos):
 * {
 *   vehiculo: { id, placa, clase?, marca, linea, modelo } | null,
 *   cliente:  { id, nombre, doc_tipo, doc_numero, telefono, email, vehiculos? } | null,
 *   dateoReciente: { id, canal, agente?, placa, telefono, origen, observacion, imagen_url, created_at, consumido_* } | null,
 *   reserva: { vigente, bloqueaHasta } | null,
 *   captacionSugerida: { canal, agente? },
 *   origenBusqueda: 'placa' | 'telefono'
 * }
 */
const base = 'api/buscar'

export const BusquedasService = {
  /** Busca por placa (acepta AbortSignal para cancelar mientras el usuario teclea) */
  byPlaca(placa: string, opts?: { signal?: AbortSignal }) {
    return get(`${base}`, { params: { placa }, signal: opts?.signal })
  },

  /** Busca por teléfono (solo dígitos; se normaliza en backend) */
  byTelefono(telefono: string, opts?: { signal?: AbortSignal }) {
    return get(`${base}`, { params: { telefono }, signal: opts?.signal })
  },

  /** Azúcar: llamada genérica con uno de los dos parámetros */
  unificada(query: { placa?: string; telefono?: string }, opts?: { signal?: AbortSignal }) {
    return get(`${base}`, { params: query, signal: opts?.signal })
  },
}
