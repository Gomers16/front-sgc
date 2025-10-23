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
 *   dateoReciente: { id, canal, agente?, placa, telefono, origen, observacion, imagen_url, created_at, consumido_* , detectado_por_convenio? } | null,
 *   reserva: { vigente, bloqueaHasta } | null,
 *   captacionSugerida: { canal, agente? },
 *   ultimaVisita: { fecha, servicioCodigo, servicioNombre, sedeNombre, estado } | null,
 *   origenBusqueda: 'placa' | 'telefono'
 * }
 */
const base = 'api/buscar'

export const BusquedasService = {
  byPlaca(placa: string, opts?: { signal?: AbortSignal }) {
    return get(`${base}`, { params: { placa }, signal: opts?.signal })
  },
  byTelefono(telefono: string, opts?: { signal?: AbortSignal }) {
    return get(`${base}`, { params: { telefono }, signal: opts?.signal })
  },
  unificada(query: { placa?: string; telefono?: string }, opts?: { signal?: AbortSignal }) {
    return get(`${base}`, { params: query, signal: opts?.signal })
  },
}
