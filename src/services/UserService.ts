// src/services/userService.ts

// URL base para todas las peticiones a la API
const API_BASE_URL = '/api';

// --- Interfaces para tipado de datos ---
export interface Rol {
    id: number;
    nombre: string;
}
export interface RazonSocial {
    id: number;
    nombre: string;
}
export interface Sede {
    id: number;
    nombre: string;
}
export interface Cargo {
    id: number;
    nombre: string;
}
export interface EntidadSalud {
    id: number;
    nombre: string;
    tipo: string;
}

// Interfaz para la respuesta de una operación de eliminación
export interface DeleteResponse {
    message: string;
}

// Interfaz principal para el objeto de Usuario
export interface User {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    celularPersonal?: string;
    celularCorporativo?: string;
    direccion?: string;
    centroCosto?: string;
    recomendaciones?: boolean;
    // La ruta de la foto ahora será una cadena de texto (ej. '/uploads/profile_pictures/image.png')
    fotoPerfil?: string;
    estado: 'activo' | 'inactivo';
    rolId: number;
    rol?: Rol;
    razonSocialId: number;
    razonSocial?: RazonSocial;
    sedeId: number;
    sede?: Sede;
    cargoId: number;
    cargo?: Cargo;
    epsId?: number;
    eps?: EntidadSalud;
    arlId?: number;
    arl?: EntidadSalud;
    afpId?: number;
    afp?: EntidadSalud;
    afcId?: number;
    afc?: EntidadSalud;
    ccfId?: number;
    ccf?: EntidadSalud;
    password?: string;
}

/**
 * Función genérica para manejar peticiones HTTP y errores.
 * @param url La URL del endpoint de la API.
 * @param options Opciones de la petición (método, headers, body, etc.).
 * @returns Una promesa que resuelve con los datos JSON.
 */
async function fetchData<T>(url: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;

    // Clonamos las opciones para no mutar el objeto original
    const fetchOptions = { ...options };

    // Si no es un FormData, nos aseguramos de que el Content-Type sea JSON
    if (!isFormData) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json',
        };
    } else {
        // Si es FormData, eliminamos Content-Type para que el navegador lo añada correctamente
        if (fetchOptions.headers) {
            delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
        }
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Error en la petición');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const jsonResponse = await response.json();

        // --- CAMBIO CLAVE PARA CORREGIR EL ERROR ---
        // Verifica si la respuesta tiene un objeto 'data'. Si es así, lo devuelve.
        // Si no, devuelve la respuesta completa (asumiendo que ya es un arreglo).
        return jsonResponse.data || jsonResponse;
    }

    return {} as T;
}

// --- Funciones para el manejo de usuarios ---

/**
 * Obtiene una lista de todos los usuarios o filtrados por razón social.
 */
export async function obtenerUsuarios(razonSocialId?: number): Promise<User[]> {
    try {
        const url = new URL(`${API_BASE_URL}/usuarios`, window.location.origin);
        if (razonSocialId) {
            url.searchParams.append('razon_social_id', razonSocialId.toString());
        }
        const response = await fetchData<User[]>(url.href);
        return response;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
    }
}

/**
 * Obtiene los detalles de un usuario específico por su ID.
 */
export async function obtenerUsuarioPorId(id: number): Promise<User | null> {
    try {
        const response = await fetchData<User>(`${API_BASE_URL}/usuarios/${id}`);
        return response;
    } catch (error: any) {
        if (error.message.includes('Not Found')) {
            console.warn(`Usuario con ID ${id} no encontrado.`);
            return null;
        }
        console.error(`Error al obtener usuario con ID ${id}:`, error);
        throw error;
    }
}

/**
 * Crea un nuevo usuario en la base de datos.
 */
export async function crearUsuario(userData: Partial<User>): Promise<User> {
    try {
        const response = await fetchData<User>(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return response;
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
}

/**
 * Actualiza los datos de un usuario existente.
 */
export async function actualizarUsuario(id: number, userData: Partial<User>): Promise<User> {
    try {
        const response = await fetchData<User>(`${API_BASE_URL}/usuarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
        return response;
    } catch (error) {
        console.error(`Error al actualizar usuario con ID ${id}:`, error);
        throw error;
    }
}

/**
 * Elimina un usuario por su ID.
 */
export async function eliminarUsuario(id: number): Promise<string> {
    try {
        const response = await fetchData<DeleteResponse>(`${API_BASE_URL}/usuarios/${id}`, {
            method: 'DELETE',
        });
        return response.message || 'Usuario eliminado correctamente.';
    } catch (error) {
        console.error(`Error al eliminar usuario con ID ${id}:`, error);
        throw error;
    }
}

/**
 * Actualiza la foto de perfil de un usuario.
 */
export async function uploadProfilePicture(userId: number, file: File): Promise<User> {
    try {
        const formData = new FormData();
        formData.append('foto', file);

        const response = await fetchData<User>(`${API_BASE_URL}/usuarios/${userId}/upload-photo`, {
            method: 'POST',
            body: formData,
        });

        return response;
    } catch (error) {
        console.error(`Error al subir la foto de perfil para el usuario ${userId}:`, error);
        throw error;
    }
}

// --- Funciones para obtener listas auxiliares ---

export async function obtenerRoles(): Promise<Rol[]> {
    try {
        const response = await fetchData<Rol[]>(`${API_BASE_URL}/roles`);
        return response;
    } catch (error) {
        console.error('Error al obtener roles:', error);
        throw error;
    }
}

export async function obtenerRazonesSociales(): Promise<RazonSocial[]> {
    try {
        const response = await fetchData<RazonSocial[]>(`${API_BASE_URL}/razones-sociales`);
        return response;
    } catch (error) {
        console.error('Error al obtener razones sociales:', error);
        throw error;
    }
}

export async function obtenerSedes(): Promise<Sede[]> {
    try {
        const response = await fetchData<Sede[]>(`${API_BASE_URL}/sedes`);
        return response;
    } catch (error) {
        console.error('Error al obtener sedes:', error);
        throw error;
    }
}

export async function obtenerCargos(): Promise<Cargo[]> {
    try {
        const response = await fetchData<Cargo[]>(`${API_BASE_URL}/cargos`);
        return response;
    } catch (error) {
        console.error('Error al obtener cargos:', error);
        throw error;
    }
}

export async function obtenerEntidadesSalud(): Promise<EntidadSalud[]> {
    try {
        const response = await fetchData<EntidadSalud[]>(`${API_BASE_URL}/entidades-salud`);
        return response;
    } catch (error) {
        console.error('Error al obtener entidades de salud:', error);
        throw error;
    }
}
