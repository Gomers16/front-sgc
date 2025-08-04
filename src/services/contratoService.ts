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
  id?: number; // ID puede ser opcional al crear
  contratoId?: number; // Contrato ID puede ser opcional al crear el paso individualmente
  nombre: string;
  completado: boolean;
  observacion?: string;
  nombreArchivo?: string;
  fechaCompletado?: string;
  archivoUrl?: string; // URL del archivo después de subir
  archivoFile?: File | null; // El objeto File para envío desde el frontend
  fase: string;
  createdAt?: string;
  updatedAt?: string;
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
  fechaFinalizacion?: string; // Para la finalización del contrato
  motivoFinalizacion?: string; // Para la finalización del contrato
}

// Define el payload para la actualización del contrato.
export interface ContratoUpdatePayload {
  estado?: 'activo' | 'inactivo';
  fechaFin?: string;
  motivoFinalizacion?: string;
  // Puedes agregar otros campos aquí si los necesitas en el futuro
}

// Define la interfaz para el payload que se envía al backend para anexar un contrato
export interface AnexarContratoPayload {
  usuarioId: number;
  archivoContrato: File;
  tipoContrato: string;
  fechaInicio: string;
  fechaFin?: string; // Opcional, si se anexa con fecha de fin
  pasos: ContratoPaso[]; // Array de pasos con sus datos y posibles archivos
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
 * Anexa un contrato físico a un usuario, incluyendo los pasos y sus archivos.
 * @param payload Los datos completos para anexar el contrato.
 * @returns El objeto del contrato creado/actualizado.
 */
export async function anexarContrato(payload: AnexarContratoPayload): Promise<Contrato> {
  try {
    const formData = new FormData();
    formData.append('usuarioId', String(payload.usuarioId));
    formData.append('tipoContrato', payload.tipoContrato);
    formData.append('fechaInicio', payload.fechaInicio);
    if (payload.fechaFin) formData.append('fechaFin', payload.fechaFin);
    // ✅ CORRECCIÓN: Cambiado 'contratoFisico' a 'archivo' para que coincida con el backend
    formData.append('archivo', payload.archivoContrato, payload.archivoContrato.name); // Main contract file

    // Append steps data and their files
    payload.pasos.forEach((paso, index) => {
      formData.append(`pasos[${index}][nombre]`, paso.nombre);
      formData.append(`pasos[${index}][completado]`, String(paso.completado));
      formData.append(`pasos[${index}][fase]`, paso.fase);

      if (paso.observacion) {
        formData.append(`pasos[${index}][observacion]`, paso.observacion);
      }
      if (paso.fechaCompletado) {
        formData.append(`pasos[${index}][fecha]`, paso.fechaCompletado);
      }
      if (paso.archivoFile) {
        // Append the file itself with a unique name for each step
        formData.append(`pasos[${index}][archivo]`, paso.archivoFile, paso.archivoFile.name);
      }
    });

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
 * Actualiza los datos de un contrato existente, incluyendo su estado y campos de finalización.
 * @param contratoId El ID del contrato a actualizar.
 * @param payload Los datos a actualizar.
 * @returns El contrato actualizado.
 */
export async function actualizarContrato(contratoId: number, payload: ContratoUpdatePayload): Promise<Contrato> {
  try {
    const response = await fetchData<Contrato>(`${API_BASE_URL}/contratos/${contratoId}`, {
      method: 'PATCH', // Usar PATCH para actualizaciones parciales
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
 * Obtiene un contrato específico por su ID, precargando usuario, sede, pasos y eventos.
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
    // Nota: Esta función filtra en el cliente. Lo ideal sería que la API te diera los contratos del usuario directamente.
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
 * @param payload Los datos a actualizar (ej. { completado: true, observacion: '...', archivo?: File }).
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
    if (payload.archivo) formData.append('archivo', payload.archivo, payload.archivo.name); // Adjunta el archivo

    const response = await fetchData<ContratoPaso>(`${API_BASE_URL}/pasos/${pasoId}`, {
      method: 'PUT', // O PATCH, según tu API
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
