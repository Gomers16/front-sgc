<!-- src/views/CrearTurno.vue -->
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
            <h2 class="title">Crear Turno</h2>
            <p class="subtitle">Registra un nuevo turno con los datos mínimos requeridos</p>
          </div>
        </div>

        <div class="d-flex align-center" style="gap:10px">
          <v-chip class="turno-chip" size="large" variant="elevated" prepend-icon="mdi-counter">
            Global: {{ turnoNumeroGlobalNext ?? '...' }}
          </v-chip>
          <v-chip class="turno-chip" size="large" variant="elevated" prepend-icon="mdi-counter">
            {{ servicioCodigoActual || 'SERV' }}: {{ turnoNumeroServicioNext ?? '...' }}
          </v-chip>
        </div>
      </div>

      <v-divider class="mx-6 divider-muted" />

      <div class="pa-8">
        <!-- 🔎 BARRA DE BÚSQUEDA -->
        <v-row class="mb-4" align="end" dense>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.placa"
              label="Buscar por Placa"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-car-search"
              @input="(e) => { onPlacaInput(e); }"
              @keydown.enter="doSearch(true)"
              :disabled="buscando"
              hint="Ej: ABC123"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="telefonoBusqueda"
              label="Buscar por Teléfono"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-phone-search"
              @keydown.enter="doSearch(true)"
              :disabled="buscando"
              hint="Opcional. Solo dígitos"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="4" class="d-flex gap-2">
            <v-btn
              color="primary"
              class="font-weight-bold"
              :loading="buscando"
              @click="doSearch(true)"
            >
              <v-icon left>mdi-magnify</v-icon>
              Buscar
            </v-btn>
            <v-btn
              color="grey-darken-1"
              variant="outlined"
              @click="resetBusqueda"
              :disabled="buscando"
            >
              <v-icon left>mdi-broom</v-icon>
              Limpiar búsqueda
            </v-btn>
          </v-col>
        </v-row>

        <!-- Mensaje cuando no hay resultados pero se ingresó algo -->
        <v-alert
          v-if="noResultados"
          type="info"
          variant="tonal"
          class="mb-4"
          :text="mensajeNoResultados"
        />

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

            <!-- Fecha y Hora -->
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

            <!-- Campos específicos cuando el medio es ASESOR -->
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
            </template>

            <!-- 👇 Panel “Datos detectados” SOLO si hay resultados -->
            <v-col cols="12" v-if="hasBusqueda">
              <v-card variant="tonal" class="pa-4 rounded-xl">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center" style="gap:10px">
                    <v-icon>mdi-magnify</v-icon>
                    <strong>Datos detectados</strong>
                    <v-progress-circular v-if="buscando" indeterminate size="18" class="ml-2" />
                  </div>

                  <!-- CHIP sugerencia de captación -->
                  <v-chip
                    v-if="captacionChipText"
                    color="primary"
                    variant="elevated"
                    prepend-icon="mdi-bullhorn"
                  >
                    {{ captacionChipText }}
                  </v-chip>
                </div>

                <!-- 💙 FILA CHIPS: CONVENIO / ASESOR / ÚLTIMA VISITA -->
                <div class="d-flex flex-wrap mb-3" style="gap:8px">
                  <!-- Convenio detectado (sin SIN-COD) -->
                  <v-chip
                    v-if="convenioDetectado"
                    color="deep-purple-accent-4"
                    class="text-white"
                    variant="elevated"
                    prepend-icon="mdi-file-document-outline"
                  >
                    Convenio: {{ formatConvenioChip(convenioDetectado) }}
                  </v-chip>

                  <!-- Asesor asignado (sin el texto 'Asesor convenio') -->
                  <v-chip
                    v-if="asesorAsignadoLabel"
                    color="indigo"
                    class="text-white"
                    variant="elevated"
                    prepend-icon="mdi-account-tie"
                  >
                    {{ asesorAsignadoLabel }}
                  </v-chip>

                  <!-- Última visita -->
                  <v-chip
                    v-if="ultimaVisitaChip"
                    color="teal"
                    class="text-white"
                    variant="elevated"
                    prepend-icon="mdi-calendar-clock"
                  >
                    {{ ultimaVisitaChip }}
                  </v-chip>
                </div>

                <v-row dense>
                  <!-- Vehículo -->
                  <v-col cols="12" md="3" v-if="busquedaVehiculo?.clase?.nombre">
                    <v-text-field
                      :model-value="busquedaVehiculo?.clase?.nombre || ''"
                      label="Clase (detectada)"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-label-outline"
                    />
                  </v-col>
                  <v-col cols="12" md="3" v-if="busquedaVehiculo?.marca">
                    <v-text-field
                      :model-value="busquedaVehiculo?.marca"
                      label="Marca (detectada)"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-car-estate"
                    />
                  </v-col>
                  <v-col cols="12" md="3" v-if="busquedaVehiculo?.linea">
                    <v-text-field
                      :model-value="busquedaVehiculo?.linea"
                      label="Línea (detectada)"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-car-sports"
                    />
                  </v-col>
                  <v-col cols="12" md="3" v-if="busquedaVehiculo?.modelo !== undefined">
                    <v-text-field
                      :model-value="String(busquedaVehiculo?.modelo ?? '')"
                      label="Modelo (detectado)"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-numeric"
                    />
                  </v-col>

                  <!-- Cliente detectado -->
                  <v-col cols="12" md="4" v-if="busquedaCliente?.nombre">
                    <v-text-field
                      :model-value="busquedaCliente?.nombre"
                      label="Cliente"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-account"
                    />
                  </v-col>
                  <v-col cols="12" md="4" v-if="busquedaCliente?.telefono">
                    <v-text-field
                      :model-value="busquedaCliente?.telefono"
                      label="Teléfono"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-phone"
                    />
                  </v-col>
                  <v-col cols="12" md="4" v-if="busquedaCliente?.email">
                    <v-text-field
                      :model-value="busquedaCliente?.email"
                      label="Email"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-email-outline"
                    />
                  </v-col>

                  <!-- PANEL DATEO (si hay dateo) -->
                  <v-col cols="12" v-if="busquedaDateo">
                    <v-card class="pa-4 rounded-lg dateo-card" variant="outlined">
                      <div class="d-flex align-center justify-space-between flex-wrap" style="gap:10px">
                        <div class="d-flex align-center" style="gap:12px">
                          <v-avatar size="72" variant="elevated">
                            <v-img v-if="busquedaDateo.imagen_url" :src="busquedaDateo.imagen_url" alt="Evidencia placa/telefono" />
                            <v-icon v-else size="40">mdi-image-off-outline</v-icon>
                          </v-avatar>
                          <div>
                            <div class="text-subtitle-1 font-weight-600">
                              Dateo: <strong>{{ busquedaDateo.canal }}</strong>
                              <span v-if="busquedaDateo.agente"> — {{ busquedaDateo.agente.nombre }}</span>
                            </div>
                            <div class="text-body-2 text-medium-emphasis">
                              Registrado: {{ dateoFechaHora }}
                            </div>
                            <div class="text-body-2 text-medium-emphasis" v-if="busquedaDateo.observacion">
                              {{ busquedaDateo.observacion }}
                            </div>

                            <!-- Convenio del dateo (sin SIN-COD) -->
                            <div class="mt-2" v-if="busquedaDateoConvenio">
                              <v-chip color="deep-purple" text-color="white" variant="elevated" prepend-icon="mdi-file-document-multiple-outline">
                                Convenio (dateo): {{ formatConvenioChip(busquedaDateoConvenio) }}
                              </v-chip>
                            </div>
                          </div>
                        </div>

                        <div class="d-flex align-center" style="gap:8px">
                          <v-chip color="primary" variant="elevated" prepend-icon="mdi-bullhorn">
                            Captación sugerida: {{ busqueda?.captacionSugerida?.canal }}
                            <span v-if="busqueda?.captacionSugerida?.agente"> — {{ busqueda?.captacionSugerida?.agente?.nombre }}</span>
                          </v-chip>

                          <v-chip
                            v-if="reservaVigente"
                            color="success"
                            variant="elevated"
                            prepend-icon="mdi-lock-clock"
                          >
                            Reserva vigente hasta {{ reservaBloqueaHasta }}
                          </v-chip>
                          <v-chip
                            v-else
                            color="grey"
                            variant="tonal"
                            prepend-icon="mdi-lock-open-outline"
                          >
                            Sin reserva vigente
                          </v-chip>
                        </div>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card>
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

            <!-- Botón crear -->
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

    <!-- Confirmación -->
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

<style scoped>
/* El select de servicio se ve "corto" aunque esté en una fila completa */
.servicio-fit { display:inline-block; min-width:120px; max-width:180px; }
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

/* —— Diálogo —— */
.bordered-dialog-button { box-shadow:0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px black !important; }

/* —— Dateo panel —— */
.dateo-card {
  border: 1px dashed rgba(16,24,40,0.12);
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfe 100%);
}

/* util */
.d-flex.gap-2 { gap: 8px; }
.radio-row :deep(.v-label) { font-weight: 500; }
</style>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { DateTime } from 'luxon'
import { authSetStore } from '@/stores/AuthStore'
import type { VForm } from 'vuetify/components'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import { BusquedasService } from '@/services/busquedas_service'

/** ===== Parámetros de búsqueda ===== **/
const PLACA_LEN = 6
const TEL_LEN = 10
const AUTO_SEARCH_ON_COMPLETE = true

/** ===== Tipos ===== **/
type TipoVehiculoFrontend =
  | 'Liviano Particular'
  | 'Liviano Taxi'
  | 'Liviano Público'
  | 'Motocicleta'

type MedioEntero = 'redes_sociales' | 'call_center' | 'fachada' | 'asesor'
type CanalAtrib = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
type AgenteTipo = 'ASESOR_INTERNO' | 'ASESOR_EXTERNO' | 'TELEMERCADEO' | string

interface ServicioDTO { id: number; codigo: string; nombre: string }
interface ServicioItem { title: string; value: number }

interface SnackbarState { show: boolean; message: string; color: string; timeout: number }

interface ClaseVehiculoDTO { codigo?: string; nombre?: string }
interface VehiculoDTO {
  id?: number; placa?: string; marca?: string; linea?: string; modelo?: number;
  clase?: ClaseVehiculoDTO | null; clienteId?: number | null
}
interface ClienteDTO { id?: number; nombre?: string; telefono?: string; email?: string }

interface AgenteDTO { id: number; nombre: string; tipo: AgenteTipo }
interface ConvenioDTO { id: number; nombre: string; codigo: string | null }
interface DateoRecienteDTO {
  id: number; canal: CanalAtrib; agente: AgenteDTO | null;
  placa: string | null; telefono: string | null; origen: string | null;
  observacion: string | null; imagen_url: string | null; created_at: string;
  consumido_turno_id: number | null; consumido_at: string | null;
  convenio?: ConvenioDTO | null;
}
interface ReservaDTO { vigente: boolean; bloqueaHasta: string | null }
interface CaptacionSugeridaDTO { canal: CanalAtrib; agente: AgenteDTO | null }
type OrigenBusqueda = 'placa' | 'telefono'
interface UltimaVisitaDTO {
  fecha: string | null; servicioCodigo: string | null; servicioNombre: string | null;
  sedeNombre: string | null; estado: string | null;
  placa?: string | null;
  clase?: ClaseVehiculoDTO | null;
  marca?: string | null; linea?: string | null; modelo?: number | null;
}

interface BusquedaResp {
  vehiculo: VehiculoDTO | null
  cliente: ClienteDTO | null
  dateoReciente: DateoRecienteDTO | null
  reserva: ReservaDTO | null
  captacionSugerida: CaptacionSugeridaDTO | null
  convenio: ConvenioDTO | null
  asesorAsignado: AgenteDTO | null
  origenBusqueda: OrigenBusqueda
  detectadoPorConvenio: boolean
  ultimaVisita: UltimaVisitaDTO | null
  vehiculos?: VehiculoDTO[] | null
  vehiculosCliente?: VehiculoDTO[] | null
}

/** ===== Stores y estado base ===== **/
const authStore = authSetStore()
const turnoNumeroGlobalNext = ref<number | null>(null)
const turnoNumeroServicioNext = ref<number | null>(null)
const formRef = ref<VForm | null>(null)
const isSubmitting = ref(false)

const serviciosItems = ref<ServicioItem[]>([])
const serviciosLoading = ref<boolean>(false)
const serviciosMapById = ref<Record<number, ServicioDTO>>({})

const telefonoBusqueda = ref<string>('')   // búsqueda por teléfono
const buscando = ref<boolean>(false)
const busqueda = ref<BusquedaResp | null>(null)
const abortCtrl = ref<AbortController | null>(null)

/** Evitar repetir misma búsqueda */
const lastSearched = ref<{ placa: string, tel: string }>({ placa: '', tel: '' })

const tipoVehiculoItems: ReadonlyArray<TipoVehiculoFrontend> = [
  'Liviano Particular',
  'Liviano Taxi',
  'Liviano Público',
  'Motocicleta',
] as const

const medioEnteroItems: ReadonlyArray<{ title: string; value: MedioEntero }> = [
  { title: 'Redes Sociales', value: 'redes_sociales' },
  { title: 'Call Center', value: 'call_center' },
  { title: 'Fachada', value: 'fachada' },
  { title: 'Asesor', value: 'asesor' },
] as const

interface TurnoForm {
  fecha: string
  horaIngreso: string
  placa: string
  tipoVehiculo: TipoVehiculoFrontend | ''
  medioEntero: MedioEntero | ''
  observaciones: string
  usuarioId: number
  servicioId: number | null
  asesorNombre: string | null
  _dateoId?: number | null
  _captacionCanal?: CanalAtrib | null
  _captacionAgenteId?: number | null
}

const form = ref<TurnoForm>({
  fecha: '',
  horaIngreso: '',
  placa: '',
  tipoVehiculo: '',
  medioEntero: '',
  observaciones: '',
  usuarioId: 0,
  servicioId: null,
  asesorNombre: null,
  _dateoId: null,
  _captacionCanal: null,
  _captacionAgenteId: null,
})

/** ===== Computed ===== **/
const hasBusqueda = computed(() => !!busqueda.value)
const busquedaVehiculo = computed(() => busqueda.value?.vehiculo ?? null)
const busquedaCliente  = computed(() => busqueda.value?.cliente ?? null)
const busquedaDateo    = computed(() => busqueda.value?.dateoReciente ?? null)
const busquedaDateoConvenio = computed(() => busqueda.value?.dateoReciente?.convenio ?? null)
const reserva          = computed(() => busqueda.value?.reserva ?? null)

const convenioDetectado = computed<ConvenioDTO | null>(() => {
  return busquedaDateoConvenio.value || busqueda.value?.convenio || null
})

/** Etiqueta del asesor: "Nombre (Comercial|Convenio|Interno|Externo|Telemercadeo)" */
function shortAsesorRol(tipo?: string): string {
  const t = (tipo || '').toUpperCase()
  if (t.includes('COMERCIAL')) return 'Comercial'
  if (t.includes('CONVENIO')) return 'Convenio'
  if (t.includes('INTERNO')) return 'Interno'
  if (t.includes('EXTERNO')) return 'Externo'
  if (t.includes('TELE')) return 'Telemercadeo'
  return tipo || ''
}
const asesorAsignadoLabel = computed<string | null>(() => {
  const a = busqueda.value?.asesorAsignado
  return a ? `${a.nombre} (${shortAsesorRol(a.tipo)})` : null
})

const ultimaVisitaChip = computed<string | null>(() => {
  const u = busqueda.value?.ultimaVisita
  if (!u || !u.fecha) return null
  const svc = u.servicioCodigo ? `${u.servicioCodigo}` : 'SERV'
  const sede = u.sedeNombre ? ` • ${u.sedeNombre}` : ''
  const est = u.estado ? ` • ${u.estado}` : ''
  return `Última visita: ${u.fecha} • ${svc}${sede}${est}`
})

const noResultados = computed(() =>
  !buscando.value && (form.value.placa || telefonoBusqueda.value) && !busqueda.value
)
const mensajeNoResultados = computed(() => {
  const por = telefonoBusqueda.value ? 'placa/teléfono' : 'placa'
  return `No encontramos registros por ${por}. Puedes crear el turno y se atribuye por defecto a FACHADA.`
})

const clienteNombre   = ref<string>('')   // para crear cliente básico si falta
const clienteTelefono = ref<string>('')   // idem
const clienteEmail    = ref<string>('')   // idem

const formattedHoraIngreso = computed<string>(() => {
  const value = form.value.horaIngreso
  if (!value) return ''
  const time = DateTime.fromFormat(value, 'HH:mm', { zone: 'America/Bogota' })
  return time.isValid ? time.toFormat('hh:mm a') : value
})

/** Código de servicio actual (RTM/PREV/PERI/SOAT) para chip */
const servicioCodigoActual = computed<string | null>(() => {
  const id = form.value.servicioId
  if (!id) return null
  return serviciosMapById.value[id]?.codigo ?? null
})

/** —— Panel Dateo —— **/
const dateoFechaHora = computed(() => {
  const iso = busquedaDateo.value?.created_at
  if (!iso) return ''
  const dt = DateTime.fromISO(iso).setZone('America/Bogota')
  return dt.isValid ? dt.toFormat('dd LLL yyyy • hh:mm a') : ''
})
const reservaVigente = computed(() => !!reserva.value?.vigente)
const reservaBloqueaHasta = computed(() => {
  const iso = reserva.value?.bloqueaHasta
  if (!iso) return ''
  const dt = DateTime.fromISO(iso).setZone('America/Bogota')
  return dt.isValid ? dt.toFormat('dd LLL yyyy') : ''
})

/** Formatear texto del chip de convenio (sin mostrar "SIN-COD") */
function formatConvenioChip(c?: ConvenioDTO | null): string {
  if (!c) return ''
  const code = (c.codigo || '').toUpperCase()
  return code && code !== 'SIN-COD' ? `${code} — ${c.nombre}` : `${c.nombre}`
}

/** ===== Snackbar ===== **/
const snackbar = ref<SnackbarState>({ show: false, message: '', color: '', timeout: 4000 })
function showSnackbar(message: string, color: string = 'info', timeout: number = 4000) {
  snackbar.value = { show: true, message, color, timeout }
}

/** ===== Util ===== **/
function normalizePhone(s: string) { return s.replace(/\D/g, '') }
function onPlacaInput(e: Event) {
  const target = e.target as HTMLInputElement | null
  if (target) form.value.placa = target.value.toUpperCase().replace(/\s|-/g, '')
}

/** Mapea clase a tipo UI */
function mapClaseToTipo(clase?: { codigo?: string; nombre?: string } | null): TipoVehiculoFrontend | '' {
  if (!clase) return ''
  const code = String(clase.codigo || '').toUpperCase()
  const name = String(clase.nombre || '').toUpperCase()
  if (code.includes('MOTO') || name.includes('MOTO')) return 'Motocicleta'
  if (code.includes('LIV_TAXI') || name.includes('TAXI')) return 'Liviano Taxi'
  if (code.includes('LIV_PUBLICO') || name.includes('PÚBLIC') || name.includes('PUBLIC')) return 'Liviano Público'
  if (code.includes('LIV_PART') || name.includes('PARTIC')) return 'Liviano Particular'
  if (name.includes('LIVIANO')) return 'Liviano Particular'
  return ''
}

function mapCanalToMedioEntero(canal: CanalAtrib): MedioEntero {
  if (canal === 'FACHADA') return 'fachada'
  if (canal === 'TELE')    return 'call_center'
  if (canal === 'REDES')   return 'redes_sociales'
  return 'asesor'
}
function mapMedioEnteroToCanal(medio: MedioEntero): CanalAtrib {
  switch (medio) {
    case 'redes_sociales': return 'REDES'
    case 'call_center':    return 'TELE'
    case 'asesor':         return 'ASESOR'
    case 'fachada':
    default:               return 'FACHADA'
  }
}

const captacionChipText = computed(() => {
  const s = busqueda.value?.captacionSugerida
  if (!s) return ''
  const a = s.agente ? ` — ${s.agente.nombre}` : ''
  return `Captación sugerida: ${s.canal}${a}`
})

/** ===== Buscar ===== **/
async function doSearch(force: boolean = false) {
  const placa = (form.value.placa || '').trim().toUpperCase()
  const telRaw = normalizePhone(telefonoBusqueda.value || '')

  const placaOk = !!placa && placa.length === PLACA_LEN
  const telOk   = !!telRaw && telRaw.length === TEL_LEN

  if (!force) {
    if (!AUTO_SEARCH_ON_COMPLETE) return
    if (!(placaOk || telOk)) return
    if ((placaOk && placa === lastSearched.value.placa) ||
        (telOk && telRaw === lastSearched.value.tel)) return
  } else {
    if (!placaOk && !telOk) {
      if (placa && placa.length !== PLACA_LEN && !telRaw) {
        showSnackbar(`La placa debe tener ${PLACA_LEN} caracteres (ej: ABC123).`, 'warning')
      } else if (telRaw && telRaw.length !== TEL_LEN && !placa) {
        showSnackbar(`El teléfono debe tener ${TEL_LEN} dígitos.`, 'warning')
      } else {
        showSnackbar('Ingresa una placa de 6 o un teléfono de 10 dígitos.', 'warning')
      }
      return
    }
  }

  const placaToSend = placaOk ? placa : undefined
  const telToSend   = telOk   ? telRaw : undefined
  if (!placaToSend && !telToSend) return

  if (abortCtrl.value) abortCtrl.value.abort()
  abortCtrl.value = new AbortController()

  buscando.value = true
  try {
    const resp = await BusquedasService.unificada(
      { placa: placaToSend, telefono: telToSend },
      { signal: abortCtrl.value.signal }
    ) as BusquedaResp

    lastSearched.value = {
      placa: placaToSend ?? lastSearched.value.placa,
      tel: telToSend ?? lastSearched.value.tel,
    }

    busqueda.value = resp || null

    // ===== Elegir vehículo preferido =====
    let vehPreferido: VehiculoDTO | null = null
    const uv = (resp?.ultimaVisita ?? null) as UltimaVisitaDTO | null
    const placaUV = uv?.placa ? String(uv.placa).toUpperCase() : null
    if (placaUV) {
      vehPreferido = {
        placa: placaUV,
        clase: uv?.clase ?? null,
        marca: (uv as any)?.marca ?? undefined,
        linea: (uv as any)?.linea ?? undefined,
        modelo: typeof (uv as any)?.modelo === 'number' ? (uv as any)?.modelo : undefined,
      }
    }
    if (!vehPreferido && resp?.vehiculo?.placa) vehPreferido = resp.vehiculo
    if (!vehPreferido) {
      const candidatos: Array<VehiculoDTO[] | undefined | null> = [
        resp?.vehiculos,
        resp?.vehiculosCliente,
        (resp as any)?.cliente?.vehiculos,
      ]
      for (const arr of candidatos) {
        if (Array.isArray(arr) && arr.length) {
          vehPreferido = arr.find(v => !!v?.placa) ?? arr[0] ?? null
          if (vehPreferido) break
        }
      }
    }

    // Poblar placa/tipo detectados
    if ((!placaOk || !form.value.placa) && vehPreferido?.placa) {
      form.value.placa = String(vehPreferido.placa).toUpperCase()
    }
    const claseFuente = vehPreferido?.clase ?? resp?.vehiculo?.clase ?? null
    const tipoDetectado = mapClaseToTipo(claseFuente)
    if (tipoDetectado) form.value.tipoVehiculo = tipoDetectado

    if (busqueda.value && vehPreferido) {
      busqueda.value = { ...(busqueda.value as any), vehiculo: vehPreferido } as BusquedaResp
    }

    // Cliente
    clienteNombre.value   = resp?.cliente?.nombre   ?? ''
    clienteTelefono.value = resp?.cliente?.telefono ?? (telOk ? telRaw : '')
    clienteEmail.value    = resp?.cliente?.email    ?? ''

    // Medio/canal sugerido
    if (resp?.captacionSugerida) {
      const canal = resp.captacionSugerida.canal
      const agente = resp.captacionSugerida.agente
      form.value.medioEntero = mapCanalToMedioEntero(canal)
      form.value._captacionCanal = canal
      form.value._captacionAgenteId = agente?.id ?? null
      form.value.asesorNombre = canal === 'ASESOR' ? (agente?.nombre ?? '') : null
    } else {
      form.value.medioEntero = 'fachada'
      form.value._captacionCanal = null
      form.value._captacionAgenteId = null
      form.value.asesorNombre = null
    }

    // Guardar id de dateo (si hay)
    form.value._dateoId = resp?.dateoReciente?.id ?? null
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return
    console.error('Error en búsqueda:', err)
    showSnackbar('Error realizando la búsqueda', 'error')
  } finally {
    buscando.value = false
  }
}

function resetBusqueda() {
  telefonoBusqueda.value = ''
  busqueda.value = null
  form.value.medioEntero = ''
  form.value.asesorNombre = null
  lastSearched.value = { placa: '', tel: '' }
}

/** ===== Servicios catálogo ===== **/
async function loadServicios() {
  serviciosLoading.value = true
  try {
    const data: ServicioDTO[] = await TurnosDelDiaService.getServicios()
    serviciosItems.value = data.map((s) => ({ title: `${s.codigo} — ${s.nombre}`, value: s.id }))
    serviciosMapById.value = Object.fromEntries(data.map((s) => [s.id, s]))
    if (!form.value.servicioId && data.length >= 1) form.value.servicioId = data[0].id
  } catch (err) {
    console.error('Error al cargar servicios:', err)
    showSnackbar('No se pudieron cargar los servicios', 'error')
    serviciosItems.value = []
  } finally {
    serviciosLoading.value = false
  }
}

/** ===== Consecutivos ===== **/
async function fetchNextTurnNumbers() {
  try {
    if (!form.value.usuarioId) return
    const resp = await TurnosDelDiaService.fetchNextTurnNumber(form.value.usuarioId, form.value.servicioId ?? undefined)
    const nextGlobal = typeof resp?.siguiente === 'number' ? resp.siguiente : null
    const nextServicio = typeof resp?.siguientePorServicio === 'number' ? resp.siguientePorServicio : null
    turnoNumeroGlobalNext.value = nextGlobal
    turnoNumeroServicioNext.value = nextServicio
  } catch (err) {
    console.error('Error al cargar consecutivos:', err)
    showSnackbar('Error al cargar consecutivos', 'error')
    turnoNumeroGlobalNext.value = turnoNumeroGlobalNext.value ?? 1
    turnoNumeroServicioNext.value = turnoNumeroServicioNext.value ?? 1
  }
}

async function resetFormFields() {
  const now = DateTime.now().setZone('America/Bogota')
  const keepServicioId = form.value.servicioId ?? null

  form.value = {
    fecha: now.toISODate() || '',
    horaIngreso: now.toFormat('HH:mm'),
    placa: '',
    tipoVehiculo: '',
    medioEntero: '',
    observaciones: '',
    usuarioId: form.value.usuarioId,
    servicioId: keepServicioId,
    asesorNombre: null,
    _dateoId: null,
    _captacionCanal: null,
    _captacionAgenteId: null,
  }
  telefonoBusqueda.value = ''
  busqueda.value = null
  lastSearched.value = { placa: '', tel: '' }
  await fetchNextTurnNumbers()
  formRef.value?.resetValidation()
}

/** ===== Lifecycle ===== **/
onMounted(async () => {
  const userUnknown: unknown = authStore.user
  const userId = ((): number | null => {
    if (typeof userUnknown === 'object' && userUnknown !== null) {
      const maybe = userUnknown as Record<string, unknown>
      return typeof maybe.id === 'number' ? maybe.id : null
    }
    return null
  })()
  if (userId !== null) form.value.usuarioId = userId

  await loadServicios()
  await resetFormFields()
})

/* ✅ Watchers */
watch(() => form.value.placa, () => {
  if (!AUTO_SEARCH_ON_COMPLETE) return
  const p = (form.value.placa || '').trim().toUpperCase()
  if (p.length === PLACA_LEN) doSearch(false)
})
watch(() => telefonoBusqueda.value, () => {
  if (!AUTO_SEARCH_ON_COMPLETE) return
  const t = normalizePhone(telefonoBusqueda.value || '')
  if (t.length === TEL_LEN) doSearch(false)
})
watch(() => form.value.medioEntero, () => {
  if (form.value.medioEntero !== 'asesor') {
    form.value.asesorNombre = null
  }
})
watch(() => form.value.servicioId, async () => {
  await fetchNextTurnNumbers()
})

/** ===== Confirmación y submit ===== **/
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogConfirmText = ref('')
const confirmDialogConfirmColor = ref('')
type ActionType = 'create_turno'
const currentAction = ref<ActionType | ''>('')

async function openConfirmDialog() {
  if (!formRef.value) {
    showSnackbar('Error interno: formulario no inicializado.', 'error')
    return
  }
  if (!form.value.servicioId) {
    showSnackbar('Selecciona un servicio.', 'warning')
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    showSnackbar('Completa los campos requeridos.', 'warning')
    return
  }
  if (form.value.medioEntero === 'asesor') {
    if (!form.value.asesorNombre) {
      showSnackbar('Indica el nombre del asesor.', 'warning')
      return
    }
  }
  confirmDialogTitle.value = 'Confirmar Creación de Turno'
  confirmDialogMessage.value = '¿Estás seguro de que quieres crear este turno?'
  confirmDialogConfirmText.value = 'Crear Turno'
  confirmDialogConfirmColor.value = 'primary'
  currentAction.value = 'create_turno'
  showConfirmDialog.value = true
}

async function handleConfirmAction() {
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

function handleCancelAction() {
  showConfirmDialog.value = false
  currentAction.value = ''
  showSnackbar('Creación de turno cancelada.', 'info')
}

async function submitForm() {
  try {
    if (!form.value.servicioId) {
      showSnackbar('Selecciona un servicio.', 'warning')
      return
    }

    const canal: CanalAtrib = form.value._captacionCanal ?? mapMedioEnteroToCanal(form.value.medioEntero)

    const payload: Record<string, unknown> = {
      placa: form.value.placa,
      tipoVehiculo: form.value.tipoVehiculo,
      observaciones: form.value.observaciones,
      fecha: form.value.fecha,
      horaIngreso: form.value.horaIngreso,
      usuarioId: form.value.usuarioId,
      servicioId: form.value.servicioId,
      canal,
    }

    if (form.value._dateoId) (payload as any).dateoId = form.value._dateoId
    if (form.value._captacionAgenteId) (payload as any).agenteCaptacionId = form.value._captacionAgenteId

    if (!busquedaCliente.value?.telefono && clienteTelefono.value) {
      (payload as any).clienteTelefono = clienteTelefono.value.replace(/\D/g, '')
    }
    if (!busquedaCliente.value?.nombre && clienteNombre.value) {
      (payload as any).clienteNombre = clienteNombre.value
    }
    if (!busquedaCliente.value?.email && clienteEmail.value) {
      (payload as any).clienteEmail = clienteEmail.value
    }

    const convenio = convenioDetectado.value
    if (convenio?.id) (payload as any).convenioId = convenio.id

    await TurnosDelDiaService.createTurno(payload)
    showSnackbar('✅ Turno creado exitosamente', 'success')
    await resetFormFields()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al crear el turno.'
    console.error('Error al crear turno:', err)
    showSnackbar(`❌ ${message}`, 'error')
  }
}
</script>
