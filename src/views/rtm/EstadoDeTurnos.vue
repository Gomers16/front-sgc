<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl">
      <v-card-title class="text-h4 mb-6 font-weight-bold d-flex justify-center title-full-bordered-container">
        <span class="title-text-with-border">
          🔍 Histórico y Estado de Turnos
        </span>
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

        <v-col cols="12" class="d-flex flex-wrap justify-end align-center">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-filter"
            @click="applyFilters"
            :loading="isLoading"
            class="mb-2 mr-4 bordered-button"
            size="default"
          >
            Aplicar Filtros
          </v-btn>
          <v-btn
            color="grey"
            variant="outlined"
            prepend-icon="mdi-close-circle-outline"
            class="mb-2 mr-4 bordered-button-grey"
            size="default"
            @click="clearFilters"
          >
            Limpiar Filtros
          </v-btn>

          <v-btn
            color="info"
            variant="outlined"
            prepend-icon="mdi-calendar-today"
            @click="setTodayAndFilter"
            class="mb-2 mr-4 bordered-button-info"
            size="default"
          >
            Ver Turnos de Hoy
          </v-btn>
          <v-btn
            color="cyan-darken-1"
            variant="outlined"
            prepend-icon="mdi-calendar-month"
            @click="setMonthAndFilter"
            class="mb-2 mr-4 bordered-button-cyan"
            size="default"
          >
            Ver Turnos del Mes
          </v-btn>

          <v-btn
            color="secondary"
            variant="elevated"
            prepend-icon="mdi-chart-bar"
            class="mb-2 bordered-button-secondary"
            size="default"
            @click="goToReporteCaptacion"
          >
            Reporte por Captación
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <v-data-table
        :headers="headers"
        :items="turnos"
        :loading="isLoading"
        loading-text="Cargando histórico de turnos..."
        no-data-text="No hay turnos para mostrar con los filtros aplicados."
        class="elevation-1"
        :sort-by="defaultSort"
      >
        <template v-slot:item.turnoNumero="{ item }">
          <span class="turno-number-display">
            {{ item.turnoNumero }}
          </span>
        </template>

        <template v-slot:item.fecha="{ item }">
          {{ formatDate(item.fecha) }}
        </template>
        <template v-slot:item.horaIngreso="{ item }">
          {{ formatTime(item.horaIngreso ?? '') }}
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { DateTime } from 'luxon';
import TurnosDelDiaService from '@/services/turnosdeldiaService';

interface Turno {
  id: number;
  turnoNumero: number;
  fecha: string;
  horaIngreso: string | null;
  horaSalida: string | null;
  tiempoServicio: string | null;
  placa: string;
  tipoVehiculo: 'carro' | 'moto' | 'taxi' | 'enseñanza';
  tieneCita: boolean;
  convenio: string | null;
  referidoInterno: string | null;
  referidoExterno: string | null;
  medioEntero: 'Redes Sociales' | 'Convenio o Referido Externo' | 'Call Center' | 'Fachada' | 'Referido Interno' | 'Asesor Comercial';
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

interface FetchTurnosFilters {
  placa?: string;
  turnoNumero?: number;
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

const router = useRouter();

const turnos = ref<Turno[]>([]);
const isLoading = ref(false);

const searchPlaca = ref<string | null | undefined>(undefined);
const searchTurnoNumero = ref<number | null>(null);
const filterDate = ref<string | null | undefined>(undefined);

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
});

// --- MODIFICACIÓN CLAVE AQUÍ: 'sortable: false' en todos EXCEPTO en 'turnoNumero' ---
const headers = [
  { title: 'Turno #', key: 'turnoNumero', align: 'center' }, // Removido sortable: false aquí para que sea ordenable
  { title: 'Placa', key: 'placa', sortable: false },
  { title: 'Fecha', key: 'fecha', sortable: false },
  { title: 'Hora Ingreso', key: 'horaIngreso', sortable: false },
  { title: 'Estado', key: 'estado', sortable: false },
  { title: 'Etapa Actual', key: 'etapaActual', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false },
];
// --------------------------------------------------------------------------------------

// Define el ordenamiento por defecto: por fecha descendente y luego por turnoNumero descendente
const defaultSort = [
  { key: 'fecha', order: 'desc' },
  { key: 'turnoNumero', order: 'desc' },
];

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout };
};

const getTurnoStatusText = (estado: Turno['estado']): string => {
  switch (estado) {
    case 'activo': return 'Activo';
    case 'inactivo': return 'Inactivo';
    case 'cancelado': return 'Cancelado';
    case 'finalizado': return 'Finalizado';
    default: return 'Desconocido';
  }
};

const getTurnoStatusColor = (estado: Turno['estado']): string => {
  switch (estado) {
    case 'activo': return 'success';
    case 'inactivo': return 'grey';
    case 'cancelado': return 'error';
    case 'finalizado': return 'info';
    default: return 'grey-lighten-1';
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
  const parts = dateString.split('T');
  return parts.length > 0 ? parts[0] : dateString;
};

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

const fetchTurnosFromApi = async (fechaInicioParam?: string, fechaFinParam?: string) => {
  isLoading.value = true;
  try {
    const filters: FetchTurnosFilters = {};

    if (typeof searchPlaca.value === 'string' && searchPlaca.value.trim() !== '') {
      filters.placa = searchPlaca.value.trim();
    }
    if (searchTurnoNumero.value !== null && searchTurnoNumero.value > 0) {
      filters.turnoNumero = searchTurnoNumero.value;
    }

    if (typeof filterDate.value === 'string' && filterDate.value !== '') {
      filters.fechaInicio = filterDate.value;
      filters.fechaFin = filterDate.value;
    } else if (fechaInicioParam && fechaFinParam) {
      filters.fechaInicio = fechaInicioParam;
      filters.fechaFin = fechaFinParam;
    }

    const queryParams = new URLSearchParams();
    for (const key in filters) {
      const value = filters[key as keyof FetchTurnosFilters];
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    }
    const apiUrl = `http://localhost:3333/api/turnos-rtm?${queryParams.toString()}`;
    console.log('Fetching from URL:', apiUrl);

    const data = await TurnosDelDiaService.fetchTurnos(filters as Record<string, string | number | boolean>) as Turno[];

    // Asegurar el formato de fecha para la ordenación
    turnos.value = data.map(turno => {
      if (turno.fecha && typeof turno.fecha === 'string' && turno.fecha.includes('T')) {
        return { ...turno, fecha: turno.fecha.split('T')[0] };
      }
      return turno;
    });

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

const applyFilters = () => {
  fetchTurnosFromApi();
};

const clearFilters = () => {
  searchPlaca.value = undefined;
  searchTurnoNumero.value = null;
  filterDate.value = undefined;
  fetchTurnosFromApi();
};

const viewTurnoDetails = (id: number) => {
  router.push(`/rtm/editar-turno/${id}`);
};

const goToReporteCaptacion = () => {
  router.push('/rtm/contador-captacion');
};

const setTodayAndFilter = () => {
  const today = DateTime.local().setZone('America/Bogota');
  filterDate.value = today.toISODate() ?? undefined;
  searchPlaca.value = undefined;
  searchTurnoNumero.value = null;
  fetchTurnosFromApi();
};

const setMonthAndFilter = () => {
  const today = DateTime.local().setZone('America/Bogota');
  const firstDayOfMonth = today.startOf('month').toISODate() ?? undefined;
  const lastDayOfMonth = today.endOf('month').toISODate() ?? undefined;

  searchPlaca.value = undefined;
  searchTurnoNumero.value = null;
  filterDate.value = undefined;

  fetchTurnosFromApi(firstDayOfMonth, lastDayOfMonth);
};

onMounted(() => {
  fetchTurnosFromApi();
});
</script>

<style scoped>
/* Contenedor del título que ahora centra su contenido */
.title-full-bordered-container {
  padding: 0 !important;
}

/* Estilo para el span que contiene el texto y el borde */
.title-text-with-border {
  border: 2px solid black;
  padding: 10px 20px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  display: inline-block;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: var(--v-theme-primary);
}

/* Estilo para el CONTORNO PRINCIPAL (el v-card más externo) */
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f2f5, #e0e2e5);
}

/* Estilo base para todos los botones con borde */
.bordered-button,
.bordered-button-info,
.bordered-button-cyan,
.bordered-button-grey,
.bordered-button-secondary {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 0 0 2px black !important; /* Borde negro de 2px */
}

.bordered-button:hover,
.bordered-button-info:hover,
.bordered-button-cyan:hover,
.bordered-button-grey:hover,
.bordered-button-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2), 0 0 0 3px black !important; /* Borde al pasar el ratón */
}

/* Nuevos estilos para el número de turno */
.turno-number-display {
  font-weight: bold;
  font-size: 1.1em; /* Un poco más grande para que destaque */
  color: var(--v-theme-primary); /* Usar el color primario de tu tema */
  display: block; /* Para que text-align funcione correctamente en la celda */
  text-align: center; /* Centrar el número */
  padding: 2px 0; /* Pequeño padding vertical para mejor espaciado */
}
</style>
