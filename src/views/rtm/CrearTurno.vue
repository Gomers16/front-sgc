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
            <h2 class="title">Crear Turno RTM</h2>
            <p class="subtitle">Registra un nuevo turno con los datos mínimos requeridos</p>
          </div>
        </div>

        <v-chip class="turno-chip" size="large" variant="elevated" prepend-icon="mdi-counter">
          Turno # {{ turnoNumero || '...' }}
        </v-chip>
      </div>

      <v-divider class="mx-6 divider-muted" />

      <div class="pa-8">
        <v-form ref="formRef" @submit.prevent="openConfirmDialog">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.fecha"
                label="Fecha"
                variant="outlined"
                readonly
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="formattedHoraIngreso"
                label="Hora de Ingreso"
                variant="outlined"
                readonly
                density="comfortable"
                prepend-inner-icon="mdi-clock-time-four-outline"
              />
            </v-col>

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

            <v-col cols="12" sm="6">
              <v-select
                v-model="form.medioEntero"
                :items="medioEnteroItems"
                label="¿Cómo se enteró de nosotros?"
                variant="outlined"
                required
                density="comfortable"
                prepend-inner-icon="mdi-account-question"
                :rules="[v => !!v || 'Este campo es requerido']"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-radio-group
                v-model="form.tieneCita"
                label="¿Tiene cita previa?"
                row
                density="comfortable"
                class="radio-row"
                :rules="[v => v !== null || 'Seleccione una opción']"
              >
                <v-radio label="Sí" :value="true" color="primary" />
                <v-radio label="No" :value="false" color="error" />
              </v-radio-group>
            </v-col>

            <v-col cols="12" sm="6" v-if="form.medioEntero === 'convenio_referido_externo'">
              <v-text-field
                v-model="form.convenio"
                label="Nombre de Convenio o Referido Externo (opcional)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-handshake"
              />
            </v-col>

            <v-col cols="12" sm="6" v-if="form.medioEntero === 'referido_interno'">
              <v-text-field
                v-model="form.referidoInterno"
                label="Nombre del Referido Interno (opcional)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-account-tie"
              />
            </v-col>

            <v-col cols="12" sm="6" v-if="form.medioEntero === 'asesor_comercial'">
              <v-text-field
                v-model="form.asesorComercial"
                label="Nombre del Asesor Comercial (opcional)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-account-hard-hat"
              />
            </v-col>

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

            <v-col cols="12" class="text-right mt-4">
              <v-btn
                color="primary"
                @click="openConfirmDialog"
                class="font-weight-bold py-3 px-6 action-btn"
                size="large"
                :loading="isSubmitting"
                :disabled="isSubmitting"
              >
                <v-icon left>mdi-plus-circle</v-icon>
                Crear nuevo turno
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
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

    <v-dialog v-model="showConfirmDialog" max-width="500px">
      <v-card class="rounded-xl">
        <v-card-title class="headline text-center text-primary font-weight-bold pa-4">
          {{ confirmDialogTitle }}
        </v-card-title>
        <v-card-text class="text-center text-body-1 pa-4">
          {{ confirmDialogMessage }}
        </v-card-text>
        <v-card-actions class="justify-center pa-4">
          <v-btn color="grey-darken-1" variant="outlined" @click="handleCancelAction">Cancelar</v-btn>
          <v-btn :color="confirmDialogConfirmColor" variant="elevated" @click="handleConfirmAction" class="bordered-dialog-button">
            {{ confirmDialogConfirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { DateTime } from 'luxon'
import { authSetStore } from '@/stores/AuthStore'
import type { VForm } from 'vuetify/components'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import type { TipoVehiculoFrontend, Turno } from '@/services/turnosdeldiaService'

type MedioEntero =
  | 'redes_sociales'
  | 'convenio_referido_externo'
  | 'call_center'
  | 'fachada'
  | 'referido_interno'
  | 'asesor_comercial'

interface SnackbarState {
  show: boolean
  message: string
  color: string
  timeout: number
}

interface TurnoForm {
  fecha: string
  horaIngreso: string
  placa: string
  tipoVehiculo: TipoVehiculoFrontend | ''
  medioEntero: MedioEntero | ''
  observaciones: string
  tieneCita: boolean
  convenio: string | null
  referidoInterno: string | null
  referidoExterno: string | null
  asesorComercial: string | null
  usuarioId: number
}

const authStore = authSetStore()
const turnoNumero = ref<number | null>(null)
const formRef = ref<VForm | null>(null)
const isSubmitting = ref(false)

const tipoVehiculoItems: ReadonlyArray<TipoVehiculoFrontend> = [
  'Liviano Particular',
  'Liviano Taxi',
  'Liviano Público',
  'Motocicleta',
] as const

const medioEnteroItems: ReadonlyArray<{ title: string; value: MedioEntero }> = [
  { title: 'Redes Sociales', value: 'redes_sociales' },
  { title: 'Convenio o Referido Externo', value: 'convenio_referido_externo' },
  { title: 'Call Center', value: 'call_center' },
  { title: 'Fachada', value: 'fachada' },
  { title: 'Referido Interno', value: 'referido_interno' },
  { title: 'Asesor Comercial', value: 'asesor_comercial' },
] as const

const form = ref<TurnoForm>({
  fecha: '',
  horaIngreso: '',
  placa: '',
  tipoVehiculo: '',
  medioEntero: '',
  observaciones: '',
  tieneCita: false,
  convenio: null,
  referidoInterno: null,
  referidoExterno: null,
  asesorComercial: null,
  usuarioId: 0,
})

const formattedHoraIngreso = computed<string>(() => {
  const value = form.value.horaIngreso
  if (!value) return ''
  const time = DateTime.fromFormat(value, 'HH:mm', { zone: 'America/Bogota' })
  return time.isValid ? time.toFormat('hh:mm a') : value
})

const snackbar = ref<SnackbarState>({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

function showSnackbar(message: string, color: string = 'info', timeout: number = 4000): void {
  snackbar.value = { show: true, message, color, timeout }
}

function onPlacaInput(e: Event): void {
  const target = e.target as HTMLInputElement | null
  if (target) form.value.placa = target.value.toUpperCase()
}

const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogConfirmText = ref('')
const confirmDialogConfirmColor = ref('')

type ActionType = 'create_turno'
const currentAction = ref<ActionType | ''>('')

onMounted(async () => {
  const userUnknown: unknown = authStore.user
  const userId = ((): number | null => {
    if (typeof userUnknown === 'object' && userUnknown !== null) {
      const maybe = userUnknown as Record<string, unknown>
      return typeof maybe.id === 'number' ? maybe.id : null
    }
    return null
  })()

  if (userId !== null) {
    form.value.usuarioId = userId
  } else {
    console.warn('Usuario no logueado o ID no disponible.')
  }

  await resetFormFields()
})

watch(
  () => form.value.medioEntero,
  () => {
    form.value.convenio = null
    form.value.referidoInterno = null
    form.value.asesorComercial = null
  }
)

/** mínimo válido según turnos ya existentes en la fecha */
function computeMinExpectedNext(turnos: Turno[]): number {
  const nums = (turnos as any[])
    .map((t) => Number((t as any)?.turnoNumero ?? (t as any)?.numero))
    .filter((n) => Number.isFinite(n)) as number[]
  const a = nums.length ? Math.max(...nums) + 1 : null
  const b = turnos.length + 1
  return a ?? b
}

async function fetchNextTurnNumber(): Promise<void> {
  try {
    // 1) valor que entrega el backend
    const data = await TurnosDelDiaService.fetchNextTurnNumber(form.value.usuarioId)
    const nextFromBackend = typeof data?.siguiente === 'number' ? data.siguiente : 0

    // 2) consultamos lo que ya existe hoy para normalizar
    const fecha = form.value.fecha // yyyy-MM-dd
    const turnosHoy = await TurnosDelDiaService.fetchTurnos({ fecha })

    const minExpected = computeMinExpectedNext(turnosHoy)

    // 3) número final a mostrar
    turnoNumero.value = Math.max(nextFromBackend || 0, minExpected)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cargar el número de turno'
    console.error('Error al cargar el siguiente número de turno:', err)
    showSnackbar(message, 'error')
    turnoNumero.value = 1
  }
}

async function resetFormFields(): Promise<void> {
  const now = DateTime.now().setZone('America/Bogota')
  form.value = {
    fecha: now.toISODate() || '',
    horaIngreso: now.toFormat('HH:mm'),
    placa: '',
    tipoVehiculo: '',
    medioEntero: '',
    observaciones: '',
    tieneCita: false,
    convenio: null,
    referidoInterno: null,
    referidoExterno: null,
    asesorComercial: null,
    usuarioId: form.value.usuarioId,
  }
  turnoNumero.value = null
  await fetchNextTurnNumber()
  formRef.value?.resetValidation()
}

async function openConfirmDialog(): Promise<void> {
  if (!formRef.value) {
    showSnackbar('Error interno: formulario no inicializado.', 'error')
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    showSnackbar('Completa los campos requeridos.', 'warning')
    return
  }
  confirmDialogTitle.value = 'Confirmar Creación de Turno'
  confirmDialogMessage.value = '¿Estás seguro de que quieres crear este turno?'
  confirmDialogConfirmText.value = 'Crear Turno'
  confirmDialogConfirmColor.value = 'primary'
  currentAction.value = 'create_turno'
  showConfirmDialog.value = true
}

async function handleConfirmAction(): Promise<void> {
  showConfirmDialog.value = false
  isSubmitting.value = true
  try {
    if (currentAction.value === 'create_turno') {
      await submitForm()
    }
  } finally {
    currentAction.value = ''
    isSubmitting.value = false
  }
}

function handleCancelAction(): void {
  showConfirmDialog.value = false
  currentAction.value = ''
  showSnackbar('Creación de turno cancelada.', 'info')
}

async function submitForm(): Promise<void> {
  try {
    await TurnosDelDiaService.createTurno({
      placa: form.value.placa,
      tipoVehiculo: form.value.tipoVehiculo as TipoVehiculoFrontend,
      tieneCita: form.value.tieneCita,
      convenio: form.value.convenio,
      referidoInterno: form.value.referidoInterno,
      referidoExterno: form.value.referidoExterno,
      medioEntero: form.value.medioEntero || 'fachada',
      observaciones: form.value.observaciones,
      asesorComercial: form.value.asesorComercial,
      fecha: form.value.fecha,
      horaIngreso: form.value.horaIngreso,
      usuarioId: form.value.usuarioId,
    })
    showSnackbar('✅ Turno creado exitosamente', 'success')
    await resetFormFields()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido al crear el turno.'
    console.error('Error al crear turno:', err)
    showSnackbar(`❌ ${message}`, 'error')
  }
}
</script>

<style scoped>
/* —— Card base —— */
.card-surface {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 1px solid rgba(16,24,40,0.06);
}

/* —— Header —— */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background:
    radial-gradient(1200px 200px at 20% -50%, rgba(25,118,210,.08), transparent 60%),
    radial-gradient(900px 180px at 80% -60%, rgba(76,175,80,.10), transparent 60%),
    linear-gradient(180deg, #ffffff, #f7f9fc);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px; width: 40px;
  border-radius: 10px;
  border: 1px solid rgba(16,24,40,0.08);
  background: #fff;
  box-shadow: 0 1px 2px rgba(16,24,40,0.06);
}

.title-group .title {
  margin: 0;
  font-weight: 700;
  letter-spacing: .2px;
  line-height: 1.2;
  font-size: 1.35rem;
  color: #0f172a;
}

.title-group .subtitle {
  margin: 2px 0 0 0;
  font-size: .925rem;
  color: #475569;
}

.turno-chip :deep(.v-chip__content) {
  font-weight: 600;
}
.turno-chip {
  --chip-bg: #0ea5e9;
  background: linear-gradient(180deg, #0ea5e9, #0284c7);
  color: #fff;
  box-shadow: 0 6px 16px rgba(2,132,199,0.25);
}

/* —— Divider —— */
.divider-muted {
  border-color: rgba(16,24,40,0.08) !important;
}

/* —— Inputs —— */
:deep(.v-text-field .v-input__control),
:deep(.v-select .v-input__control) {
  border-radius: 10px;
}

:deep(.v-input__prepend-inner .v-icon) {
  color: #1976D2;
}

/* —— Button principal —— */
.action-btn {
  border-radius: 12px !important;
  text-transform: none;
  letter-spacing: .2px;
  box-shadow: 0 6px 16px rgba(25,118,210,.25) !important;
  border: 1px solid rgba(16,24,40,0.06);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(25,118,210,.28) !important;
}

/* —— Diálogo —— */
.bordered-dialog-button {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px black !important;
}

.radio-row :deep(.v-label) {
  font-weight: 500;
}
</style>
