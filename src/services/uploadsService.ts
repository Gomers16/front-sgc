// src/services/uploadsService.ts
import { upload, del, get } from '@/services/http'

/** Respuesta estándar del controlador de uploads */
export interface UploadImageResponse {
  /** URL absoluta o relativa para servir la imagen */
  url: string
  /** Nombre del archivo en disco (si tu back lo expone) */
  filename?: string
  /** Mime que detectó el back */
  mime?: string
  /** Tamaño en bytes */
  size?: number
  /** Hash/etag si lo calculas */
  hash?: string | null
  /** Algún id/origen (por ej. id en storage, si aplica) */
  id?: string | number | null
}

/** Campos extra opcionales que quieras enviar en el multipart */
export type ExtraUploadFields = Record<string, string | number | boolean | undefined | null>

/** Subir una imagen (FormData con el campo "file") */
export async function uploadImage(file: File, extra?: ExtraUploadFields) {
  const form = new FormData()
  form.append('file', file, file.name || 'image')
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, String(v))
    })
  }
  // POST /api/uploads/images
  return upload<UploadImageResponse>('/api/uploads/images', form)
}

/** (Opcional) Obtener metadata de una imagen por filename.
 *  Úsalo sólo si tu GET devuelve JSON. Si tu GET sirve binario, usa download() desde http.ts.
 */
export function getImageMetaByFilename<T extends Record<string, unknown> = Record<string, unknown>>(
  filename: string
) {
  return get<T>(`/api/uploads/images/${encodeURIComponent(filename)}`)
}

/** Borrar imagen por filename (si expones DELETE) */
export function deleteImageByFilename(filename: string) {
  return del<{ ok: boolean; deleted?: string }>(`/api/uploads/images/${encodeURIComponent(filename)}`)
}
