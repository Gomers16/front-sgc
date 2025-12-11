<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-4 pa-sm-6 pa-md-8 rounded-xl">
      <v-card-title
        class="text-h5 text-sm-h4 mb-4 mb-sm-6 font-weight-bold d-flex justify-center title-full-bordered-container"
      >
        <span class="title-text-with-border">
          🔍 Histórico<span class="d-none d-sm-inline"> y Estado</span> de Turnos
        </span>
      </v-card-title>

      <!-- FILTROS -->
      <v-row class="mb-2">
        <v-col cols="12" md="6" class="d-flex align-center flex-wrap">
          <span class="mr-2 mr-sm-3 text-caption text-sm-body-2 text-medium-emphasis">
            Rápidos:
          </span>
          <v-chip
            class="mr-2 mb-2"
            :size="$vuetify.display.xs ? 'small' : 'default'"
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
            :size="$vuetify.display.xs ? 'small' : 'default'"
            color="primary"
            @click="setServicioFiltro(s.value)"
            :variant="servicioFiltroId === s.value ? 'flat' : 'outlined'"
          >
            {{ s.label }}
          </v-chip>
        </v-col>
      </v-row>

      <v-row class="mb-2 mb-sm-4">
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            v-model="searchPlaca"
            label="Buscar por Placa"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            v-model="searchTurnoNumero"
            label="Buscar por Turno #"
            prepend-inner-icon="mdi-numeric"
            variant="outlined"
            density="compact"
            clearable
            type="number"
          />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            v-model="filterDate"
            label="Filtrar por Fecha"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            density="compact"
            type="date"
            clearable
          />
        </v-col>

        <v-col cols="12" class="d-flex flex-wrap justify-end align-center">
          <!-- Botones con texto abreviado en móvil -->
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-filter"
            @click="applyFilters"
            :loading="isLoading"
            :block="$vuetify.display.xs"
            class="mb-2 mr-0 mr-sm-4 bordered-button"
            :size="$vuetify.display.xs ? 'small' : 'default'"
          >
            <span v-if="$vuetify.display.xs">Filtrar</span>
            <span v-else>Aplicar Filtros</span>
          </v-btn>

          <v-btn
            color="grey"
            variant="outlined"
            prepend-icon="mdi-close-circle-outline"
            class="mb-2 mr-0 mr-sm-4 bordered-button-grey"
            :block="$vuetify.display.xs"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="clearFilters"
          >
            Limpiar
          </v-btn>

          <v-btn
            color="info"
            variant="outlined"
            prepend-icon="mdi-calendar-today"
            @click="setTodayAndFilter"
            :block="$vuetify.display.xs"
            class="mb-2 mr-0 mr-sm-4 bordered-button-info"
            :size="$vuetify.display.xs ? 'small' : 'default'"
          >
            <span v-if="$vuetify.display.xs">Hoy</span>
            <span v-else>Ver Turnos de Hoy</span>
          </v-btn>

          <v-btn
            color="cyan-darken-1"
            variant="outlined"
            prepend-icon="mdi-calendar-month"
            @click="setMonthAndFilter"
            :block="$vuetify.display.xs"
            class="mb-2 mr-0 mr-sm-4 bordered-button-cyan"
            :size="$vuetify.display.xs ? 'small' : 'default'"
          >
            <span v-if="$vuetify.display.xs">Mes</span>
            <span v-else>Ver Turnos del Mes</span>
          </v-btn>

          <v-btn
            color="secondary"
            variant="elevated"
            prepend-icon="mdi-chart-bar"
            :block="$vuetify.display.xs"
            class="mb-2 mr-0 mr-sm-4 bordered-button-secondary"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="goToReporteCaptacion"
          >
            <span v-if="$vuetify.display.xs">Reporte</span>
            <span v-else>Reporte por Captación</span>
          </v-btn>

          <v-btn
            color="deep-purple"
            variant="elevated"
            prepend-icon="mdi-file-import"
            :block="$vuetify.display.xs"
            class="mb-2 bordered-button-secondary"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="openImportDialog"
          >
            <span v-if="$vuetify.display.xs">Importar</span>
            <span v-else>Importar RepGeneral</span>
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-4 my-sm-6" />

      <!-- TABLA -->
      <div class="table-scroll-x">
        <v-data-table
          :headers="headersResponsive"
          :items="turnos"
          :loading="isLoading"
          loading-text="Cargando histórico de turnos..."
          no-data-text="No hay turnos para mostrar con los filtros aplicados."
          class="elevation-1"
          :sort-by="defaultSort"
          :density="$vuetify.display.xs ? 'compact' : 'default'"
        >
          <!-- Turno # global -->
          <template #item.turnoNumero="{ item }">
            <span class="turno-number-display">
              {{ item.turnoNumero }}
            </span>
          </template>

          <!-- Turno # por servicio -->
          <template #item.turnoNumeroServicio="{ item }">
            <span class="turno-number-display turno-number-svc">
              {{ item.turnoNumeroServicio ?? '—' }}
            </span>
          </template>

          <!-- Fecha -->
          <template #item.fecha="{ item }">
            <span class="nowrap col-fecha text-caption text-sm-body-2">
              {{ formatDate(item.fecha) }}
            </span>
          </template>

          <!-- Hora ingreso -->
          <template #item.horaIngreso="{ item }">
            <span class="nowrap col-hora text-caption text-sm-body-2">
              {{ formatTime(item.horaIngreso ?? '') }}
            </span>
          </template>

          <!-- Placa -->
          <template #item.placa="{ item }">
            <span class="font-weight-bold text-caption text-sm-body-2">
              {{ item.placa }}
            </span>
          </template>

          <!-- Tipo vehículo -->
          <template #item.tipoVehiculo="{ item }">
            <v-chip
              :size="$vuetify.display.xs ? 'x-small' : 'small'"
              color="grey-darken-1"
              variant="outlined"
            >
              {{ item.tipoVehiculo ?? '—' }}
            </v-chip>
          </template>

          <!-- Servicio (solo código: PERI / SOAT / RTM / PREV) -->
          <template #item.servicio="{ item }">
            <v-chip
              :size="$vuetify.display.xs ? 'x-small' : 'small'"
              color="primary"
              variant="flat"
              class="font-weight-bold"
            >
              {{ getServicioCodigo(item) }}
            </v-chip>
          </template>

          <!-- Estado -->
          <template #item.estado="{ item }">
            <v-chip
              :color="getTurnoStatusColor(item.estado)"
              dark
              :size="$vuetify.display.xs ? 'x-small' : 'small'"
            >
              {{ getTurnoStatusText(item.estado) }}
            </v-chip>
          </template>

          <!-- Visita: abre modal de historial -->
          <template #item.visitaVehiculoTexto="{ item }">
            <v-chip
              :size="$vuetify.display.xs ? 'x-small' : 'small'"
              color="teal"
              variant="outlined"
              class="cursor-pointer"
              @click="openVisitasModal(item)"
            >
              {{ item.visitaVehiculoTexto || '—' }}
            </v-chip>
          </template>

          <!-- Captación -->
          <template #item.captacion="{ item }">
            <v-chip
              v-if="item.canalAtribucion"
              :size="$vuetify.display.xs ? 'x-small' : 'small'"
              color="purple"
              variant="flat"
              prepend-icon="mdi-clipboard-text-clock"
            >
              {{ getCaptacionLabel(item) }}
            </v-chip>
            <span v-else class="text-caption">—</span>
          </template>

          <!-- Acciones -->
          <template #item.actions="{ item }">
            <v-btn
              color="info"
              variant="text"
              :size="$vuetify.display.xs ? 'x-small' : 'small'"
              @click="openDetails(item)"
            >
              <span v-if="$vuetify.display.smAndUp">Ver</span>
              <v-icon :size="$vuetify.display.xs ? 'small' : 'default'">
                mdi-eye
              </v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <!-- Detalle de turno -->
    <v-dialog
      v-model="detailsDialog"
      :max-width="$vuetify.display.xs ? '100%' : '800'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-sm-h6 font-weight-bold pa-3 pa-sm-4">
          Detalle del turno #{{ selectedTurno?.turnoNumero ?? '—' }}
        </v-card-title>

        <v-card-text v-if="selectedTurno" class="pa-3 pa-sm-4">
          <v-row>
            <v-col cols="12" md="6">
              <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                Datos generales
              </h4>
              <p class="text-caption text-sm-body-2">
                <strong>Fecha:</strong> {{ formatDate(selectedTurno.fecha) }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Hora ingreso:</strong>
                {{ formatTime(selectedTurno.horaIngreso) }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Hora salida:</strong> {{ selectedTurno.horaSalida || '—' }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Tiempo servicio:</strong>
                {{ selectedTurno.tiempoServicio || '—' }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Estado:</strong>
                {{ getTurnoStatusText(selectedTurno.estado) }}
              </p>
            </v-col>

            <v-col cols="12" md="6">
              <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                Vehículo y servicio
              </h4>
              <p class="text-caption text-sm-body-2">
                <strong>Placa:</strong> {{ selectedTurno.placa }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Color:</strong> {{ getVehiculoColor(selectedTurno) }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Tarjeta de propiedad:</strong>
                {{ getVehiculoMatricula(selectedTurno) }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Tipo vehículo:</strong> {{ selectedTurno.tipoVehiculo || '—' }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Servicio:</strong>
                {{ getServicioCodigo(selectedTurno) || '—' }}
              </p>
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <v-row>
            <v-col cols="12" md="6">
              <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                Cliente (propietario)
              </h4>
              <p class="text-caption text-sm-body-2">
                <strong>Nombre:</strong> {{ getClienteNombre(selectedTurno) }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Teléfono:</strong> {{ getClienteTelefono(selectedTurno) }}
              </p>

              <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2 mt-4">
                Conductor
              </h4>
              <p class="text-caption text-sm-body-2">
                <strong>Nombre:</strong> {{ getConductorNombre(selectedTurno) }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Teléfono:</strong> {{ getConductorTelefono(selectedTurno) }}
              </p>
            </v-col>

            <v-col cols="12" md="6">
              <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                Captación
              </h4>
              <p class="text-caption text-sm-body-2">
                <strong>Canal:</strong>
                {{ prettifyCanal(selectedTurno.canalAtribucion) }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Agente:</strong>
                <span v-if="selectedTurno.agenteCaptacion?.id">
                  {{ selectedTurno.agenteCaptacion.nombre }}
                  ({{ prettifyAgenteTipo(selectedTurno.agenteCaptacion.tipo) }})
                </span>
                <span v-else>—</span>
              </p>
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <v-row>
            <v-col cols="12" md="6">
              <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                Historial de visitas
              </h4>
              <p class="text-caption text-sm-body-2">
                <strong>Visita:</strong>
                {{ selectedTurno.visitaVehiculoTexto || '—' }}
              </p>
            </v-col>

            <v-col cols="12" md="6">
              <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                Operación
              </h4>
              <p class="text-caption text-sm-body-2">
                <strong>Usuario:</strong> {{ getUsuarioNombre(selectedTurno) }}
              </p>
              <p class="text-caption text-sm-body-2">
                <strong>Sede:</strong> {{ selectedTurno.sede?.nombre ?? '—' }}
              </p>

              <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2 mt-4">
                Observaciones
              </h4>
              <p class="text-caption text-sm-body-2">
                {{ selectedTurno.observaciones || '—' }}
              </p>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-3 pa-sm-4">
          <v-spacer />
          <v-btn
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="detailsDialog = false"
          >
            Cerrar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="goToEditSelected"
          >
            <span v-if="$vuetify.display.xs">Editar</span>
            <span v-else>Ir a edición</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL HISTORIAL DE VISITAS (por placa) -->
    <v-dialog
      v-model="visitasDialog"
      :max-width="$vuetify.display.xs ? '100%' : '700'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-sm-h6 font-weight-bold pa-3 pa-sm-4">
          Historial de visitas
        </v-card-title>

        <v-card-text class="pa-3 pa-sm-4">
          <p class="mb-3 mb-sm-4 text-caption text-sm-body-2">
            <strong>Placa:</strong> {{ visitasPlacaActual || '—' }}
          </p>

          <div v-if="visitasHistorial.length">
            <v-table
              :density="$vuetify.display.xs ? 'compact' : 'default'"
              class="text-caption text-sm-body-2"
            >
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Servicio</th>
                  <th># Visita</th>
                  <th class="d-none d-sm-table-cell">Fecha</th>
                  <th class="d-none d-md-table-cell">Cliente</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="v in visitasHistorial"
                  :key="v.id"
                  :class="{ 'row-actual': v.id === visitasTurnoActualId }"
                >
                  <td>{{ visitasPlacaActual }}</td>
                  <td>{{ v.servicioCodigo || '—' }}</td>
                  <td>{{ v.orden }}</td>
                  <td class="d-none d-sm-table-cell">{{ v.fechaStr }}</td>
                  <td class="d-none d-md-table-cell">{{ v.clienteNombre || '—' }}</td>
                </tr>
              </tbody>
            </v-table>
            <small class="text-caption d-block mt-2">
              La fila resaltada corresponde al turno seleccionado.
            </small>
          </div>
          <div v-else class="text-caption text-sm-body-2">
            No hay historial de visitas para esta placa.
          </div>
        </v-card-text>

        <v-card-actions class="pa-3 pa-sm-4">
          <v-spacer />
          <v-btn
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="visitasDialog = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL IMPORTAR REPGENERAL -->
    <v-dialog
      v-model="importDialog"
      :max-width="$vuetify.display.xs ? '100%' : '650'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-sm-h6 font-weight-bold pa-3 pa-sm-4">
          Importar RepGeneral (CSV)
        </v-card-title>

        <v-card-text class="pa-3 pa-sm-4">
          <p class="mb-3 mb-sm-4 text-caption text-sm-body-2">
            Selecciona el archivo <strong>.csv</strong> generado por el CDA (RepGeneral)
            para actualizar clientes, vehículos y conductores en el sistema.
          </p>

          <v-file-input
            v-model="importFile"
            label="Archivo RepGeneral (.csv)"
            accept=".csv"
            prepend-icon="mdi-file-delimited"
            :density="$vuetify.display.xs ? 'compact' : 'default'"
            show-size
            clearable
            :disabled="importLoading"
          />

          <v-btn
            color="primary"
            class="mt-3 mt-sm-4"
            prepend-icon="mdi-upload"
            :loading="importLoading"
            :disabled="importLoading"
            :block="$vuetify.display.xs"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="handleImportRepGeneral"
          >
            Importar
          </v-btn>

          <div v-if="importResult" class="mt-4 mt-sm-6">
            <v-alert
              :type="importResult.ok ? 'success' : 'warning'"
              border="start"
              variant="tonal"
              :density="$vuetify.display.xs ? 'compact' : 'default'"
            >
              <div class="mb-2 text-caption text-sm-body-2">
                <strong>{{ importResult.message }}</strong>
              </div>
              <div class="text-caption text-sm-body-2">
                <p>Clientes creados: {{ importResult.resumen.clientesCreados }}</p>
                <p>Clientes actualizados: {{ importResult.resumen.clientesActualizados }}</p>
                <p>Vehículos creados: {{ importResult.resumen.vehiculosCreados }}</p>
                <p>Vehículos actualizados: {{ importResult.resumen.vehiculosActualizados }}</p>
                <p>Conductores creados: {{ importResult.resumen.conductoresCreados }}</p>
                <p>Filas con errores: {{ importResult.resumen.errores }}</p>
              </div>
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions class="pa-3 pa-sm-4">
          <v-spacer />
          <v-btn
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :disabled="importLoading"
            @click="importDialog = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { DateTime } from 'luxon'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import repGeneralService, { RepGeneralImportResponse } from '@/services/repGeneralService'

interface ServicioEnTurno {
  id: number
  codigoServicio: string
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
  color?: string | null
  matricula?: string | null
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
interface ConductorMin {
  id: number
  nombre: string
  telefono?: string | null
}
interface AgenteCaptacionMin {
  id: number
  nombre: string
  tipo: string
}
interface CaptacionDateoMin {
  id: number
  canal: string
  consumidoAt?: string | null
}

type EstadoTurno = 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
type CanalAtrib = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES' | string

interface HistVisit {
  id: number
  fechaStr: string
  clienteNombre: string | null
  servicioCodigo?: string | null
}

interface Turno {
  id: number
  turnoNumero: number
  turnoNumeroServicio?: number | null
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
  tiempoServicio: string | null
  placa: string
  tipoVehiculo: string
  medioEntero?: string | null
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

  conductorId?: number | null
  conductor?: ConductorMin | null

  canalAtribucion?: CanalAtrib
  agenteCaptacionId?: number | null
  agenteCaptacion?: AgenteCaptacionMin | null
  captacionDateoId?: number | null
  captacionDateo?: CaptacionDateoMin | null

  visitaVehiculoNumero?: number | null
  visitaVehiculoTexto?: string | null
  visitaVehiculoUltimasFechas?: string[]
  visitasVehiculoDetalle?: HistVisit[]

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
const { xs, smAndUp, mdAndUp } = useDisplay()

const turnos = ref<Turno[]>([])
const isLoading = ref(false)

const searchPlaca = ref<string | null | undefined>(undefined)
const searchTurnoNumero = ref<number | null>(null)
const filterDate = ref<string | null | undefined>(undefined)

const serviciosItems = ref<Array<{ title: string; value: number }>>([])
const serviciosLoading = ref<boolean>(false)
const servicioFiltroId = ref<number | null>(null)

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

const detailsDialog = ref(false)
const selectedTurno = ref<Turno | null>(null)

const visitasDialog = ref(false)
const visitasTurnoActualId = ref<number | null>(null)
const visitasHistorial = ref<Array<HistVisit & { orden: number }>>([])
const visitasPlacaActual = ref<string>('')

const importDialog = ref(false)
const importFile = ref<File | File[] | null>(null)
const importLoading = ref(false)
const importResult = ref<RepGeneralImportResponse | null>(null)

// HEADERS RESPONSIVE
const headersResponsive = computed(() => {
  // Móvil (xs): Solo columnas esenciales
  if (xs.value) {
    return [
      { title: '#', key: 'turnoNumero', align: 'center' as const },
      { title: 'Placa', key: 'placa' },
      { title: 'Svc', key: 'servicio' },
      { title: 'Estado', key: 'estado' },
      { title: '', key: 'actions', sortable: false, align: 'center' as const },
    ]
  }

  // Tablet (sm): Columnas intermedias
  if (smAndUp.value && !mdAndUp.value) {
    return [
      { title: 'Turno #', key: 'turnoNumero', align: 'center' as const },
      { title: 'Fecha', key: 'fecha' },
      { title: 'Placa', key: 'placa' },
      { title: 'Tipo', key: 'tipoVehiculo' },
      { title: 'Servicio', key: 'servicio' },
      { title: 'Estado', key: 'estado' },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center' as const },
    ]
  }

  // Desktop (md+): Todas las columnas
  return [
    { title: 'Turno #', key: 'turnoNumero', align: 'center' as const },
    { title: 'Svc #', key: 'turnoNumeroServicio', align: 'center' as const },
    { title: 'Fecha', key: 'fecha' },
    { title: 'Hora Ingreso', key: 'horaIngreso' },
    { title: 'Placa', key: 'placa' },
    { title: 'Tipo Vehículo', key: 'tipoVehiculo' },
    { title: 'Servicio', key: 'servicio' },
    { title: 'Estado', key: 'estado' },
    { title: 'Visita', key: 'visitaVehiculoTexto' },
    { title: 'Captación', key: 'captacion' },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'center' as const },
  ]
})

const defaultSort = [
  { key: 'fecha', order: 'desc' as const },
  { key: 'turnoNumero', order: 'desc' as const },
]

const serviciosChips = computed(() =>
  serviciosItems.value.map((s) => {
    const code = s.title.split('—')[0].trim()
    return { label: code, value: s.value }
  })
)

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

const getServicioCodigo = (t: Turno): string => {
  const s = t.servicio
  if (!s) return '—'
  return s.codigoServicio
}

const prettifyCanal = (canal?: CanalAtrib): string => {
  switch ((canal || '').toUpperCase()) {
    case 'FACHADA': return 'Fachada'
    case 'ASESOR': return 'Asesor Comercial'
    case 'TELE': return 'Call Center'
    case 'REDES': return 'Redes Sociales'
    default: return canal || '—'
  }
}

const prettifyAgenteTipo = (tipo?: string): string => {
  const t = (tipo || '').toUpperCase()
  switch (t) {
    case 'ASESOR_INTERNO': return 'Asesor Interno'
    case 'ASESOR_EXTERNO': return 'Asesor Externo'
    case 'ASESOR_COMERCIAL':
    case 'ASESOR_CONVENIO': return 'Asesor Comercial'
    case 'TELEMERCADEO': return 'Telemercadeo'
    default: return tipo || '—'
  }
}

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

const getVehiculoColor = (t: Turno): string =>
  t.vehiculo?.color || '—'

const getVehiculoMatricula = (t: Turno): string =>
  t.vehiculo?.matricula || '—'

const getConductorNombre = (t: Turno): string => {
  const c = t.conductor
  if (!c) return '—'
  return c.nombre || '—'
}

const getConductorTelefono = (t: Turno): string =>
  t.conductor?.telefono || '—'

const getUsuarioNombre = (t: Turno): string => {
  const u = t.usuario
  if (!u) return '—'
  const nombre = [u.nombres, u.apellidos].filter(Boolean).join(' ').trim()
  return nombre || `Usuario #${u.id}`
}

const getCaptacionLabel = (t: Turno): string => {
  const canal = (t.canalAtribucion || '').toUpperCase()
  if (!canal) return 'Sin captación'

  if (canal === 'ASESOR') {
    const tipo = prettifyAgenteTipo(t.agenteCaptacion?.tipo)
    if (t.agenteCaptacion?.nombre) {
      return `Asesor — ${t.agenteCaptacion.nombre}${
        tipo && tipo !== '—' ? ` (${tipo})` : ''
      }`
    }
    return 'Asesor'
  }

  return prettifyCanal(canal)
}

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

const loadServicios = async () => {
  serviciosLoading.value = true
  try {
    const data = await TurnosDelDiaService.getServicios()
    serviciosItems.value = (data || []).map((s: any) => ({
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

const setServicioFiltro = (id: number | null) => {
  servicioFiltroId.value = id
  applyFilters()
}

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

    const data = await TurnosDelDiaService.fetchTurnos(
      filters as Record<string, string | number | boolean>
    ) as Turno[]

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

const openDetails = (t: Turno) => {
  selectedTurno.value = t
  detailsDialog.value = true
}

const goToEditSelected = () => {
  if (!selectedTurno.value) return
  router.push(`/rtm/editar-turno/${selectedTurno.value.id}`)
}

const openVisitasModal = (t: Turno) => {
  visitasTurnoActualId.value = t.id
  visitasPlacaActual.value = t.placa

  const detalle = t.visitasVehiculoDetalle || []
  visitasHistorial.value = detalle.map((v, idx) => ({
    ...v,
    orden: idx + 1,
  }))

  visitasDialog.value = true
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

const openImportDialog = () => {
  importDialog.value = true
  importFile.value = null
  importResult.value = null
}

const handleImportRepGeneral = async () => {
  const value = importFile.value
  let file: File | null = null
  if (value instanceof File) {
    file = value
  } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
    file = value[0]
  }

  if (!file) {
    showSnackbar('Por favor selecciona un archivo CSV antes de importar.', 'warning')
    return
  }

  importLoading.value = true
  importResult.value = null

  try {
    const resp = await repGeneralService.importarRepGeneral(file)
    importResult.value = resp

    if (resp.ok) {
      showSnackbar(resp.message || 'Importación realizada correctamente.', 'success')
      await fetchTurnosFromApi()
    } else {
      showSnackbar(resp.message || 'La importación terminó con advertencias.', 'warning')
    }
  } catch (error: unknown) {
    console.error('Error al importar RepGeneral:', error)
    let msg = 'Error al importar RepGeneral. Revisa el archivo e intenta nuevamente.'
    if (error instanceof Error && error.message) {
      msg = error.message
    }
    showSnackbar(msg, 'error')
  } finally {
    importLoading.value = false
  }
}

onMounted(async () => {
  await loadServicios()
  fetchTurnosFromApi()
})
</script>

<style scoped>
.title-full-bordered-container {
  padding: 0 !important;
}

.title-text-with-border {
  border: 2px solid black;
  padding: 8px 16px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16px;
  display: inline-block;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: var(--v-theme-primary);
  font-size: 1.1rem;
}

@media (min-width: 600px) {
  .title-text-with-border {
    padding: 10px 20px;
    margin-bottom: 24px;
    font-size: 1.5rem;
  }
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
.bordered-button-secondary {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 3px 5px rgba(0,0,0,0.1), 0 0 0 2px black !important;
}

@media (min-width: 600px) {
  .bordered-button,
  .bordered-button-info,
  .bordered-button-cyan,
  .bordered-button-grey,
  .bordered-button-secondary {
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 0 0 2px black !important;
  }
}

.bordered-button:hover,
.bordered-button-info:hover,
.bordered-button-cyan:hover,
.bordered-button-grey:hover,
.bordered-button-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2), 0 0 0 3px black !important;
}

.turno-number-display {
  font-weight: bold;
  font-size: 0.95em;
  color: var(--v-theme-primary);
  display: block;
  text-align: center;
  padding: 2px 0;
}

@media (min-width: 600px) {
  .turno-number-display {
    font-size: 1.1em;
  }
}

.turno-number-svc {
  color: var(--v-theme-secondary);
}

.nowrap {
  white-space: nowrap;
  display: inline-block;
}

.col-fecha {
  min-width: 100px;
}

.col-hora {
  min-width: 100px;
}

@media (min-width: 600px) {
  .col-fecha {
    min-width: 140px;
  }

  .col-hora {
    min-width: 140px;
  }
}

.table-scroll-x {
  overflow-x: auto;
}

.cursor-pointer {
  cursor: pointer;
}

.row-actual {
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
