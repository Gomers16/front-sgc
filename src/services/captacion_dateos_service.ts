// src/services/captacion_dateos_service.ts
import { get, post, put, del } from './http'

/**
 * CAPTACIÓN / DATEOS
 *
 * Endpoints disponibles:
 *  - GET    /api/captacion-dateos                     → Lista paginada con filtros
 *  - GET    /api/captacion-dateos/:id                 → Detalle de un dateo
 *  - POST   /api/captacion-dateos                     → Crear dateo (archiva prospectos con misma placa)
 *  - POST   /api/captacion-dateos/verificar-vencidos  → ⭐ NUEVO: Revierte dateos vencidos (>72h PENDIENTE)
 *  - PUT    /api/captacion-dateos/:id                 → Actualizar dateo
 *  - DELETE /api/captacion-dateos/:id                 → Eliminar dateo
 *
 * 🔄 FLUJO PROSPECTOS ↔ DATEOS:
 * 1. Cuando se crea un dateo con una placa, TODOS los prospectos con esa placa se archivan
 * 2. Si el dateo lleva >72h en estado PENDIENTE, se revierte:
 *    - El dateo se marca como NO_EXITOSO
 *    - TODOS los prospectos con esa placa se desarchivan
 *    - Los prospectos vuelven a estar disponibles para todos los asesores
 */
const base = 'api/captacion-dateos'

export const CaptacionDateosService = {
  /**
   * Lista paginada con filtros
   *
   * @param params Filtros de búsqueda:
   *  - placa: Placa del vehículo (se normaliza en backend: sin espacios/guiones, mayúsculas)
   *  - telefono: Teléfono del cliente (se normaliza en backend: solo dígitos)
   *  - canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
   *  - agente_id: ID del agente de captación
   *  - convenio_id: ID del convenio
   *  - resultado: 'PENDIENTE' | 'EN_PROCESO' | 'EXITOSO' | 'NO_EXITOSO'
   *  - consumido: true (tiene turno consumido) | false (sin turno)
   *  - desde/hasta: Rango de fechas (formato: YYYY-MM-DD)
   *  - page/perPage: Paginación
   *
   * @returns { data: Dateo[], total: number, page: number, perPage: number }
   */
  list(params?: {
    page?: number
    perPage?: number
    placa?: string
    telefono?: string
    canal?: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
    agente_id?: number
    convenio_id?: number
    resultado?: 'PENDIENTE' | 'EN_PROCESO' | 'EXITOSO' | 'NO_EXITOSO'
    consumido?: boolean
    desde?: string
    hasta?: string
  }) {
    const p: Record<string, string | number> = {}
    if (params) {
      const { consumido, ...rest } = params
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p[k] = v as any
      })
      if (consumido !== undefined) p.consumido = String(consumido)
    }
    return get(`${base}`, { params: p })
  },

  /**
   * Obtiene el detalle de un dateo por ID
   *
   * @param id ID del dateo
   * @returns Dateo con información completa + reserva calculada + turnoInfo (si consumido)
   */
  getById(id: number | string) {
    return get(`${base}/${id}`)
  },

  /**
   * Crea un nuevo dateo
   *
   * ⚠️ IMPORTANTE: Al crear un dateo con una placa:
   * - Se archivan TODOS los prospectos con esa placa (normalizadas)
   * - Los prospectos desaparecen de la lista para todos los asesores
   * - Si el dateo se vence (>72h PENDIENTE), los prospectos se desarchivan
   *
   * Reglas de validación:
   * - origen requerido: 'UI' | 'WHATSAPP' | 'IMPORT'
   * - placa requerida
   * - canal requerido: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
   * - Si canal = ASESOR o TELE → agente_id requerido
   * - Exclusividad: No se puede datear placa/teléfono con reserva vigente
   *
   * @param body Datos del dateo a crear
   * @returns Dateo creado
   */
  create(body: {
    canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
    origen: 'UI' | 'WHATSAPP' | 'IMPORT'
    agente_id?: number | null
    convenio_id?: number | null
    prospecto_id?: number | null // 👈 NUEVO: Si viene desde prospecto
    placa?: string | null
    telefono?: string | null
    observacion?: string | null
    imagen_url?: string | null
    imagen_mime?: string | null
    imagen_tamano_bytes?: number | null
    imagen_hash?: string | null
    imagen_origen_id?: string | null
    imagen_subida_por?: number | null
  }) {
    return post(`${base}`, body)
  },

  /**
   * Actualiza un dateo existente
   *
   * Campos actualizables:
   * - observacion: Texto libre
   * - resultado: PENDIENTE | EN_PROCESO | EXITOSO | NO_EXITOSO
   * - consumido_turno_id: ID del turno consumido (null para revertir)
   * - Campos de imagen: imagen_url, imagen_mime, etc.
   *
   * @param id ID del dateo
   * @param body Campos a actualizar (parcial)
   * @returns Dateo actualizado
   */
  update(
    id: number | string,
    body: {
      observacion?: string | null
      resultado?: 'PENDIENTE' | 'EN_PROCESO' | 'EXITOSO' | 'NO_EXITOSO'
      imagen_url?: string | null
      imagen_mime?: string | null
      imagen_tamano_bytes?: number | null
      imagen_hash?: string | null
      imagen_origen_id?: string | null
      imagen_subida_por?: number | null
      consumido_turno_id?: number | null
    }
  ) {
    return put(`${base}/${id}`, body)
  },

  /**
   * Marca un dateo como consumido por un turno
   *
   * @param id ID del dateo
   * @param consumido_turno_id ID del turno que consumió el dateo
   * @returns Dateo actualizado
   */
  consume(id: number | string, consumido_turno_id: number) {
    return put(`${base}/${id}`, { consumido_turno_id })
  },

  /**
   * Revierte el consumo de un dateo (quita el turno asociado)
   *
   * @param id ID del dateo
   * @returns Dateo actualizado
   */
  clearConsumption(id: number | string) {
    return put(`${base}/${id}`, { consumido_turno_id: null })
  },

  /**
   * Elimina un dateo permanentemente
   *
   * ⚠️ CUIDADO: Operación irreversible
   * Solo usar para corregir cargas erróneas
   *
   * @param id ID del dateo
   * @returns 204 No Content
   */
  remove(id: number | string) {
    return del(`${base}/${id}`)
  },

  /**
   * ⭐ NUEVO: Verifica y revierte dateos vencidos
   *
   * 🎯 PROPÓSITO:
   * - Busca dateos que cumplan TODAS estas condiciones:
   *   1. Vienen de un prospecto (prospecto_id NOT NULL)
   *   2. Están en estado PENDIENTE
   *   3. Fueron creados hace más de 72 horas
   *
   * - Para cada dateo encontrado:
   *   1. Marca el dateo como NO_EXITOSO
   *   2. Desarchiva el prospecto original
   *   3. Desarchiva TODOS los prospectos duplicados con esa placa
   *   4. Los prospectos vuelven a estar disponibles para todos los asesores
   *
   * 📅 USO:
   * - Ejecutar manualmente: Para probar o corregir
   * - Cron job: Cada 1 hora (recomendado)
   *
   * @returns {
   *   message: string,           // Mensaje de resultado
   *   procesados: number,        // Total de dateos evaluados
   *   exitosos: number,          // Dateos revertidos exitosamente
   *   fallidos: number,          // Dateos que fallaron al revertir
   *   total: number              // Alias de procesados (compatibilidad)
   * }
   *
   * @example
   * // Uso en componente Vue/React:
   * const resultado = await CaptacionDateosService.verificarVencidos()
   * console.log(`Se revirtieron ${resultado.exitosos} dateos`)
   *
   * @example
   * // Uso en cron job:
   * setInterval(async () => {
   *   const r = await CaptacionDateosService.verificarVencidos()
   *   console.log(`[CRON] ${r.message}`)
   * }, 3600000) // cada 1 hora
   */
  verificarVencidos() {
    return post<{
      message: string
      procesados: number
      exitosos: number
      fallidos: number
      total: number
    }>(`${base}/verificar-vencidos`, {})
  },
}
