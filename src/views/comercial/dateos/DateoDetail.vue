<template>
  <v-container class="py-4 py-sm-6">
    <v-btn
      variant="text"
      class="mb-3 mb-sm-4"
      prepend-icon="mdi-arrow-left"
      :size="$vuetify.display.xs ? 'small' : 'default'"
      @click="volver"
    >
      Volver
    </v-btn>

    <v-skeleton-loader v-if="loading" type="card, card" />

    <v-row v-else class="g-3 g-sm-4">
      <!-- Ficha -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg rounded-sm-xl">
          <v-card-title class="d-flex align-center justify-space-between pa-3 pa-sm-4">
            <span class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold">
              Dateo #{{ dateo?.id }}
            </span>
            <v-chip :size="$vuetify.display.xs ? 'x-small' : 'small'" variant="flat">
              {{ getCanalLabel(form.canal) }}
            </v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3 pa-sm-4">
            <v-row class="g-2">
              <v-col cols="12">
                <div class="text-caption text-sm-body-2 mb-2">
                  <strong>Creado:</strong>
                  {{ dateo?.created_at_fmt || fmt(dateo?.created_at) }}
                </div>
              </v-col>

              <!-- Canal -->
              <v-col cols="12">
                <v-select
                  v-model="form.canal"
                  :items="canalItems"
                  label="Canal"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  prepend-inner-icon="mdi-source-branch"
                  :disabled="!editando"
                  :readonly="!editando"
                />
              </v-col>

              <!-- Placa -->
              <v-col cols="12">
                <v-text-field
                  v-model="form.placa"
                  label="Placa *"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  prepend-inner-icon="mdi-card-text"
                  :rules="editando ? [rules.required, rules.placaLength] : []"
                  :counter="editando ? 6 : false"
                  :maxlength="editando ? 6 : undefined"
                  :disabled="!editando"
                  :readonly="!editando"
                  @input="editando ? normalizePlaca($event) : null"
                  :hint="editando ? 'Exactamente 6 caracteres en mayúsculas' : ''"
                  :persistent-hint="editando"
                />
              </v-col>

              <!-- Teléfono -->
              <v-col cols="12">
                <v-text-field
                  v-model="form.telefono"
                  label="Teléfono"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  prepend-inner-icon="mdi-phone"
                  type="tel"
                  :disabled="!editando"
                  :readonly="!editando"
                />
              </v-col>

              <v-col cols="12">
                <div class="text-caption text-sm-body-2">
                  <strong>Agente:</strong> {{ dateo?.agente?.nombre || '—' }}
                  <span v-if="dateo?.agente" class="text-medium-emphasis">
                    ({{ mapTipoCorto(dateo?.agente?.tipo) }})
                  </span>
                </div>
              </v-col>

              <v-col cols="12">
                <div class="text-caption text-sm-body-2">
                  <strong>Convenio:</strong> {{ dateo?.convenio?.nombre || '—' }}
                </div>
              </v-col>
            </v-row>

            <!-- Turno (solo visual) -->
            <v-divider class="my-3" />
            <div class="text-caption text-sm-subtitle-2 mb-2 font-weight-600">Turno vinculado</div>

            <div v-if="dateo?.turnoInfo" class="d-flex align-center flex-wrap" style="gap:6px">
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-600">
                {{ (dateo?.turnoInfo?.fecha && formatDateOnly(dateo.turnoInfo.fecha)) || '—' }}
              </v-chip>
              <v-chip size="x-small" color="indigo" variant="tonal" class="font-weight-600">
                G: {{ dateo?.turnoInfo?.numeroGlobal ?? '—' }}
              </v-chip>
              <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-600">
                S: {{ dateo?.turnoInfo?.numeroServicio ?? '—' }}
              </v-chip>

              <v-chip
                v-if="dateo?.turnoInfo?.servicioCodigo"
                size="x-small"
                variant="tonal"
                class="font-weight-600"
              >
                {{ dateo?.turnoInfo?.servicioCodigo }}
              </v-chip>

              <v-chip
                size="x-small"
                :color="chipColorEstadoTurno(dateo?.turnoInfo?.estado || dateo?.resultado)"
                variant="elevated"
                prepend-icon="mdi-progress-clock"
                class="font-weight-600"
              >
                {{ textoEstadoTurno(dateo?.turnoInfo?.estado || dateo?.resultado) }}
              </v-chip>
            </div>
            <div v-else class="text-caption text-sm-body-2 text-medium-emphasis">
              — Sin turno vinculado —
            </div>
          </v-card-text>

          <!-- Acciones de la ficha -->
          <v-card-actions class="px-3 px-sm-4 pb-3 pb-sm-4 pt-0">
            <v-spacer />

            <!-- Modo lectura: botón Editar -->
            <v-btn
              v-if="!editando"
              color="primary"
              variant="tonal"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              @click="activarEdicion"
              prepend-icon="mdi-pencil"
            >
              Editar
            </v-btn>

            <!-- Modo edición: botones Guardar y Cancelar -->
            <template v-else>
              <v-btn
                color="primary"
                @click="guardar"
                :loading="saving"
                :disabled="!isFormValid"
                :size="$vuetify.display.xs ? 'small' : 'default'"
                prepend-icon="mdi-content-save"
              >
                <span v-if="$vuetify.display.xs">Guardar</span>
                <span v-else>Guardar cambios</span>
              </v-btn>
              <v-btn
                variant="text"
                @click="cancelarEdicion"
                :disabled="saving"
                :size="$vuetify.display.xs ? 'small' : 'default'"
              >
                Cancelar
              </v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Resultado -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg rounded-sm-xl">
          <v-card-title class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold pa-3 pa-sm-4">
            Resultado
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3 pa-sm-4">
            <v-row class="g-2">
              <v-col cols="12">
                <v-select
                  v-model="form.resultado"
                  :items="resultadoItems"
                  label="Resultado"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  :disabled="!editando"
                  :readonly="!editando"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-3 px-sm-4 pb-3 pb-sm-4 pt-0">
            <v-spacer />

            <template v-if="editando">
              <v-btn
                color="primary"
                @click="guardar"
                :loading="saving"
                :disabled="!isFormValid"
                :size="$vuetify.display.xs ? 'small' : 'default'"
                prepend-icon="mdi-content-save"
              >
                <span v-if="$vuetify.display.xs">Guardar</span>
                <span v-else>Guardar cambios</span>
              </v-btn>
            </template>

            <v-btn
              color="error"
              variant="tonal"
              @click="openEliminar"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              prepend-icon="mdi-delete"
              :disabled="editando"
            >
              Eliminar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Observación / Evidencia -->
      <v-col cols="12">
        <v-card elevation="4" class="rounded-lg rounded-sm-xl">
          <v-card-title class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold pa-3 pa-sm-4">
            Observación y evidencia
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3 pa-sm-4">
            <v-row class="g-2">
              <v-col cols="12" sm="8">
                <v-textarea
                  v-model="form.observacion"
                  label="Observación"
                  variant="outlined"
                  :rows="$vuetify.display.xs ? 2 : 3"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  :disabled="!editando"
                  :readonly="!editando"
                />
              </v-col>

              <v-col cols="12" sm="4">
                <v-file-input
                  v-model="evidenciaModel"
                  label="Cambiar evidencia (foto)"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  accept="image/*"
                  prepend-icon="mdi-image"
                  :clearable="true"
                  :multiple="false"
                  show-size
                  :rules="[maxSizeRule]"
                  :disabled="uploading || !editando"
                />
                <small class="text-caption text-medium-emphasis">
                  Tamaño máx. {{ MAX_IMAGE_MB }}MB. Formatos: JPG/PNG/WEBP/HEIC…
                </small>

                <!-- PREVISUALIZACIÓN -->
                <v-img
                  v-if="previewUrl || form.imagen_url"
                  :src="previewUrl || form.imagen_url!"
                  class="mt-2 rounded"
                  :height="$vuetify.display.xs ? 120 : 160"
                  cover
                />
                <div v-else class="mt-2 text-medium-emphasis text-caption">
                  No hay evidencia asociada.
                </div>

                <div v-if="editando && form.imagen_url" class="d-flex gap-1 mt-2">
                  <v-btn
                    color="secondary"
                    variant="text"
                    :size="$vuetify.display.xs ? 'x-small' : 'small'"
                    :href="form.imagen_url!"
                    target="_blank"
                    prepend-icon="mdi-open-in-new"
                  >
                    <span class="d-none d-sm-inline">Ver original</span>
                    <span class="d-sm-none">Ver</span>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions v-if="editando" class="px-3 px-sm-4 pb-3 pb-sm-4 pt-0">
            <v-spacer />
            <v-btn
              color="primary"
              @click="guardar"
              :loading="saving"
              :disabled="!isFormValid"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              prepend-icon="mdi-content-save"
            >
              <span v-if="$vuetify.display.xs">Guardar</span>
              <span v-else>Guardar cambios</span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Diálogo eliminar -->
    <v-dialog
      v-model="dlgEliminar.visible"
      :max-width="$vuetify.display.xs ? '100%' : '420'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-sm-h6 pa-3 pa-sm-4">
          Eliminar dateo
        </v-card-title>
        <v-card-text class="pa-3 pa-sm-4 text-caption text-sm-body-2">
          ¿Estás seguro? Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="px-3 px-sm-4 pb-3 pb-sm-4">
          <v-spacer />
          <v-btn
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="dlgEliminar.visible = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="dlgEliminar.loading"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="doEliminar"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Mensaje -->
    <v-snackbar v-model="snackbar.visible" :timeout="3500" :color="snackbar.color" variant="tonal">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getDateo,
  updateDateo,
  deleteDateo,
  formatDateTime as fmt,
  type Dateo,
  type ResultadoDateo,
} from '@/services/dateosService'
import { uploadImage, type UploadImageResponse } from '@/services/uploadsService'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const loading = ref<boolean>(true)
const saving = ref<boolean>(false)
const editando = ref<boolean>(false)
const dateo = ref<Dateo | null>(null)

const backupForm = ref<FormShape | null>(null)

const resultadoItems: { title: string; value: ResultadoDateo }[] = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'En proceso', value: 'EN_PROCESO' },
  { title: 'Exitoso', value: 'EXITOSO' },
  { title: 'No exitoso', value: 'NO_EXITOSO' },
]

const canalItems = [
  { title: 'Asesor', value: 'ASESOR' },
  { title: 'Telemercadeo', value: 'TELE' },
  { title: 'Fachada', value: 'FACHADA' },
  { title: 'Redes sociales', value: 'REDES' },
]

type FormShape = {
  resultado: ResultadoDateo
  observacion: string
  placa: string
  telefono: string
  canal: 'ASESOR' | 'TELE' | 'FACHADA' | 'REDES'
  imagen_url: string | null
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
}

const form = ref<FormShape>({
  resultado: 'PENDIENTE',
  observacion: '',
  placa: '',
  telefono: '',
  canal: 'ASESOR',
  imagen_url: null,
})

const snackbar = ref<{ visible: boolean; msg: string; color: 'error' | 'success' | 'info' }>(
  { visible: false, msg: '', color: 'error' }
)

/* ===== Validaciones ===== */
const rules = {
  required: (v: any) => !!v || 'Este campo es requerido',
  placaLength: (v: any) => {
    if (!v) return 'La placa es requerida'
    const trimmed = v.toString().trim()
    return trimmed.length === 6 || 'La placa debe tener exactamente 6 caracteres'
  },
}

const isFormValid = computed(() => {
  return form.value.placa && form.value.placa.trim().length === 6
})

/* ===== Modo Edición ===== */
function activarEdicion() {
  backupForm.value = JSON.parse(JSON.stringify(form.value))
  editando.value = true
}

function cancelarEdicion() {
  if (backupForm.value) {
    form.value = JSON.parse(JSON.stringify(backupForm.value))
  }
  editando.value = false

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  evidenciaModel.value = null
  evidenciaFile.value = null
}

/* ===== Normalización de placa ===== */
function normalizePlaca(event: Event) {
  const input = event.target as HTMLInputElement
  if (input && input.value) {
    const normalized = input.value.toUpperCase().replace(/[\s-]/g, '').slice(0, 6)
    form.value.placa = normalized
    input.value = normalized
  }
}

/* ===== Evidencia ===== */
const evidenciaModel = ref<File | File[] | null>(null)
const evidenciaFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const uploading = ref<boolean>(false)
const MAX_IMAGE_MB = 8

watch(evidenciaModel, (val) => {
  const f = Array.isArray(val) ? val[0] : val
  evidenciaFile.value = f ?? null

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (evidenciaFile.value instanceof File) {
    previewUrl.value = URL.createObjectURL(evidenciaFile.value)
  }
})

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function maxSizeRule(v: File | File[] | null) {
  const f = Array.isArray(v) ? v?.[0] : v
  if (!f) return true
  return f.size <= MAX_IMAGE_MB * 1024 * 1024 || `La imagen no debe superar ${MAX_IMAGE_MB}MB`
}

function mapTipoCorto(t?: string) {
  const u = String(t || '').toUpperCase()
  if (u.includes('CONVENIO')) return 'Convenio'
  if (u.includes('COMERCIAL')) return 'Comercial'
  if (u.includes('TELE')) return 'Tele'
  return ''
}

function getCanalLabel(canal: string): string {
  const item = canalItems.find(c => c.value === canal)
  return item ? item.title : canal
}

/* ===== Turno helpers ===== */
function chipColorEstadoTurno(e?: string) {
  const v = String(e || '').toLowerCase()
  if (v.includes('proceso')) return 'info'
  if (v.includes('final')) return 'success'
  if (v.includes('cancel')) return 'error'
  return 'warning'
}

function textoEstadoTurno(e?: string) {
  const v = String(e || '').toUpperCase()
  if (v === 'EN_PROCESO') return 'En proceso'
  if (v === 'FINALIZADO') return 'Finalizado'
  if (v === 'CANCELADO') return 'Cancelado'
  if (v === 'ACTIVO') return 'Activo'
  return 'Pendiente'
}

function formatDateOnly(iso?: string) {
  if (!iso) return ''
  const p = iso.split('T')[0] || iso
  const [y, m, d] = p.split('-')
  return `${d}/${m}/${y}`
}

/* ===== Carga ===== */
async function load() {
  loading.value = true
  try {
    const d = await getDateo(id)
    dateo.value = d
    form.value.resultado = d.resultado ?? 'PENDIENTE'
    form.value.observacion = d.observacion ?? ''
    form.value.placa = (d.placa ?? '').toUpperCase()
    form.value.telefono = d.telefono ?? ''
    form.value.canal = (d.canal ?? 'ASESOR') as 'ASESOR' | 'TELE' | 'FACHADA' | 'REDES'
    form.value.imagen_url = d.imagen_url ?? null
    form.value.imagen_mime = d.imagen_mime ?? null
    form.value.imagen_tamano_bytes = d.imagen_tamano_bytes ?? null
    form.value.imagen_hash = d.imagen_hash ?? null
    form.value.imagen_origen_id = d.imagen_origen_id ?? null

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    evidenciaModel.value = null
    evidenciaFile.value = null

    editando.value = false
  } catch (e) {
    const message =
      (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
      'No se pudo cargar el dateo'
    snackbar.value = { visible: true, msg: message, color: 'error' }
  } finally {
    loading.value = false
  }
}

/* ===== Subida de imagen ===== */
async function uploadImagen() {
  if (!evidenciaFile.value) return
  uploading.value = true
  try {
    const data: UploadImageResponse = await uploadImage(evidenciaFile.value)
    form.value.imagen_url = data.url ?? null
    form.value.imagen_mime = data.mime ?? evidenciaFile.value.type ?? null
    form.value.imagen_tamano_bytes = typeof data.size === 'number' ? data.size : evidenciaFile.value.size
    form.value.imagen_hash = data.hash ?? null
    form.value.imagen_origen_id = data.id ?? null
  } finally {
    uploading.value = false
  }
}

/* ===== 🔥 GUARDAR (con subida automática de imagen) ===== */
async function guardar() {
  if (!isFormValid.value) {
    snackbar.value = {
      visible: true,
      msg: 'La placa debe tener exactamente 6 caracteres',
      color: 'error'
    }
    return
  }

  saving.value = true
  try {
    // 🔥 PASO 1: Si hay imagen pendiente, subirla primero
    if (evidenciaFile.value instanceof File) {
      console.log('📤 Subiendo imagen antes de guardar...')
      await uploadImagen()
      if (!form.value.imagen_url) {
        throw new Error('No se recibió la URL de la imagen después de subirla')
      }
      console.log('✅ Imagen subida:', form.value.imagen_url)
    }

    // 🔥 PASO 2: Preparar payload con TODOS los campos (incluida imagen)
    const payload: any = {
      resultado: form.value.resultado,
      observacion: form.value.observacion || null,
      placa: form.value.placa.trim().toUpperCase(),
      telefono: form.value.telefono || null,
      canal: form.value.canal,
    }

    // 🔥 AGREGAR campos de imagen si existen
    if (form.value.imagen_url) {
      payload.imagen_url = form.value.imagen_url
      payload.imagen_mime = form.value.imagen_mime ?? null
      payload.imagen_tamano_bytes = form.value.imagen_tamano_bytes ?? null
      payload.imagen_hash = form.value.imagen_hash ?? null
      payload.imagen_origen_id = form.value.imagen_origen_id ?? null
    }

    console.log('🔥 Guardando dateo con payload:', payload)

    const response = await updateDateo(id, payload)

    console.log('✅ Respuesta del servidor:', response)

    snackbar.value = { visible: true, msg: 'Cambios guardados correctamente ✅', color: 'success' }

    // 🔥 PASO 3: Limpiar estado de imagen temporal
    if (evidenciaFile.value) {
      evidenciaModel.value = null
      evidenciaFile.value = null
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
      }
    }

    // Recargar datos
    await load()

  } catch (e) {
    console.error('❌ Error guardando:', e)
    const message =
      (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
      (e instanceof Error ? e.message : 'No se pudo guardar')
    snackbar.value = { visible: true, msg: message, color: 'error' }
  } finally {
    saving.value = false
  }
}

/* ===== Eliminar ===== */
const dlgEliminar = ref<{ visible: boolean; loading: boolean }>({ visible: false, loading: false })

function openEliminar() {
  dlgEliminar.value.visible = true
}

async function doEliminar() {
  dlgEliminar.value.loading = true
  try {
    await deleteDateo(id)
    router.push({ name: 'ComercialDateos' })
  } catch (e) {
    const message =
      (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
      'No se pudo eliminar'
    snackbar.value = { visible: true, msg: message, color: 'error' }
  } finally {
    dlgEliminar.value.loading = false
  }
}

function volver() {
  router.push({ name: 'ComercialDateos' })
}

onMounted(load)
</script>

<style scoped>
.g-4 { gap: 16px; }
.g-3 { gap: 12px; }
.g-2 { gap: 8px; }
.gap-1 { gap: 4px; }
.font-weight-600 { font-weight: 600; }

@media (min-width: 600px) {
  .g-4 { gap: 16px; }
}
</style>
