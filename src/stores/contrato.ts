// src/stores/contrato.ts

import { defineStore } from 'pinia';
// Importa las interfaces y funciones del servicio de contratos.
import { obtenerContratosPorUsuario } from '@/services/contratoService';
import type { Contrato } from '@/services/contratoService'; // Importación de tipo

export const useContratoStore = defineStore('contrato', { // ✅ Asegúrate de que este sea el nombre exportado
  state: () => ({
    // Lista de contratos cargados en el frontend
    contratos: [] as Contrato[],
    loading: false, // Indica si se están cargando datos
    error: null as string | null, // Almacena mensajes de error
  }),
  actions: {
    /**
     * Carga los contratos de un usuario específico desde el backend
     * y los almacena en el estado del store.
     * @param usuarioId El ID del usuario.
     */
    async fetchContratosPorUsuario(usuarioId: number) {
      this.loading = true;
      this.error = null;
      try {
        const fetchedContratos = await obtenerContratosPorUsuario(usuarioId);
        // Reemplaza los contratos existentes con los recién obtenidos para este usuario
        this.contratos = fetchedContratos;
      } catch (err: unknown) {
        this.error = (err instanceof Error) ? err.message : 'Error al cargar contratos (desconocido).';
        console.error('Error fetching contracts:', err);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Añade un nuevo contrato al estado del store.
     * Esto se llama después de que un contrato se ha anexado exitosamente en el backend.
     * @param nuevoContrato El objeto del contrato retornado por el backend.
     */
    addContrato(nuevoContrato: Contrato) {
      // Evita añadir duplicados si el contrato ya existe por su ID
      if (!this.contratos.some(c => c.id === nuevoContrato.id)) {
        this.contratos.push(nuevoContrato);
      }
    },

    /**
     * Actualiza un contrato existente en el store.
     * @param updatedContrato El objeto del contrato actualizado.
     */
    updateContrato(updatedContrato: Contrato) {
      const index = this.contratos.findIndex(c => c.id === updatedContrato.id);
      if (index !== -1) {
        this.contratos[index] = updatedContrato;
      }
    },

    /**
     * Elimina un contrato del store.
     * @param contratoId El ID del contrato a eliminar.
     */
    removeContrato(contratoId: number) {
      this.contratos = this.contratos.filter(c => c.id !== contratoId);
    },

    /**
     * Reinicia el estado del store a sus valores iniciales.
     * Útil al cambiar de usuario o al cerrar sesión.
     */
    resetState() {
      this.contratos = [];
      this.loading = false;
      this.error = null;
    }
  },
  getters: {
    /**
     * Obtiene todos los contratos actualmente cargados en el store.
     */
    getAllContratos: (state) => state.contratos,

    /**
     * Obtiene los contratos de un usuario específico de la lista cargada.
     * @param usuarioId El ID del usuario.
     */
    getContratosByUsuarioId: (state) => (usuarioId: number) => {
      return state.contratos.filter(contrato => contrato.usuarioId === usuarioId);
    },

    /**
     * Obtiene un contrato por su ID de la lista cargada.
     * @param id El ID del contrato.
     */
    getContratoById: (state) => (id: number) => {
      return state.contratos.find(contrato => contrato.id === id);
    }
  }
});
