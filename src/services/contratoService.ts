// src/services/contratoService.ts

// Define la URL base de tu API.
const API_BASE_URL = 'http://localhost:3333/api';

// --- Interfaces Unificadas para tipado de datos ---

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
}

interface Sede {
  id: number;
  nombre: string;
}

interface ContratoPaso {
  id?: number;
  contratoId?: number;
  nombre: string;
  completado: boolean;
  observacion?: string;
  nombreArchivo?: string;
  fechaCompletado?: string;
  archivoUrl?: string;
  archivoFile?: File | null;
  fase: string;
  orden?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface HistorialEstadoContrato {
  id: number;
  contratoId: number;
  usuarioId: number | null;
  usuario?: Usuario;
  oldEstado: 'activo' | 'inactivo';
  newEstado: 'activo' | 'inactivo';
  fechaCambio: string;
  fechaInicioContrato: string;
  motivo?: string | null;
}

interface Contrato {
  id: number;
  usuarioId: number;
  usuario?: Usuario;
  sedeId: number;
  sede?: Sede;
  tipoContrato: 'prestacion' | 'temporal' | 'laboral';
  estado: 'activo' | 'inactivo';
  fechaInicio: string;
  fechaFin?: string;
  pasos?: ContratoPaso[];
  createdAt: string;
  updatedAt: string;
  nombreArchivoContratoFisico?: string;
  rutaArchivoContratoFisico?: string;
  fechaFinalizacion?: string;
  motivoFinalizacion?: string;
  historial?: HistorialEstadoContrato[];
}

export interface ContratoUpdatePayload {
  estado?: 'activo' | 'inactivo';
  fechaFin?: string;
  motivoFinalizacion?: string;
  usuarioId?: number;
}

// --- Función genérica de fetch ---
async function fetchData<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Error en la petición');
  }

  return response.json();
}

// --- Funciones del Servicio de Contrato Unificado ---

/**
 * Anexa un contrato físico a un usuario.
 */
export async function anexarContrato(payload: FormData): Promise<Contrato> {
  try {
    const response = await fetchData<Contrato>(`${API_BASE_URL}/contratos/anexar-fisico`, {
      method: 'POST',
      body: payload,
    });
    return response;
  } catch (error) {
    console.error('Error al anexar el contrato físico:', error);
    throw error;
  }
}

/**
 * Crea un nuevo contrato en el backend (sin archivo físico).
 */
export async function crearContrato(payload: {
  usuarioId: number;
  tipoContrato: 'prestacion' | 'temporal' | 'laboral';
  estado: 'activo' | 'inactivo';
  fechaInicio: string;
  fechaFin?: string;
}): Promise<Contrato> {
  try {
    const response = await fetchData<Contrato>(`${API_BASE_URL}/contratos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    console.error('Error al crear contrato:', error);
    throw error;
  }
}

/**
 * Actualiza un contrato existente.
 */
export async function actualizarContrato(contratoId: number, payload: ContratoUpdatePayload): Promise<Contrato> {
  try {
    const response = await fetchData<Contrato>(`${API_BASE_URL}/contratos/${contratoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    console.error(`Error al actualizar el contrato ${contratoId}:`, error);
    throw error;
  }
}

/**
 * Obtiene un contrato específico por su ID.
 */
export async function obtenerContratoPorId(id: number): Promise<Contrato> {
  try {
    const response = await fetchData<Contrato>(`${API_BASE_URL}/contratos/${id}`);
    return response;
  } catch (error) {
    console.error(`Error al obtener contrato con ID ${id}:`, error);
    throw error;
  }
}

/**
 * Obtiene la lista de contratos para un usuario específico.
 */
export async function obtenerContratosPorUsuario(usuarioId: number): Promise<Contrato[]> {
  try {
    const response = await fetchData<Contrato[]>(`${API_BASE_URL}/usuarios/${usuarioId}/contratos`);
    return response;
  } catch (error) {
    console.error(`Error al obtener contratos para el usuario ${usuarioId}:`, error);
    throw error;
  }
}

/**
 * Actualiza el estado de un paso de contrato.
 */
export async function actualizarPasoContrato(
  contratoId: number,
  pasoId: number,
  payload: { completado: boolean; observacion?: string; archivo?: File }
): Promise<ContratoPaso> {
  try {
    const formData = new FormData();
    formData.append('completado', String(payload.completado));
    if (payload.observacion) formData.append('observacion', payload.observacion);
    if (payload.archivo) formData.append('archivo', payload.archivo, payload.archivo.name);

    const response = await fetchData<ContratoPaso>(`${API_BASE_URL}/contratos/${contratoId}/pasos/${pasoId}`, {
      method: 'PUT',
      body: formData,
    });
    return response;
  } catch (error) {
    console.error(`Error al actualizar el paso ${pasoId}:`, error);
    throw error;
  }
}

/**
 * Obtiene los pasos de un contrato específico.
 */
export async function obtenerPasosContrato(contratoId: number): Promise<ContratoPaso[]> {
  try {
    const response = await fetchData<ContratoPaso[]>(`${API_BASE_URL}/contratos/${contratoId}/pasos`);
    return response;
  } catch (error) {
    console.error(`Error al obtener pasos para el contrato ${contratoId}:`, error);
    throw error;
  }
}