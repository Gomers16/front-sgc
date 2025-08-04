// src/services/contratoPasosService.ts

interface ContratoPaso {
  id: number
  contratoId: number
  nombre: string
  descripcion: string
  orden: number
}

class ContratoPasosService {
  private static API_BASE_URL = 'http://localhost:3333/api'

  public static async fetchPasos(contratoId: number): Promise<ContratoPaso[]> {
    const response = await fetch(`${this.API_BASE_URL}/contratos/${contratoId}/pasos`)
    if (!response.ok) throw new Error('Error al obtener pasos')
    return response.json()
  }

  public static async createPaso(contratoId: number, payload: Partial<ContratoPaso>): Promise<ContratoPaso> {
    const response = await fetch(`${this.API_BASE_URL}/contratos/${contratoId}/pasos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('Error al crear paso')
    return response.json()
  }
  
  // RUTA CORREGIDA: Ahora incluye el contratoId en la URL
  public static async updatePaso(contratoId: number, id: number, payload: Partial<ContratoPaso>): Promise<ContratoPaso> {
    const response = await fetch(`${this.API_BASE_URL}/contratos/${contratoId}/pasos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('Error al actualizar paso')
    return response.json()
  }

  // RUTA CORREGIDA: Ahora incluye el contratoId en la URL
  public static async deletePaso(contratoId: number, id: number): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/contratos/${contratoId}/pasos/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar paso')
  }
}

export default ContratoPasosService