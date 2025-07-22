
interface SiguienteTurnoResponse {
  siguiente: number;
}

// Interfaz para un turno (simplificada si solo necesitas ciertos campos)
interface Turno {
  id: number;
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado';
  horaIngreso: string | null;
  horaSalida: string | null;
  fecha: string;
  // Añade otros campos si los necesitas para cálculos o visualizaciones futuras
}

class TurnosDelDiaService {
  // Asegúrate de que esta URL base sea la correcta para tu backend AdonisJS
  // Por ejemplo, si lo desplegaste en Render, sería algo como 'https://tu-backend.onrender.com/api/turnos-rtm'
  private static API_BASE_URL = 'http://localhost:3333/api/turnos-rtm';

  /**
   * Obtiene el siguiente número de turno disponible.
   * Corresponde a GET /api/turnos-rtm/siguiente-turno
   * @param token Token de autenticación.
   * @returns Promise<SiguienteTurnoResponse>
   */
  public static async fetchNextTurnNumber(token: string): Promise<SiguienteTurnoResponse> {
    try {
      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/siguiente-turno`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Se envía el token
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
   * Este método consolida la obtención de turnos del día y turnos históricos.
   * Corresponde a GET /api/turnos-rtm?fecha=YYYY-MM-DD&placa=...&tipoVehiculo=...&estado=...
   * @param filters - Un objeto con filtros opcionales (ej. { fecha: '2024-07-17', placa: 'ABC', tipoVehiculo: 'moto', estado: 'activo' }).
   * @param token - Token de autenticación.
   */
  public static async fetchTurnos(filters: Record<string, string | number | boolean> = {}, token: string): Promise<Turno[]> {
    try {
      const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
      const url = queryParams
        ? `${TurnosDelDiaService.API_BASE_URL}?${queryParams}`
        : TurnosDelDiaService.API_BASE_URL;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Se envía el token
      }

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
   * Corresponde a GET /api/turnos-rtm/:id
   * @param id - El ID del turno.
   * @param token - Token de autenticación.
   */
  public static async fetchTurnoById(id: number, token: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Se envía el token
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
   * Corresponde a POST /api/turnos-rtm
   * @param turnoData - Los datos para el nuevo turno.
   * @param token - Token de autenticación.
   */
  public static async createTurno(turnoData: Record<string, unknown>, token: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Se envía el token
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
   * Corresponde a PUT /api/turnos-rtm/:id
   * @param id - El ID del turno a actualizar.
   * @param turnoData - Los datos a actualizar.
   * @param token - Token de autenticación.
   */
  public static async updateTurno(id: number, turnoData: Record<string, unknown>, token: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Se envía el token
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
   * Corresponde a PUT /api/turnos-rtm/:id/salida
   * @param id - El ID del turno.
   * @param token - Token de autenticación.
   */
  public static async registrarSalida(id: number, token: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Se envía el token
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
   * Corresponde a PATCH /api/turnos-rtm/:id/activar
   * @param id - El ID del turno a activar.
   * @param token - Token de autenticación.
   */
  public static async activarTurno(id: number, token: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Se envía el token
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
   * Corresponde a PATCH /api/turnos-rtm/:id/cancelar
   * @param id - El ID del turno a cancelar.
   * @param token - Token de autenticación.
   */
  public static async cancelarTurno(id: number, token: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Se envía el token
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
   * Corresponde a PATCH /api/turnos-rtm/:id/inhabilitar
   * @param id - El ID del turno a inhabilitar.
   * @param token - Token de autenticación.
   */
  public static async inhabilitarTurno(id: number, token: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Se envía el token
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
}

export default TurnosDelDiaService;
