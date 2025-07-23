// src/services/turnosdeldiaService.ts

import { DateTime } from 'luxon';

interface SiguienteTurnoResponse {
  siguiente: number;
}

interface Turno {
  id: number;
  turnoNumero: number;
  placa: string;
  tipoVehiculo: 'carro' | 'moto' | 'taxi' | 'enseñanza';
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado';
  horaIngreso: string | null;
  horaSalida: string | null;
  fecha: string;
  convenio: string | null;
  referidoInterno: string | null;
  referidoExterno: string | null;
  medioEntero: 'Redes Sociales' | 'Convenio o Referido Externo' | 'Call Center' | 'Fachada' | 'Referido Interno' | 'Asesor Comercial';
  observaciones: string | null;
  funcionarioId: number;
  // ... otros campos si los necesitas ...
}

class TurnosDelDiaService {
  private static API_BASE_URL = 'http://localhost:3333/api/turnos-rtm'; // ¡Ajusta esta URL si tu backend no está en localhost!

  /**
   * Obtiene el siguiente número de turno disponible.
   * Si tu backend NO requiere token para esta ruta, también quita el parámetro `token` aquí.
   * Actualmente, tu backend NO LO REQUIERE para el reporte, pero esta función original lo tiene.
   * Si esta ruta ('siguiente-turno') sí lo requiere, déjalo. Si no, quítalo.
   */
  public static async fetchNextTurnNumber(token: string): Promise<SiguienteTurnoResponse> {
    try {
      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/siguiente-turno`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Mantener si el backend SÍ lo pide para esta ruta
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener el siguiente número de turno.');
      }

      return response.json();
    } catch (error) {
      console.error('Error en fetchNextTurnNumber:', error);
      throw error;
    }
  }

  /**
   * Obtiene una lista de turnos RTM, permitiendo varios filtros.
   * Corresponde a GET /api/turnos-rtm?fecha=YYYY-MM-DD&placa=...&tipoVehiculo=...&estado=...
   * @param filters - Un objeto con filtros opcionales.
   * ¡TOKEN ELIMINADO DE AQUÍ PORQUE TU BACKEND NO LO VALIDA PARA ESTA RUTA!
   */
  // AHORA LA FIRMA DE LA FUNCIÓN YA NO TIENE EL PARÁMETRO '_token'
  public static async fetchTurnos(filters: Record<string, string | number | boolean> = {}): Promise<Turno[]> {
    try {
      const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
      const url = queryParams
        ? `${TurnosDelDiaService.API_BASE_URL}?${queryParams}`
        : TurnosDelDiaService.API_BASE_URL;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      // No agregamos el header 'Authorization' porque el backend no lo valida

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener los turnos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en fetchTurnos:', error);
      throw error;
    }
  }

  /**
   * Obtiene un turno específico por ID para edición o detalles.
   * Si tu backend NO requiere token para esta ruta, también quita el parámetro `token` aquí.
   */
  public static async fetchTurnoById(id: number, token: string): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Mantener si el backend SÍ lo pide para esta ruta
      }

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}`, { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener el turno');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en fetchTurnoById:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo turno RTM.
   * Si tu backend NO requiere token para esta ruta, también quita el parámetro `token` aquí.
   */
  public static async createTurno(turnoData: Record<string, unknown>, token: string): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Mantener si el backend SÍ lo pide para esta ruta
      }

      const response = await fetch(TurnosDelDiaService.API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(turnoData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el turno');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en createTurno:', error);
      throw error;
    }
  }

  /**
   * Actualiza un turno existente.
   * Si tu backend NO requiere token para esta ruta, también quita el parámetro `token` aquí.
   */
  public static async updateTurno(id: number, turnoData: Record<string, unknown>, token: string): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Mantener si el backend SÍ lo pide para esta ruta
      }

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(turnoData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el turno');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en updateTurno:', error);
      throw error;
    }
  }

  /**
   * Registra la hora de salida para un turno.
   * Si tu backend NO requiere token para esta ruta, también quita el parámetro `token` aquí.
   */
  public static async registrarSalida(id: number, token: string): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Mantener si el backend SÍ lo pide para esta ruta
      }

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}/salida`, {
        method: 'PUT',
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar salida');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en registrarSalida:', error);
      throw error;
    }
  }

  /**
   * Activa un turno cambiando su estado a 'activo'.
   * Si tu backend NO requiere token para esta ruta, también quita el parámetro `token` aquí.
   */
  public static async activarTurno(id: number, token: string): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Mantener si el backend SÍ lo pide para esta ruta
      }

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}/activar`, {
        method: 'PATCH',
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al activar el turno');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en activarTurno:', error);
      throw error;
    }
  }

  /**
   * Cancela un turno cambiando su estado a 'cancelado'.
   * Si tu backend NO requiere token para esta ruta, también quita el parámetro `token` aquí.
   */
  public static async cancelarTurno(id: number, token: string): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Mantener si el backend SÍ lo pide para esta ruta
      }

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}/cancelar`, {
        method: 'PATCH',
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cancelar el turno');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en cancelarTurno:', error);
      throw error;
    }
  }

  /**
   * "Inhabilita" (soft delete) un turno cambiando su estado a 'inactivo'.
   * Si tu backend NO requiere token para esta ruta, también quita el parámetro `token` aquí.
   */
  public static async inhabilitarTurno(id: number, token: string): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Mantener si el backend SÍ lo pide para esta ruta
      }

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}/inhabilitar`, {
        method: 'PATCH',
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al inhabilitar el turno');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en inhabilitarTurno:', error);
      throw error;
    }
  }

  /**
   * Exporta turnos a un archivo Excel desde el backend.
   * Corresponde a GET /api/turnos-rtm/reporte/excel?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
   * @param filters - Un objeto con los filtros de fecha (fechaInicio, fechaFin).
   * ¡TOKEN ELIMINADO DE AQUÍ PORQUE TU BACKEND NO LO VALIDA PARA ESTA RUTA!
   * @returns {Promise<{ data: Blob, filename: string }>} Un objeto con el Blob del archivo y el nombre sugerido.
   */
  public static async exportTurnosExcel(filters: { fechaInicio?: string; fechaFin?: string }): Promise<{ data: Blob, filename: string }> {
    try {
      const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
      const url = `${TurnosDelDiaService.API_BASE_URL}/reporte/excel?${queryParams}`;

      const headers: HeadersInit = {};
      // No agregamos el header 'Authorization' porque el backend no lo valida

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Error al descargar el archivo Excel.');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (parseError) {
          throw new Error(errorText || `Error de red o servidor al descargar el archivo (${response.status} ${response.statusText}).`);
        }
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `reporte_captacion_${DateTime.local().toISODate()}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^"'\s;]+)['"]?$/i);
        if (filenameMatch && filenameMatch[1]) {
          try {
            filename = decodeURIComponent(filenameMatch[1]);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            console.warn('No se pudo decodificar el nombre del archivo, usando el valor original:', filenameMatch[1]);
            filename = filenameMatch[1];
          }
        }
      }

      const blobData = await response.blob();
      return { data: blobData, filename };

    } catch (error) {
      console.error('Error en exportTurnosExcel:', error);
      throw error;
    }
  }
}

export default TurnosDelDiaService;
