import { get, put, download } from './http'

export interface TramiteLiquidacion {
  tramiteId: number

  retencion:             number | null
  derechosTraspaso:      number | null
  pazSalvo:              number | null
  levantamientoPrenda:   number | null
  inscripcionPrenda:     number | null
  papeleria:             number | null
  honorarios:            number | null
  impuestoAnioActual:    number | null
  impuestoAniosVencidos: number | null
}

const BASE = '/api/tramites'

export const TramiteLiquidacionService = {
  getByTramite(tramiteId: number) {
    return get<TramiteLiquidacion>(`${BASE}/${tramiteId}/liquidacion`)
  },

  upsert(tramiteId: number, data: Partial<TramiteLiquidacion>) {
    return put<TramiteLiquidacion, Partial<TramiteLiquidacion>>(
      `${BASE}/${tramiteId}/liquidacion`,
      data,
    )
  },

  exportPdf(tramiteId: number): Promise<Blob> {
    return download(`${BASE}/${tramiteId}/liquidacion/export-pdf`)
  },
}
