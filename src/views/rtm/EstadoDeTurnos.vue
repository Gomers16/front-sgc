<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl">
      <v-card-title class="text-h4 mb-6 font-weight-bold d-flex justify-center title-full-bordered-container">
        <span class="title-text-with-border">
          🔍 Histórico y Estado de Turnos
        </span>
      </v-card-title>

      <!-- FILTROS -->
      <v-row class="mb-2">
        <!-- 🔽 Chips rápidos por servicio -->
        <v-col cols="12" md="6" class="d-flex align-center flex-wrap">
          <span class="mr-3 text-medium-emphasis">Rápidos:</span>
          <v-chip
            class="mr-2 mb-2"
            color="grey"
            variant="outlined"
            @click="setServicioFiltro(null)"
            :variant="servicioFiltroId ? 'outlined' : 'flat'"
          >
            Todos
          </v-chip>
          <v-chip
            v-for="s in serviciosChips"
            :key="s.value"
            class="mr-2 mb-2"
            color="primary"
            @click="setServicioFiltro(s.value)"
            :variant="servicioFiltroId === s.value ? 'flat' : 'outlined'"
          >
            {{ s.label }}
          </v-chip>
        </v-col>
      </v-row>

      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchPlaca"
            label="Buscar por Placa"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            clearable
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchTurnoNumero"
            label="Buscar por Turno #"
            prepend-inner-icon="mdi-numeric"
            variant="outlined"
            clearable
            type="number"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="filterDate"
            label="Filtrar por Fecha"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            type="date"
            clearable
          />
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

      <!-- Contenedor con scroll horizontal opcional -->
      <div class="table-scroll-x">
        <v-data-table
          :headers="headers"
          :items="turnos"
          :loading="isLoading"
          loading-text="Cargando histórico de turnos..."
          no-data-text="No hay turnos para mostrar con los filtros aplicados."
          class="elevation-1"
          :sort-by="defaultSort"
        >
          <!-- Turno # (global) -->
          <template #item.turnoNumero="{ item }">
            <span class="turno-number-display">
              {{ item.turnoNumero }}
            </span>
          </template>

          <!-- Svc # (por servicio) -->
          <template #item.turnoNumeroServicio="{ item }">
            <span class="turno-number-display turno-number-svc">
              {{ item.turnoNumeroServicio ?? '—' }}
            </span>
          </template>

          <!-- Fecha / Hora (forzar una sola línea y ancho mínimo) -->
          <template #item.fecha="{ item }">
            <span class="nowrap col-fecha">{{ formatDate(item.fecha) }}</span>
          </template>
          <template #item.horaIngreso="{ item }">
            <span class="nowrap col-hora">{{ formatTime(item.horaIngreso ?? '') }}</span>
          </template>

          <!-- Servicio -->
          <template #item.servicio="{ item }">
            <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
              {{ item.servicio?.codigoServicio ?? '—' }}
            </v-chip>
          </template>

          <!-- Tipo Vehículo -->
          <template #item.tipoVehiculo="{ item }">
            <v-chip size="small" color="grey-darken-1" variant="outlined">
              {{ item.tipoVehiculo ?? '—' }}
            </v-chip>
          </template>

          <!-- Vinc. Vehículo (trazabilidad) -->
          <template #item.vehiculoVinculo="{ item }">
            <v-chip
              v-if="item.vehiculo?.id"
              size="small"
              color="teal"
              variant="flat"
              prepend-icon="mdi-car"
            >
              ID {{ item.vehiculo.id }}
            </v-chip>
            <span v-else>—</span>
          </template>

          <!-- Cliente (trazabilidad) -->
          <template #item.cliente="{ item }">
            <div class="d-flex align-center">
              <v-icon size="18" class="mr-1">mdi-account</v-icon>
              <span>{{ getClienteNombre(item) }}</span>
            </div>
          </template>

          <!-- Teléfono cliente -->
          <template #item.telefono="{ item }">
            <div class="d-flex align-center">
              <v-icon size="18" class="mr-1">mdi-phone</v-icon>
              <span>{{ getClienteTelefono(item) }}</span>
            </div>
          </template>

          <!-- Canal atribución -->
          <template #item.canalAtribucion="{ item }">
            <v-chip
              size="small"
              :color="getCanalColor(item.canalAtribucion)"
              variant="flat"
              prepend-icon="mdi-source-branch"
            >
              {{ prettifyCanal(item.canalAtribucion) }}
            </v-chip>
          </template>

          <!-- Agente captación -->
          <template #item.agente="{ item }">
            <div v-if="item.agenteCaptacion?.id" class="d-flex flex-column">
              <div class="d-flex align-center">
                <v-icon size="18" class="mr-1">mdi-account-tie</v-icon>
                <span class="font-weight-medium">{{ item.agenteCaptacion?.nombre }}</span>
              </div>
              <v-chip
                size="x-small"
                class="mt-1"
                variant="outlined"
                :color="getAgenteTipoColor(item.agenteCaptacion?.tipo)"
              >
                {{ prettifyAgenteTipo(item.agenteCaptacion?.tipo) }}
              </v-chip>
            </div>
            <span v-else>—</span>
          </template>

          <!-- Captación (dateo/atribución final) -->
          <template #item.captacion="{ item }">
            <v-chip
              v-if="item.canalAtribucion"
              size="small"
              color="purple"
              variant="flat"
              prepend-icon="mdi-clipboard-text-clock"
            >
              {{ getCaptacionLabel(item) }}
            </v-chip>
            <span v-else>—</span>
          </template>

          <!-- Estado -->
          <template #item.estado="{ item }">
            <v-chip :color="getTurnoStatusColor(item.estado)" dark small>
              {{ getTurnoStatusText(item.estado) }}
            </v-chip>
          </template>

          <!-- Usuario (funcionario) -->
          <template #item.usuario="{ item }">
            <div class="d-flex align-center">
              <v-icon size="18" class="mr-1">mdi-badge-account</v-icon>
              <span>{{ getUsuarioNombre(item) }}</span>
            </div>
          </template>

          <!-- Sede -->
          <template #item.sede="{ item }">
            <div class="d-flex align-center">
              <v-icon size="18" class="mr-1">mdi-office-building</v-icon>
              <span>{{ item.sede?.nombre ?? '—' }}</span>
            </div>
          </template>

          <!-- Observaciones (tooltip si es largo) -->
          <template #item.observaciones="{ item }">
            <v-tooltip v-if="item.observaciones && item.observaciones.length > 30" location="bottom">
              <template #activator="{ props }">
                <span v-bind="props">{{ trunc(item.observaciones, 30) }}</span>
              </template>
              <span>{{ item.observaciones }}</span>
            </v-tooltip>
            <span v-else>{{ item.observaciones ?? '—' }}</span>
          </template>

          <!-- Acciones -->
          <template #item.actions="{ item }">
            <v-btn color="info" variant="text" small @click="viewTurnoDetails(item.id)">
              Ver Detalles
              <v-icon right>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </div>
    </v-card>

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
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import TurnosDelDiaService from '@/services/turnosdeldiaService'

/** === Tipos mínimos esperados desde el backend (preloads) === */
interface ServicioEnTurno {
  id: number
  codigoServicio: string   // 'RTM' | 'PREV' | 'PERI' | 'SOAT' ...
  nombreServicio: string
}
interface UsuarioMin {
  id: number
  nombres?: string
  apellidos?: string
}
interface SedeMin {
  id: number
  nombre: string
}
interface VehiculoMin {
  id: number
  placa?: string
}
interface ClienteMin {
  id: number
  nombres?: string
  apellidos?: string
  nombre?: string
  nombreCompleto?: string
  razonSocial?: string
  telefono?: string
  celular?: string
}
interface AgenteCaptacionMin {
  id: number
  nombre: string
  tipo: 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO' | string
}
interface CaptacionDateoMin {
  id: number
  canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES' | string
  consumidoAt?: string | null
}

type EstadoTurno = 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
type CanalAtrib = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES' | string

interface Turno {
  id: number
  turnoNumero: number
  turnoNumeroServicio?: number | null
  turnoCodigo?: string | null
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
  tiempoServicio: string | null
  placa: string
  tipoVehiculo: string
  medioEntero: string
  observaciones: string | null
  funcionarioId: number
  estado: EstadoTurno

  servicioId?: number | null
  servicio?: ServicioEnTurno | null
  vehiculoId?: number | null
  vehiculo?: VehiculoMin | null
  clienteId?: number | null
  cliente?: ClienteMin | null
  usuario?: UsuarioMin | null
  sede?: SedeMin | null

  canalAtribucion?: CanalAtrib
  agenteCaptacionId?: number | null
  agenteCaptacion?: AgenteCaptacionMin | null
  captacionDateoId?: number | null
  captacionDateo?: CaptacionDateoMin | null

  createdAt: string
  updatedAt: string
}

interface FetchTurnosFilters {
  placa?: string
  turnoNumero?: number
  fecha?: string
  fechaInicio?: string
  fechaFin?: string
  servicioId?: number
}

const router = useRouter()

const turnos = ref<Turno[]>([])
const isLoading = ref(false)

const searchPlaca = ref<string | null | undefined>(undefined)
const searchTurnoNumero = ref<number | null>(null)
const filterDate = ref<string | null | undefined>(undefined)

/** 🔽 Estado de servicios para filtros */
const serviciosItems = ref<Array<{ title: string; value: number }>>([])
const serviciosLoading = ref<boolean>(false)
const servicioFiltroId = ref<number | null>(null)

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

/** === Headers: tabla completa con trazabilidad === */
const headers = [
  { title: 'Turno #', key: 'turnoNumero', align: 'center' },
  { title: 'Svc #', key: 'turnoNumeroServicio', align: 'center' },
  { title: 'Fecha', key: 'fecha', sortable: false },
  { title: 'Hora Ingreso', key: 'horaIngreso', sortable: false },
  { title: 'Placa', key: 'placa', sortable: false },
  { title: 'Tipo Vehículo', key: 'tipoVehiculo', sortable: false },
  { title: 'Servicio', key: 'servicio', sortable: false },
  { title: 'Canal', key: 'canalAtribucion', sortable: false },
  { title: 'Agente', key: 'agente', sortable: false },
  { title: 'Cliente', key: 'cliente', sortable: false },
  { title: 'Teléfono', key: 'telefono', sortable: false },
  { title: 'Vinc. Vehículo', key: 'vehiculoVinculo', sortable: false },
  { title: 'Estado', key: 'estado', sortable: false },
  { title: 'Captación', key: 'captacion', sortable: false },
  { title: 'Usuario', key: 'usuario', sortable: false },
  { title: 'Sede', key: 'sede', sortable: false },
  { title: 'Observaciones', key: 'observaciones', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Orden por defecto: fecha desc, luego turnoNumero desc (global)
const defaultSort = [
  { key: 'fecha', order: 'desc' as const },
  { key: 'turnoNumero', order: 'desc' as const },
]

/** Chips rápidos: se derivan del catálogo (solo código visible) */
const serviciosChips = computed(() =>
  serviciosItems.value.map((s) => {
    const code = s.title.split('—')[0].trim()
    return { label: code, value: s.value }
  })
)

/** === Helpers UI === */
const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout }
}

const getTurnoStatusText = (estado: EstadoTurno): string => {
  switch (estado) {
    case 'activo': return 'Activo'
    case 'inactivo': return 'Inactivo'
    case 'cancelado': return 'Cancelado'
    case 'finalizado': return 'Finalizado'
    default: return 'Desconocido'
  }
}

const getTurnoStatusColor = (estado: EstadoTurno): string => {
  switch (estado) {
    case 'activo': return 'success'
    case 'inactivo': return 'grey'
    case 'cancelado': return 'error'
    case 'finalizado': return 'info'
    default: return 'grey-lighten-1'
  }
}

const prettifyCanal = (canal?: CanalAtrib): string => {
  switch ((canal || '').toUpperCase()) {
    case 'FACHADA': return 'Fachada'
    case 'ASESOR': return 'Asesor'
    case 'TELE': return 'Telemercadeo'
    case 'REDES': return 'Redes Sociales'
    default: return canal || '—'
  }
}

const getCanalColor = (canal?: CanalAtrib): string => {
  switch ((canal || '').toUpperCase()) {
    case 'FACHADA': return 'orange'
    case 'ASESOR': return 'green'
    case 'TELE': return 'indigo'
    case 'REDES': return 'purple'
    default: return 'grey'
  }
}

const prettifyAgenteTipo = (tipo?: string): string => {
  switch ((tipo || '').toUpperCase()) {
    case 'ASESOR_INTERNO': return 'Asesor Interno'
    case 'ASESOR_EXTERNO': return 'Asesor Externo'
    case 'TELEMERCADEO': return 'Telemercadeo'
    default: return tipo || '—'
  }
}

const getAgenteTipoColor = (tipo?: string): string => {
  switch ((tipo || '').toUpperCase()) {
    case 'ASESOR_INTERNO': return 'green'
    case 'ASESOR_EXTERNO': return 'blue'
    case 'TELEMERCADEO': return 'indigo'
    default: return 'grey'
  }
}

/** Cliente: contempla más campos de nombre */
const getClienteNombre = (t: Turno): string => {
  const c = t.cliente
  if (!c) return '—'
  if (c.nombreCompleto) return c.nombreCompleto
  if (c.nombre) return c.nombre
  const byParts = [c.nombres, c.apellidos].filter(Boolean).join(' ').trim()
  return byParts || c.razonSocial || '—'
}

const getClienteTelefono = (t: Turno): string =>
  t.cliente?.telefono || t.cliente?.celular || '—'

const getUsuarioNombre = (t: Turno): string => {
  const u = t.usuario
  if (!u) return '—'
  const nombre = [u.nombres, u.apellidos].filter(Boolean).join(' ').trim()
  return nombre || `Usuario #${u.id}`
}

const getCaptacionLabel = (t: Turno): string => {
  const canal = (t.canalAtribucion || '').toUpperCase()
  if (canal === 'ASESOR') {
    const tipo = prettifyAgenteTipo(t.agenteCaptacion?.tipo)
    return tipo && tipo !== '—' ? `Dateo: ${tipo}` : 'Dateo: Asesor'
  }
  return `Dateo: ${prettifyCanal(canal)}`
}

const trunc = (s: string, n = 30) => (s.length > n ? s.slice(0, n) + '…' : s)

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const parts = dateString.split('T')
  return parts.length > 0 ? parts[0] : dateString
}

const formatTime = (timeString: string | null): string => {
  if (!timeString) return ''
  let time = DateTime.fromFormat(timeString, 'HH:mm:ss', { zone: 'America/Bogota' })
  if (!time.isValid) {
    time = DateTime.fromFormat(timeString, 'HH:mm', { zone: 'America/Bogota' })
  }
  return time.isValid ? time.toFormat('hh:mm a') : timeString
}

/** Cargar catálogo de servicios */
const loadServicios = async () => {
  serviciosLoading.value = true
  try {
    const data = await TurnosDelDiaService.getServicios()
    serviciosItems.value = (data || []).map((s) => ({
      title: `${s.codigo} — ${s.nombre}`,
      value: s.id,
    }))
  } catch (e) {
    console.error('Error cargando servicios:', e)
    serviciosItems.value = []
  } finally {
    serviciosLoading.value = false
  }
}

/** Handler chips/select de servicio */
const setServicioFiltro = (id: number | null) => {
  servicioFiltroId.value = id
  applyFilters()
}

/** === Data load === */
const fetchTurnosFromApi = async (fechaInicioParam?: string, fechaFinParam?: string) => {
  isLoading.value = true
  try {
    const filters: FetchTurnosFilters = {}

    if (typeof searchPlaca.value === 'string' && searchPlaca.value.trim() !== '') {
      filters.placa = searchPlaca.value.trim()
    }
    if (searchTurnoNumero.value !== null && searchTurnoNumero.value > 0) {
      filters.turnoNumero = searchTurnoNumero.value
    }

    if (typeof filterDate.value === 'string' && filterDate.value !== '') {
      filters.fechaInicio = filterDate.value
      filters.fechaFin = filterDate.value
    } else if (fechaInicioParam && fechaFinParam) {
      filters.fechaInicio = fechaInicioParam
      filters.fechaFin = fechaFinParam
    }

    if (servicioFiltroId.value) {
      filters.servicioId = servicioFiltroId.value
    }

    // (debug) Ver URL final
    const queryParams = new URLSearchParams()
    for (const key in filters) {
      const value = filters[key as keyof FetchTurnosFilters]
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    }
    const apiUrl = `http://localhost:3333/api/turnos-rtm?${queryParams.toString()}`
    console.log('Fetching from URL:', apiUrl)

    const data = await TurnosDelDiaService.fetchTurnos(
      filters as Record<string, string | number | boolean>
    ) as Turno[]

    // Normalizar fecha (YYYY-MM-DD) para ordenar
    turnos.value = data.map((turno) => {
      const normalized = { ...turno }
      if (normalized.fecha && typeof normalized.fecha === 'string' && normalized.fecha.includes('T')) {
        normalized.fecha = normalized.fecha.split('T')[0]
      }
      return normalized
    })

    showSnackbar('Turnos cargados correctamente.', 'success')
  } catch (error: unknown) {
    console.error('Error al cargar turnos:', error)
    let message = 'Error al cargar los turnos. Intente recargar la página.'
    if (error instanceof Error) {
      message = error.message
    }
    showSnackbar(message, 'error')
    turnos.value = []
  } finally {
    isLoading.value = false
  }
}

const applyFilters = () => fetchTurnosFromApi()

const clearFilters = () => {
  searchPlaca.value = undefined
  searchTurnoNumero.value = null
  filterDate.value = undefined
  servicioFiltroId.value = null
  fetchTurnosFromApi()
}

const viewTurnoDetails = (id: number) => {
  router.push(`/rtm/editar-turno/${id}`)
}

const goToReporteCaptacion = () => {
  router.push('/rtm/contador-captacion')
}

const setTodayAndFilter = () => {
  const today = DateTime.local().setZone('America/Bogota')
  filterDate.value = today.toISODate() ?? undefined
  searchPlaca.value = undefined
  searchTurnoNumero.value = null
  fetchTurnosFromApi()
}

const setMonthAndFilter = () => {
  const today = DateTime.local().setZone('America/Bogota')
  const firstDayOfMonth = today.startOf('month').toISODate() ?? undefined
  const lastDayOfMonth = today.endOf('month').toISODate() ?? undefined

  searchPlaca.value = undefined
  searchTurnoNumero.value = null
  filterDate.value = undefined

  fetchTurnosFromApi(firstDayOfMonth, lastDayOfMonth)
}

onMounted(async () => {
  await loadServicios()
  fetchTurnosFromApi()
})
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
  box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 0 0 2px black !important;
}

.bordered-button:hover,
.bordered-button-info:hover,
.bordered-button-cyan:hover,
.bordered-button-grey:hover,
.bordered-button-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2), 0 0 0 3px black !important;
}

/* Número de turno: destacado y centrado */
.turno-number-display {
  font-weight: bold;
  font-size: 1.1em;
  color: var(--v-theme-primary);
  display: block;
  text-align: center;
  padding: 2px 0;
}

/* Diferenciar el # por servicio */
.turno-number-svc {
  color: var(--v-theme-secondary);
}

/* Evitar salto de línea y asegurar ancho suficiente en fecha/hora */
.nowrap { white-space: nowrap; display: inline-block; }
.col-fecha { min-width: 140px; }
.col-hora  { min-width: 140px; }

/* Scroll horizontal opcional para la tabla */
.table-scroll-x { overflow-x: auto; }
</style>
