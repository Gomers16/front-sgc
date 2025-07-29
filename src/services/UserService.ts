// src/services/userService.ts

const BASE_URL = 'http://localhost:3333/api/usuarios';

// Interfaz para la respuesta estándar del backend con un campo 'data'
interface BackendResponse<T> {
  message: string;
  data: T;
}

interface UsuarioPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  password?: string;
  rolId: number;
  razonSocialId: number;
  sedeId?: number | null;
  cargoId?: number | null;
  fotoPerfil?: string | null; // Esta es la URL, no el archivo en sí
  direccion?: string | null;
  celularPersonal?: string;
  celularCorporativo?: string | null;
  centroCosto?: string | null;
  estado?: string;
  recomendaciones?: boolean;
  epsId?: number | null;
  arlId?: number | null;
  afpId?: number | null;
  afcId?: number | null;
  ccfId?: number | null;
}

interface UsuarioResponse {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  celularPersonal?: string;
  rolId: number;
  razonSocialId: number;
  sedeId?: number | null;
  cargoId?: number | null;
  fotoPerfil?: string | null;
  direccion?: string | null;
  celularCorporativo?: string | null;
  centroCosto?: string | null;
  estado: string;
  recomendaciones?: boolean;
  epsId?: number | null;
  arlId?: number | null;
  afpId?: number | null;
  afcId?: number | null;
  ccf?: { id: number; nombre: string } | null;
  rol?: { id: number; nombre: string };
  razonSocial?: { id: number; nombre: string };
  sede?: { id: number; nombre: string } | null;
  cargo?: { id: number; nombre: string } | null;
  eps?: { id: number; nombre: string } | null;
  arl?: { id: number; nombre: string } | null;
  afp?: { id: number; nombre: string } | null;
  afc?: { id: number; nombre: string } | null;
  ccfId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface SelectorOption {
  id: number;
  nombre: string;
}

interface ProfilePictureUploadResponse {
  message: string;
  fotoPerfilUrl: string;
}

/**
 * Función para obtener un token de autenticación desde sessionStorage.
 * Asegúrate de que esto coincida con cómo y dónde lo guarda tu AuthStore.
 */
function getAuthToken(): string | null {
  const token = sessionStorage.getItem('token');
  return token;
}

/**
 * Realiza una solicitud fetch genérica a la API para JSON.
 * @param url El endpoint de la API.
 * @param method El método HTTP (GET, POST, PUT, DELETE).
 * @param data Los datos a enviar en el cuerpo de la solicitud (para POST/PUT).
 * @param requiresAuth Indica si la solicitud requiere un token de autenticación. Por defecto es true.
 * @returns La respuesta parseada en JSON.
 * @throws Error si la respuesta de la red no es exitosa.
 */
async function apiFetch<T>(url: string, method: string, data?: object, requiresAuth: boolean = true): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`Advertencia: La solicitud a ${url} requiere autenticación pero no se encontró un token.`);
      throw new Error('No se encontró el token de autenticación para esta operación.');
    }
  }

  const options: RequestInit = {
    method: method,
    headers: headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error de respuesta no JSON', details: response.statusText }));
      throw new Error(errorData.message || `Error HTTP! Estado: ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return await response.json() as T;
  } catch (error: unknown) {
    console.error(`Error en la solicitud ${method} a ${url}:`, error);
    throw error;
  }
}

/**
 * Realiza una solicitud fetch para subir archivos (multipart/form-data).
 * @param url El endpoint de la API.
 * @param method El método HTTP (POST, PUT, PATCH).
 * @param formData Los datos FormData que contienen el archivo.
 * @param requiresAuth Indica si la solicitud requiere un token de autenticación. Por defecto es true.
 * @returns La respuesta parseada en JSON.
 * @throws Error si la respuesta de la red no es exitosa.
 */
async function uploadFile<T>(url: string, method: string, formData: FormData, requiresAuth: boolean = true): Promise<T> {
  const headers: HeadersInit = {}; // No establecer 'Content-Type' para FormData, fetch lo hace automáticamente.

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`Advertencia: La solicitud a ${url} requiere autenticación pero no se encontró un token.`);
      throw new Error('No se encontró el token de autenticación para esta operación.');
    }
  }

  const options: RequestInit = {
    method: method,
    headers: headers,
    body: formData,
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error de respuesta no JSON', details: response.statusText }));
      throw new Error(errorData.message || `Error HTTP! Estado: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error: unknown) {
    console.error(`Error en la solicitud ${method} a ${url} (upload):`, error);
    throw error;
  }
}


export async function crearUsuario(userData: UsuarioPayload): Promise<UsuarioResponse> {
  return apiFetch<UsuarioResponse>(BASE_URL, 'POST', userData, false);
}

export async function obtenerUsuarios(): Promise<UsuarioResponse[]> {
  return apiFetch<UsuarioResponse[]>(BASE_URL, 'GET', undefined, false);
}

export async function actualizarUsuario(id: number, userData: UsuarioPayload): Promise<UsuarioResponse> {
  return apiFetch<UsuarioResponse>(`${BASE_URL}/${id}`, 'PUT', userData, false);
}

export async function eliminarUsuario(id: number): Promise<void> {
  await apiFetch<null>(`${BASE_URL}/${id}`, 'DELETE', undefined, false);
}

// NUEVA FUNCIÓN PARA SUBIR FOTO DE PERFIL
export async function uploadProfilePicture(userId: number, file: File): Promise<ProfilePictureUploadResponse> {
  const formData = new FormData();
  formData.append('foto', file); // 'foto' debe coincidir con el nombre esperado en el backend (request.file('foto'))
  // La ruta corregida en el backend es `/api/usuarios/:id/profile-picture`
  return uploadFile<ProfilePictureUploadResponse>(`${BASE_URL}/${userId}/profile-picture`, 'PUT', formData, false); // Asumimos que esta ruta NO requiere autenticación para la prueba actual
}


// --- Servicios para obtener opciones de selectores (NO requieren autenticación) ---
// Estas rutas son públicas, según tu configuración en start/routes.ts

export async function obtenerRoles(): Promise<SelectorOption[]> {
  const response = await apiFetch<BackendResponse<SelectorOption[]>>('http://localhost:3333/api/roles', 'GET', undefined, false);
  return response.data;
}

export async function obtenerRazonesSociales(): Promise<SelectorOption[]> {
  const response = await apiFetch<BackendResponse<SelectorOption[]>>('http://localhost:3333/api/razones-sociales', 'GET', undefined, false);
  return response.data;
}

export async function obtenerSedes(): Promise<SelectorOption[]> {
  const response = await apiFetch<BackendResponse<SelectorOption[]>>('http://localhost:3333/api/sedes', 'GET', undefined, false);
  return response.data;
}

export async function obtenerCargos(): Promise<SelectorOption[]> {
  const response = await apiFetch<BackendResponse<SelectorOption[]>>('http://localhost:3333/api/cargos', 'GET', undefined, false);
  return response.data;
}

export async function obtenerEntidadesSalud(): Promise<SelectorOption[]> {
  const response = await apiFetch<BackendResponse<SelectorOption[]>>('http://localhost:3333/api/entidades-salud', 'GET', undefined, false);
  return response.data;
}
