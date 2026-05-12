import { get } from './http'

const base = 'api/servicios'

export default {
  getActivos(): Promise<{ id: number; codigoServicio: string; nombre: string }[]> {
    return get(base) // GET /api/servicios — el index que ya tienes registrado
  },
}
