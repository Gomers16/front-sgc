// src/services/captacion_dateos_service.ts
import { get, post, put, del } from './http'

/**
 * CAPTACIÓN / DATEOS
 * Endpoints:
 *  - GET    /api/captacion-dateos?placa=&telefono=&canal=&agente_id=&vigente=&consumido=&page=&perPage=
 *  - GET    /api/captacion-dateos/:id
 *  - POST   /api/captacion-dateos       { canal, agente_id?, placa?, telefono?, origen, observacion?, imagen_url?, ... }
 *  - PUT    /api/captacion-dateos/:id   { observacion?, imagen_?*, consumido_turno_id? }
 *  - DELETE /api/captacion-dateos/:id
 */
const base = 'api/captacion-dateos'

export const CaptacionDateosService = {
  /**
   * Lista paginada con filtros:
   *  - placa (UPPER en backend), telefono (solo dígitos en backend)
   *  - canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
   *  - agente_id: number
   *  - vigente: true|false (calcula reserva en backend)
   *  - consumido: true|false
   */
  list(params?: {
    page?: number
    perPage?: number
    placa?: string
    telefono?: string
    canal?: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
    agente_id?: number
    vigente?: boolean
    consumido?: boolean
  }) {
    // booleans se envían como string 'true'|'false' si vienen definidos
    const p: Record<string, string | number> = {}
    if (params) {
      const { vigente, consumido, ...rest } = params
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p[k] = v as any
      })
      if (vigente !== undefined) p.vigente = String(vigente)
      if (consumido !== undefined) p.consumido = String(consumido)
    }
    return get(`${base}`, { params: p })
  },

  /** Detalle por id (incluye reserva calculada en show) */
  getById(id: number | string) {
    return get(`${base}/${id}`)
  },

  /**
   * Crea un dateo
   * Reglas backend:
   *  - canal requerido
   *  - origen requerido: 'UI' | 'WHATSAPP' | 'IMPORT'
   *  - si canal = ASESOR o TELE ⇒ agente_id requerido
   *  - se requiere al menos uno: placa o telefono
   *  - imagen es por URL (opcional): imagen_url (+ metadatos opcionales)
   */
  create(body: {
    canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
    origen: 'UI' | 'WHATSAPP' | 'IMPORT'
    agente_id?: number | null
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
   * Actualiza un dateo (parcial) o marca consumo.
   * - Para consumir: { consumido_turno_id: number }
   * - Para revertir consumo: { consumido_turno_id: null }
   */
  update(
    id: number | string,
    body: {
      observacion?: string | null
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

  /** Azúcar: marcar un dateo como consumido por un turno */
  consume(id: number | string, consumido_turno_id: number) {
    return put(`${base}/${id}`, { consumido_turno_id })
  },

  /** Azúcar: revertir consumo */
  clearConsumption(id: number | string) {
    return put(`${base}/${id}`, { consumido_turno_id: null })
  },

  /** Elimina un dateo (histórico; solo si necesitas corregir cargas erróneas) */
  remove(id: number | string) {
    return del(`${base}/${id}`)
  },
}
