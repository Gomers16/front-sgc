// src/composables/usePermissions.ts
import { useAuthStore } from '@/stores/AuthStore'
/**
 * Composable de permisos basado en roles
 *
 * Uso:
 * const { can } = usePermissions()
 * v-if="can.verTurnos()"
 */
export function usePermissions() {
  const auth = useAuthStore()

  return {
    can: {
      // Dashboard - Todos MENOS comerciales
      verDashboard: () => !auth.hasRole('COMERCIAL'),

      // Turnos
      verTurnos: () => auth.hasAnyRole(['SUPER_ADMIN', 'GERENCIA', 'OPERATIVO_TURNOS']),
      crearTurno: () => auth.hasAnyRole(['SUPER_ADMIN', 'OPERATIVO_TURNOS', 'GERENCIA']),

      // Facturación
      verHistoricoFacturacion: () =>
        auth.hasAnyRole(['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD', 'OPERATIVO_TURNOS']),

      // Comercial - Solo gerencia, admin y contabilidad ven TODO
      verComercial: () => auth.hasAnyRole(['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD']),

      // Mi Ficha Comercial - Solo comerciales ven SU propia ficha
      verMiFichaComercial: () => auth.hasRole('COMERCIAL'),

      // Gestión Documental
      verGestionDocumental: () =>
        auth.hasAnyRole(['SUPER_ADMIN', 'GERENCIA', 'TALENTO_HUMANO']),
    }
  }
}
