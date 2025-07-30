// src/services/contratosService.ts

interface Contrato {
  id: number
  nombre: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
  estado: string
  funcionarioId: number
  sedeId?: number
}

class ContratosService {
  private static API_BASE_URL = 'http://localhost:3333/api/contratos'

  public static async fetchContratos(): Promise<Contrato[]> {
    const response = await fetch(this.API_BASE_URL)
    if (!response.ok) throw new Error('Error al obtener contratos')
    return response.json()
  }

  public static async fetchContratoById(id: number): Promise<Contrato> {
    const response = await fetch(`${this.API_BASE_URL}/${id}`)
    if (!response.ok) throw new Error('Contrato no encontrado')
    return response.json()
  }

  public static async createContrato(payload: Partial<Contrato>): Promise<Contrato> {
    const response = await fetch(this.API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('Error al crear contrato')
    return response.json()
  }

  public static async updateContrato(id: number, payload: Partial<Contrato>): Promise<Contrato> {
    const response = await fetch(`${this.API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('Error al actualizar contrato')
    return response.json()
  }

  public static async deleteContrato(id: number): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar contrato')
  }
}

export default ContratosService
