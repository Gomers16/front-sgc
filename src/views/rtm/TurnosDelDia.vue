<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl bg-background-light">
      <v-card-title class="text-h4 mb-6 font-weight-bold d-flex justify-center title-full-bordered-container">
        <span class="title-text-with-border">
          📋 Turnos en Proceso <span class="text-secondary">(HOY - {{ todayDate }})</span>
        </span>
      </v-card-title>

      <v-row class="mb-4 align-center">
        <v-col cols="12" sm="6" md="4">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-refresh"
            @click="loadTurnosHoy"
            :loading="isLoading"
            class="bordered-button"
            size="large"
          >
            Refrescar
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="4" class="text-sm-right text-md-center">
          <v-btn
            color="info"
            variant="outlined"
            prepend-icon="mdi-chart-bar"
            @click="openStatsModal"
            class="bordered-button-info"
            size="large"
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
            class="bordered-button-success"
            size="large"
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
          <v-card class="turno-card pa-4 rounded-lg elevation-4" color="primary">
            <v-card-title class="text-h6 font-weight-bold pb-2 text-on-primary-text">
              🔢 Turno: {{ turno.turnoNumero }}
            </v-card-title>
            <v-card-text>
              <p class="text-subtitle-1 text-on-primary-text">🚗 Placa: <span class="font-weight-medium">{{ turno.placa }}</span></p>
              <p class="text-subtitle-1 text-on-primary-text">⏰ Ingreso: <span class="font-weight-medium">{{ formatTime(turno.horaIngreso) }}</span></p>
              <p class="text-subtitle-1 mt-3 font-weight-bold text-on-primary-text">📌 Etapas:</p>
              <v-list dense class="py-0 bg-transparent">
                <v-list-item v-for="(etapa, i) in getEtapas(turno)" :key="i" class="py-0 px-0">
                  <template v-slot:prepend>
                    <v-icon :color="etapa.completed ? 'success' : 'on-primary-text-light'">
                      {{ etapa.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                    </v-icon>
                  </template>
                  <v-list-item-title :class="{ 'text-decoration-line-through text-on-primary-text-faded': etapa.completed }" class="text-on-primary-text">
                    {{ etapa.name }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>

            <v-card-actions class="justify-center pt-0">
              <v-btn
                color="button-text-light-warning"
                variant="text"
                prepend-icon="mdi-pencil"
                @click="openConfirmDialog(turno, 'editar')"
              >
                Editar
              </v-btn>
              <v-btn
                color="button-text-light-secondary"
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
          <v-btn :color="confirmDialog.color" variant="elevated" @click="handleConfirmAction" class="bordered-dialog-button">
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showStatsModal" max-width="800" content-class="elevation-24">
      <v-card class="rounded-xl bg-white">
        <v-card-title class="text-h5 text-center text-primary font-weight-bold py-4">
          📊 Estadísticas de Turnos en Proceso (Hoy)
        </v-card-title>
        <v-card-text>
          <p class="text-h6 mb-4 text-center">Total de Turnos en Proceso: <strong>{{ turnos.length }}</strong></p>

          <v-divider class="my-4"></v-divider>

          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 text-secondary">Por Tipo de Vehículo:</v-card-title>
                <div style="height: 250px;"> <BarChart :data="chartDataTipoVehiculo" :options="chartOptions" />
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 text-secondary">Por Medio de Ingreso:</v-card-title>
                <v-list density="compact">
                  <v-list-item v-for="(count, medio) in statsData.medioEntero" :key="medio">
                    <v-list-item-title class="font-weight-medium text-capitalize">{{ medio }}:</v-list-item-title>
                    <template v-slot:append>
                      <v-chip color="blue-grey" label>{{ count }}</v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end py-4">
          <v-btn color="primary" variant="elevated" @click="showStatsModal = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import { authSetStore } from '@/stores/AuthStore'

// Importaciones para Chart.js y vue-chartjs
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  type TooltipItem
} from 'chart.js';
import { Bar as BarChart } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);


// Interfaz para definir la estructura de un turno
interface Turno {
  id: number;
  fecha: string;
  horaIngreso: string | null;
  horaSalida: string | null;
  tiempoServicio: string | null;
  turnoNumero: number;
  turnoCodigo?: string;
  placa: string;
  tipoVehiculo: 'carro' | 'moto' | 'taxi' | 'enseñanza' | null;
  tieneCita: boolean;
  convenio: string | null;
  referidoInterno: string | null;
  referidoExterno: string | null;
  medioEntero:
    | 'Redes Sociales'
    | 'Convenio o Referido Externo'
    | 'Call Center'
    | 'Fachada'
    | 'Referido Interno'
    | 'Asesor Comercial'
    | null;
  observaciones: string | null;
  funcionarioId: number;
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado';
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
const todayDate = ref('')

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
  action: '',
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
    // CAMBIO CLAVE AQUÍ: Redirige a la nueva vista de desarrollo
    router.push(`/rtm/proximamente`)
  }
}

// --- FUNCIÓN PARA FORMATAR LA HORA (HH:mm:ss a hh:mm AM/PM) ---
const formatTime = (timeString: string | null): string => {
  if (!timeString) return '';
  let time: DateTime;

  time = DateTime.fromFormat(timeString, 'HH:mm:ss', { zone: 'America/Bogota' });

  if (!time.isValid) {
    time = DateTime.fromFormat(timeString, 'HH:mm', { zone: 'America/Bogota' });
  }

  if (time.isValid) {
    return time.toFormat('hh:mm a');
  }
  console.warn('formatTime: Failed to parse timeString:', timeString);
  return timeString;
};


// --- FUNCIÓN PRINCIPAL: Cargar turnos del día ---
const loadTurnosHoy = async () => {
  isLoading.value = true
  try {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Bogota'
    };
    const formatter = new Intl.DateTimeFormat('es-CO', options);
    const parts = formatter.formatToParts(today);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const todayISO = `${year}-${month}-${day}`;


    const filters = { fecha: todayISO };
    const data = await TurnosDelDiaService.fetchTurnos(filters) as Turno[];

    turnos.value = data.filter(turno => {
      const turnoFechaNormalizada = turno.fecha ? new Date(turno.fecha).toISOString().slice(0, 10) : '';
      const isToday = turnoFechaNormalizada === todayISO;
      const isInProcess = turno.estado === 'activo' || (turno.horaIngreso && !turno.horaSalida);
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
    turnos.value = []
  } finally {
    isLoading.value = false
  }
}

// --- Lógica para determinar el estado de las etapas de un turno ---
const getEtapas = (turno: Turno) => {
  const etapas = [
    { name: 'Puerta', completed: !!turno.horaIngreso },
    { name: 'Registro', completed: false },
    { name: 'Facturación', completed: false },
    { name: 'Revisión', completed: false },
    { name: 'Certificación', completed: !!turno.horaSalida },
  ];

  if (turno.estado === 'cancelado' || turno.estado === 'inactivo') {
    etapas.forEach(etapa => etapa.completed = false);
  }

  return etapas;
}

// --- Estado y Lógica para el Modal de Estadísticas ---
const showStatsModal = ref(false);
const statsData = ref({
  tipoVehiculo: {
    'carro': 0,
    'moto': 0,
    'taxi': 0,
    'enseñanza': 0,
    'Desconocido': 0,
  } as Record<string, number>,
  medioEntero: {
    'Redes Sociales': 0,
    'Convenio o Referido Externo': 0,
    'Call Center': 0,
    'Fachada': 0,
    'Referido Interno': 0,
    'Asesor Comercial': 0,
    'Desconocido': 0,
  } as Record<string, number>,
});

const calculateStats = () => {
  statsData.value.tipoVehiculo = { 'carro': 0, 'moto': 0, 'taxi': 0, 'enseñanza': 0, 'Desconocido': 0 };
  statsData.value.medioEntero = {
    'Redes Sociales': 0,
    'Convenio o Referido Externo': 0,
    'Call Center': 0,
    'Fachada': 0,
    'Referido Interno': 0,
    'Asesor Comercial': 0,
    'Desconocido': 0,
  };

  turnos.value.forEach(turno => {
    const tipo = turno.tipoVehiculo;
    if (tipo && tipo in statsData.value.tipoVehiculo) {
      statsData.value.tipoVehiculo[tipo]++;
    } else {
      statsData.value.tipoVehiculo['Desconocido']++;
    }

    const medio = turno.medioEntero;
    if (medio && medio in statsData.value.medioEntero) {
      statsData.value.medioEntero[medio]++;
    } else {
      statsData.value.medioEntero['Desconocido']++;
    }
  });
};

const openStatsModal = () => {
  calculateStats();
  showStatsModal.value = true;
};

// --- Propiedades computadas para los datos de los gráficos ---
const chartDataTipoVehiculo = computed(() => {
  const labels = Object.keys(statsData.value.tipoVehiculo);
  const data = Object.values(statsData.value.tipoVehiculo);
  const backgroundColors = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#9E9E9E'];

  return {
    labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
    datasets: [
      {
        label: 'Cantidad de Turnos',
        backgroundColor: backgroundColors,
        data: data,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      callbacks: {
        label: function(context: TooltipItem<'bar'>) {
          const label = context.label || '';
          const value = context.parsed.y;
          return `${label}: ${value}`;
        }
      }
    }
  }
};


// --- Hook de ciclo de vida: Se ejecuta cuando el componente se monta ---
onMounted(() => {
  todayDate.value = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  loadTurnosHoy();
})
</script>

<style scoped>
/* Estilos para el CONTORNO PRINCIPAL (el v-card más externo) */
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.05); /* Sombra más sutil */
  border-radius: 16px;
}

/* 1. Estilos para el TÍTULO PRINCIPAL con borde y centrado */
/* Contenedor del título que ahora centra su contenido */
.title-full-bordered-container {
  /* Vuetify d-flex y justify-center ya manejan el display flex y el centrado */
  padding: 0 !important; /* Asegura que el v-card-title no tenga padding extra */
}

/* Estilo para el span que contiene el texto y el borde */
.title-text-with-border {
  border: 2px solid black; /* Borde negro de 2px */
  padding: 10px 20px; /* Más padding para que el borde se vea bien */
  border-radius: 12px; /* Bordes ligeramente más redondeados */
  background-color: rgba(255, 255, 255, 0.9); /* Fondo semi-transparente para que el borde resalte */
  margin-bottom: 24px; /* Un margen inferior para separarlo del formulario/botones */
  display: inline-block; /* Importante para que el padding y border se apliquen correctamente */
  /* El centrado lo hará el padre con d-flex justify-center */
}

/* Estilo para el texto principal del título (dentro del span con borde) */
.title-text-with-border {
  /* Estas propiedades ya están en el v-card-title, pero las repetimos por especificidad */
  font-weight: bold;
  letter-spacing: 0.05em;
  color: var(--v-theme-primary); /* Usar la variable de color primary de Vuetify */
}

/* Asegurar que el span de la fecha esté en la misma línea y tenga espacio */
.title-text-with-border .text-secondary {
  display: inline; /* Asegura que la fecha esté en la misma línea */
  margin-left: 8px; /* Espacio entre el texto principal y la fecha */
  color: #4CAF50; /* Color verde para la fecha */
}

/* 2. Estilos para los BOTONES con borde */
/* Estilo base para todos los botones con borde */
.bordered-button,
.bordered-button-info,
.bordered-button-success {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 0 0 2px black !important; /* Borde negro de 2px */
}

.bordered-button:hover,
.bordered-button-info:hover,
.bordered-button-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2), 0 0 0 3px black !important; /* Borde al pasar el ratón */
}

/* Estilos específicos para el color de la sombra y borde de cada botón */


/* Estilo para el botón de confirmación en el diálogo (ya existente) */
.bordered-dialog-button {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px black !important;
}

.bordered-dialog-button:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.2), 0 0 0 2px black !important;
}

/* ESTILO CRÍTICO PARA LAS TARJETAS AZULES (las que están dentro del contorno) */
.turno-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border-radius: 12px;
  box-shadow: 0 8px 15px rgba(0,0,0,0.2); /* Sombra para las tarjetas azules */
}

.turno-card:hover {
  transform: translateY(-7px);
  box-shadow: 0 18px 35px rgba(0,0,0,0.3);
}

/* Colores de texto para elementos sobre fondos oscuros (las tarjetas azules) */
.text-on-primary-text {
  color: rgb(var(--v-theme-on-primary-text)) !important;
}

.text-on-primary-text-faded {
  color: rgb(var(--v-theme-on-primary-text-faded)) !important;
}

.v-list-item-title {
  font-size: 0.95rem;
}

/* Color para los íconos de etapa no completados sobre el fondo azul */
.v-icon.on-primary-text-light {
  color: rgb(var(--v-theme-on-primary-text-light)) !important;
}

/* Asegurar que el fondo de la lista de etapas sea transparente */
.v-list.bg-transparent {
  background-color: transparent !important;
}
</style>
