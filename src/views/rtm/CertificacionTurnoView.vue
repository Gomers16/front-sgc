<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="light-blue-darken-3">
            <v-icon>mdi-check-decagram</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Certificación / Subir evidencia</div>
            <div class="text-caption text-medium-emphasis" v-if="turno">
              Turno #{{ turno.turnoNumero }} • {{ turno.placa }} • {{ getServicioCodigo(turno) }}
            </div>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap:10px">
          <v-chip v-if="turno" :color="estadoColor" variant="tonal" class="font-weight-bold">
            {{ estadoTexto }}
          </v-chip>

          <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="goBack">
            Volver a turnos
          </v-btn>
        </div>
      </v-card-title>
    </v-card>

    <v-row>
      <!-- IZQUIERDA: Evidencia -->
      <v-col cols="12" md="6">
        <v-card elevation="8" class="rounded-xl mb-4">
          <v-card-title class="py-4">
            <v-icon class="mr-2">mdi-image-plus</v-icon>
            Evidencia de certificación (pantallazo FLUR)
          </v-card-title>
          <v-divider />

          <v-card-text>
            <!-- Dropzone -->
            <div
              class="dropzone rounded-lg mb-4"
              :class="{ 'dropzone--active': dragging }"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
              @click="selectFile"
            >
              <div class="text-center">
                <div class="text-subtitle-1 font-weight-bold">
                  Suelta el pantallazo aquí o haz clic para seleccionar
                </div>
                <div class="text-medium-emphasis">
                  Imagen JPG o PNG (hasta 8 MB)
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="d-none"
                  @change="onFileChange"
                />
              </div>
            </div>

            <!-- Preview -->
            <v-expand-transition>
              <div v-if="previewUrl" class="preview-wrapper">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center" style="gap:8px">
                    <v-btn
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-magnify-minus"
                      @click="zoomOut"
                    >
                      Zoom -
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-magnify-plus"
                      @click="zoomIn"
                    >
                      Zoom +
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-rotate-right"
                      @click="rotateRight"
                    >
                      Rotar 90°
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="text"
                      @click="fitWidth"
                    >
                      Ajustar a ancho
                    </v-btn>
                  </div>

                  <v-btn
                    size="small"
                    variant="text"
                    color="error"
                    prepend-icon="mdi-delete"
                    @click.stop="limpiarEvidencia"
                  >
                    Quitar evidencia
                  </v-btn>
                </div>

                <div class="preview-canvas">
                  <img :src="previewUrl" :style="imgStyle" alt="Evidencia certificación" />
                </div>
              </div>
            </v-expand-transition>

            <!-- Nota opcional -->
            <v-textarea
              v-model="nota"
              label="Notas del ingeniero (opcional)"
              rows="2"
              auto-grow
              class="mt-4"
              clearable
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- DERECHA: Info del turno + acción -->
      <v-col cols="12" md="6">
        <v-card elevation="8" class="rounded-xl mb-4">
          <v-card-title class="py-4 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-clipboard-text</v-icon>
              Detalle del turno
            </div>
          </v-card-title>
          <v-divider />

          <v-card-text v-if="loadingTurno">
            <div class="d-flex justify-center my-6">
              <v-progress-circular indeterminate color="primary" />
            </div>
          </v-card-text>

          <v-card-text v-else-if="!turno">
            <v-alert type="error" variant="tonal">
              No se pudo cargar la información del turno.
            </v-alert>
          </v-card-text>

          <v-card-text v-else>
            <v-row>
              <v-col cols="6">
                <div class="label">Turno</div>
                <div class="value">#{{ turno.turnoNumero }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Placa</div>
                <div class="value">{{ turno.placa }}</div>
              </v-col>

              <v-col cols="6">
                <div class="label">Servicio</div>
                <div class="value">{{ getServicioCodigo(turno) }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Ingreso</div>
                <div class="value">
                  {{ formatTime(turno.horaIngreso) || '—' }}
                </div>
              </v-col>

              <v-col cols="6">
                <div class="label">Fecha</div>
                <div class="value">
                  {{ formatFecha(turno.fecha) || '—' }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="label">Estado</div>
                <div class="value">
                  <v-chip size="small" :color="chipEstadoColor" variant="tonal">
                    {{ capitalizar(turno.estado) }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="6">
                <div class="label">Funcionario</div>
                <div class="value">
                  {{ nombreFuncionario }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="label">Tipo de vehículo</div>
                <div class="value">
                  {{ turno.tipoVehiculo || '—' }}
                </div>
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- Recordatorio de flujo -->
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
              density="compact"
            >
              Sube el pantallazo del FLUR. Al confirmar se marcará la
              <b>certificación</b> y el turno quedará <b>finalizado</b>.
            </v-alert>

            <v-alert
              v-if="turno.tieneFacturacion === false"
              type="warning"
              variant="tonal"
              class="mb-4"
              density="compact"
            >
              Este turno aún no tiene facturación registrada.
              Puedes subir la evidencia, pero se recomienda facturar antes de finalizar.
            </v-alert>

            <div class="d-flex align-center justify-end" style="gap:10px">
              <v-btn variant="text" @click="goBack">
                Cancelar
              </v-btn>
              <v-btn
                color="primary"
                :disabled="!puedeConfirmar"
                :loading="saving"
                @click="openConfirm"
              >
                Marcar como certificado y finalizar
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- DIALOG CONFIRMACIÓN -->
    <v-dialog v-model="dialogConfirm" max-width="620">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-shield-check</v-icon>
          Confirmar certificación
        </v-card-title>
        <v-divider />
        <v-card-text>
          <p class="text-body-2 mb-3">
            Se guardará la evidencia de certificación y el turno se marcará como
            <b>finalizado</b> con la hora actual de salida.
          </p>

          <v-row v-if="turno">
            <v-col cols="12" md="6">
              <div class="section-title">Turno</div>
              <div class="label">Turno</div>
              <div class="value mb-2">#{{ turno.turnoNumero }}</div>

              <div class="label">Placa</div>
              <div class="value mb-2">{{ turno.placa }}</div>

              <div class="label">Servicio</div>
              <div class="value mb-2">{{ getServicioCodigo(turno) }}</div>

              <div class="label">Ingreso</div>
              <div class="value mb-2">
                {{ formatTime(turno.horaIngreso) || '—' }}
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="section-title">Certificación</div>

              <div class="label">Evidencia</div>
              <div class="value mb-2">
                <span v-if="previewUrl">Imagen seleccionada</span>
                <span v-else>—</span>
              </div>

              <div class="label">Notas</div>
              <div class="value mb-2">
                {{ nota || '—' }}
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogConfirm = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="saving"
            @click="confirmarYGuardar"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snack.show" :timeout="3000">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import { CertificacionService } from '@/services/certificacion_service'

/* ===== Router ===== */
const route = useRoute()
const router = useRouter()

/* ===== Tipos ===== */
interface ServicioEnTurno {
  id: number
  codigoServicio: string
  nombreServicio: string
}

interface FuncionarioLite {
  id: number
  nombres: string
  apellidos: string
}

interface Turno {
  id: number
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
  tiempoServicio: string | null
  turnoNumero: number
  turnoCodigo?: string
  placa: string
  tipoVehiculo: string | null
  tieneCita: boolean
  convenio: string | null
  referidoInterno: string | null
  referidoExterno: string | null
  medioEntero:
    | 'Redes Sociales'
    | 'Convenio o Referido Externo'
    | 'Call Center'
    | 'Fachada'
    | 'Referido Interno'
    | 'Asesor Comercial'
    | null
  observaciones: string | null
  funcionarioId: number
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  servicioId?: number | null
  servicio?: ServicioEnTurno | null
  servicioCodigo?: string
  servicioNombre?: string

  // puede venir como funcionario o usuario según el back
  funcionario?: FuncionarioLite
  usuario?: FuncionarioLite

  // bandera desde facturación, si ya tiene factura
  tieneFacturacion?: boolean | null
}

/* ===== Estado básico ===== */
const turno = ref<Turno | null>(null)
const loadingTurno = ref(true)
const saving = ref(false)

const snack = reactive({ show: false, text: '' })
const dialogConfirm = ref(false)

/* ===== Evidencia (archivo) ===== */
const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const previewBlob = ref<File | null>(null)
const imageRotation = ref(0)
const imageScale = ref(1)
const nota = ref('')

/* ===== Helpers turnoId ===== */
function getTurnoId(): number | null {
  const p = route.params.id
  if (p) {
    const n = Number(p)
    if (!Number.isNaN(n)) return n
  }
  const q = route.query.turnoId
  if (Array.isArray(q)) {
    const n = Number(q[0])
    if (!Number.isNaN(n)) return n
  } else if (q != null) {
    const n = Number(q)
    if (!Number.isNaN(n)) return n
  }
  return null
}

/* ===== UI computeds ===== */
const puedeConfirmar = computed(
  () => !!turno.value && !!previewBlob.value && !saving.value
)

const estadoTexto = computed(() => {
  if (!turno.value) return ''
  if (turno.value.horaSalida) return 'Certificado / Finalizado'
  return 'Pendiente de certificación'
})

const estadoColor = computed(() => {
  if (!turno.value) return 'grey'
  if (turno.value.horaSalida) return 'success'
  return 'warning'
})

const chipEstadoColor = computed(() => {
  if (!turno.value) return 'grey'
  switch (turno.value.estado) {
    case 'activo':
      return 'success'
    case 'cancelado':
      return 'error'
    case 'finalizado':
      return 'blue-grey'
    default:
      return 'grey'
  }
})

const nombreFuncionario = computed(() => {
  const t: any = turno.value
  const f = t?.funcionario || t?.usuario
  return f ? `${f.nombres} ${f.apellidos}` : '—'
})

/* ===== Imagen / preview ===== */
function selectFile() {
  fileInput.value?.click()
}
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) setFile(file)
  input.value = ''
}
function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}
function setFile(file: File) {
  previewBlob.value = file
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  imageRotation.value = 0
  imageScale.value = 1
}
function limpiarEvidencia() {
  previewBlob.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  imageRotation.value = 0
  imageScale.value = 1
}

function zoomIn() {
  imageScale.value = Math.min(imageScale.value + 0.1, 3)
}
function zoomOut() {
  imageScale.value = Math.max(imageScale.value - 0.1, 0.4)
}
function rotateRight() {
  imageRotation.value = (imageRotation.value + 90) % 360
}
function fitWidth() {
  imageScale.value = 1
}

const imgStyle = computed(() => ({
  transform: `rotate(${imageRotation.value}deg) scale(${imageScale.value})`,
  transformOrigin: 'center center',
  maxWidth: '100%',
}))

/* ===== Helpers texto / fecha / servicio ===== */
function formatTime(timeString: string | null): string {
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

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return ''
  const d = DateTime.fromISO(fecha, { zone: 'America/Bogota' })
  if (!d.isValid) return fecha
  return d.toFormat('dd/MM/yyyy')
}

function capitalizar(s: string | null | undefined): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getServicioCodigo(t: Turno): string {
  return t.servicio?.codigoServicio ?? t.servicioCodigo ?? '—'
}

/* ===== Navegación ===== */
function goBack() {
  router.push('/rtm/turnos-dia')
}

/* ===== Dialog ===== */
function openConfirm() {
  if (!puedeConfirmar.value) {
    snack.text = 'Selecciona una imagen de evidencia antes de confirmar.'
    snack.show = true
    return
  }
  dialogConfirm.value = true
}

/* ===== Guardar / finalizar ===== */
async function confirmarYGuardar() {
  if (!turno.value || !previewBlob.value) return

  saving.value = true
  try {
    const turnoId = turno.value.id

    // Subir evidencia de certificación (el back ya finaliza el turno)
    await CertificacionService.subirEvidencia(
      turnoId,
      previewBlob.value,
      nota.value || null
    )

    snack.text = '✅ Certificación registrada y turno finalizado.'
    snack.show = true
    dialogConfirm.value = false

    router.push('/rtm/turnos-dia')
  } catch (err: any) {
    console.error('Error al guardar certificación:', err)
    snack.text =
      '❌ No se pudo registrar la certificación. ' +
      (err?.message || 'Intenta nuevamente.')
    snack.show = true
  } finally {
    saving.value = false
  }
}

/* ===== Carga del turno ===== */
async function fetchTurno() {
  const id = getTurnoId()
  if (!id) {
    loadingTurno.value = false
    snack.text = 'No se encontró el turno en la URL.'
    snack.show = true
    return
  }
  loadingTurno.value = true
  try {
    const t = await TurnosDelDiaService.fetchTurnoById(id)
    turno.value = t as unknown as Turno
  } catch (e) {
    console.error('No se pudo cargar el turno:', e)
    snack.text = 'No se pudo cargar la información del turno.'
    snack.show = true
  } finally {
    loadingTurno.value = false
  }
}

/* ===== Mounted ===== */
onMounted(() => {
  fetchTurno()
})
</script>

<style scoped>
.v-card {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08), 0 6px 6px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
}

.section-title {
  font-weight: 700;
  margin-bottom: 10px;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
}

.label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.value {
  font-weight: 600;
}

/* Dropzone */
.dropzone {
  border: 2px dashed rgba(0, 0, 0, 0.25);
  padding: 22px;
  cursor: pointer;
  background: #f0f9ff;
  transition: 0.3s;
  border-radius: 12px;
}

.dropzone--active {
  background: #e0f2ff;
  border-color: #0284c7;
}

/* Preview */
.preview-wrapper .preview-canvas {
  width: 100%;
  max-height: 60vh;
  overflow: auto;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 8px;
  text-align: center;
}

.preview-canvas img {
  max-width: 100%;
  transition: transform 0.2s ease;
}

/* Helpers */
.text-medium-emphasis {
  color: rgba(0, 0, 0, 0.6);
}

.rounded-xl {
  border-radius: 16px;
}
.rounded-2xl {
  border-radius: 20px;
}
</style>
