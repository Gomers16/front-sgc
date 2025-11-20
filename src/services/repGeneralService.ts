// src/services/repGeneralService.ts
import { post } from './http'

export interface RepGeneralImportResumen {
  clientesCreados: number
  clientesActualizados: number
  vehiculosCreados: number
  vehiculosActualizados: number
  conductoresCreados: number
  errores: number
}

export interface RepGeneralImportResponse {
  ok: boolean
  message: string
  resumen: RepGeneralImportResumen
}

/**
 * Importa el archivo RepGeneral (CSV) y devuelve el resumen
 * de creación/actualización de clientes, vehículos y conductores.
 */
export async function importarRepGeneral(
  file: File
): Promise<RepGeneralImportResponse> {
  const formData = new FormData()
  formData.append('file', file)

  // ✅ NO incluyas headers cuando uses FormData
  // El navegador agregará automáticamente:
  // Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
  const data = await post<RepGeneralImportResponse>(
    '/api/rtm/rep-general/import',
    formData
    // ❌ ELIMINA este objeto:
    // {
    //   headers: {
    //     'Content-Type': 'multipart/form-data',
    //   },
    // }
  )

  return data
}

const repGeneralService = {
  importarRepGeneral,
}

export default repGeneralService
