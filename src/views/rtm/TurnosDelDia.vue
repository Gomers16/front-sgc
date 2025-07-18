<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl">
      <v-card-title class="text-h4 mb-6 text-center text-primary font-weight-bold">
        📋 Turnos en Proceso <span class="text-secondary">(HOY - {{ todayDate }})</span>
      </v-card-title>

      <v-row class="mb-4 align-center">
        <v-col cols="12" sm="6" md="4">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-refresh"
            @click="loadTurnosHoy"
            :loading="isLoading"
          >
            Refrescar
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="4" class="text-sm-right text-md-center">
          <v-btn
            color="info"
            variant="outlined"
            prepend-icon="mdi-chart-bar"
            @click="showSnackbar('Funcionalidad de estadísticas en desarrollo', 'info')"
          >
            Ver estadísticas del día
          </v-btn>
        </v-col>
        <v-col cols="12" md="4" class="text-md-right">
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-plus-circle"
            @click="router.push('/rtm/crear-turno')"
          >
            Crear Nuevo Turno
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <v-row v-if="isLoading" class="justify-center my-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="text-center text-subtitle-1 mt-4">Cargando turnos del día...</p>
      </v-row>

      <v-row v-else-if="turnos.length === 0" class="justify-center my-10">
        <v-col cols="12" class="text-center">
          <v-icon size="64" color="grey-lighten-1">mdi-inbox-remove-outline</v-icon>
          <p class="text-h6 text-grey-darken-1 mt-4">No hay turnos en proceso para hoy.</p>
          <p class="text-body-1 text-grey-darken-1">¡Es un buen momento para crear uno nuevo!</p>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col
          v-for="turno in turnos"
          :key="turno.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card class="turno-card pa-4 rounded-lg elevation-4">
            <v-card-title class="text-h6 font-weight-bold text-primary pb-2">
              🔢 Turno: {{ turno.turnoNumero }}
            </v-card-title>
            <v-card-text>
              <p class="text-subtitle-1">🚗 Placa: <span class="font-weight-medium">{{ turno.placa }}</span></p>
              <p class="text-subtitle-1">⏰ Ingreso: <span class="font-weight-medium">{{ turno.horaIngreso }}</span></p>
              <p class="text-subtitle-1 mt-3 font-weight-bold text-darken-1">📌 Etapas:</p>
              <v-list dense class="py-0">
                <v-list-item v-for="(etapa, i) in getEtapas(turno)" :key="i" class="py-0 px-0">
                  <template v-slot:prepend>
                    <v-icon :color="etapa.completed ? 'success' : 'grey-lighten-1'">
                      {{ etapa.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                    </v-icon>
                  </template>
                  <v-list-item-title :class="{ 'text-decoration-line-through text-grey': etapa.completed }">
                    {{ etapa.name }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>

            <v-card-actions class="justify-end pt-0">
              <v-btn
                color="warning"
                variant="text"
                prepend-icon="mdi-pencil"
                @click="openConfirmDialog(turno, 'editar')"
              >
                Editar
              </v-btn>
              <v-btn
                color="secondary"
                variant="text"
                prepend-icon="mdi-play"
                @click="openConfirmDialog(turno, 'continuar')"
              >
                Continuar
              </v-btn>
            </v-card-actions>
          </v-card>
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

    <v-dialog v-model="confirmDialog.show" max-width="500">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="confirmDialog.show = false">Cancelar</v-btn>
          <v-btn :color="confirmDialog.color" variant="elevated" @click="handleConfirmAction">
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// Asegúrate de que esta ruta sea correcta para tu servicio
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import { authSetStore } from '@/stores/AuthStore'

// Interfaz para definir la estructura de un turno
interface Turno {
  id: number;
  fecha: string; // **Importante:** Este campo debe venir del backend en formato 'YYYY-MM-DD'
  horaIngreso: string;
  horaSalida: string | null;
  tiempoServicio: string | null;
  turnoNumero: number;
  turnoCodigo?: string;
  placa: string;
  tipoVehiculo: 'vehiculo' | 'moto';
  tieneCita: boolean;
  convenio: string | null;
  referidoInterno: string | null;
  referidoExterno: string | null;
  medioEntero: 'fachada' | 'redes' | 'telemercadeo' | 'otros';
  observaciones: string | null;
  funcionarioId: number;
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'; // Tipos de estado posibles
  funcionario?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  createdAt: string;
  updatedAt: string;
}

const router = useRouter()
const turnos = ref<Turno[]>([])
const isLoading = ref(true)
const todayDate = ref('') // Usado para mostrar la fecha de hoy en el título

// --- Configuración del Snackbar (Notificaciones) ---
const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout }
}

// --- Configuración del Diálogo de Confirmación ---
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  action: '', // 'editar' o 'continuar'
  turno: null as Turno | null,
  color: 'primary',
})

const openConfirmDialog = (turno: Turno, action: 'editar' | 'continuar') => {
  confirmDialog.value = {
    show: true,
    turno,
    action,
    title: action === 'editar' ? 'Editar Turno' : 'Continuar Turno',
    message: `¿Está seguro que desea ${action === 'editar' ? 'editar' : 'continuar con'} el turno ${turno.turnoNumero}?`,
    color: action === 'editar' ? 'warning' : 'secondary',
  }
}

const handleConfirmAction = () => {
  const { action, turno } = confirmDialog.value
  if (!turno) return

  confirmDialog.value.show = false

  if (action === 'editar') {
    router.push(`/rtm/editar-turno/${turno.id}`)
  } else if (action === 'continuar') {
    router.push(`/rtm/continuar-turno/${turno.id}`)
  }
}

// --- FUNCIÓN PRINCIPAL: Cargar turnos del día ---
const loadTurnosHoy = async () => {
  isLoading.value = true
  try {
    const authStore = authSetStore();
    const token = authStore.token;

    if (!token) {
      showSnackbar('Error: No hay token de autenticación. Por favor, inicie sesión.', 'error')
      router.push('/login')
      return
    }

    // Obtiene la fecha de hoy en formato 'YYYY-MM-DD' (ej. "2025-07-18")
    // Se asegura de que sea la fecha de Ibagué, Colombia (-05:00) para evitar desfases.
    // Aunque new Date() por defecto usa la zona horaria local del cliente.
    // Para mayor robustez con zonas horarias, considera una librería como 'date-fns-tz'
    // o asegurar que tu servidor esté en la misma zona horaria.
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Bogota' // Especifica la zona horaria
    };
    const formatter = new Intl.DateTimeFormat('es-CO', options);
    // Formatea a MM/DD/YYYY y luego reordena a YYYY-MM-DD
    const parts = formatter.formatToParts(today);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const todayISO = `${year}-${month}-${day}`;


    // Envía el filtro de fecha al backend.
    // Si el controlador no lo usa para filtrar, el siguiente paso lo manejará.
    const filters = { fecha: todayISO };
    const data = await TurnosDelDiaService.fetchTurnos(filters, token) as Turno[];

    // --- FILTRADO ESTRICTO EN EL FRONTEND ---
    // Esta es la corrección clave para asegurar que SOLO se muestren turnos de HOY
    // y que estén en estado "en proceso".
    turnos.value = data.filter(turno => {
      // Normaliza la fecha del turno a 'YYYY-MM-DD' para comparación
      const turnoFechaNormalizada = turno.fecha ? new Date(turno.fecha).toISOString().slice(0, 10) : '';

      // Comprueba si la fecha del turno es la de hoy
      const isToday = turnoFechaNormalizada === todayISO;

      // Comprueba si el turno está en un estado "en proceso"
      const isInProcess = turno.estado === 'activo' || (turno.horaIngreso && !turno.horaSalida);

      // El turno se muestra si es de hoy Y está en proceso
      return isToday && isInProcess;
    });

    showSnackbar(`Turnos en proceso para ${todayDate.value} cargados correctamente.`, 'success');

  } catch (error: unknown) {
    console.error('Error al cargar turnos del día:', error)
    let message = 'Error al cargar los turnos del día. Intente recargar la página.'
    if (error instanceof Error) {
      message = error.message
      if (message.includes('Sesión expirada') || message.includes('no autorizada')) {
        const authStore = authSetStore();
        authStore.logout()
        router.push('/login')
      }
    }
    showSnackbar(message, 'error')
    turnos.value = [] // Limpia los turnos en caso de error
  } finally {
    isLoading.value = false
  }
}

// --- Lógica para determinar el estado de las etapas de un turno ---
const getEtapas = (turno: Turno) => {
  const etapas = [
    { name: 'Puerta', completed: !!turno.horaIngreso }, // Completada si hay hora de ingreso
    { name: 'Registro', completed: false }, // Estas requieren lógica de backend si existen
    { name: 'Facturación', completed: false },
    { name: 'Revisión', completed: false },
    { name: 'Certificación', completed: !!turno.horaSalida }, // Completada si hay hora de salida
  ];

  // Si el turno está cancelado o inactivo, resetear el estado de las etapas visualmente
  if (turno.estado === 'cancelado' || turno.estado === 'inactivo') {
    etapas.forEach(etapa => etapa.completed = false);
  }

  return etapas;
}

// --- Hook de ciclo de vida: Se ejecuta cuando el componente se monta ---
onMounted(() => {
  // Formatea la fecha actual para mostrarla de forma legible en el título
  todayDate.value = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  loadTurnosHoy(); // Carga los turnos al iniciar el componente
})
</script>

<style scoped>
/* Estilos específicos del componente */
.v-card-title {
  font-weight: bold;
  letter-spacing: 0.05em;
}
.v-card-title .text-secondary {
  color: #4CAF50; /* Color secundario, por ejemplo, para la fecha */
}
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f2f5, #e0e2e5); /* Estilo de tarjeta con gradiente suave */
}
.turno-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; /* Animación al pasar el ratón */
}
.turno-card:hover {
  transform: translateY(-5px); /* Efecto de elevación */
  box-shadow: 0 15px 30px rgba(0,0,0,0.2); /* Sombra más pronunciada */
}
.v-list-item-title {
  font-size: 0.95rem; /* Tamaño de fuente para los ítems de lista de etapas */
}
</style>
