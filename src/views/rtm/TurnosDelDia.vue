<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl bg-background-light">
      <v-card-title
        class="text-h4 mb-6 font-weight-bold d-flex justify-center title-full-bordered-container"
      >
        <span class="title-text-with-border">
          📋 Turnos de Hoy
          <span class="text-secondary">(HOY - {{ todayDate }})</span>
        </span>
      </v-card-title>

      <v-row class="mb-4 align-center">
        <v-col cols="12" sm="6" md="3">
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

        <!-- Filtro por servicio -->
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="servicioFiltro"
            :items="servicioFiltroItems"
            label="Filtrar por servicio"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-filter-variant"
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="3" class="text-sm-right text-md-center">
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

        <v-col cols="12" sm="6" md="3" class="text-md-right">
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

      <v-divider class="my-6" />

      <!-- Loading -->
      <v-row v-if="isLoading" class="justify-center my-10">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-center text-subtitle-1 mt-4">
          Cargando turnos del día...
        </p>
      </v-row>

      <!-- Sin turnos -->
      <v-row v-else-if="turnosFiltrados.length === 0" class="justify-center my-10">
        <v-col cols="12" class="text-center">
          <v-icon size="64" color="grey-lighten-1">
            mdi-inbox-remove-outline
          </v-icon>
          <p class="text-h6 text-grey-darken-1 mt-4">
            No hay turnos para hoy con el filtro seleccionado.
          </p>
          <p class="text-body-1 text-grey-darken-1">
            ¡Es un buen momento para crear uno nuevo!
          </p>
        </v-col>
      </v-row>

      <!-- Tarjetas -->
      <v-row v-else>
        <v-col
          v-for="turno in turnosFiltrados"
          :key="turno.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="turno-card pa-4 rounded-lg elevation-4"
            :color="cardColor(turno.estado)"
            :class="`estado-${turno.estado}`"
          >
            <v-card-title class="text-h6 font-weight-bold pb-1 text-on-primary-text">
              🔢 Turno: {{ displayTurnoNumero(turno) }}
            </v-card-title>

            <!-- Turno del servicio (RTM / SOAT / PREV / PERI) -->
            <div class="text-subtitle-2 mb-2 font-weight-medium text-on-primary-text">
              {{ getServicioCodigo(turno) }}:
              <span class="font-weight-bold">
                {{ displayTurnoServicio(turno) }}
              </span>
            </div>

            <v-card-text>
              <!-- Chip de estado -->
              <v-chip
                class="mb-3"
                size="small"
                :color="estadoChipColor(turno.estado)"
                variant="elevated"
                label
              >
                {{ estadoChipLabel(turno.estado) }}
              </v-chip>

              <p class="text-subtitle-1 text-on-primary-text">
                🛠 Servicio:
                <span class="font-weight-medium">
                  {{ getServicioCodigo(turno) }}
                </span>
              </p>
              <p class="text-subtitle-1 text-on-primary-text">
                🚗 Tipo Vehículo:
                <span class="font-weight-medium">
                  {{ turno.tipoVehiculo || 'Desconocido' }}
                </span>
              </p>
              <p class="text-subtitle-1 text-on-primary-text">
                🚗 Placa:
                <span class="font-weight-medium">{{ turno.placa }}</span>
              </p>
              <p class="text-subtitle-1 text-on-primary-text">
                ⏰ Ingreso:
                <span class="font-weight-medium">
                  {{ formatTime(turno.horaIngreso) }}
                </span>
              </p>

              <p class="text-subtitle-1 mt-3 font-weight-bold text-on-primary-text">
                📌 Etapas:
              </p>

              <v-list dense class="py-0 bg-transparent">
                <v-list-item
                  v-for="(etapa, i) in getEtapas(turno)"
                  :key="etapa.key || i"
                  class="py-0 px-0"
                >
                  <template #prepend>
                    <v-icon
                      :color="iconColor(etapa, turno)"
                      :class="{
                        'etapa-icon-completed-finalizado':
                          etapa.completed && turno.estado === 'finalizado',
                      }"
                    >
                      {{
                        etapa.completed
                          ? 'mdi-check-circle'
                          : 'mdi-circle-outline'
                      }}
                    </v-icon>
                  </template>

                  <div class="etapa-row">
                    <div class="etapa-label">
                      <template v-if="etapa.name === 'Facturación'">
                        <v-btn
                          variant="text"
                          color="button-text-light-secondary"
                          class="pa-0 text-capitalize text-on-primary-text"
                          @click.stop="goToFacturacion(turno)"
                        >
                          Facturación
                        </v-btn>
                      </template>

                      <template v-else-if="etapa.name === 'Certificación'">
                        <v-btn
                          variant="text"
                          color="button-text-light-secondary"
                          class="pa-0 text-capitalize text-on-primary-text"
                          @click.stop="goToCertificacion(turno)"
                        >
                          Certificación
                        </v-btn>
                      </template>

                      <span
                        v-else
                        :class="{
                          'text-decoration-line-through text-on-primary-text-faded':
                            etapa.completed && etapa.name !== 'Puerta',
                        }"
                        class="text-on-primary-text"
                      >
                        {{ etapa.name }}
                      </span>
                    </div>

                    <span
                      v-if="etapa.time"
                      class="text-on-primary-text-faded etapa-time"
                    >
                      {{ formatTime(etapa.time) }}
                    </span>
                  </div>
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

    <!-- Diálogo confirmar acción -->
    <v-dialog v-model="confirmDialog.show" max-width="500">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          {{ confirmDialog.title }}
        </v-card-title>
        <v-card-text>
          {{ confirmDialog.message }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="confirmDialog.show = false">
            Cancelar
          </v-btn>
          <v-btn
            :color="confirmDialog.color"
            variant="elevated"
            @click="handleConfirmAction"
            class="bordered-dialog-button"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal estadísticas -->
    <v-dialog v-model="showStatsModal" max-width="1000" content-class="elevation-24">
      <v-card class="rounded-xl bg-white">
        <v-card-title class="text-h5 text-center text-primary font-weight-bold py-4">
          📊 Estadísticas de Turnos (Hoy)
        </v-card-title>
        <v-card-text>
          <p class="text-h6 mb-1 text-center">
            Total de turnos visibles hoy (excepto inactivos):
            <strong>{{ turnos.length }}</strong>
          </p>
          <p class="text-body-2 text-center text-grey-darken-1">
            Incluye turnos en proceso, finalizados y cancelados.
          </p>

          <v-row class="mt-4">
            <!-- Resumen por estado -->
            <v-col cols="12" md="4">
              <v-card variant="outlined" class="pa-4 h-100">
                <v-card-title class="text-h6 text-secondary">
                  Por Estado
                </v-card-title>
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title>En proceso</v-list-item-title>
                    <template #append>
                      <v-chip color="amber" label>
                        {{ conteoPorEstado.enProceso }}
                      </v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Finalizados</v-list-item-title>
                    <template #append>
                      <v-chip color="light-green-accent-4" label>
                        {{ conteoPorEstado.finalizados }}
                      </v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Cancelados</v-list-item-title>
                    <template #append>
                      <v-chip color="red-accent-2" label>
                        {{ conteoPorEstado.cancelados }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Resumen por servicio + tipo de vehículo -->
            <v-col cols="12" md="8">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 text-secondary">
                  Por Servicio y Tipo de Vehículo
                </v-card-title>

                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th class="text-center">Total</th>
                      <th class="text-center">Liv. Particular</th>
                      <th class="text-center">Liv. Taxi</th>
                      <th class="text-center">Liv. Público</th>
                      <th class="text-center">Motocicleta</th>
                      <th class="text-center">Desconocido</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(stats, servicioCodigo) in servicioStats"
                      :key="servicioCodigo"
                    >
                      <td><strong>{{ servicioCodigo }}</strong></td>
                      <td class="text-center">{{ stats.total }}</td>
                      <td class="text-center">{{ stats.porTipo['Liviano Particular'] }}</td>
                      <td class="text-center">{{ stats.porTipo['Liviano Taxi'] }}</td>
                      <td class="text-center">{{ stats.porTipo['Liviano Público'] }}</td>
                      <td class="text-center">{{ stats.porTipo['Motocicleta'] }}</td>
                      <td class="text-center">{{ stats.porTipo['Desconocido'] }}</td>
                    </tr>
                    <tr v-if="Object.keys(servicioStats).length === 0">
                      <td colspan="7" class="text-center text-grey-darken-1">
                        No hay turnos para hoy.
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-row>
            <!-- Gráfico por tipo de vehículo -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 text-secondary">
                  Por Tipo de Vehículo
                </v-card-title>
                <div style="height: 250px">
                  <BarChart :data="chartDataTipoVehiculo" :options="chartOptions" />
                </div>
              </v-card>
            </v-col>

            <!-- Conteo por canal de captación / "¿Cómo nos conoció?" -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 text-secondary">
                  Canal de captación (¿Cómo nos conoció?)
                </v-card-title>
                <v-list density="compact">
                  <v-list-item
                    v-for="(count, medio) in statsData.medioEntero"
                    :key="medio"
                  >
                    <v-list-item-title class="font-weight-medium text-capitalize">
                      {{ medio }}:
                    </v-list-item-title>
                    <template #append>
                      <v-chip color="blue-grey" label>
                        {{ count }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end py-4">
          <v-btn
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-file-excel"
            @click="downloadExcelDia"
          >
            Descargar Excel del día
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="showStatsModal = false">
            Cerrar
          </v-btn>
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

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  type TooltipItem,
} from 'chart.js'
import { Bar as BarChart } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

/* ===== Tipos ===== */
type TipoVehiculoFrontend =
  | 'Liviano Particular'
  | 'Liviano Taxi'
  | 'Liviano Público'
  | 'Motocicleta'

type TipoVehiculoStatsKey =
  | TipoVehiculoFrontend
  | 'Desconocido'

const TIPO_VEHICULO_KEYS: TipoVehiculoStatsKey[] = [
  'Liviano Particular',
  'Liviano Taxi',
  'Liviano Público',
  'Motocicleta',
  'Desconocido',
]

// Etiquetas para canal de captación alineadas con "¿Cómo nos conoció?" en CrearTurno
type MedioCaptacionLabel = 'Redes Sociales' | 'Call Center' | 'Fachada' | 'Asesor' | 'Otros'

interface ServicioEnTurno {
  id: number
  codigoServicio: string
  nombreServicio: string
}

interface Turno {
  id: number
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
  tiempoServicio: string | null
  turnoNumero: number
  turnoNumeroServicio?: number | null
  turnoCodigo?: string
  placa: string
  tipoVehiculo: TipoVehiculoFrontend | null
  tieneCita: boolean
  convenio: string | null
  referidoInterno: string | null
  referidoExterno: string | null
  // Lo que venga de BD (viejo o nuevo): lo tratamos como string
  medioEntero: string | null
  observaciones: string | null
  funcionarioId: number
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'

  servicioId?: number | null
  servicio?: ServicioEnTurno | null
  servicioCodigo?: 'RTM' | 'SOAT' | 'PREV' | 'PERI' | string
  servicioNombre?: string

  funcionario?: {
    id: number
    nombres: string
    apellidos: string
  }
  createdAt: string
  updatedAt: string

  tieneFacturacion?: boolean | null
  horaFacturacion?: string | null
}

interface Etapa {
  key: string
  name: string
  completed: boolean
  time: string | null
}

/* ===== Estado ===== */
const router = useRouter()
const turnos = ref<Turno[]>([])
const isLoading = ref(true)
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

/* ===== Filtro por servicio ===== */
const servicioFiltro = ref<string>('TODOS')
const servicioFiltroItems = [
  { title: 'Todos los servicios', value: 'TODOS' },
  { title: 'RTM', value: 'RTM' },
  { title: 'SOAT', value: 'SOAT' },
  { title: 'Preventiva', value: 'PREV' },
  { title: 'Peritaje', value: 'PERI' },
]

const turnosFiltrados = computed(() => {
  return turnos.value.filter((t) => {
    if (servicioFiltro.value === 'TODOS') return true
    const codigo = getServicioCodigo(t).toUpperCase()
    return codigo === servicioFiltro.value.toUpperCase()
  })
})

/* ===== Conteo por estado ===== */
const conteoPorEstado = computed(() => {
  const res = {
    enProceso: 0,
    finalizados: 0,
    cancelados: 0,
  }

  turnos.value.forEach((t) => {
    if (t.estado === 'activo') res.enProceso++
    else if (t.estado === 'finalizado') res.finalizados++
    else if (t.estado === 'cancelado') res.cancelados++
  })

  return res
})

/* ===== Stats por servicio y tipo vehiculo (todos los visibles) ===== */
const servicioStats = computed(() => {
  const base: Record<
    string,
    { total: number; porTipo: Record<TipoVehiculoStatsKey, number> }
  > = {}

  turnos.value.forEach((t) => {
    const servicio = getServicioCodigo(t) || 'SIN_SERVICIO'
    if (!base[servicio]) {
      const porTipoInit = {} as Record<TipoVehiculoStatsKey, number>
      TIPO_VEHICULO_KEYS.forEach((k) => (porTipoInit[k] = 0))
      base[servicio] = {
        total: 0,
        porTipo: porTipoInit,
      }
    }

    const tipoKey: TipoVehiculoStatsKey =
      t.tipoVehiculo && TIPO_VEHICULO_KEYS.includes(t.tipoVehiculo as TipoVehiculoStatsKey)
        ? (t.tipoVehiculo as TipoVehiculoStatsKey)
        : 'Desconocido'

    base[servicio].total++
    base[servicio].porTipo[tipoKey]++
  })

  return base
})

/* ===== Confirm dialog editar/continuar ===== */
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  action: '',
  turno: null as Turno | null,
  color: 'primary',
})

const displayTurnoNumero = (turno: Turno) => {
  if (
    turno.estado === 'cancelado' ||
    turno.estado === 'inactivo' ||
    !turno.turnoNumero ||
    turno.turnoNumero <= 0
  ) {
    return '—'
  }
  return turno.turnoNumero
}

const displayTurnoServicio = (turno: Turno) => {
  const n = turno.turnoNumeroServicio ?? (turno as any).turno_numero_servicio ?? null
  if (
    turno.estado === 'cancelado' ||
    turno.estado === 'inactivo' ||
    !n ||
    n <= 0
  ) {
    return '—'
  }
  return n
}

const openConfirmDialog = (turno: Turno, action: 'editar' | 'continuar') => {
  confirmDialog.value = {
    show: true,
    turno,
    action,
    title: action === 'editar' ? 'Editar Turno' : 'Continuar Turno',
    message: `¿Está seguro que desea ${
      action === 'editar' ? 'editar' : 'continuar con'
    } el turno ${displayTurnoNumero(turno)}?`,
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
    router.push(`/rtm/proximamente`)
  }
}

/* ===== Ir a facturación / certificación ===== */
const goToFacturacion = (turno: Turno) => {
  router.push({
    path: '/facturacion/subir-ticket',
    query: { turnoId: String(turno.id) },
  })
}

const goToCertificacion = (turno: Turno) => {
  router.push({
    name: 'RtmCertificacion',
    params: { id: turno.id },
  })
}

/* ===== Helpers ===== */
const formatTime = (timeString: string | null): string => {
  if (!timeString) return ''
  let time: DateTime

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
    time = DateTime.fromFormat(
      timeString,
      timeString.length === 5 ? 'HH:mm' : 'HH:mm:ss',
      { zone: 'America/Bogota' }
    )
  } else {
    time = DateTime.fromISO(timeString, { zone: 'America/Bogota' })
  }

  return time.isValid ? time.toFormat('hh:mm a') : timeString ?? ''
}

const getServicioCodigo = (t: Turno): string => {
  return t.servicio?.codigoServicio ?? t.servicioCodigo ?? '—'
}

/* ===== Estado → label / colores ===== */
const cardColor = (estado: Turno['estado']) => {
  if (estado === 'finalizado') return 'success'
  if (estado === 'cancelado') return 'error'
  if (estado === 'inactivo') return 'grey-darken-1'
  return 'primary'
}

const estadoChipLabel = (estado: Turno['estado']) => {
  if (estado === 'finalizado') return 'Finalizado'
  if (estado === 'cancelado') return 'Cancelado'
  if (estado === 'inactivo') return 'Inactivo'
  return 'En proceso'
}

const estadoChipColor = (estado: Turno['estado']) => {
  if (estado === 'finalizado') return 'light-green-accent-3'
  if (estado === 'cancelado') return 'red-accent-2'
  if (estado === 'inactivo') return 'grey'
  return 'amber'
}

/* ===== Color del ícono de la etapa ===== */
const iconColor = (etapa: Etapa, turno: Turno) => {
  if (!etapa.completed) {
    return 'on-primary-text-light'
  }
  if (turno.estado === 'finalizado') {
    return 'white'
  }
  return 'success'
}

/* ===== Cargar turnos de hoy (incluye cancelados, excluye inactivos) ===== */
const loadTurnosHoy = async () => {
  isLoading.value = true
  try {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Bogota',
    }
    const formatter = new Intl.DateTimeFormat('es-CO', options)
    const parts = formatter.formatToParts(today)
    const year = parts.find((p) => p.type === 'year')?.value
    const month = parts.find((p) => p.type === 'month')?.value
    const day = parts.find((p) => p.type === 'day')?.value
    const todayISO = `${year}-${month}-${day}`

    const filters = { fecha: todayISO }
    const data = (await TurnosDelDiaService.fetchTurnos(filters)) as unknown as Turno[]

    turnos.value = data.filter((turno) => {
      const turnoFechaNormalizada = turno.fecha
        ? new Date(turno.fecha).toISOString().slice(0, 10)
        : ''
      const isToday = turnoFechaNormalizada === todayISO

      // mostramos todos los estados de hoy excepto inactivos
      const notInactivo = turno.estado !== 'inactivo'

      return isToday && notInactivo
    })

    showSnackbar('Turnos de hoy cargados correctamente.', 'success')
  } catch (error: unknown) {
    console.error('Error al cargar turnos del día:', error)
    let message = 'Error al cargar los turnos del día. Intente recargar la página.'
    if (error instanceof Error) {
      message = error.message
      if (
        message.includes('Sesión expirada') ||
        message.includes('no autorizada')
      ) {
        const authStore = authSetStore()
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

/* ===== Etapas (Puerta, Facturación, Certificación) ===== */
const getEtapas = (turno: Turno): Etapa[] => {
  const etapas: Etapa[] = [
    {
      key: `puerta-${turno.id}`,
      name: 'Puerta',
      completed: !!turno.horaIngreso,
      time: turno.horaIngreso,
    },
    {
      key: `facturacion-${turno.id}`,
      name: 'Facturación',
      completed: !!turno.tieneFacturacion,
      time: turno.horaFacturacion ?? null,
    },
    {
      key: `certificacion-${turno.id}`,
      name: 'Certificación',
      completed: !!turno.horaSalida,
      time: turno.horaSalida,
    },
  ]

  if (turno.estado === 'cancelado' || turno.estado === 'inactivo') {
    etapas.forEach((etapa) => (etapa.completed = false))
  }

  return etapas
}

/* ===== Stats ===== */
const showStatsModal = ref(false)
const statsData = ref({
  tipoVehiculo: {} as Record<TipoVehiculoStatsKey, number>,
  medioEntero: {
    'Redes Sociales': 0,
    'Call Center': 0,
    Fachada: 0,
    Asesor: 0,
    Otros: 0,
  } as Record<MedioCaptacionLabel, number>,
})

const initTipoVehiculoStats = () => {
  const base: Record<TipoVehiculoStatsKey, number> = {} as any
  TIPO_VEHICULO_KEYS.forEach((k) => (base[k] = 0))
  statsData.value.tipoVehiculo = base
}

// Mapea lo que viene en turno.medioEntero a nuestras etiquetas de canal de captación
const mapMedioToCanalCaptacion = (
  medio: Turno['medioEntero']
): MedioCaptacionLabel => {
  if (!medio) return 'Otros'
  const m = medio.toString().toLowerCase()

  // Posibles valores: "redes_sociales", "Redes Sociales", etc.
  if (m.includes('redes')) return 'Redes Sociales'
  if (m.includes('call') || m.includes('tele')) return 'Call Center'
  if (m.includes('fachada')) return 'Fachada'
  if (m.includes('asesor')) return 'Asesor'

  // Referidos / convenios los agrupamos como Asesor
  if (m.includes('referido') || m.includes('convenio')) return 'Asesor'

  return 'Otros'
}

const calculateStats = () => {
  initTipoVehiculoStats()
  statsData.value.medioEntero = {
    'Redes Sociales': 0,
    'Call Center': 0,
    Fachada: 0,
    Asesor: 0,
    Otros: 0,
  }

  turnos.value.forEach((turno) => {
    const tipoKey: TipoVehiculoStatsKey =
      turno.tipoVehiculo && TIPO_VEHICULO_KEYS.includes(turno.tipoVehiculo as TipoVehiculoStatsKey)
        ? (turno.tipoVehiculo as TipoVehiculoStatsKey)
        : 'Desconocido'
    statsData.value.tipoVehiculo[tipoKey]++

    const canal = mapMedioToCanalCaptacion(turno.medioEntero)
    statsData.value.medioEntero[canal]++
  })
}

const openStatsModal = () => {
  calculateStats()
  showStatsModal.value = true
}

/* ===== Descargar Excel del día ===== */
const downloadExcelDia = () => {
  try {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Bogota',
    }
    const formatter = new Intl.DateTimeFormat('es-CO', options)
    const parts = formatter.formatToParts(today)
    const year = parts.find((p) => p.type === 'year')?.value
    const month = parts.find((p) => p.type === 'month')?.value
    const day = parts.find((p) => p.type === 'day')?.value
    const todayISO = `${year}-${month}-${day}`

    // Ajusta el endpoint si en tu backend está en otra ruta
    const url = `/api/turnos-rtm/reporte/excel?fechaInicio=${todayISO}&fechaFin=${todayISO}`


    window.open(url, '_blank')
  } catch (error) {
    console.error('Error al descargar Excel del día:', error)
    showSnackbar('No se pudo descargar el Excel del día.', 'error')
  }
}

/* ===== Charts ===== */
const chartDataTipoVehiculo = computed(() => {
  const labels = TIPO_VEHICULO_KEYS
  const data = labels.map((k) => statsData.value.tipoVehiculo[k])
  const backgroundColors = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#9E9E9E']

  return {
    labels,
    datasets: [
      {
        label: 'Cantidad de Turnos',
        backgroundColor: backgroundColors,
        data,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
    tooltip: {
      callbacks: {
        label: function (context: TooltipItem<'bar'>) {
          const label = context.label || ''
          const value = context.parsed.y
          return `${label}: ${value}`
        },
      },
    },
  },
}

/* ===== Mounted ===== */
onMounted(() => {
  todayDate.value = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  initTipoVehiculoStats()
  loadTurnosHoy()
})
</script>

<style scoped>
.v-card {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08), 0 6px 6px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
}

/* Título con borde */
.title-full-bordered-container {
  padding: 0 !important;
}

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

.title-text-with-border .text-secondary {
  display: inline;
  margin-left: 8px;
  color: #4caf50;
}

/* Botones con borde */
.bordered-button,
.bordered-button-info,
.bordered-button-success {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 0 2px black !important;
}

.bordered-button:hover,
.bordered-button-info:hover,
.bordered-button-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 3px black !important;
}

/* Diálogo */
.bordered-dialog-button {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px black !important;
}
.bordered-dialog-button:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), 0 0 0 2px black !important;
}

/* Tarjetas de turno */
.turno-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border-radius: 12px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}
.turno-card:hover {
  transform: translateY(-7px);
  box-shadow: 0 18px 35px rgba(0, 0, 0, 0.3);
}

/* Acentos por estado */
.estado-cancelado {
  border: 2px solid #fca5a5;
}
.estado-finalizado {
  border: 2px solid #4ade80;
}
.estado-activo {
  border: 2px solid #38bdf8;
}

/* Textos sobre fondo primario/success/error */
.text-on-primary-text {
  color: rgb(var(--v-theme-on-primary-text)) !important;
}
.text-on-primary-text-faded {
  color: rgb(var(--v-theme-on-primary-text-faded)) !important;
}

/* Fila de etapa */
.etapa-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.etapa-label {
  display: flex;
  align-items: center;
}

/* Hora de cada etapa */
.etapa-time {
  text-align: right;
  font-family: monospace;
  font-size: 0.75rem;
  min-width: 78px;
}

/* En tarjeta verde, chulos completados blancos */
.etapa-icon-completed-finalizado {
  color: #ffffff !important;
}

.v-icon.on-primary-text-light {
  color: rgb(var(--v-theme-on-primary-text-light)) !important;
}
.v-list.bg-transparent {
  background-color: transparent !important;
}

.v-list-item-title {
  font-size: 0.95rem;
}
</style>
