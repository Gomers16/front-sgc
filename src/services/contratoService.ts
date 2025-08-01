// src/services/contratoService.ts

// Define la URL base de tu API. Asegúrate de que coincida con la configuración de tu proxy de Vite.
const API_BASE_URL = '/api';

// --- Interfaces para tipado de datos (deben coincidir con tus modelos de AdonisJS) ---

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
  id: number;
  contratoId: number;
  nombre: string;
  completado: boolean;
  observacion?: string;
  nombreArchivo?: string;
  fechaCompletado?: string;
  createdAt: string;
  updatedAt: string;
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
}

// --- Funciones para interactuar con la API de Contratos usando fetch ---

/**
 * Realiza una petición fetch genérica.
 * @param url La URL a la que hacer la petición.
 * @param options Opciones de la petición fetch.
 * @returns La respuesta parseada como JSON.
 * @throws Error si la respuesta no es exitosa (status 2xx).
 */
async function fetchData<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Error en la petición');
  }

  return response.json();
}

/**
 * Anexa un contrato físico a un usuario.
 * @param usuarioId El ID del usuario al que se anexará el contrato.
 * @param archivo El archivo físico del contrato (PDF, etc.).
 * @param tipoContrato El tipo de contrato (prestacion, temporal, laboral).
 * @param fechaInicio La fecha de inicio del contrato.
 * @param fechaFin La fecha de fin del contrato (opcional).
 * @returns El objeto del contrato creado/actualizado.
 */
export async function anexarContrato(
  usuarioId: number,
  archivo: File,
  tipoContrato: string,
  fechaInicio: string,
  fechaFin?: string
): Promise<Contrato> {
  try {
    const formData = new FormData();
    formData.append('usuarioId', String(usuarioId));
    formData.append('tipoContrato', tipoContrato);
    formData.append('fechaInicio', fechaInicio);
    if (fechaFin) formData.append('fechaFin', fechaFin);
    formData.append('archivo', archivo);

    const response = await fetchData<Contrato>(`${API_BASE_URL}/contratos/anexar-fisico`, {
      method: 'POST',
      body: formData,
    });

    return response;
  } catch (error) {
    console.error('Error al anexar el contrato físico:', error);
    throw error;
  }
}

/**
 * Crea un nuevo contrato en el backend.
 * @param payload Los datos del contrato a crear.
 * @returns El contrato creado.
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
 * Obtiene un contrato específico por su ID, precargando usuario, sede y pasos.
 * @param id El ID del contrato.
 * @returns El objeto del contrato.
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
 * @param usuarioId El ID del usuario.
 * @returns Un array de contratos.
 */
export async function obtenerContratosPorUsuario(usuarioId: number): Promise<Contrato[]> {
  try {
    const response = await fetchData<Contrato[]>(`${API_BASE_URL}/contratos`);
    return response.filter(c => c.usuarioId === usuarioId);
  } catch (error) {
    console.error(`Error al obtener contratos para el usuario ${usuarioId}:`, error);
    throw error;
  }
}

/**
 * Actualiza el estado de un paso de contrato.
 * @param pasoId El ID del paso a actualizar.
 * @param payload Los datos a actualizar (ej. { completado: true, observacion: '...' }).
 * @returns El paso actualizado.
 */
export async function actualizarPasoContrato(
  pasoId: number,
  payload: { completado: boolean; observacion?: string; archivo?: File }
): Promise<ContratoPaso> {
  try {
    const formData = new FormData();
    formData.append('completado', String(payload.completado));
    if (payload.observacion) formData.append('observacion', payload.observacion);
    if (payload.archivo) formData.append('archivo', payload.archivo);

    const response = await fetchData<ContratoPaso>(`${API_BASE_URL}/pasos/${pasoId}`, {
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
 * @param contratoId El ID del contrato.
 * @returns Un array de pasos de contrato.
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
