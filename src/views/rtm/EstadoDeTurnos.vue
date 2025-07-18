<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl">
      <v-card-title class="text-h4 mb-6 text-center text-primary font-weight-bold">
        🔍 Histórico y Estado de Turnos
      </v-card-title>

      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchPlaca"
            label="Buscar por Placa"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            clearable
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchTurnoNumero"
            label="Buscar por Turno #"
            prepend-inner-icon="mdi-numeric"
            variant="outlined"
            clearable
            type="number"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="filterDate"
            label="Filtrar por Fecha"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            type="date"
            clearable
          ></v-text-field>
        </v-col>
        <v-col cols="12" class="d-flex justify-end">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-filter"
            @click="applyFilters"
            :loading="isLoading"
          >
            Aplicar Filtros
          </v-btn>
          <v-btn
            color="grey"
            variant="outlined"
            prepend-icon="mdi-close-circle-outline"
            class="ml-2"
            @click="clearFilters"
          >
            Limpiar Filtros
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <v-data-table
        :headers="headers"
        :items="turnos" :loading="isLoading"
        loading-text="Cargando histórico de turnos..."
        no-data-text="No hay turnos para mostrar con los filtros aplicados."
        class="elevation-1"
      >
        <template v-slot:item.fecha="{ item }">
          {{ formatDate(item.fecha) }}
        </template>

        <template v-slot:item.estado="{ item }">
          <v-chip :color="getTurnoStatusColor(item.estado)" dark small>
            {{ getTurnoStatusText(item.estado) }}
          </v-chip>
        </template>
        <template v-slot:item.etapaActual="{ item }">
          {{ getActualStageText(item) }}
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn
            color="info"
            variant="text"
            small
            @click="viewTurnoDetails(item.id)"
          >
            Ver Detalles
            <v-icon right>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import TurnosDelDiaService from '@/services/turnosdeldiaService';

// Interfaz para el tipo Turno (no cambia, es la misma que ya tienes)
interface Turno {
  id: number;
  turnoNumero: number;
  fecha: string;
  horaIngreso: string;
  horaSalida: string | null;
  tiempoServicio: string | null;
  placa: string;
  tipoVehiculo: 'vehiculo' | 'moto';
  tieneCita: boolean;
  convenio: string | null;
  referidoInterno: string | null;
  referidoExterno: string | null;
  medioEntero: 'fachada' | 'redes' | 'telemercadeo' | 'otros';
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

const router = useRouter();

const turnos = ref<Turno[]>([]);
const isLoading = ref(false);

const searchPlaca = ref('');
const searchTurnoNumero = ref<number | null>(null);
const filterDate = ref('');

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
});

const headers = [
  { title: 'Turno #', key: 'turnoNumero' },
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Hora Ingreso', key: 'horaIngreso' },
  { title: 'Estado', key: 'estado' },
  { title: 'Etapa Actual', key: 'etapaActual', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false },
];

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout };
};

const getTurnoStatusText = (estado: Turno['estado']): string => {
  switch (estado) {
    case 'activo':
      return 'Activo';
    case 'inactivo':
      return 'Inactivo';
    case 'cancelado':
      return 'Cancelado';
    case 'finalizado':
      return 'Finalizado';
    default:
      return 'Desconocido';
  }
};

const getTurnoStatusColor = (estado: Turno['estado']): string => {
  switch (estado) {
    case 'activo':
      return 'success';
    case 'inactivo':
      return 'grey';
    case 'cancelado':
      return 'error';
    case 'finalizado':
      return 'info';
    default:
      return 'grey-lighten-1';
  }
};

const getActualStageText = (turno: Turno): string => {
  if (turno.estado === 'finalizado' || (turno.estado === 'activo' && turno.horaSalida)) {
    return 'Certificación Finalizada';
  }
  if (turno.estado === 'cancelado' || turno.estado === 'inactivo') {
    return 'Inactivo / Cancelado';
  }
  return 'En Proceso';
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return dateString.split('T')[0];
  } catch (e) {
    console.error("Error al formatear la fecha:", dateString, e);
    return dateString;
  }
};


const fetchTurnosFromApi = async () => {
  isLoading.value = true;
  try {
    const filters: Record<string, string | number> = {}; // Allow number for turnoNumero

    if (searchPlaca.value) filters.placa = searchPlaca.value;
    // NEW: Pass searchTurnoNumero to the backend filter
    if (searchTurnoNumero.value !== null && searchTurnoNumero.value > 0) {
      filters.turnoNumero = searchTurnoNumero.value;
    }
    if (filterDate.value) filters.fecha = filterDate.value;

    console.log('Filtros que se enviarán al backend:', filters); // Add console.log as discussed
    const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
    const url = queryParams
        ? `${TurnosDelDiaService.API_BASE_URL}?${queryParams}` // Use the service's base URL
        : TurnosDelDiaService.API_BASE_URL;
    console.log('URL de la API construida:', url);

    const data = await TurnosDelDiaService.fetchTurnos(filters) as Turno[];
    turnos.value = data; // Assign directly, as backend does the filtering

    showSnackbar('Turnos cargados correctamente.', 'success');
  } catch (error: unknown) {
    console.error('Error al cargar turnos:', error);
    let message = 'Error al cargar los turnos. Intente recargar la página.';
    if (error instanceof Error) {
      message = error.message;
    }
    showSnackbar(message, 'error');
    turnos.value = [];
  } finally {
    isLoading.value = false;
  }
};

// REMOVED: The computed property `filteredTurnos` is no longer needed because filtering happens on the backend.
// const filteredTurnos = computed(() => {
//   if (searchTurnoNumero.value === null || searchTurnoNumero.value === 0) {
//     return turnos.value;
//   } else {
//     return turnos.value.filter(turno => turno.turnoNumero === searchTurnoNumero.value);
//   }
// });


const applyFilters = () => {
  fetchTurnosFromApi();
};

const clearFilters = () => {
  searchPlaca.value = '';
  searchTurnoNumero.value = null;
  filterDate.value = '';
  fetchTurnosFromApi();
};

const viewTurnoDetails = (id: number) => {
  router.push(`/rtm/editar-turno/${id}`);
};

onMounted(() => {
  fetchTurnosFromApi();
});
</script>

<style scoped>
.v-card-title {
  font-weight: bold;
  letter-spacing: 0.05em;
}
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f2f5, #e0e2e5);
}
.v-btn {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.v-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2);
}
</style>
