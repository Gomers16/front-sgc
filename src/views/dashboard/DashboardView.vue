<template>
  <v-container>
    <v-card class="welcome-card" elevation="10">
      <v-card-title
        class="text-h4 text-center font-bold mb-4"
        style="color: black;"
      >
        ¡Bienvenido a ACTIVAUTOS CDA DEL CENTRO IBAGUÉ!
      </v-card-title>
      <v-card-text class="text-center text-subtitle-1 mb-6">
        Estamos felices de tenerte de vuelta. Aquí tienes un resumen de la operación de hoy.
      </v-card-text>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-h4 text-center mb-6 text-primary font-weight-bold">📊 Resumen del Día ({{ todayDate }})</h3>
      <v-row justify="center" class="mb-8">
        <v-col cols="12" sm="6" md="4">
          <v-card class="kpi-card pa-4 text-center elevation-4" color="light-blue-lighten-5">
            <v-icon size="48" color="blue-darken-2">mdi-car-multiple</v-icon>
            <v-card-title class="text-h4 font-weight-bold text-blue-darken-2">{{ isLoadingKpis ? '...' : turnosEnProceso }}</v-card-title>
            <v-card-subtitle class="text-body-1 text-blue-darken-2">Turnos en Proceso</v-card-subtitle>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="kpi-card pa-4 text-center elevation-4" color="green-lighten-5">
            <v-icon size="48" color="green-darken-2">mdi-check-circle-outline</v-icon>
            <v-card-title class="text-h4 font-weight-bold text-green-darken-2">{{ isLoadingKpis ? '...' : turnosFinalizados }}</v-card-title>
            <v-card-subtitle class="text-body-1 text-green-darken-2">Turnos Finalizados</v-card-subtitle>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="kpi-card pa-4 text-center elevation-4" color="orange-lighten-5">
            <v-icon size="48" color="orange-darken-2">mdi-numeric</v-icon>
            <v-card-title class="text-h4 font-weight-bold text-orange-darken-2">{{ isLoadingKpis ? '...' : siguienteTurno }}</v-card-title>
            <v-card-subtitle class="text-body-1 text-orange-darken-2">Siguiente Turno</v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-h4 text-center mb-6 text-primary font-weight-bold">🚀 Acciones Rápidas</h3>
      <v-row justify="center">
        <v-col cols="12" sm="6" md="4">
          <v-btn
            color="success"
            variant="elevated"
            size="large"
            block
            prepend-icon="mdi-plus-circle"
            @click="router.push('/rtm/crear-turno')"
            class="action-btn"
          >
            Crear Nuevo Turno
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-btn
            color="info"
            variant="elevated"
            size="large"
            block
            prepend-icon="mdi-progress-check"
            @click="router.push('/rtm/turnos-dia')"
            class="action-btn"
          >
            Ver Turnos en Proceso
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-btn
            color="primary"
            variant="elevated"
            size="large"
            block
            prepend-icon="mdi-history"
            @click="router.push('/rtm/estado-turnos')"
            class="action-btn"
          >
            Ver Histórico de Turnos
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import { authSetStore } from '@/stores/AuthStore'
import TurnosDelDiaService from '@/services/turnosdeldiaService' // Asegúrate de que esta ruta sea correcta

// Interfaz para un turno (simplificada para el dashboard si solo necesitas ciertos campos)
interface Turno {
  id: number;
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado';
  horaIngreso: string | null;
  horaSalida: string | null;
  fecha: string; // Necesario para filtrar por fecha
  // Añade otros campos si los necesitas para cálculos o visualizaciones futuras
}

const router = useRouter()
const authStore = authSetStore()

const turnosEnProceso = ref(0)
const turnosFinalizados = ref(0)
const siguienteTurno = ref(0)
const isLoadingKpis = ref(true)
const todayDate = ref('')

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout }
}

const fetchDashboardData = async () => {
  isLoadingKpis.value = true
  try {
    // ✅ Obtener el ID numérico del usuario del AuthStore
    const userId = authStore.currentUserId;

    // ✅ Verificar si el userId es nulo antes de continuar
    if (userId === null) {
      showSnackbar('Error: No se pudo obtener el ID de usuario. Por favor, inicie sesión.', 'error');
      authStore.logout();
      router.push('/login');
      return; // Detener la ejecución si no hay userId
    }

    // 1. Obtener la fecha de hoy para filtrar
    const today = DateTime.local().setZone('America/Bogota');
    const todayISO = today.toISODate() || '';

    // 2. Obtener todos los turnos del día para calcular KPIs
    // Esta llamada no necesita el usuarioId, ya que es para todos los turnos del día
    const allTurnosToday = await TurnosDelDiaService.fetchTurnos({ fecha: todayISO }) as Turno[];

    turnosEnProceso.value = allTurnosToday.filter(
      t => t.estado === 'activo' && !t.horaSalida // Activo y sin hora de salida
    ).length;

    turnosFinalizados.value = allTurnosToday.filter(
      t => t.estado === 'finalizado' || (t.estado === 'activo' && t.horaSalida) // Finalizado o activo con hora de salida
    ).length;

    // 3. Obtener el siguiente número de turno
    // ✅ Pasa el ID numérico del usuario (userId), no el token
    const siguienteTurnoData = await TurnosDelDiaService.fetchNextTurnNumber(userId);
    siguienteTurno.value = siguienteTurnoData.siguiente;

    showSnackbar('Datos del dashboard actualizados.', 'success');

  } catch (error: unknown) {
    console.error('Error al cargar datos del dashboard:', error)
    let message = 'Error al cargar los datos del dashboard. Intente recargar la página.'
    if (error instanceof Error) {
      message = error.message
      // Añadimos más condiciones para redirigir si el error es de autenticación/token
      if (message.includes('Sesión expirada') || message.includes('no autorizada') || message.includes('no es un número válido')) {
        authStore.logout();
        router.push('/login');
      }
    }
    showSnackbar(message, 'error')
    // Resetear KPIs en caso de error
    turnosEnProceso.value = 0;
    turnosFinalizados.value = 0;
    siguienteTurno.value = 0;
  } finally {
    isLoadingKpis.value = false;
  }
}

onMounted(() => {
  authStore.checkAuth(); // Asegura que el usuario esté autenticado y sus datos cargados
  todayDate.value = DateTime.local().setZone('America/Bogota').toFormat('dd/MM/yyyy');
  fetchDashboardData();
})
</script>

<style scoped>
.fullscreen-center {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9fbff;
  padding: 0;
  margin: 0;
}

.welcome-card {
  max-width: 1200px; /* Aumentado el ancho máximo para la tarjeta */
  width: 100%;
  padding: 60px; /* Aumentado el padding */
  border-radius: 16px;
  text-align: center;
  background: linear-gradient(145deg, #e0e2e5, #f0f2f5); /* Fondo suave */
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  margin: 0 auto; /* Centrado horizontal explícito */
}

.font-bold {
  font-weight: 700;
}

.kpi-card {
  border-radius: 12px;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.2);
}

.action-btn {
  font-weight: bold;
  letter-spacing: 0.05em;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.2);
}
</style>
