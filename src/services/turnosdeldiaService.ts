// src/services/turnosdeldiaService.ts

import { DateTime } from 'luxon';

// Definimos los tipos de vehículo válidos una sola vez para reutilizar.
type TipoVehiculoFrontend = 'Liviano Particular' | 'Liviano Taxi' | 'Liviano Público' | 'Motocicleta';

interface SiguienteTurnoResponse {
  siguiente: number;
  sedeId: number; // Agregado para reflejar la respuesta del backend
}

interface Turno {
  id: number;
  turnoNumero: number;
  placa: string;
  tipoVehiculo: TipoVehiculoFrontend; // ¡ACTUALIZADO AQUÍ!
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado';
  horaIngreso: string | null;
  horaSalida: string | null;
  fecha: string;
  convenio: string | null;
  referidoInterno: string | null;
  referidoExterno: string | null;
  medioEntero: 'Redes Sociales' | 'Convenio o Referido Externo' | 'Call Center' | 'Fachada' | 'Referido Interno' | 'Asesor Comercial';
  observaciones: string | null;
  funcionarioId: number; // Esto se mapea a usuario_id en la DB, pero lo llamamos así en el modelo
  tieneCita: boolean; // Asegúrate de incluir todos los campos relevantes
  asesorComercial: string | null;
  tiempoServicio: string | null;
  // Si precargas 'usuario' y 'sede', querrás esto también en la interfaz si lo usas directamente
  usuario?: {
    id: number;
    nombres: string;
    apellidos: string;
    // ... otros campos del usuario
  };
  sede?: {
    id: number;
    nombre: string;
    // ... otros campos de la sede
  };
}

class TurnosDelDiaService {
  private static API_BASE_URL = 'http://localhost:3333/api/turnos-rtm'; // ¡Ajusta esta URL si tu backend no está en localhost!

  /**
   * Obtiene el siguiente número de turno disponible para una sede específica del usuario.
   * Ahora requiere `usuarioId` en la query string.
   */
  public static async fetchNextTurnNumber(usuarioId: number): Promise<SiguienteTurnoResponse> {
    try {
      const queryParams = new URLSearchParams({ usuarioId: usuarioId.toString() }).toString();
      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/siguiente-turno?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
   * ¡TOKEN ELIMINADO DE AQUÍ PORQUE TU BACKEND NO LO VALIDA PARA ESTA RUTA!
   */
  public static async fetchTurnos(filters: Record<string, string | number | boolean> = {}): Promise<Turno[]> {
    try {
      // Si el filtro tipoVehiculo está presente, asegúrate de que sea del tipo correcto
      if (filters.tipoVehiculo && !['Liviano Particular', 'Liviano Taxi', 'Liviano Público', 'Motocicleta'].includes(filters.tipoVehiculo as TipoVehiculoFrontend)) {
        console.warn(`Valor de tipoVehiculo inválido para el filtro: ${filters.tipoVehiculo}. Se ignorará o causará un error en el backend.`);
        // Puedes optar por lanzar un error o eliminar el filtro inválido
        delete filters.tipoVehiculo;
      }

      const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
      const url = queryParams
        ? `${TurnosDelDiaService.API_BASE_URL}?${queryParams}`
        : TurnosDelDiaService.API_BASE_URL;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

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
   * ¡TOKEN ELIMINADO!
   */
  public static async fetchTurnoById(id: number): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

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
   * Ahora requiere `usuarioId` en `turnoData`.
   * ¡TOKEN ELIMINADO!
   */
  public static async createTurno(turnoData: {
    placa: string;
    tipoVehiculo: TipoVehiculoFrontend; // Asegúrate que el frontend envíe estos valores
    tieneCita?: boolean;
    convenio?: string | null;
    referidoInterno?: string | null;
    referidoExterno?: string | null;
    medioEntero: string; // El frontend envía el string clave (ej. 'redes_sociales')
    observaciones?: string | null;
    asesorComercial?: string | null;
    fecha: string;
    horaIngreso: string;
    usuarioId: number; // ¡Campo requerido para el backend!
  }): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

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
   * Ahora requiere `usuarioId` en `turnoData`.
   * ¡TOKEN ELIMINADO!
   */
  public static async updateTurno(id: number, turnoData: {
    placa?: string;
    tipoVehiculo?: TipoVehiculoFrontend; // Asegúrate que el frontend envíe estos valores
    tieneCita?: boolean;
    convenio?: string | null;
    referidoInterno?: string | null;
    referidoExterno?: string | null;
    medioEntero?: string; // El frontend envía el string clave (ej. 'redes_sociales')
    observaciones?: string | null;
    usuarioId: number; // ¡Campo requerido para el backend!
    horaSalida?: string | null;
    tiempoServicio?: string | null;
    estado?: 'activo' | 'inactivo' | 'cancelado' | 'finalizado';
    asesorComercial?: string | null;
  }): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

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
   * Ahora requiere `usuarioId` en el payload para la validación de sede.
   * ¡TOKEN ELIMINADO!
   */
  public static async registrarSalida(id: number, usuarioId: number): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}/salida`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ usuarioId }), // Enviar usuarioId en el cuerpo
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
   * Ahora requiere `usuarioId` en el payload para la validación de sede.
   * ¡TOKEN ELIMINADO!
   */
  public static async activarTurno(id: number, usuarioId: number): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}/activar`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ usuarioId }), // Enviar usuarioId en el cuerpo
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
   * Ahora requiere `usuarioId` en el payload para la validación de sede.
   * ¡TOKEN ELIMINADO!
   */
  public static async cancelarTurno(id: number, usuarioId: number): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}/cancelar`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ usuarioId }), // Enviar usuarioId en el cuerpo
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
   * Ahora requiere `usuarioId` en el payload para la validación de sede.
   * ¡TOKEN ELIMINADO!
   */
  public static async inhabilitarTurno(id: number, usuarioId: number): Promise<Turno> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${TurnosDelDiaService.API_BASE_URL}/${id}/inhabilitar`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ usuarioId }), // Enviar usuarioId en el cuerpo
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
   * ¡TOKEN ELIMINADO DE AQUÍ PORQUE TU BACKEND NO LO VALIDA PARA ESTA RUTA!
   * @returns {Promise<{ data: Blob, filename: string }>} Un objeto con el Blob del archivo y el nombre sugerido.
   */
  public static async exportTurnosExcel(filters: { fechaInicio?: string; fechaFin?: string }): Promise<{ data: Blob, filename: string }> {
    try {
      const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
      const url = `${TurnosDelDiaService.API_BASE_URL}/reporte/excel?${queryParams}`;

      const headers: HeadersInit = {};

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
