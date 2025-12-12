// src/services/facturacion_service.ts
import { get, upload, post, patch } from './http'

/* =========================== Tipos del dominio =========================== */

export type FactEstado = 'BORRADOR' | 'OCR_LISTO' | 'LISTA_CONFIRMAR' | 'CONFIRMADA' | 'REVERTIDA'
export type FormaPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MIXTO'
export type DocTipo = 'CC' | 'NIT'

export interface FacturacionTicket {
  id: number
  // Archivo
  hash: string
  file_path: string
  file_mime: string | null
  file_size: number | null
  image_rotation: number

  // Estado
  estado: FactEstado

  // Mínimos
  placa: string | null
  total: number | null
  fecha_pago: string | null // ISO en API

  // Totales explícitos
  subtotal: number | null
  iva: number | null
  total_factura: number | null

  // Datos OCR/extra
  nit: string | null
  pin: string | null
  marca: string | null
  vendedor_text: string | null

  // Detalle de pago
  pago_consignacion: number | null
  pago_tarjeta: number | null
  pago_efectivo: number | null
  pago_cambio: number | null

  // Relaciones (ids)
  agente_id: number | null
  sede_id: number | null
  turno_id: number | null
  dateo_id: number | null
  servicio_id: number | null

  // Comprobante
  prefijo: string | null
  consecutivo: string | null
  forma_pago: FormaPago | null

  // Cliente/Vehículo
  doc_tipo: DocTipo | null
  doc_numero: string | null
  nombre: string | null
  telefono: string | null
  observaciones: string | null
  cliente_id: number | null
  vehiculo_id: number | null

  // OCR
  ocr_text: string | null
  ocr_conf_placa: number
  ocr_conf_total: number
  ocr_conf_fecha: number
  ocr_conf_agente: number
  ocr_conf_baja_revisado: boolean

  // Duplicados
  duplicado_por_hash: boolean
  duplicado_por_contenido: boolean
  posible_duplicado_at: string | null // ISO

  // Confirmación / Enriquecimiento
  confirmado_at: string | null // ISO
  ajuste_total_flag: boolean
  ajuste_total_diff: number
  revertida_flag: boolean
  revertida_motivo: string | null
  revertida_at: string | null // ISO

  // Auditoría
  created_by_id: number | null
  confirmed_by_id: number | null
  created_at: string
  updated_at: string

  // 🔹 Enriquecidos (virtuales del backend al preloade ar turno/servicio)
  turnoGlobal?: number | null
  turnoServicio?: number | null
  tipoVehiculoSnapshot?: string | null
  servicioCodigo?: string | null
  servicioNombre?: string | null
}

export interface Paginated<T> {
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
    first_page: number
    first_page_url: string
    last_page_url: string
    next_page_url: string | null
    previous_page_url: string | null
  }
  data: T[]
}

export interface TicketUpdatePayload {
  placa?: string | null
  total?: number | null
  fecha_pago?: string | null
  sede_id?: number | null
  agente_id?: number | null
  prefijo?: string | null
  consecutivo?: string | null
  forma_pago?: FormaPago | null
  servicio_id?: number | null
  doc_tipo?: DocTipo | null
  doc_numero?: string | null
  nombre?: string | null
  telefono?: string | null
  observaciones?: string | null
  ocr_conf_baja_revisado?: boolean
  image_rotation?: number
  nit?: string | null
  pin?: string | null
  marca?: string | null
  vendedor_text?: string | null
  subtotal?: number | null
  iva?: number | null
  total_factura?: number | null
  pago_consignacion?: number | null
  pago_tarjeta?: number | null
  pago_efectivo?: number | null
  pago_cambio?: number | null
}

/* =============================== Endpoints =============================== */

const base = '/api/facturacion/tickets' // ⬅️ con slash inicial

export const FacturacionService = {
  /**
   * Listado con filtros y paginación.
   * Filtros: desde, hasta (ISO), sede_id, agente_id, placa, estado, turno_id, dateo_id, page, limit
   */
  list(params?: {
    desde?: string
    hasta?: string
    sede_id?: number
    agente_id?: number
    placa?: string
    estado?: FactEstado
    turno_id?: number
    dateo_id?: number
    page?: number
    limit?: number
  }) {
    const p: Record<string, string | number> = {}
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p[k] = v as string | number
      })
    }
    return get<Paginated<FacturacionTicket>>(base, { params: p })
  },

  /** Detalle por id (incluye preloads en backend) */
  getById(id: number | string) {
    return get<FacturacionTicket>(`${base}/${id}`)
  },

  /** Verifica si el hash (sha256 del archivo) ya existe */
  hashExists(hash: string) {
    return get<{ exists: boolean }>(`${base}/hash-exists/${encodeURIComponent(hash)}`)
  },

  /**
   * Chequeo de duplicado por contenido (placa + total + fecha ±1h)
   * Enviar fecha en ISO (ej: 2025-10-27T13:55:00-05:00)
   */
  checkDuplicados(args: { placa: string; total: number; fecha_pago_iso: string }) {
    return get<{ possible: boolean; count: number }>(`${base}/duplicados`, { params: args })
  },

  /**
   * Crea ticket subiendo SOLO archivo (image/*) + metadatos planos (turno_id, etc.)
   */
  async createFromFile(args: {
    file: File | Blob
    turno_id?: number | null
    dateo_id?: number | null
    sede_id?: number | null
    servicio_id?: number | null
    image_rotation?: number | null
    filename?: string
  }) {
    const form = new FormData()
    form.append('archivo', args.file, args.filename || 'ticket.jpg')
    if (args.turno_id != null) form.append('turno_id', String(args.turno_id))
    if (args.dateo_id != null) form.append('dateo_id', String(args.dateo_id))
    if (args.sede_id != null) form.append('sede_id', String(args.sede_id))
    if (args.servicio_id != null) form.append('servicio_id', String(args.servicio_id))
    if (args.image_rotation != null) form.append('image_rotation', String(args.image_rotation))

    return upload<FacturacionTicket>(`${base}`, form)
  },

  /**
   * Crea ticket con "data" (JSON) + archivo en el mismo FormData.
   */
  async createFromFormData(args: {
    data: Partial<{
      turno_id: number | null
      placa: string | null
      fecha_pago: string | null // YYYY-MM-DD
      hora_pago: string | null  // HH:mm:ss
      total: number | null
      vendedor: string | null
      prefijo: string | null
      consecutivo: string | null
      nit: string | null
      pin: string | null
      marca: string | null
      subtotal: number | null
      iva: number | null
      total_factura: number | null
      image_rotation: number | null
      sede_id?: number | null
      dateo_id?: number | null
      servicio_id?: number | null
    }>
    archivo?: File | Blob | null
    filename?: string
  }) {
    const fd = new FormData()
    fd.append('data', JSON.stringify(args.data || {}))
    if (args.archivo) {
      fd.append('archivo', args.archivo, args.filename || 'ticket.jpg')
    }
    return upload<FacturacionTicket>(`${base}`, fd)
  },

  /** Reintentar OCR */
  reocr(id: number | string) {
    return post<FacturacionTicket>(`${base}/${id}/reocr`)
  },

  /**
   * Actualiza campos editables del formulario.
   */
  update(id: number | string, body: TicketUpdatePayload) {
    return patch<FacturacionTicket>(`${base}/${id}`, body)
  },

  /**
   * Confirmar ticket → pasa a CONFIRMADA (si cumple validaciones).
   * - forzar?: true para confirmar pese a posible duplicado por contenido.
   */
  confirmar(id: number | string, forzar = false) {
    const body = forzar ? { forzar: true } : undefined
    return post<FacturacionTicket>(`${base}/${id}/confirmar`, body)
  },

  /* ============================ Azúcares UI ============================ */

  /**
   * Flujo común de caja:
   *  1) subir archivo
   *  2) reocr
   *  3) update con los ajustes del usuario
   *  4) confirmar (opcionalmente con forzar)
   */
  async flujoCaja({
    file,
    meta,
    updatePatch,
    forzar,
  }: {
    file: File | Blob
    meta?: {
      turno_id?: number | null
      dateo_id?: number | null
      sede_id?: number | null
      servicio_id?: number | null
      image_rotation?: number | null
      filename?: string
    }
    updatePatch?: TicketUpdatePayload
    forzar?: boolean
  }) {
    const created = await FacturacionService.createFromFile({ file, ...(meta || {}) })
    const ocrd = await FacturacionService.reocr(created.id)
    const updated = updatePatch ? await FacturacionService.update(ocrd.id, updatePatch) : ocrd
    const confirmed = await FacturacionService.confirmar(updated.id, !!forzar)
    return confirmed
  },
}
