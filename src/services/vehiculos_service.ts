// src/services/vehiculos_service.ts
import { get, post, put, del } from './http'

/**
 * VEHÍCULOS
 * Endpoints:
 *  - GET    /api/vehiculos?page=&perPage=&q=&clase_codigo=&cliente_telefono=
 *  - GET    /api/vehiculos/:id
 *  - POST   /api/vehiculos   { placa, clase_codigo|clase_vehiculo_id, marca?, linea?, modelo?, cliente_telefono? }
 *  - PUT    /api/vehiculos/:id { placa?, clase_codigo?|clase_vehiculo_id?, marca?, linea?, modelo?, cliente_telefono?|cliente_id? }
 *  - DELETE /api/vehiculos/:id
 */
const base = 'api/vehiculos'

export const VehiculosService = {
  /**
   * Lista paginada con filtros:
   *  - q: busca por placa/marca/linea/modelo
   *  - clase_codigo: LIV_PART | LIV_TAXI | LIV_PUBLICO | MOTO
   *  - cliente_telefono: solo dígitos
   */
  list(params?: {
    page?: number
    perPage?: number
    q?: string
    clase_codigo?: string
    cliente_telefono?: string
  }) {
    return get(`${base}`, { params })
  },

  /** Obtiene un vehículo por id (incluye preload de clase y cliente) */
  getById(id: number | string) {
    return get(`${base}/${id}`)
  },

  /**
   * Crea un vehículo
   * body mínimo:
   *   - placa (UPPER; se normaliza en backend)
   *   - clase_codigo  (ej: 'LIV_PART')  **o**  clase_vehiculo_id
   * opcionales:
   *   - marca, linea, modelo
   *   - cliente_telefono (si existe, lo enlaza como dueño actual)
   */
  create(body: {
    placa: string
    clase_codigo?: string
    clase_vehiculo_id?: number
    marca?: string | null
    linea?: string | null
    modelo?: number | null
    cliente_telefono?: string | null
  }) {
    return post(`${base}`, body)
  },

  /**
   * Actualiza un vehículo (parcial)
   * Puedes cambiar:
   *  - placa
   *  - clase_codigo o clase_vehiculo_id
   *  - marca / linea / modelo
   *  - cliente_id o cliente_telefono
   */
  update(
    id: number | string,
    body: {
      placa?: string
      clase_codigo?: string
      clase_vehiculo_id?: number
      marca?: string | null
      linea?: string | null
      modelo?: number | null
      cliente_id?: number | null
      cliente_telefono?: string | null
    }
  ) {
    return put(`${base}/${id}`, body)
  },

  /** Elimina un vehículo */
  remove(id: number | string) {
    return del(`${base}/${id}`)
  },
}
