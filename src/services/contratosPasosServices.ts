// src/services/contratoPasosService.ts

// La interfaz no cambia, pero ten en cuenta que el payload para
// el backend necesitará un 'FormData' para los archivos.
interface ContratoPaso {
  id: number
  contratoId: number
  fase: 'inicio' | 'desarrollo' | 'fin'
  nombrePaso: string
  observacion?: string
  orden: number
  completado: boolean
  fecha?: string
  archivo?: File // No se envía directamente, se usa en FormData
  archivoUrl?: string // Lo que devuelve el backend
}

class ContratoPasosService {
  private static API_BASE_URL = 'http://localhost:3333/api'

  public static async fetchPasos(contratoId: number): Promise<ContratoPaso[]> {
    const response = await fetch(`${this.API_BASE_URL}/contratos/${contratoId}/pasos`)
    if (!response.ok) throw new Error('Error al obtener pasos')
    return response.json()
  }

  // ✅ MODIFICACIÓN: Usa FormData para enviar datos y archivos
  public static async createPaso(contratoId: number, data: FormData): Promise<ContratoPaso> {
    const response = await fetch(`${this.API_BASE_URL}/contratos/${contratoId}/pasos`, {
      method: 'POST',
      body: data, // fetch maneja el encabezado Content-Type automáticamente con FormData
    })
    if (!response.ok) throw new Error('Error al crear paso')
    return response.json()
  }
  
  // ✅ MODIFICACIÓN: Usa FormData y el método POST con _method=PUT para el archivo
  public static async updatePaso(id: number, data: FormData): Promise<ContratoPaso> {
    data.append('_method', 'PUT'); // Indica a Adonis que este POST es una actualización
    
    // NOTA: La ruta de tu controlador 'update' es '.../contrato-pasos/:id'.
    // He ajustado la URL para que coincida.
    const response = await fetch(`${this.API_BASE_URL}/contrato-pasos/${id}`, {
      method: 'POST',
      body: data,
    })
    if (!response.ok) throw new Error('Error al actualizar paso')
    return response.json()
  }

  // ✅ MODIFICACIÓN: Se quita 'contratoId' ya que el controlador espera solo el 'id' del paso
  public static async deletePaso(id: number): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/contrato-pasos/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Error al eliminar paso')
  }
}

export default ContratoPasosService;