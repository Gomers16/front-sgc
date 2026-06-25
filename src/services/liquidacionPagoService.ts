import { get, upload, download } from './http'

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

  getPagoPdf(liquidacionPagoId: number): Promise<Blob> {
    return download(`/api/tramites/liquidacion-pago/${liquidacionPagoId}/pdf`)
  },
}
