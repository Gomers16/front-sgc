import { get, upload } from './http'

export interface LiquidacionPago {
  id:             number
  fecha:          string | null
  monto:          number
  formaPago:      string | null
  referenciaPago: string | null
  evidenciaUrl:   string | null
  pdfPath:        string | null
}

export interface TramiteConLiquidacion {
  tramiteId:        number
  placa:            string | null
  tipoTramite:      string | null
  liquidacionId:    number
  totalLiquidacion: number
  pagos:            LiquidacionPago[]
  totalPagado:      number
  saldoPendiente:   number
  estado:           'pendiente' | 'parcial' | 'pagado'
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333').replace(/\/$/, '')

export const LiquidacionPagoService = {
  getHistorialTurno(sedeId: number, fecha: string, turnoNumero: number) {
    const params = new URLSearchParams({
      sedeId:      String(sedeId),
      fecha,
      turnoNumero: String(turnoNumero),
    })
    return get<TramiteConLiquidacion[]>(`/api/tramites/liquidacion-historial?${params}`)
  },

  registrarPago(tramiteLiquidacionId: number, formData: FormData) {
    return upload<LiquidacionPago>(`/api/tramites/liquidacion/${tramiteLiquidacionId}/pago`, formData)
  },

  getPagoPdfUrl(liquidacionPagoId: number): string {
    return `${BASE_URL}/api/tramites/liquidacion-pago/${liquidacionPagoId}/pdf`
  },
}
