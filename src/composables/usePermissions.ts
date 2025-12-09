// src/composables/usePermissions.ts
import { useAuthStore } from '@/stores/AuthStore'

/**
 * Composable de permisos basado en roles
 */
export function usePermissions() {
  const auth = useAuthStore()

  return {
    can: {
      // ==================== DASHBOARD ====================
      // Solo 3 roles: SUPER_ADMIN, GERENCIA, OPERATIVO_TURNOS
      verDashboard: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      // ==================== TURNOS ====================
      verTurnos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      crearTurno: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'OPERATIVO_TURNOS',
        'GERENCIA'
      ]),

      editarTurno: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      cerrarTurno: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      // ==================== FACTURACIÓN ====================
      verHistoricoFacturacion: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD',
        'OPERATIVO_TURNOS'
      ]),

      crearFacturacion: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      confirmarFacturacion: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      // ==================== CERTIFICACIONES ====================
      crearCertificacion: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      verCertificaciones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      // ==================== REP GENERAL ====================
      importarRepGeneral: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      // ==================== COMERCIAL ====================
      // Solo gerencia, admin y contabilidad ven TODO el módulo comercial
      verComercial: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      // Mi Ficha Comercial - Solo comerciales ven SU propia ficha
      verMiFichaComercial: () => auth.hasRole('COMERCIAL'),

      gestionarProspectos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'COMERCIAL'
      ]),

      gestionarDateos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'COMERCIAL'
      ]),

      // ==================== COMISIONES ====================
      verComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD',
        'COMERCIAL'
      ]),

      gestionarComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      aprobarComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      pagarComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      // ==================== CONVENIOS ====================
      verConvenios: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      crearConvenio: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA'
      ]),

      editarConvenio: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA'
      ]),

      // ==================== GESTIÓN DOCUMENTAL ====================
      verGestionDocumental: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      verContratos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      crearContrato: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      editarContrato: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      eliminarContrato: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      // ==================== USUARIOS ====================
      verUsuarios: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      crearUsuario: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      editarUsuario: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      eliminarUsuario: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA'
      ]),
    }
  }
}
