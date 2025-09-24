<!-- src/views/ReporteCaptacion.vue -->
<template>
  <v-container class="mt-4">
    <v-card elevation="8" class="pa-6 rounded-xl">
      <v-card-title class="text-h4 mb-4 font-weight-bold d-flex justify-center title-full-bordered-container">
        <span class="title-text-with-border">📊 Reporte de Medios de Captación</span>
      </v-card-title>

      <!-- Filtros de fechas + acciones -->
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
          />
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
          />
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

          <!-- Export general: todo el rango -->
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

      <!-- 🎯 Exportación Personalizada -->
      <v-card variant="elevated" class="pa-5 mb-6 export-card">
        <div class="d-flex align-center mb-3">
          <v-icon class="mr-2" size="26">mdi-target-variant</v-icon>
          <span class="text-h6 font-weight-bold text-primary">Exportación Personalizada</span>
        </div>

        <v-row>
          <!-- Servicios (dinámicos, incluye SOAT si existe) -->
          <v-col cols="12" md="4">
            <v-select
              class="select-accent service-select"
              v-model="selectedServicios"
              :items="serviciosOptions"
              item-title="display"
              item-value="codigo"
              label="Servicios a exportar"
              prepend-inner-icon="mdi-wrench-clock"
              multiple
              chips
              clearable
              variant="outlined"
              density="comfortable"
              :menu-props="{ maxHeight: 320 }"
              hint="Selecciona uno o más servicios (vacío = todos)"
              persistent-hint
            >
              <template #selection="{ item, index }">
                <v-chip v-if="index < 3" size="small" class="chip-service" label>
                  <v-icon start size="14">mdi-shield-check</v-icon>{{ item.title }}
                </v-chip>
                <span v-if="index === 3" class="text-caption grey--text">+{{ selectedServicios.length - 3 }} más</span>
              </template>
              <template #item="{ props }">
                <v-list-item v-bind="props">
                  <template #prepend><v-icon size="18">mdi-tag</v-icon></template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <!-- Medios (nueva taxonomía) -->
          <v-col cols="12" md="4">
            <v-select
              class="select-accent medio-select"
              v-model="selectedMedios"
              :items="mediosOptions"
              item-title="title"
              item-value="value"
              label="Medios de captación a exportar"
              prepend-inner-icon="mdi-account-group"
              multiple
              chips
              clearable
              variant="outlined"
              density="comfortable"
              :menu-props="{ maxHeight: 320 }"
              hint="Selecciona uno o más medios (vacío = todos)"
              persistent-hint
            >
              <template #selection="{ item, index }">
                <v-chip v-if="index < 3" size="small" class="chip-medio" label>
                  <v-icon start size="14">mdi-bullhorn</v-icon>{{ item.title }}
                </v-chip>
                <span v-if="index === 3" class="text-caption grey--text">+{{ selectedMedios.length - 3 }} más</span>
              </template>
              <template #item="{ props }">
                <v-list-item v-bind="props">
                  <template #prepend><v-icon size="18">mdi-bullhorn</v-icon></template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <!-- Botón Exportar selección -->
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-btn
              color="warning"
              variant="elevated"
              @click="exportMultipleSelection"
              :loading="isExportingMultiple"
              :disabled="!canExportMultiple"
              block
              size="large"
              class="export-btn"
            >
              <v-icon class="mr-2">mdi-microsoft-excel</v-icon>
              Exportar Selección
            </v-btn>
          </v-col>
        </v-row>

        <!-- Indicador de selección actual -->
        <v-row v-if="selectedServicios.length > 0 || selectedMedios.length > 0" class="mt-2">
          <v-col cols="12">
            <v-alert type="info" variant="tonal" density="compact" class="text-caption selection-alert">
              <strong>Exportará:</strong>
              <span v-if="selectedServicios.length > 0">
                Servicios ({{ selectedServicios.length }}): {{ selectedServicios.join(', ') }}
              </span>
              <span v-if="selectedServicios.length > 0 && selectedMedios.length > 0"> | </span>
              <span v-if="selectedMedios.length > 0">
                Medios ({{ selectedMedios.length }}): {{ selectedMedios.slice(0,3).join(', ') }}{{ selectedMedios.length > 3 ? '…' : '' }}
              </span>
            </v-alert>
          </v-col>
        </v-row>
      </v-card>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-h5 mb-4 text-primary">{{ periodTitle }}</h3>

      <v-row>
        <!-- Por Medio de Ingreso -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="text-h6 text-secondary">Por Medio de Ingreso:</v-card-title>
            <v-list density="compact">
              <v-list-item
                v-for="m in mediosOrder"
                :key="m.value"
              >
                <v-list-item-title class="font-weight-medium">
                  {{ m.title }}:
                </v-list-item-title>

                <template #append>
                  <v-chip color="blue-grey" label>{{ reportData.medios[m.value] ?? 0 }}</v-chip>

                  <!-- Ver detalles -->
                  <v-btn
                    v-if="(reportData.medios[m.value] ?? 0) > 0"
                    icon variant="tonal" size="small" color="primary" class="ml-2"
                    :title="`Ver detalle de ${m.title}`"
                    @click="showDetailsModal('medioEntero', m.value)"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>

                  <!-- Export rápido -->
                  <v-btn
                    v-if="(reportData.medios[m.value] ?? 0) > 0"
                    icon variant="tonal" size="small" color="success" class="ml-1"
                    :loading="isExportingQuick === `medio:${m.value}`"
                    :title="`Exportar ${m.title} en Excel`"
                    @click="quickExport('medioEntero', m.value)"
                  >
                    <v-icon>mdi-download</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Por Servicio -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="text-h6 text-secondary">Por Servicio:</v-card-title>
            <v-list density="compact">
              <v-list-item
                v-for="s in serviciosCountSorted"
                :key="s.codigo"
              >
                <v-list-item-title class="font-weight-medium">{{ s.codigo }}:</v-list-item-title>

                <template #append>
                  <v-chip color="blue-grey" label>{{ s.count }}</v-chip>

                  <!-- Ver detalles -->
                  <v-btn
                    v-if="s.count > 0"
                    icon variant="tonal" size="small" color="primary" class="ml-2"
                    :title="`Ver detalle de ${s.codigo}`"
                    @click="showDetailsModal('servicio', s.codigo)"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>

                  <!-- Export rápido -->
                  <v-btn
                    v-if="s.count > 0"
                    icon variant="tonal" size="small" color="success" class="ml-1"
                    :loading="isExportingQuick === `serv:${s.codigo}`"
                    :title="`Exportar ${s.codigo} en Excel`"
                    @click="quickExport('servicio', s.codigo)"
                  >
                    <v-icon>mdi-download</v-icon>
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

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <!-- Modal Detalles -->
    <v-dialog v-model="detailsModal" max-width="1200">
      <v-card class="rounded-xl">
        <v-card-title class="text-h5 text-center text-primary font-weight-bold py-4">
          Detalles de Turnos por {{ currentDetailTypeLabel }}
          <span v-if="currentDetailValue"> ({{ currentDetailValueText }})</span>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="detailHeaders"
            :items="filteredDetailTurnos"
            no-data-text="No hay turnos para mostrar en esta categoría."
            class="elevation-1"
          >
            <template #item.fecha="{ item }">
              {{ formatDate(item.fecha) }}
            </template>
            <template #item.horaIngreso="{ item }">
              {{ formatTime(item.horaIngreso ?? '') }}
            </template>
            <template #item.servicioDisplay="{ item }">
              {{ getServicioCodigo(item) }}
            </template>
            <template #item.canalDisplay="{ item }">
              {{ prettifyCanal(item.canalAtribucion) }}
            </template>
            <template #item.agenteDisplay="{ item }">
              {{ getAgenteLabel(item) }}
            </template>

            <!-- 👇 NUEVO: mostrar Svc # en detalles -->
            <template #item.turnoNumeroServicio="{ item }">
              <span class="svc-badge">{{ item.turnoNumeroServicio ?? '—' }}</span>
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
import { ref, onMounted, computed } from 'vue'
import { DateTime } from 'luxon'
import TurnosDelDiaService, {
  type ServicioCodigo,
  type MedioEnteroFinalDB,
  type ExportFiltersMultiple
} from '@/services/turnosdeldiaService'

/** ===== Tipos ===== */
interface ServicioEnTurno { id: number; codigoServicio: string; nombreServicio: string }
interface AgenteCaptacionLite { id: number; nombre: string; tipo: 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO' | string }

interface Turno {
  id: number
  turnoNumero: number
  turnoNumeroServicio?: number | null   // 👈 NUEVO
  turnoCodigo?: string | null
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
  tiempoServicio: string | null
  placa: string
  tipoVehiculo: 'Liviano Particular' | 'Liviano Taxi' | 'Liviano Público' | 'Motocicleta'
  medioEntero: MedioEnteroFinalDB
  observaciones: string | null
  funcionarioId: number
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  servicioId?: number | null
  servicio?: ServicioEnTurno | null
  servicioCodigo?: ServicioCodigo | string
  canalAtribucion?: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES' | string
  agenteCaptacion?: AgenteCaptacionLite | null
  createdAt: string
  updatedAt: string
}

/** ===== Estado ===== */
const turnos = ref<Turno[]>([])
const isLoading = ref(false)
const isExporting = ref(false)
const isExportingQuick = ref<string | null>(null)
const isExportingMultiple = ref(false)

const startDate = ref<string | undefined>(undefined)
const endDate   = ref<string | undefined>(undefined)

/** Servicios (dinámicos) */
const serviciosOptions = ref<Array<{ codigo: ServicioCodigo | string; nombre: string; display: string }>>([])
const selectedServicios = ref<ServicioCodigo[]>([])

/** Medios (nueva taxonomía limpia) */
const mediosOptions = [
  { value: 'Fachada' as MedioEnteroFinalDB,        title: 'Fachada' },
  { value: 'Redes Sociales' as MedioEnteroFinalDB, title: 'Redes Sociales' },
  { value: 'Call Center' as MedioEnteroFinalDB,    title: 'Call Center' },
  { value: 'Asesor Comercial' as MedioEnteroFinalDB, title: 'Asesor Comercial' },
]
const selectedMedios = ref<MedioEnteroFinalDB[]>([])
const mediosOrder = mediosOptions

const snackbar = ref({ show: false, message: '', color: '', timeout: 4000 })

/** ===== Reporte en memoria ===== */
const reportData = ref({
  medios: {
    'Fachada': 0,
    'Redes Sociales': 0,
    'Call Center': 0,
    'Asesor Comercial': 0,
  } as Record<MedioEnteroFinalDB, number>,
  servicios: {} as Record<string, number>, // dinámico
})

/** ===== Modal Detalles ===== */
const detailsModal = ref(false)
const filteredDetailTurnos = ref<Turno[]>([])
const currentDetailType = ref<'medioEntero'|'servicio'>('medioEntero')
const currentDetailValue = ref<string | undefined>(undefined)
const currentDetailValueText = ref('')

const detailHeaders = [
  { title: 'Turno #', key: 'turnoNumero' },
  { title: 'Svc #', key: 'turnoNumeroServicio' },   // 👈 NUEVO
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Hora Ingreso', key: 'horaIngreso' },
  { title: 'Servicio', key: 'servicioDisplay' },
  { title: 'Medio', key: 'medioEntero' },
  { title: 'Canal', key: 'canalDisplay' },
  { title: 'Agente', key: 'agenteDisplay' },
]

/** ===== Computed ===== */
const canExportMultiple = computed(() =>
  !!startDate.value && !!endDate.value && (selectedServicios.value.length > 0 || selectedMedios.value.length > 0)
)

const getMonthName = (m: number) =>
  ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m - 1]

const periodTitle = computed(() => {
  const startDt = startDate.value ? DateTime.fromISO(startDate.value, { zone: 'America/Bogota' }) : null
  const endDt   = endDate.value ? DateTime.fromISO(endDate.value,   { zone: 'America/Bogota' })   : null
  if (!startDt || !endDt || !startDt.isValid || !endDt.isValid) return 'Resumen de Captación'

  const today = DateTime.local().setZone('America/Bogota')
  if (startDt.toISODate() === today.toISODate() && endDt.toISODate() === today.toISODate()) {
    return `Resumen de Captación para el día ${formatDate(startDt.toISODate()!)}`
  } else if (
    startDt.startOf('month').toISODate() === today.startOf('month').toISODate() &&
    endDt.endOf('month').toISODate() === today.endOf('month').toISODate()
  ) {
    return `Resumen de Captación del mes de ${getMonthName(today.month)} (${today.year})`
  }
  return `Resumen de Captación desde el ${formatDate(startDt.toISODate()!)} hasta el ${formatDate(endDt.toISODate()!)}`
})

/** Para listado por servicio ordenado desc */
const serviciosCountSorted = computed(() => {
  const entries = Object.entries(reportData.value.servicios).map(([codigo, count]) => ({ codigo, count }))
  entries.sort((a, b) => b.count - a.count || a.codigo.localeCompare(b.codigo))
  return entries
})

/** ===== Helpers UI ===== */
const showSnackbar = (message: string, color = 'info', timeout = 4000) =>
  snackbar.value = { show: true, message, color, timeout }

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  try {
    const date = DateTime.fromISO(dateString, { zone: 'America/Bogota' })
    return date.isValid ? date.toFormat('dd/MM/yyyy') : dateString
  } catch { return dateString }
}

const formatTime = (timeString: string | null): string => {
  if (!timeString) return ''
  let time = DateTime.fromFormat(timeString, 'HH:mm:ss', { zone: 'America/Bogota' })
  if (!time.isValid) time = DateTime.fromFormat(timeString, 'HH:mm', { zone: 'America/Bogota' })
  return time.isValid ? time.toFormat('hh:mm a') : timeString
}

const prettifyCanal = (canal?: string): string => {
  switch ((canal || '').toUpperCase()) {
    case 'FACHADA': return 'Fachada'
    case 'ASESOR':  return 'Asesor'
    case 'TELE':    return 'Telemercadeo'
    case 'REDES':   return 'Redes Sociales'
    default:        return canal || '—'
  }
}

const getAgenteLabel = (t: Turno): string => {
  const a = t.agenteCaptacion
  if (!a || !a.id) return '—'
  const prettyTipo =
    a.tipo?.toUpperCase() === 'ASESOR_INTERNO' ? 'Asesor Interno' :
    a.tipo?.toUpperCase() === 'ASESOR_EXTERNO' ? 'Asesor Externo' :
    a.tipo?.toUpperCase() === 'TELEMERCADEO'   ? 'Telemercadeo' : (a.tipo || '')
  return prettyTipo ? `${a.nombre} (${prettyTipo})` : a.nombre
}

const getServicioCodigo = (t: Turno): string =>
  t.servicio?.codigoServicio ?? (t.servicioCodigo as string) ?? '—'

/** ===== Data ===== */
const loadServiciosOptions = async () => {
  try {
    const data = await TurnosDelDiaService.getServicios()
    serviciosOptions.value = (data || []).map(s => ({
      codigo: s.codigo,
      nombre: s.nombre,
      display: `${s.codigo} — ${s.nombre}`,
    }))
  } catch (e) {
    console.error('Error cargando servicios (reporte):', e)
    serviciosOptions.value = []
  }
}

const fetchTurnosForReport = async () => {
  isLoading.value = true
  try {
    const filters: { fechaInicio?: string; fechaFin?: string } = {}
    if (startDate.value) filters.fechaInicio = startDate.value
    if (endDate.value)   filters.fechaFin   = endDate.value

    const raw = await TurnosDelDiaService.fetchTurnos(filters as Record<string, string | number | boolean>) as any[]

    // 👇 Normalizar camelCase y asegurar turnoNumeroServicio desde snake_case si viene así
    const data: Turno[] = (raw || []).map((t: any) => ({
      ...t,
      turnoNumeroServicio: t.turnoNumeroServicio ?? t.turno_numero_servicio ?? null,
    }))

    turnos.value = data
    calculateReportData()
    showSnackbar('Turnos cargados para el reporte.', 'success')
  } catch (error: unknown) {
    console.error('Error al cargar turnos para el reporte:', error)
    showSnackbar(error instanceof Error ? error.message : 'Error al cargar los turnos para el reporte.', 'error')
    turnos.value = []
    // reset
    reportData.value.medios = { 'Fachada': 0, 'Redes Sociales': 0, 'Call Center': 0, 'Asesor Comercial': 0 }
    reportData.value.servicios = {}
  } finally {
    isLoading.value = false
  }
}

const calculateReportData = () => {
  const mediosCount: Record<MedioEnteroFinalDB, number> =
    { 'Fachada': 0, 'Redes Sociales': 0, 'Call Center': 0, 'Asesor Comercial': 0 }

  const serviciosCount: Record<string, number> = {}

  for (const t of turnos.value) {
    if (t.medioEntero && t.medioEntero in mediosCount) {
      mediosCount[t.medioEntero]++
    }
    const cod = getServicioCodigo(t)
    if (cod && cod !== '—') {
      serviciosCount[cod] = (serviciosCount[cod] || 0) + 1
    }
  }

  reportData.value.medios = mediosCount
  reportData.value.servicios = serviciosCount
}

/** ===== Acciones ===== */
const applyDateFilter = () => {
  const startDt = startDate.value ? DateTime.fromISO(startDate.value, { zone: 'America/Bogota' }) : null
  const endDt   = endDate.value ? DateTime.fromISO(endDate.value,   { zone: 'America/Bogota' })   : null
  if (startDt && endDt && startDt.isValid && endDt.isValid && startDt > endDt) {
    showSnackbar('La fecha de inicio no puede ser posterior a la fecha fin.', 'warning')
    return
  }
  fetchTurnosForReport()
}

const setTodayAndFilter = () => {
  const today = DateTime.local().setZone('America/Bogota')
  startDate.value = today.toISODate() ?? undefined
  endDate.value   = today.toISODate() ?? undefined
  applyDateFilter()
}

const setMonthAndFilter = () => {
  const today = DateTime.local().setZone('America/Bogota')
  startDate.value = today.startOf('month').toISODate() ?? undefined
  endDate.value   = today.endOf('month').toISODate()   ?? undefined
  applyDateFilter()
}

const clearDateFilter = () => {
  startDate.value = undefined
  endDate.value   = undefined
  setMonthAndFilter()
}

/** Detalles */
const currentDetailTypeLabel = computed(() =>
  currentDetailType.value === 'medioEntero' ? 'Medio de Ingreso' : 'Servicio'
)

const showDetailsModal = (type: 'medioEntero' | 'servicio', value?: string) => {
  currentDetailType.value = type
  currentDetailValue.value = value
  filteredDetailTurnos.value = []

  if (type === 'medioEntero' && value) {
    filteredDetailTurnos.value = turnos.value.filter(t => t.medioEntero === (value as MedioEnteroFinalDB))
    currentDetailValueText.value = String(value)
  } else if (type === 'servicio' && value) {
    filteredDetailTurnos.value = turnos.value.filter(t => getServicioCodigo(t) === value)
    currentDetailValueText.value = value
  }

  detailsModal.value = true
}

/** Exportaciones */
const exportReportToExcel = async () => {
  isExporting.value = true
  try {
    const filters: ExportFiltersMultiple = {}
    if (startDate.value) filters.fechaInicio = startDate.value
    if (endDate.value)   filters.fechaFin   = endDate.value

    if (!filters.fechaInicio || !filters.fechaFin) {
      showSnackbar('Selecciona un rango de fechas para exportar.', 'warning')
      return
    }

    const { data, filename } = await TurnosDelDiaService.exportTurnosExcel(filters)
    downloadFile(data, filename)
    showSnackbar('Reporte Excel generado y descargado.', 'success')
  } catch (error: unknown) {
    console.error('Error al exportar reporte:', error)
    showSnackbar(error instanceof Error ? error.message : 'Error al exportar reporte.', 'error')
  } finally {
    isExporting.value = false
  }
}

const exportMultipleSelection = async () => {
  if (!startDate.value || !endDate.value) {
    showSnackbar('Selecciona primero un rango de fechas para exportar.', 'warning')
    return
  }
  if (selectedServicios.value.length === 0 && selectedMedios.value.length === 0) {
    showSnackbar('Selecciona al menos un servicio o medio de captación.', 'warning')
    return
  }

  isExportingMultiple.value = true
  try {
    const { data, filename } = await TurnosDelDiaService.exportTurnosExcelMultiple({
      fechaInicio: startDate.value,
      fechaFin: endDate.value,
      serviciosSeleccionados: selectedServicios.value.length ? selectedServicios.value : undefined,
      mediosSeleccionados: selectedMedios.value.length ? selectedMedios.value : undefined,
    })
    downloadFile(data, filename)
    showSnackbar('Exportación múltiple descargada.', 'success')
  } catch (error: unknown) {
    console.error('Error en exportación múltiple:', error)
    showSnackbar(error instanceof Error ? error.message : 'Error en la exportación múltiple.', 'error')
  } finally {
    isExportingMultiple.value = false
  }
}

const quickExport = async (type: 'servicio' | 'medioEntero', value: string) => {
  if (!startDate.value || !endDate.value) {
    showSnackbar('Selecciona primero un rango de fechas para exportar.', 'warning')
    return
  }

  const key = type === 'servicio' ? `serv:${value}` : `medio:${value}`
  isExportingQuick.value = key

  try {
    let result: { data: Blob; filename: string }
    if (type === 'servicio') {
      result = await TurnosDelDiaService.exportTurnosByServicio(
        startDate.value, endDate.value, value as ServicioCodigo
      )
    } else {
      result = await TurnosDelDiaService.exportTurnosByMedio(
        startDate.value, endDate.value, value as MedioEnteroFinalDB
      )
    }
    downloadFile(result.data, result.filename)
    showSnackbar('Exportación filtrada descargada.', 'success')
  } catch (error: unknown) {
    console.error('Error quickExport:', error)
    showSnackbar(error instanceof Error ? error.message : 'Error al exportar el filtro seleccionado.', 'error')
  } finally {
    isExportingQuick.value = null
  }
}

/** Util descarga */
const downloadFile = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/** ===== Lifecycle ===== */
onMounted(async () => {
  await loadServiciosOptions()
  setMonthAndFilter()
})
</script>

<style scoped>
.title-full-bordered-container { padding: 0 !important; }
.title-text-with-border {
  border: 2px solid black;
  padding: 8px 15px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  margin-bottom: 15px;
  display: inline-block;
  font-weight: bold;
  letter-spacing: 0.04em;
  color: var(--v-theme-primary);
  font-size: 1.8rem !important;
}
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f2f5, #e0e2e5);
}
.bordered-button,
.bordered-button-info,
.bordered-button-cyan,
.bordered-button-grey,
.bordered-button-success {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 3px 5px rgba(0,0,0,0.1), 0 0 0 1.5px black !important;
  display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
}
.gap-2 > .v-btn { margin: 4px; }
.bordered-button:hover,
.bordered-button-info:hover,
.bordered-button-cyan:hover,
.bordered-button-grey:hover,
.bordered-button-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15), 0 0 0 2px black !important;
}
.export-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,248,255,0.9));
  border: 2px solid rgba(33, 150, 243, 0.25);
  border-radius: 16px;
  backdrop-filter: blur(6px);
}
.select-accent :deep(.v-field) {
  border-radius: 12px !important;
  background: #ffffff !important;
}
.service-select :deep(.v-field) {
  border: 1.8px solid rgba(33, 150, 243, 0.45) !important;
  box-shadow: 0 3px 10px rgba(33, 150, 243, 0.12);
}
.medio-select :deep(.v-field) {
  border: 1.8px solid rgba(76, 175, 80, 0.45) !important;
  box-shadow: 0 3px 10px rgba(76, 175, 80, 0.12);
}
.select-accent :deep(.v-field.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(33,150,243,0.15) !important;
}
.chip-service {
  background: rgba(33,150,243,0.15) !important;
  color: #0d47a1 !important;
  border: 1px solid rgba(33,150,243,0.35) !important;
}
.chip-medio {
  background: rgba(76,175,80,0.18) !important;
  color: #1b5e20 !important;
  border: 1px solid rgba(76,175,80,0.35) !important;
}
.export-btn { border-radius: 12px; box-shadow: 0 6px 14px rgba(255,152,0,0.2); }
.selection-alert { border-radius: 10px; border: 1px dashed rgba(33, 150, 243, 0.35); }

.svc-badge {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid rgba(0,0,0,.1);
}
</style>
