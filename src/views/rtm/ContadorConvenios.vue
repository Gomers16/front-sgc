<template>
  <v-container class="mt-4">
    <v-card elevation="8" class="pa-6 rounded-xl">
      <v-card-title class="text-h4 mb-4 font-weight-bold d-flex justify-center title-full-bordered-container">
        <span class="title-text-with-border">
          📊 Reporte de Medios de Captación
        </span>
      </v-card-title>

      <v-row class="mb-4 d-flex justify-center align-center">
        <v-col cols="6" sm="4" md="3" lg="2">
          <v-text-field
            v-model="startDate"
            label="Fecha Inicio"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            type="date"
            clearable
            density="compact"
          ></v-text-field>
        </v-col>
        <v-col cols="6" sm="4" md="3" lg="2">
          <v-text-field
            v-model="endDate"
            label="Fecha Fin"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            type="date"
            clearable
            density="compact"
          ></v-text-field>
        </v-col>

        <v-col cols="12" sm="10" md="6" lg="5" class="d-flex flex-wrap justify-center align-center gap-2">
          <v-btn
            color="primary"
            variant="elevated"
            @click="applyDateFilter"
            :loading="isLoading"
            class="bordered-button d-flex align-center justify-center flex-grow-1"
            size="small"
            style="min-width: 120px; max-width: 160px;"
          >
            <v-icon class="mr-1">mdi-filter</v-icon>
            Filtrar
          </v-btn>
          <v-btn
            color="grey"
            variant="outlined"
            @click="clearDateFilter"
            class="bordered-button-grey d-flex align-center justify-center flex-grow-1"
            size="small"
            style="min-width: 120px; max-width: 160px;"
          >
            <v-icon class="mr-1">mdi-close-circle-outline</v-icon>
            Limpiar
          </v-btn>
          <v-btn
            color="info"
            variant="outlined"
            @click="setTodayAndFilter"
            class="bordered-button-info d-flex align-center justify-center flex-grow-1"
            size="small"
            style="min-width: 120px; max-width: 160px;"
          >
            <v-icon class="mr-1">mdi-calendar-today</v-icon>
            Hoy
          </v-btn>
          <v-btn
            color="cyan-darken-1"
            variant="outlined"
            @click="setMonthAndFilter"
            class="bordered-button-cyan d-flex align-center justify-center flex-grow-1"
            size="small"
            style="min-width: 120px; max-width: 160px;"
          >
            <v-icon class="mr-1">mdi-calendar-month</v-icon>
            Mes
          </v-btn>
          <v-btn
            color="success"
            variant="elevated"
            @click="exportReportToExcel"
            :loading="isExporting"
            class="bordered-button-success d-flex align-center justify-center flex-grow-1"
            size="small"
            style="min-width: 120px; max-width: 160px;"
          >
            <v-icon class="mr-1">mdi-microsoft-excel</v-icon>
            Exportar
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-h5 mb-4 text-primary">{{ periodTitle }}</h3>
      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="text-h6 text-secondary">Por Medio de Ingreso:</v-card-title>
            <v-list density="compact">
              <v-list-item v-for="(count, medio) in reportData.medios" :key="medio">
                <v-list-item-title class="font-weight-medium text-capitalize">{{ medio.replace(/_/g, ' ') }}:</v-list-item-title>
                <template v-slot:append>
                  <v-chip color="blue-grey" label>{{ count }}</v-chip>
                  <v-btn
                    v-if="count > 0"
                    icon
                    variant="text"
                    size="small"
                    class="ml-2"
                    @click="showDetailsModal('medioEntero', medio as Turno['medioEntero'])"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="text-h6 text-secondary">Por Referido:</v-card-title>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title class="font-weight-medium">Referido Interno:</v-list-item-title>
                <template v-slot:append>
                  <v-chip color="blue-grey" label>{{ reportData.referidoInternoCount }}</v-chip>
                  <v-btn
                    v-if="reportData.referidoInternoCount > 0"
                    icon
                    variant="text"
                    size="small"
                    class="ml-2"
                    @click="showDetailsModal('referidoInterno')"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-medium">Sin Referido:</v-list-item-title>
                <template v-slot:append>
                  <v-chip color="blue-grey" label>{{ reportData.noReferidoCount }}</v-chip>
                  <v-btn
                    v-if="reportData.noReferidoCount > 0"
                    icon
                    variant="text"
                    size="small"
                    class="ml-2"
                    @click="showDetailsModal('noReferido')"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <p class="text-body-1 text-center">
        Total de turnos en el periodo seleccionado: <strong>{{ turnos.length }}</strong>
      </p>

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

    <v-dialog v-model="detailsModal" max-width="1200">
      <v-card class="rounded-xl">
        <v-card-title class="text-h5 text-center text-primary font-weight-bold py-4">
          Detalles de Turnos por {{ currentDetailType }}
          <span v-if="currentDetailValue"> ({{ currentDetailValueText }})</span>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="detailHeaders"
            :items="filteredDetailTurnos"
            no-data-text="No hay turnos para mostrar en esta categoría."
            class="elevation-1"
          >
            <template v-slot:item.fecha="{ item }">
              {{ formatDate(item.fecha) }}
            </template>
            <template v-slot:item.horaIngreso="{ item }">
              {{ formatTime(item.horaIngreso ?? '') }}
            </template>

            <template v-slot:item.referidoInterno="{ item }">
              {{ item.referidoInterno || '-' }}
            </template>

            <template v-slot:item.convenio_referido_externo_display="{ item }">
              <span v-if="item.medioEntero === 'Convenio o Referido Externo' && item.convenio">
                {{ item.convenio }}
              </span>
              <span v-else-if="item.referidoExterno">
                {{ item.referidoExterno }}
              </span>
              <span v-else>-</span>
            </template>

            <template v-slot:item.asesorComercialDisplay="{ item }">
              <span v-if="item.medioEntero === 'Asesor Comercial' && item.asesorComercial">
                {{ item.asesorComercial }}
              </span>
              <span v-else>-</span>
            </template>
            </v-data-table>
        </v-card-text>
        <v-card-actions class="justify-end py-4">
          <v-btn color="primary" variant="elevated" @click="detailsModal = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
  // Asegúrate de que esta propiedad exista y se esté enviando desde tu backend
  asesorComercial: string | null; // ¡NUEVO!
  // funcionario?: { // Esta ya no es necesaria para la columna de Asesor Comercial si el backend envía el string directamente
  //   id: number;
  //   nombres: string;
  //   apellidos: string;
  // };
  createdAt: string;
  updatedAt: string;
}

const turnos = ref<Turno[]>([]);
const isLoading = ref(false);
const isExporting = ref(false);

const startDate = ref<string | undefined>(undefined);
const endDate = ref<string | undefined>(undefined);

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
});

const reportData = ref({
  medios: {
    'Fachada': 0,
    'Redes Sociales': 0,
    'Call Center': 0,
    'Convenio o Referido Externo': 0,
    'Referido Interno': 0,
    'Asesor Comercial': 0,
  } as Record<Turno['medioEntero'], number>,
  referidoInternoCount: 0,
  noReferidoCount: 0,
});

const detailsModal = ref(false);
const filteredDetailTurnos = ref<Turno[]>([]);
const currentDetailType = ref('');
const currentDetailValue = ref<Turno['medioEntero'] | undefined>(undefined);
const currentDetailValueText = ref('');

const detailHeaders = [
  { title: 'Turno #', key: 'turnoNumero' },
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Hora Ingreso', key: 'horaIngreso' },
  { title: 'Medio Captación', key: 'medioEntero' },
  { title: 'Referido Interno', key: 'referidoInterno' },
  { title: 'Convenio / Ref. Externo', key: 'convenio_referido_externo_display' },
  { title: 'Asesor Comercial', key: 'asesorComercialDisplay' }, // ¡NUEVA COLUMNA!
];

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout };
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = DateTime.fromISO(dateString, { zone: 'America/Bogota' });
    return date.isValid ? date.toFormat('dd/MM/yyyy') : dateString;
  } catch (e) {
    console.error("Error al formatear la fecha:", dateString, e);
    return dateString;
  }
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

const getMonthName = (monthIndex: number): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex];
};

const periodTitle = computed(() => {
  const startDt = startDate.value ? DateTime.fromISO(startDate.value, { zone: 'America/Bogota' }) : null;
  const endDt = endDate.value ? DateTime.fromISO(endDate.value, { zone: 'America/Bogota' }) : null;

  if (!startDt || !endDt || !startDt.isValid || !endDt.isValid) {
    return 'Resumen de Captación';
  }

  const today = DateTime.local().setZone('America/Bogota');

  if (startDt.toISODate() === today.toISODate() && endDt.toISODate() === today.toISODate()) {
    return `Resumen de Captación para el día ${formatDate(startDt.toISODate())}`;
  }
  else if (
    startDt.startOf('month').toISODate() === today.startOf('month').toISODate() &&
    endDt.endOf('month').toISODate() === today.endOf('month').toISODate()
  ) {
    return `Resumen de Captación del mes de ${getMonthName(today.month - 1)} (${today.year})`;
  }
  else {
    return `Resumen de Captación desde el ${formatDate(startDt.toISODate())} hasta el ${formatDate(endDt.toISODate())}`;
  }
});

const fetchTurnosForReport = async () => {
  isLoading.value = true;
  try {
    const filters: { fechaInicio?: string; fechaFin?: string } = {};

    if (typeof startDate.value === 'string' && startDate.value !== '') {
      filters.fechaInicio = startDate.value;
    }
    if (typeof endDate.value === 'string' && endDate.value !== '') {
      filters.fechaFin = endDate.value;
    }

    console.log('Filtros de fecha para backend:', filters);
    const data = await TurnosDelDiaService.fetchTurnos(filters as Record<string, string | number | boolean>) as Turno[];
    turnos.value = data;
    calculateReportData();

    showSnackbar('Turnos cargados para el reporte.', 'success');
  } catch (error: unknown) {
    console.error('Error al cargar turnos para el reporte:', error);
    let message = 'Error al cargar los turnos para el reporte.';
    if (error instanceof Error) {
      message = error.message;
    }
    showSnackbar(message, 'error');
    turnos.value = [];
    reportData.value.medios = {
      'Fachada': 0,
      'Redes Sociales': 0,
      'Call Center': 0,
      'Convenio o Referido Externo': 0,
      'Referido Interno': 0,
      'Asesor Comercial': 0,
    };
    reportData.value.referidoInternoCount = 0;
    reportData.value.noReferidoCount = 0;
  } finally {
    isLoading.value = false;
  }
};

const calculateReportData = () => {
  const mediosCount: Record<Turno['medioEntero'], number> = {
    'Fachada': 0,
    'Redes Sociales': 0,
    'Call Center': 0,
    'Convenio o Referido Externo': 0,
    'Referido Interno': 0,
    'Asesor Comercial': 0,
  };
  let referidoInternoCount = 0;
  let noReferidoCount = 0;

  turnos.value.forEach(turno => {
    if (turno.medioEntero && turno.medioEntero in mediosCount) {
      mediosCount[turno.medioEntero]++;
    } else if (turno.medioEntero) {
        console.warn(`Medio de entrada desconocido o no manejado: ${turno.medioEntero}`);
    }

    if (turno.medioEntero === 'Referido Interno' && turno.referidoInterno && turno.referidoInterno.trim() !== '') {
      referidoInternoCount++;
    }
  });

  noReferidoCount = turnos.value.filter(turno => {
    const isInternalReferralWithName = turno.medioEntero === 'Referido Interno' && turno.referidoInterno && turno.referidoInterno.trim() !== '';
    const isExternalReferralWithName = turno.medioEntero === 'Convenio o Referido Externo' && turno.convenio && turno.convenio.trim() !== '';
    return !isInternalReferralWithName && !isExternalReferralWithName;
  }).length;


  reportData.value.medios = mediosCount;
  reportData.value.referidoInternoCount = referidoInternoCount;
  reportData.value.noReferidoCount = noReferidoCount;
};

const applyDateFilter = () => {
  const startDt = startDate.value ? DateTime.fromISO(startDate.value, { zone: 'America/Bogota' }) : null;
  const endDt = endDate.value ? DateTime.fromISO(endDate.value, { zone: 'America/Bogota' }) : null;

  if (startDt && endDt && startDt.isValid && endDt.isValid && startDt > endDt) {
    showSnackbar('La fecha de inicio no puede ser posterior a la fecha fin.', 'warning');
    return;
  }
  fetchTurnosForReport();
};

const setTodayAndFilter = () => {
  const today = DateTime.local().setZone('America/Bogota');
  startDate.value = today.toISODate() ?? undefined;
  endDate.value = today.toISODate() ?? undefined;
  applyDateFilter();
};

const setMonthAndFilter = () => {
  const today = DateTime.local().setZone('America/Bogota');
  const firstDayOfMonth = today.startOf('month').toISODate() ?? undefined;
  const lastDayOfMonth = today.endOf('month').toISODate() ?? undefined;

  startDate.value = firstDayOfMonth;
  endDate.value = lastDayOfMonth;
  applyDateFilter();
};

const clearDateFilter = () => {
  startDate.value = undefined;
  endDate.value = undefined;
  setMonthAndFilter(); // Vuelve a cargar el mes actual por defecto
};

const showDetailsModal = (type: 'medioEntero' | 'referidoInterno' | 'referidoExterno' | 'noReferido', value?: Turno['medioEntero']) => {
  currentDetailType.value = type;
  currentDetailValue.value = value;
  filteredDetailTurnos.value = [];

  switch (type) {
    case 'medioEntero':
      if (value) {
        filteredDetailTurnos.value = turnos.value.filter(turno => turno.medioEntero === value);
        currentDetailValueText.value = value.replace(/_/g, ' ');
      }
      break;
    case 'referidoInterno':
      filteredDetailTurnos.value = turnos.value.filter(turno => turno.medioEntero === 'Referido Interno' && turno.referidoInterno && turno.referidoInterno.trim() !== '');
      currentDetailValueText.value = 'Referido Interno';
      break;
    case 'referidoExterno':
      filteredDetailTurnos.value = turnos.value.filter(turno =>
        turno.medioEntero === 'Convenio o Referido Externo' && turno.convenio && turno.convenio.trim() !== ''
      );
      currentDetailValueText.value = 'Convenio o Referido Externo';
      break;
    case 'noReferido':
      filteredDetailTurnos.value = turnos.value.filter(turno =>
        (!turno.referidoInterno || turno.referidoInterno.trim() === '') &&
        (turno.medioEntero !== 'Convenio o Referido Externo' || !turno.convenio || turno.convenio.trim() === '')
      );
      currentDetailValueText.value = 'Sin Referido';
      break;
  }

  detailsModal.value = true;
};

const exportReportToExcel = async () => {
  isExporting.value = true;
  try {
    const filters: { fechaInicio?: string; fechaFin?: string } = {};

    if (startDate.value) filters.fechaInicio = startDate.value;
    if (endDate.value) filters.fechaFin = endDate.value;

    if (!filters.fechaInicio || !filters.fechaFin) {
      showSnackbar('Por favor, selecciona un rango de fechas (Fecha Inicio y Fecha Fin) para exportar el Excel.', 'warning');
      return;
    }

    const { data, filename } = await TurnosDelDiaService.exportTurnosExcel(filters);

    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showSnackbar('Reporte Excel generado y descargado exitosamente.', 'success');
  } catch (error: unknown) {
    console.error('Error al exportar el reporte a Excel:', error);
    let message = 'Error al exportar el reporte a Excel.';
    if (error instanceof Error) {
      message = error.message;
    }
    showSnackbar(message, 'error');
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  setMonthAndFilter();
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
  padding: 8px 15px; /* Reducir padding */
  border-radius: 10px; /* Reducir radio de borde */
  background-color: rgba(255, 255, 255, 0.9);
  margin-bottom: 15px; /* Reducir margen inferior */
  display: inline-block;
  font-weight: bold;
  letter-spacing: 0.04em; /* Ligeramente más compacto */
  color: var(--v-theme-primary);
  font-size: 1.8rem !important; /* Ajustar tamaño de fuente */
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
.bordered-button-success {
  border-radius: 8px; /* Reducir radio de borde del botón */
  transition: all 0.3s ease;
  box-shadow: 0 3px 5px rgba(0,0,0,0.1), 0 0 0 1.5px black !important; /* Borde más fino */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px; /* Espacio entre botones */
}

/* Estilo para el contenedor flex de los botones para el gap */
.gap-2 > .v-btn {
    margin: 4px; /* Espacio entre los botones cuando están en flex-wrap */
}

.bordered-button:hover,
.bordered-button-info:hover,
.bordered-button-cyan:hover,
.bordered-button-grey:hover,
.bordered-button-success:hover {
  transform: translateY(-1px); /* Menor desplazamiento */
  box-shadow: 0 4px 8px rgba(0,0,0,0.15), 0 0 0 2px black !important; /* Borde al pasar el ratón */
}
.v-list-item-title {
  text-transform: capitalize;
}
</style>
