import { fetchData } from './UserService'; // Importamos la función genérica

// URL base para las peticiones de eventos de contrato
const API_BASE_URL = '/api';

// --- Interfaces para tipado de datos ---

/**
 * Interfaz para un evento de contrato.
 */
export interface ContratoEvento {
    id: number;
    contratoId: number;
    tipo: 'incapacidad' | 'suspension' | 'licencia' | 'permiso' | 'vacaciones' | 'cesantias' | 'disciplinario' | 'terminacion';
    subtipo?: string;
    fechaInicio: string; // Formato ISO 8601 (YYYY-MM-DD)
    fechaFin?: string; // Formato ISO 8601 (YYYY-MM-DD)
    descripcion?: string;
    documentoUrl?: string; // Ruta al archivo adjunto
    createdAt: string;
    updatedAt: string;
}

/**
 * Función para obtener todos los eventos de un contrato específico.
 * @param contratoId El ID del contrato.
 * @returns Una promesa que resuelve con un arreglo de eventos.
 */
export async function obtenerEventosDeContrato(contratoId: number): Promise<ContratoEvento[]> {
    try {
        return await fetchData<ContratoEvento[]>(`${API_BASE_URL}/contratos/${contratoId}/eventos`);
    } catch (error) {
        console.error('Error al obtener los eventos de contrato:', error);
        throw error;
    }
}

/**
 * Función para crear un nuevo evento para un contrato.
 * @param contratoId El ID del contrato.
 * @param eventData Los datos del evento, incluyendo el archivo si aplica.
 * @returns Una promesa que resuelve con el evento creado.
 */
export async function crearEventoDeContrato(contratoId: number, eventData: Partial<ContratoEvento> | FormData): Promise<ContratoEvento> {
    const isFormData = eventData instanceof FormData;
    const body = isFormData ? eventData : JSON.stringify(eventData);

    try {
        return await fetchData<ContratoEvento>(`${API_BASE_URL}/contratos/${contratoId}/eventos`, {
            method: 'POST',
            body: body,
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error al crear el evento de contrato:', error);
        throw error;
    }
}

/**
 * Función para actualizar un evento de contrato existente.
 * @param contratoId El ID del contrato al que pertenece el evento.
 * @param eventId El ID del evento a actualizar.
 * @param eventData Los datos del evento a actualizar.
 * @returns Una promesa que resuelve con el evento actualizado.
 */
export async function actualizarEventoDeContrato(contratoId: number, eventId: number, eventData: Partial<ContratoEvento>): Promise<ContratoEvento> {
    try {
        return await fetchData<ContratoEvento>(`${API_BASE_URL}/contratos/${contratoId}/eventos/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData),
        });
    } catch (error) {
        console.error('Error al actualizar el evento de contrato:', error);
        throw error;
    }
}

/**
 * Función para eliminar un evento de contrato.
 * @param contratoId El ID del contrato al que pertenece el evento.
 * @param eventId El ID del evento a eliminar.
 * @returns Una promesa que resuelve al finalizar la eliminación.
 */
export async function eliminarEventoDeContrato(contratoId: number, eventId: number): Promise<void> {
    try {
        await fetchData<void>(`${API_BASE_URL}/contratos/${contratoId}/eventos/${eventId}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Error al eliminar el evento de contrato:', error);
        throw error;
    }
}
