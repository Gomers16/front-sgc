<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-0 rounded-2xl card-surface">
      <!-- Header corporativo -->
      <div class="card-header px-6 py-5">
        <div class="header-left">
          <div class="icon-pill">
            <v-icon size="22">mdi-clipboard-text-outline</v-icon>
          </div>
        <div class="title-group">
            <h2 class="title">Editar Turno</h2>
            <p class="subtitle">Actualiza la información del turno seleccionado</p>
          </div>
        </div>

        <div class="d-flex align-center" style="gap:10px">
          <v-chip class="turno-chip" size="large" variant="elevated" prepend-icon="mdi-counter">
            Global: {{ form.turnoNumero ?? '—' }}
          </v-chip>
          <v-chip class="turno-chip" size="large" variant="elevated" prepend-icon="mdi-counter">
            {{ servicioCodigoActual || 'SERV' }}: {{ form.turnoNumeroServicio ?? '—' }}
          </v-chip>
        </div>
      </div>

      <v-divider class="mx-6 divider-muted" />

      <div class="pa-8">
        <v-form ref="formRef" @submit.prevent="openConfirmDialog">
          <v-row dense>
            <!-- Servicio -->
            <v-col cols="12">
              <v-select
                v-model="form.servicioId"
                :items="serviciosItems"
                :loading="serviciosLoading"
                label="Servicio"
                variant="outlined"
                required
                density="compact"
                hide-details
                prepend-inner-icon="mdi-wrench-cog"
                class="servicio-fit"
                :rules="[v => !!v || 'El servicio es requerido']"
              />
            </v-col>

            <!-- Fecha (solo visual) y hora ingreso -->
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="fechaBonita"
                label="Fecha"
                variant="outlined"
                readonly
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.horaIngreso"
                label="Hora de Ingreso (HH:mm:ss)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-clock-time-four-outline"
              />
            </v-col>

            <!-- Placa -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.placa"
                label="Placa del Vehículo"
                variant="outlined"
                required
                density="comfortable"
                prepend-inner-icon="mdi-car-info"
                @input="onPlacaInput"
                :rules="[v => !!v || 'La placa es requerida']"
              />
            </v-col>

            <!-- Tipo de Vehículo -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.tipoVehiculo"
                :items="tipoVehiculoItems"
                label="Tipo de Vehículo"
                variant="outlined"
                required
                density="comfortable"
                prepend-inner-icon="mdi-car-multiple"
                :rules="[v => !!v || 'El tipo de vehículo es requerido']"
              />
            </v-col>

            <!-- ¿Cómo nos conoció? -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.medioEntero"
                :items="medioEnteroItems"
                label="¿Cómo nos conoció?"
                variant="outlined"
                required
                density="comfortable"
                prepend-inner-icon="mdi-account-question"
                :rules="[v => !!v || 'Este campo es requerido']"
              />
            </v-col>

            <!-- Si es Asesor → detalle asesor -->
            <template v-if="form.medioEntero === 'asesor'">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.asesorNombre"
                  label="Nombre del Asesor"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-tie"
                  :rules="[v => !!v || 'El nombre del asesor es requerido']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-radio-group
                  v-model="form.asesorTipo"
                  label="Tipo de Asesor"
                  row
                  density="comfortable"
                  class="radio-row"
                  :rules="[v => !!v || 'Seleccione tipo de asesor']"
                >
                  <v-radio label="Interno" value="ASESOR_INTERNO" color="primary" />
                  <v-radio label="Externo" value="ASESOR_EXTERNO" color="primary" />
                </v-radio-group>
              </v-col>
            </template>

            <!-- Observaciones -->
            <v-col cols="12">
              <v-textarea
                v-model="form.observaciones"
                label="Observaciones (opcional)"
                rows="3"
                auto-grow
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-comment-text-multiple"
              />
            </v-col>

            <!-- Estado / Hora Salida / Tiempo Servicio -->
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.estado"
                :items="['activo','inactivo','cancelado','finalizado']"
                label="Estado del Turno"
                variant="outlined"
                required
                density="comfortable"
                prepend-inner-icon="mdi-check-decagram"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.horaSalida"
                label="Hora de Salida (HH:mm:ss)"
                variant="outlined"
                density="comfortable"
                clearable
                prepend-inner-icon="mdi-clock-end"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.tiempoServicio"
                label="Tiempo de Servicio (ej. 30 min)"
                variant="outlined"
                density="comfortable"
                clearable
                prepend-inner-icon="mdi-timer-outline"
              />
            </v-col>

            <!-- ====== Fila 1: Captación/Dateo + Cliente ====== -->
            <v-col cols="12" md="6" class="d-flex">
              <v-card variant="tonal" class="card-compact d-flex flex-column flex-grow-1">
                <div class="card-header"><v-icon class="mr-2">mdi-bullhorn</v-icon><span>Captación / Dateo</span></div>

                <div class="mb-2 d-flex flex-wrap" style="gap:8px">
                  <v-chip size="small" color="teal" variant="elevated" prepend-icon="mdi-bullhorn">
                    Canal actual: {{ canalPretty }}
                  </v-chip>
                  <v-chip
                    v-if="agenteChip"
                    size="small"
                    color="indigo"
                    variant="elevated"
                    prepend-icon="mdi-account-tie"
                  >
                    {{ agenteChip }}
                  </v-chip>
                </div>

                <v-text-field
                  :model-value="dateoOrigenPretty"
                  label="Origen (último dateo)"
                  variant="outlined"
                  density="compact"
                  readonly
                  prepend-inner-icon="mdi-source-branch"
                  class="mb-2"
                />
                <v-textarea
                  :model-value="dateo?.observacion || '—'"
                  label="Observación (último dateo)"
                  variant="outlined"
                  density="compact"
                  readonly
                  rows="2"
                  prepend-inner-icon="mdi-text-long"
                  class="mb-2"
                />
                <v-text-field
                  :model-value="dateoFechaFmt"
                  label="Fecha último dateo"
                  variant="outlined"
                  density="compact"
                  readonly
                  prepend-inner-icon="mdi-calendar-clock"
                />
              </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
              <v-card variant="tonal" class="card-compact d-flex flex-column flex-grow-1">
                <div class="card-header"><v-icon class="mr-2">mdi-account</v-icon><span>Datos del Cliente</span></div>
                <v-text-field :model-value="cliente?.nombre || '—'" label="Nombre" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-account" class="mb-2" />
                <v-text-field :model-value="cliente?.telefono || '—'" label="Teléfono" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-phone" class="mb-2" />
                <v-text-field :model-value="cliente?.email || '—'" label="Email" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-email" />
              </v-card>
            </v-col>

            <!-- ====== Fila 2: Vehículo + Metadatos ====== -->
            <v-col cols="12" md="6" class="d-flex">
              <v-card variant="tonal" class="card-compact d-flex flex-column flex-grow-1">
                <div class="card-header"><v-icon class="mr-2">mdi-car-info</v-icon><span>Datos del Vehículo</span></div>
                <v-text-field :model-value="form.placa" label="Placa" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-car" class="mb-2" />
                <v-text-field :model-value="vehiculoClase" label="Clase" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-shape-outline" class="mb-2" />
                <v-text-field :model-value="vehiculo?.marca || '—'" label="Marca" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-alpha-m-box" class="mb-2" />
                <v-text-field :model-value="vehiculo?.linea || '—'" label="Línea" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-timeline-outline" class="mb-2" />
                <v-text-field :model-value="vehiculo?.modelo != null ? String(vehiculo?.modelo) : '—'" label="Modelo" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-numeric" />
              </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
              <v-card variant="tonal" class="card-compact d-flex flex-column flex-grow-1">
                <div class="card-header"><v-icon class="mr-2">mdi-information-outline</v-icon><span>Metadatos</span></div>
                <v-text-field :model-value="usuarioNombre" label="Usuario" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-account-badge" class="mb-2" />
                <v-text-field :model-value="sedeNombre" label="Sede" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-office-building" class="mb-2" />
                <v-text-field :model-value="createdFmt" label="Creado" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-calendar-plus" class="mb-2" />
                <v-text-field :model-value="updatedFmt" label="Actualizado" variant="outlined" density="compact" readonly prepend-inner-icon="mdi-calendar-refresh" />

                <!-- 👇 Campo temporal para trabajar sin auth -->
                <v-text-field
                  v-if="DEV_NO_AUTH"
                  v-model.number="tmpUsuarioId"
                  label="Usuario ID (temporal, sin auth)"
                  variant="outlined"
                  density="compact"
                  type="number"
                  prepend-inner-icon="mdi-account-key"
                  class="mb-2"
                />
              </v-card>
            </v-col>

            <!-- Botones -->
            <v-col cols="12" class="text-right mt-2">
              <v-btn color="grey-darken-1" variant="outlined" class="mr-2" @click="goBack">
                <v-icon left>mdi-arrow-left</v-icon> Volver
              </v-btn>
              <v-btn color="primary" class="font-weight-bold py-3 px-6 action-btn" size="large" :loading="isSaving" :disabled="isSaving" @click="openConfirmDialog">
                <v-icon left>mdi-content-save</v-icon> Guardar cambios
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </div>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
      <template #actions><v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn></template>
    </v-snackbar>

    <!-- Confirmación -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card class="rounded-xl">
        <v-card-title class="headline text-center text-primary font-weight-bold pa-4">Confirmar Guardado</v-card-title>
        <v-card-text class="text-center text-body-1 pa-4">¿Deseas guardar los cambios del turno?</v-card-text>
        <v-card-actions class="justify-center pa-4">
          <v-btn color="grey-darken-1" variant="outlined" @click="showConfirmDialog=false">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="save">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loader -->
    <v-dialog v-model="isLoading" persistent width="300">
      <v-card color="primary" dark>
        <v-card-text class="py-4 text-center">
          Cargando turno...
          <v-progress-linear indeterminate color="white" class="mb-0" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { DateTime } from 'luxon'
import { useRoute, useRouter } from 'vue-router'
import type { VForm } from 'vuetify/components'
import { authSetStore } from '@/stores/AuthStore'
import TurnosDelDiaService from '@/services/turnosdeldiaService'

type TipoVehiculoFrontend = 'Liviano Particular' | 'Liviano Taxi' | 'Liviano Público' | 'Motocicleta'
type MedioEntero = 'redes_sociales' | 'call_center' | 'fachada' | 'asesor'
type AsesorTipo = 'ASESOR_INTERNO' | 'ASESOR_EXTERNO'

interface ServicioDTO { id: number; codigo: string; nombre: string }
interface ServicioItem { title: string; value: number }

const route = useRoute()
const router = useRouter()
const authStore = authSetStore()

/** === Modo sin auth (parche temporal) === */
const DEV_NO_AUTH = true
const tmpUsuarioId = ref<number>(1)

/** ===== Form ===== **/
interface EditForm {
  turnoNumero: number | null
  turnoNumeroServicio: number | null
  fecha: string
  horaIngreso: string
  horaSalida: string | null
  tiempoServicio: string | null
  placa: string
  tipoVehiculo: TipoVehiculoFrontend | ''
  medioEntero: MedioEntero | ''
  observaciones: string
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  servicioId: number | null
  asesorNombre: string | null
  asesorTipo: AsesorTipo | null
  servicioCodigo?: string | null
}
const formRef = ref<VForm | null>(null)
const form = ref<EditForm>({
  turnoNumero: null,
  turnoNumeroServicio: null,
  fecha: '',
  horaIngreso: '',
  horaSalida: null,
  tiempoServicio: null,
  placa: '',
  tipoVehiculo: '',
  medioEntero: '',
  observaciones: '',
  estado: 'activo',
  servicioId: null,
  asesorNombre: null,
  asesorTipo: null,
  servicioCodigo: null,
})

/** Catálogos */
const tipoVehiculoItems: ReadonlyArray<TipoVehiculoFrontend> = ['Liviano Particular','Liviano Taxi','Liviano Público','Motocicleta'] as const
const medioEnteroItems: ReadonlyArray<{ title: string; value: MedioEntero }> = [
  { title: 'Redes Sociales', value: 'redes_sociales' },
  { title: 'Call Center',    value: 'call_center' },
  { title: 'Fachada',        value: 'fachada' },
  { title: 'Asesor',         value: 'asesor' },
] as const

const serviciosItems = ref<ServicioItem[]>([])
const serviciosLoading = ref(false)
const serviciosMapById = ref<Record<number, ServicioDTO>>({})

/** Relacionados leídos del turno */
const vehiculo = ref<any | null>(null)
const cliente  = ref<any | null>(null)
const dateo    = ref<any | null>(null)
const agente   = ref<any | null>(null) // agenteCaptacion del turno o del dateo

/** UI State */
const snackbar = ref({ show: false, message: '', color: '', timeout: 4000 })
const isLoading = ref(true)
const isSaving  = ref(false)
const showConfirmDialog = ref(false)
const showSnackbar = (m:string,c='info',t=4000)=>{ snackbar.value = { show:true, message:m, color:c, timeout:t } }

/** Pretty / helpers */
const FMT = 'dd/MM/yyyy HH:mm:ss'
const fechaBonita = computed(() => {
  const dt = form.value.fecha ? DateTime.fromISO(form.value.fecha).setZone('America/Bogota') : null
  return dt && dt.isValid ? dt.toFormat('dd/MM/yyyy') : ''
})
const servicioCodigoActual = computed(() => {
  const id = form.value.servicioId
  return id ? serviciosMapById.value[id]?.codigo : form.value.servicioCodigo || null
})
const createdFmt = computed(() => {
  const iso = (originalRaw.value?.createdAt || originalRaw.value?.created_at) as string | undefined
  const dt = iso ? DateTime.fromISO(iso).setZone('America/Bogota') : null
  return dt && dt.isValid ? dt.toFormat(FMT) : '—'
})
const updatedFmt = computed(() => {
  const iso = (originalRaw.value?.updatedAt || originalRaw.value?.updated_at) as string | undefined
  const dt = iso ? DateTime.fromISO(iso).setZone('America/Bogota') : null
  return dt && dt.isValid ? dt.toFormat(FMT) : '—'
})
const usuarioNombre = computed(() => {
  const u = originalRaw.value?.usuario
  return u ? `${u.nombres} ${u.apellidos}` : '—'
})
const sedeNombre = computed(() => originalRaw.value?.sede?.nombre || '—')
const vehiculoClase = computed(() =>
  vehiculo.value?.clase?.nombre || vehiculo.value?.clase?.codigo || '—'
)

/** Captación / Dateo pretty */
const canalPretty = computed(() => {
  const c = (originalRaw.value?.canalAtribucion || '').toUpperCase()
  if (c === 'TELE') return 'Telemercadeo'
  if (c === 'ASESOR') return 'Asesor'
  if (c === 'REDES') return 'Redes Sociales'
  if (c === 'FACHADA') return 'Fachada'
  return '—'
})
const agenteChip = computed(() => {
  const a = agente.value
  if (!a) return ''
  const tipo = (a.tipo || '').toUpperCase()
  const tipoPretty =
    tipo === 'ASESOR_INTERNO' ? 'Asesor Interno' :
    tipo === 'ASESOR_EXTERNO' ? 'Asesor Externo' :
    tipo === 'TELEMERCADEO'   ? 'Telemercadeo'   : (a.tipo || '')
  return `${a.nombre} (${tipoPretty})`
})
const dateoOrigenPretty = computed(() => {
  const raw = dateo.value?.origen || ''
  const u = String(raw).toUpperCase()
  const map: Record<string,string> = { 'IMPORT':'Importado', 'MANUAL':'Manual', 'API':'API' }
  return map[u] ?? (raw || '—')
})
const dateoFechaFmt = computed(() => {
  const iso = dateo.value?.createdAt || dateo.value?.created_at
  if (!iso) return '—'
  const dt = DateTime.fromISO(iso).setZone('America/Bogota')
  return dt.isValid ? dt.toFormat(FMT) : '—'
})

/** raw turno para metadatos */
const originalRaw = ref<any | null>(null)

function onPlacaInput(e: Event) {
  const target = e.target as HTMLInputElement | null
  if (target) form.value.placa = target.value.toUpperCase().replace(/\s|-/g, '')
}

/** Mapas medio<->canal */
function canalToMedio(canal: string | null | undefined): MedioEntero {
  const c = (canal || '').toUpperCase()
  if (c === 'REDES') return 'redes_sociales'
  if (c === 'TELE')  return 'call_center'
  if (c === 'ASESOR')return 'asesor'
  return 'fachada'
}
function medioToCanal(medio: MedioEntero): 'FACHADA'|'TELE'|'REDES'|'ASESOR' {
  if (medio === 'redes_sociales') return 'REDES'
  if (medio === 'call_center')    return 'TELE'
  if (medio === 'asesor')         return 'ASESOR'
  return 'FACHADA'
}

/** Catálogo de servicios (única definición) */
async function loadServicios() {
  serviciosLoading.value = true
  try {
    const data: ServicioDTO[] = await TurnosDelDiaService.getServicios()
    serviciosItems.value = data.map(s => ({ title: `${s.codigo} — ${s.nombre}`, value: s.id }))
    serviciosMapById.value = Object.fromEntries(data.map(s => [s.id, s]))
  } catch (e) {
    console.error(e)
    showSnackbar('No se pudieron cargar los servicios', 'error')
  } finally {
    serviciosLoading.value = false
  }
}

/** Cargar turno (incluye relaciones: cliente, vehiculo, agenteCaptacion, captacionDateo) */
async function fetchTurno() {
  isLoading.value = true
  try {
    const id = Number(route.params.id)
    if (!id) { showSnackbar('ID inválido', 'error'); router.push('/rtm/turnos-dia'); return }

    const data: any = await TurnosDelDiaService.fetchTurnoById(id) // sin token
    originalRaw.value = data

    // relaciones
    vehiculo.value = data?.vehiculo ?? null
    cliente.value  = data?.cliente ?? null
    dateo.value    = data?.captacionDateo ?? null

    // agente: preferimos agenteCaptacion del turno; si no, del dateo
    agente.value   = data?.agenteCaptacion ?? data?.captacionDateo?.agente ?? null

    // set form base
    form.value.turnoNumero         = data?.turnoNumero ?? null
    form.value.turnoNumeroServicio = data?.turnoNumeroServicio ?? data?.turno_numero_servicio ?? null
    form.value.fecha               = data?.fecha ?? '' // ISO
    form.value.horaIngreso         = data?.horaIngreso ?? ''
    form.value.horaSalida          = data?.horaSalida ?? null
    form.value.tiempoServicio      = data?.tiempoServicio ?? null
    form.value.placa               = data?.placa ?? ''
    form.value.tipoVehiculo        = data?.tipoVehiculo ?? ''
    form.value.observaciones       = data?.observaciones ?? ''
    form.value.estado              = data?.estado ?? 'activo'
    form.value.servicioId          = data?.servicio?.id ?? data?.servicioId ?? null
    form.value.servicioCodigo      = data?.servicio?.codigoServicio ?? data?.servicioCodigo ?? null

    // medio/canal: prioriza canalAtribucion; si no, medioEntero guardado
    const canal = data?.canalAtribucion ?? null
    form.value.medioEntero = canal ? canalToMedio(canal) : ((): MedioEntero => {
      const val = (data?.medioEntero || '').toLowerCase()
      if (['redes_sociales','call_center','fachada','asesor'].includes(val)) return val as MedioEntero
      return 'fachada'
    })()

    // asesor (si medio es ASESOR): tomar de agenteCaptacion/dateo o fallback
    if (form.value.medioEntero === 'asesor' && agente.value) {
      form.value.asesorNombre = agente.value.nombre || null
      const t = String(agente.value.tipo || '').toUpperCase()
      form.value.asesorTipo =
        t === 'ASESOR_INTERNO' ? 'ASESOR_INTERNO' :
        t === 'ASESOR_EXTERNO' ? 'ASESOR_EXTERNO' : null
    } else {
      form.value.asesorNombre = data?.asesorComercial ?? null
      form.value.asesorTipo   = null
    }
  } catch (e) {
    console.error(e)
    showSnackbar('No fue posible cargar el turno', 'error')
    router.push('/rtm/turnos-dia')
  } finally {
    isLoading.value = false
  }
}

/** Guardar */
function openConfirmDialog() { showConfirmDialog.value = true }
async function save() {
  showConfirmDialog.value = false
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) { showSnackbar('Completa los campos requeridos', 'warning'); return }

  if (form.value.medioEntero === 'asesor') {
    if (!form.value.asesorNombre) { showSnackbar('Indica el nombre del asesor', 'warning'); return }
    if (!form.value.asesorTipo)   { showSnackbar('Selecciona el tipo de asesor', 'warning'); return }
  }

  isSaving.value = true
  try {
    const id = Number(route.params.id)
    if (!id) throw new Error('ID inválido')

    const canal = medioToCanal(form.value.medioEntero)
    const payload: any = {
      placa: form.value.placa,
      tipoVehiculo: form.value.tipoVehiculo,
      observaciones: form.value.observaciones,
      horaIngreso: form.value.horaIngreso,
      horaSalida: form.value.horaSalida,
      tiempoServicio: form.value.tiempoServicio,
      estado: form.value.estado,
      servicioId: form.value.servicioId,
      canal,               // Adonis puede derivar medio_entero desde aquí
      medioEntero: form.value.medioEntero, // compat si lo usa

      // 👇 Parche temporal SIN AUTH: enviar usuarioId requerido por backend
      usuarioId: Number(tmpUsuarioId.value) || 1,
    }

    // Si medio = asesor, enviamos los campos
    if (form.value.medioEntero === 'asesor') {
      payload.asesorComercial = form.value.asesorNombre
      payload.asesorTipo = form.value.asesorTipo
    } else {
      payload.asesorComercial = null
      payload.asesorTipo = null
    }

    await TurnosDelDiaService.updateTurno(id, payload) // sin token
    showSnackbar('✅ Turno actualizado correctamente', 'success')
  } catch (e:any) {
    console.error(e)
    showSnackbar(e?.message || 'Error al guardar el turno', 'error')
  } finally {
    isSaving.value = false
  }
}

/** Navegación */
function goBack() { router.push('/rtm/turnos-dia') }

onMounted(async () => {
  await loadServicios()
  await fetchTurno()
})
</script>

<style scoped>
/* El select de servicio se ve "corto" aunque esté en una fila completa */
.servicio-fit { display:inline-block; min-width:120px; max-width:260px; }
.servicio-fit :deep(.v-input__control) { width:100%; }

/* —— Card base —— */
.card-surface {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 1px solid rgba(16,24,40,0.06);
}

/* —— Header —— */
.card-header {
  display:flex; align-items:center; justify-content:space-between; gap:16px;
  background:
    radial-gradient(1200px 200px at 20% -50%, rgba(25,118,210,.08), transparent 60%),
    radial-gradient(900px 180px at 80% -60%, rgba(76,175,80,.10), transparent 60%),
    linear-gradient(180deg, #ffffff, #f7f9fc);
  border-top-left-radius:16px; border-top-right-radius:16px;
}
.header-left { display:flex; align-items:center; gap:14px; }
.icon-pill {
  display:inline-flex; align-items:center; justify-content:center;
  height:40px; width:40px; border-radius:10px;
  border:1px solid rgba(16,24,40,0.08); background:#fff;
  box-shadow:0 1px 2px rgba(16,24,40,0.06);
}
.title-group .title { margin:0; font-weight:700; letter-spacing:.2px; line-height:1.2; font-size:1.35rem; color:#0f172a; }
.title-group .subtitle { margin:2px 0 0 0; font-size:.925rem; color:#475569; }

.turno-chip :deep(.v-chip__content) { font-weight:600; }
.turno-chip {
  --chip-bg:#0ea5e9; background: linear-gradient(180deg,#0ea5e9,#0284c7);
  color:#fff; box-shadow:0 6px 16px rgba(2,132,199,0.25);
}

/* —— Divider —— */
.divider-muted { border-color: rgba(16,24,40,0.08) !important; }

/* —— Inputs —— */
:deep(.v-text-field .v-input__control),
:deep(.v-select .v-input__control) { border-radius:10px; }
:deep(.v-input__prepend-inner .v-icon) { color:#1976D2; }

/* —— Button principal —— */
.action-btn {
  border-radius:12px !important; text-transform:none; letter-spacing:.2px;
  box-shadow:0 6px 16px rgba(25,118,210,.25) !important;
  border:1px solid rgba(16,24,40,0.06);
}
.action-btn:hover {
  transform: translateY(-1px);
  box-shadow:0 10px 20px rgba(25,118,210,.28) !important;
}

/* Tarjetas compactas 2×2 */
.card-compact { padding: 12px; border-radius: 12px; border: 1px dashed rgba(16,24,40,0.12); }
.card-header { display:flex; align-items:center; font-weight:700; margin-bottom:8px; }

/* util */
.radio-row :deep(.v-label) { font-weight: 500; }
</style>
