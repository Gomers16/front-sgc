// src/services/razonSocialService.ts

/**
 * @file Servicio para interactuar con la API de razones sociales.
 * Maneja las operaciones de listado, obtención por ID y obtención de usuarios
 * asociados a una razón social.
 */

// Define interfaces para los tipos de datos que esperas recibir
// Esto mejora la seguridad de tipos y la legibilidad.
// Si tus modelos de AdonisJS tienen más campos, deberías incluirlos aquí.
interface RazonSocial {
  id: number;
  nombre: string;
  // Añade otras propiedades si las traes de la base de datos
}

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  // Otras propiedades del usuario que necesites...
  // Por ejemplo, si precargas 'cargo', 'rol', 'contratos':
  cargo?: { id: number; nombre: string };
  rol?: { id: number; nombre: string };
  contratos?: Array<{ id: number; estado: string; /* ...otras propiedades del contrato */ }>;
}

/**
 * Lista todas las razones sociales disponibles desde la API.
 * @returns {Promise<Array<RazonSocial>>} Un arreglo de razones sociales o un arreglo vacío en caso de error.
 */
export async function listarRazonesSociales(): Promise<Array<RazonSocial>> {
  try {
    const response = await fetch('/api/razones-sociales', {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${response.statusText || 'Error al obtener las razones sociales'}. Detalles: ${errorText}`);
    }

    const json = await response.json();
    return json.data || [];
  } catch (error: unknown) {
    console.error('Error en listarRazonesSociales:', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Obtiene una razón social específica por su ID desde la API.
 * @param {string | number} id - El ID de la razón social a obtener.
 * @returns {Promise<RazonSocial | null>} El objeto de la razón social o null si no se encuentra o hay un error.
 */
export async function obtenerRazonSocialPorId(id: string | number): Promise<RazonSocial | null> {
  try {
    const response = await fetch(`/api/razones-sociales/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${response.statusText || 'Error al obtener la razón social'}. Detalles: ${errorText}`);
    }

    const json = await response.json();
    return json.data || null;
  } catch (error: unknown) {
    console.error(`Error en obtenerRazonSocialPorId (${id}):`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Obtiene la lista de usuarios asociados a una razón social específica.
 * @param {string | number} razonSocialId - El ID de la razón social.
 * @returns {Promise<Array<Usuario>>} Un arreglo de usuarios o un arreglo vacío en caso de error.
 */
export async function fetchUsuariosPorRazonSocial(razonSocialId: string | number): Promise<Array<Usuario>> {
  try {
    const response = await fetch(`/api/razones-sociales/${razonSocialId}/usuarios`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${response.statusText}. Detalles: ${errorText}`);
    }

    const json = await response.json();
    console.log('🧪 Respuesta JSON:', json);
    return json.data || [];
  } catch (error: unknown) {
    console.error(`Error en fetchUsuariosPorRazonSocial (${razonSocialId}):`, error instanceof Error ? error.message : error);
    return [];
  }
}
