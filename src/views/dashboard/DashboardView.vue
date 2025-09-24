<!--
📌 DashboardView.vue (actualizada)
- Mantiene KPIs generales
- Mantiene "🛠️ Turnos en Proceso por Servicio (Hoy)" con tarjetas grandes
- Debajo de cada tarjeta grande se agrega un mini indicador "Total (Hoy)"
- Acciones rápidas y snackbar
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

      <!-- KPIs por servicio (en proceso) + mini "Total (Hoy)" debajo -->
      <h3 class="text-h5 text-center mb-6 text-primary font-weight-bold">
        🛠️ Turnos en Proceso por Servicio (Hoy)
      </h3>

      <v-row justify="center" class="mb-4">
        <!-- RTM -->
        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-car-wrench"
            :valor="kpiServicios.rtm"
            titulo="RTM"
            :loading="isLoadingKpis"
            color-card="indigo-lighten-5"
            color-icon="indigo-darken-2"
          />
          <div class="mt-2">
            <DashboardIndicadorMini
              icon="mdi-format-list-numbered"
              titulo="Total (Hoy)"
              :valor="kpiServiciosTotal.rtm"
              :loading="isLoadingKpis"
              color-card="blue-lighten-5"
              color-icon="blue-darken-2"
            />
          </div>
        </v-col>

        <!-- Preventiva -->
        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-shield-check-outline"
            :valor="kpiServicios.preventiva"
            titulo="Preventiva"
            :loading="isLoadingKpis"
            color-card="deep-purple-lighten-5"
            color-icon="deep-purple-darken-2"
          />
          <div class="mt-2">
            <DashboardIndicadorMini
              icon="mdi-format-list-numbered"
              titulo="Total (Hoy)"
              :valor="kpiServiciosTotal.preventiva"
              :loading="isLoadingKpis"
              color-card="purple-lighten-5"
              color-icon="purple-darken-2"
            />
          </div>
        </v-col>

        <!-- Peritaje -->
        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-clipboard-text-search-outline"
            :valor="kpiServicios.peritaje"
            titulo="Peritaje"
            :loading="isLoadingKpis"
            color-card="cyan-lighten-5"
            color-icon="cyan-darken-2"
          />
          <div class="mt-2">
            <DashboardIndicadorMini
              icon="mdi-format-list-numbered"
              titulo="Total (Hoy)"
              :valor="kpiServiciosTotal.peritaje"
              :loading="isLoadingKpis"
              color-card="teal-lighten-5"
              color-icon="teal-darken-2"
            />
          </div>
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
 *    useDashboardDatos → KPIs y fecha (incluye kpiServicios y kpiServiciosTotal).
 *    useAvisos         → Snackbar (avisos).
 * - Importa componentes:
 *    DashboardIndicador, DashboardIndicadorMini, DashboardAcciones, AvisoFlotante.
 * - Define funciones de navegación.
 * - Llama a cargarDashboard() al montar y maneja errores mostrando avisos.
 */
import { useRouter } from 'vue-router'
import { useDashboardDatos } from '@/composables/dashboard/useDashboardDatos'
import { useAvisos } from '@/composables/dashboard/useAvisos'

import DashboardIndicador from '@/components/dashboard/DashboardIndicador.vue'
import DashboardIndicadorMini from '@/components/dashboard/DashboardIndicadorMini.vue' // 👈 nuevo
import DashboardAcciones from '@/components/dashboard/DashboardAcciones.vue'
import AvisoFlotante from '@/components/dashboard/AvisoFlotante.vue'

const router = useRouter()
const { snackbar, mostrarAviso } = useAvisos()
const {
  turnosEnProceso,
  turnosFinalizados,
  siguienteTurno,
  kpiServicios,       // { rtm, preventiva, peritaje }
  kpiServiciosTotal,  // { rtm, preventiva, peritaje }
  isLoadingKpis,
  todayDate,
  cargarDashboard,
} = useDashboardDatos()

// Navegación
function goCrearTurno() { router.push('/rtm/crear-turno') }
function goTurnosDia()  { router.push('/rtm/turnos-dia') }
function goHistorico()  { router.push('/rtm/estado-turnos') }

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

/* Utilidades para compactar los bloques de servicios */
.mb-4 { margin-bottom: 16px !important; }
.mt-2 { margin-top: 8px !important; }
.font-bold { font-weight: 700; }
</style>
