export default class TurnosDelDiaService {
  private static API_BASE_URL = 'http://localhost:3333/api/turnos-rtm';

  /**
   * Obtiene el siguiente número de turno disponible.
   * Corresponde a GET /api/turnos-rtm/siguiente-turno
   */
  static async fetchSiguienteTurno() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/siguiente-turno`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener el siguiente turno');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en fetchSiguienteTurno:', error);
      throw error;
    }
  }

  /**
   * Obtiene una lista de turnos RTM, permitiendo varios filtros.
   * Este método consolida la obtención de turnos del día y turnos históricos.
   * Corresponde a GET /api/turnos-rtm?fecha=YYYY-MM-DD&placa=...&tipoVehiculo=...&estado=...
   * @param filters - Un objeto con filtros opcionales (ej. { fecha: '2024-07-17', placa: 'ABC', tipoVehiculo: 'moto', estado: 'activo' }).
   * @param token - Opcional: Token de autenticación si la ruta lo requiere.
   */
  static async fetchTurnos(filters: Record<string, string | number | boolean> = {}, token?: string) {
    try {
      const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
      const url = queryParams
        ? `${this.API_BASE_URL}?${queryParams}`
        : this.API_BASE_URL;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
   * @param token - Opcional: Token de autenticación.
   */
  static async fetchTurnoById(id: number, token?: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.API_BASE_URL}/${id}`, { headers });
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
   * @param token - Opcional: Token de autenticación.
   */
  static async createTurno(turnoData: Record<string, unknown>, token?: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.API_BASE_URL, {
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
   * @param token - Opcional: Token de autenticación.
   */
  static async updateTurno(id: number, turnoData: Record<string, unknown>, token?: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.API_BASE_URL}/${id}`, {
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
   * @param token - Opcional: Token de autenticación.
   */
  static async registrarSalida(id: number, token?: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.API_BASE_URL}/${id}/salida`, {
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
   * @param token - Opcional: Token de autenticación.
   */
  static async activarTurno(id: number, token?: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.API_BASE_URL}/${id}/activar`, {
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
   * @param token - Opcional: Token de autenticación.
   */
  static async cancelarTurno(id: number, token?: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.API_BASE_URL}/${id}/cancelar`, {
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
   * @param token - Opcional: Token de autenticación.
   */
  static async inhabilitarTurno(id: number, token?: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.API_BASE_URL}/${id}/inhabilitar`, {
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
