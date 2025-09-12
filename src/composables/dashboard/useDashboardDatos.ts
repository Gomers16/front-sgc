/**
 * 📌 useDashboardDatos
 * - Composable que maneja los datos principales (KPIs) del dashboard.
 * - Controla:
 *    • turnosEnProceso    → número de turnos que están en curso.
 *    • turnosFinalizados  → número de turnos ya terminados.
 *    • siguienteTurno     → identificador/número del próximo turno.
 *    • isLoadingKpis      → estado de carga (true mientras se consulta).
 *    • todayDate          → fecha actual en formato dd/MM/yyyy (zona Bogotá).
 * - Expone la función cargarDashboard() que:
 *    • Consulta el backend (fetchDashboard).
 *    • Actualiza los valores de los KPIs.
 *    • Maneja errores y sesión expirada (redirige a /login si es necesario).
 */

import { ref, onMounted } from 'vue'
import { DateTime } from 'luxon'
import { useRouter } from 'vue-router'
import { authSetStore } from '@/stores/AuthStore'
import { fetchDashboard } from '@/services/dashboardService'

export function useDashboardDatos() {
  const router = useRouter()
  const authStore = authSetStore()

  // 📊 Estado de los KPIs
  const turnosEnProceso = ref(0)
  const turnosFinalizados = ref(0)
  const siguienteTurno = ref(0)

  // ⏳ Estado de carga de los KPIs
  const isLoadingKpis = ref(true)

  // 📅 Fecha actual en formato colombiano
  const todayDate = ref('')

  /**
   * 📌 cargarDashboard
   * - Consulta al backend los datos del dashboard.
   * - Maneja errores y sesión expirada.
   */
  async function cargarDashboard() {
    isLoadingKpis.value = true
    try {
      const userId = authStore.currentUserId
      if (userId === null) {
        throw new Error('Error: No se pudo obtener el ID de usuario. Por favor, inicie sesión.')
      }

      const data = await fetchDashboard(userId)
      turnosEnProceso.value   = data.turnosEnProceso
      turnosFinalizados.value = data.turnosFinalizados
      siguienteTurno.value    = data.siguienteTurno
    } catch (error: unknown) {
      // Mensaje por defecto
      let msg = 'Error al cargar los datos del dashboard. Intente recargar la página.'

      // Si el error tiene un mensaje válido, lo usamos
      if (error instanceof Error && typeof error.message === 'string') {
        msg = error.message
      }

      // Manejo de sesión expirada o no autorizada
      if (msg.includes('Sesión expirada') || msg.includes('no autorizada')) {
        authStore.logout()
        router.push('/login')
      }

      throw new Error(msg)
    } finally {
      isLoadingKpis.value = false
    }
  }

  // ✅ Al montar, verificamos auth y calculamos la fecha de hoy
  onMounted(() => {
    authStore.checkAuth()
    todayDate.value = DateTime.local().setZone('America/Bogota').toFormat('dd/MM/yyyy')
  })

  return {
    // estado expuesto
    turnosEnProceso,
    turnosFinalizados,
    siguienteTurno,
    isLoadingKpis,
    todayDate,
    // acción expuesta
    cargarDashboard,
  }
}
