<!--
📌 DashboardView.vue
- Vista principal del dashboard.
- Se encarga de mostrar:
    • Mensaje de bienvenida.
    • KPIs (turnos en proceso, turnos finalizados, siguiente turno).
    • Acciones rápidas (botones principales).
    • Avisos flotantes (snackbar).
- No contiene lógica compleja: solo orquesta composables y componentes.
-->

<template>
  <v-container>
    <v-card class="welcome-card" elevation="10">
      <!-- Encabezado de bienvenida -->
      <v-card-title class="text-h4 text-center font-bold mb-4" style="color: black;">
        ¡Bienvenido a ACTIVAUTOS CDA DEL CENTRO IBAGUÉ!
      </v-card-title>

      <v-card-text class="text-center text-subtitle-1 mb-6">
        Estamos felices de tenerte de vuelta. Aquí tienes un resumen de la operación de hoy.
      </v-card-text>

      <v-divider class="my-6" />

      <!-- Sección de KPIs -->
      <h3 class="text-h4 text-center mb-6 text-primary font-weight-bold">
        📊 Resumen del Día ({{ todayDate }})
      </h3>

      <v-row justify="center" class="mb-8">
        <!-- KPI: Turnos en proceso -->
        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-car-multiple"
            :valor="turnosEnProceso"
            titulo="Turnos en Proceso"
            :loading="isLoadingKpis"
            color-card="light-blue-lighten-5"
            color-icon="blue-darken-2"
          />
        </v-col>

        <!-- KPI: Turnos finalizados -->
        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-check-circle-outline"
            :valor="turnosFinalizados"
            titulo="Turnos Finalizados"
            :loading="isLoadingKpis"
            color-card="green-lighten-5"
            color-icon="green-darken-2"
          />
        </v-col>

        <!-- KPI: Siguiente turno -->
        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-numeric"
            :valor="siguienteTurno"
            titulo="Siguiente Turno"
            :loading="isLoadingKpis"
            color-card="orange-lighten-5"
            color-icon="orange-darken-2"
          />
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <!-- Sección de acciones rápidas -->
      <h3 class="text-h4 text-center mb-6 text-primary font-weight-bold">🚀 Acciones Rápidas</h3>
      <DashboardAcciones
        @crear-turno="goCrearTurno"
        @ver-turnos-proceso="goTurnosDia"
        @ver-historico="goHistorico"
      />
    </v-card>

    <!-- Snackbar global para mostrar avisos -->
    <AvisoFlotante v-model="snackbar" />
  </v-container>
</template>

<script setup lang="ts">
/**
 * 📌 Script del Dashboard
 * - Importa composables:
 *    useDashboardDatos → KPIs y fecha.
 *    useAvisos         → Snackbar (avisos).
 * - Importa componentes:
 *    DashboardIndicador, DashboardAcciones, AvisoFlotante.
 * - Define funciones de navegación.
 * - Llama a cargarDashboard() al montar y maneja errores mostrando avisos.
 */
import { useRouter } from 'vue-router'
import { useDashboardDatos } from '@/composables/dashboard/useDashboardDatos'
import { useAvisos } from '@/composables/dashboard/useAvisos'

import DashboardIndicador from '@/components/dashboard/DashboardIndicador.vue'
import DashboardAcciones from '@/components/dashboard/DashboardAcciones.vue'
import AvisoFlotante from '@/components/dashboard/AvisoFlotante.vue'

const router = useRouter()
const { snackbar, mostrarAviso } = useAvisos()
const {
  turnosEnProceso,
  turnosFinalizados,
  siguienteTurno,
  isLoadingKpis,
  todayDate,
  cargarDashboard,
} = useDashboardDatos()

// Funciones de navegación (la vista decide a dónde ir)
function goCrearTurno()    { router.push('/rtm/crear-turno') }
function goTurnosDia()     { router.push('/rtm/turnos-dia') }
function goHistorico()     { router.push('/rtm/estado-turnos') }

// Cargar datos al entrar
cargarDashboard().catch((e) => {
  const msg = e?.message || 'No fue posible cargar el dashboard.'
  mostrarAviso(msg, 'error')
})
</script>

<style scoped>
/* Estilos para la tarjeta principal del dashboard */
.welcome-card {
  max-width: 1200px;
  width: 100%;
  padding: 60px;
  border-radius: 16px;
  text-align: center;
  background: linear-gradient(145deg, #e0e2e5, #f0f2f5);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  margin: 0 auto;
}

/* Clase auxiliar para negritas */
.font-bold { font-weight: 700; }
</style>
