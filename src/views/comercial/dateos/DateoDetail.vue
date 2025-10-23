<template>
  <v-container class="py-6">
    <v-btn variant="text" class="mb-3" prepend-icon="mdi-arrow-left" @click="volver">Volver</v-btn>

    <v-skeleton-loader v-if="loading" type="card, card" />

    <v-row v-else class="g-4">
      <!-- Ficha -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Dateo #{{ dateo?.id }}</span>
            <v-chip size="small" variant="flat">{{ dateo?.canal }}</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div class="text-body-2">
              <strong>Creado:</strong>
              {{ dateo?.created_at_fmt || fmt(dateo?.created_at) }}
            </div>
            <div class="text-body-2">
              <strong>Agente:</strong> {{ dateo?.agente?.nombre || '—' }}
              <span v-if="dateo?.agente" class="text-medium-emphasis">
                ({{ mapTipoCorto(dateo?.agente?.tipo) }})
              </span>
            </div>
            <div class="text-body-2"><strong>Placa:</strong> {{ dateo?.placa || '—' }}</div>
            <div class="text-body-2"><strong>Teléfono:</strong> {{ dateo?.telefono || '—' }}</div>
            <div class="text-body-2">
              <strong>Convenio:</strong> {{ dateo?.convenio?.nombre || '—' }}
            </div>

            <!-- Turno (solo visual) -->
            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2 font-weight-600">Turno vinculado</div>

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

              <!-- ✅ Nuevo: Servicio al ladito, igual que en la lista -->
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
            <div v-else class="text-medium-emphasis">— Sin turno vinculado —</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Resultado -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">Resultado</v-card-title>
          <v-divider />
          <v-card-text>
            <v-row class="g-2">
              <v-col cols="12">
                <v-select
                  v-model="form.resultado"
                  :items="resultadoItems"
                  label="Resultado"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-spacer />
            <v-btn color="primary" @click="guardar" :loading="saving" prepend-icon="mdi-content-save">
              Guardar
            </v-btn>
            <v-btn color="error" variant="tonal" @click="openEliminar" prepend-icon="mdi-delete">
              Eliminar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Observación / Evidencia -->
      <v-col cols="12">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">Observación y evidencia</v-card-title>
          <v-divider />
          <v-card-text>
            <v-row class="g-2">
              <v-col cols="12" sm="8">
                <v-textarea v-model="form.observacion" label="Observación" variant="outlined" rows="3" />
              </v-col>

              <v-col cols="12" sm="4">
                <v-file-input
                  v-model="evidenciaModel"
                  label="Cambiar evidencia (foto)"
                  variant="outlined"
                  density="comfortable"
                  accept="image/*"
                  prepend-icon="mdi-image"
                  :clearable="true"
                  :multiple="false"
                  show-size
                  :rules="[maxSizeRule]"
                  :disabled="uploading"
                />
                <small class="text-medium-emphasis">
                  Tamaño máx. {{ MAX_IMAGE_MB }}MB. Formatos: JPG/PNG/WEBP/HEIC…
                </small>

                <!-- PREVISUALIZACIÓN -->
                <v-img
                  v-if="previewUrl || form.imagen_url"
                  :src="previewUrl || form.imagen_url!"
                  class="mt-2 rounded"
                  height="160"
                  cover
                />
                <div v-else class="mt-2 text-medium-emphasis text-caption">
                  No hay evidencia asociada.
                </div>

                <div class="d-flex gap-1 mt-2">
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    :loading="uploading"
                    :disabled="!evidenciaFile || uploading"
                    @click="subirYAplicar"
                    prepend-icon="mdi-cloud-upload"
                  >
                    Subir evidencia
                  </v-btn>
                  <v-btn
                    v-if="form.imagen_url"
                    color="secondary"
                    variant="text"
                    size="small"
                    :href="form.imagen_url!"
                    target="_blank"
                    prepend-icon="mdi-open-in-new"
                  >
                    Ver original
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-spacer />
            <v-btn color="primary" @click="guardar" :loading="saving" prepend-icon="mdi-content-save">
              Guardar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Diálogo eliminar -->
    <v-dialog v-model="dlgEliminar.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">Eliminar dateo</v-card-title>
        <v-card-text>¿Estás seguro? Esta acción no se puede deshacer.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgEliminar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgEliminar.loading" @click="doEliminar">Eliminar</v-btn>
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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
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
const dateo = ref<Dateo | null>(null)

const resultadoItems: { title: string; value: ResultadoDateo }[] = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'En proceso', value: 'EN_PROCESO' },
  { title: 'Exitoso', value: 'EXITOSO' },
  { title: 'No exitoso', value: 'NO_EXITOSO' },
]

type FormShape = {
  resultado: ResultadoDateo
  observacion: string
  imagen_url: string | null
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
}

const form = ref<FormShape>({
  resultado: 'PENDIENTE',
  observacion: '',
  imagen_url: null,
})

const snackbar = ref<{ visible: boolean; msg: string; color: 'error' | 'success' | 'info' }>(
  { visible: false, msg: '', color: 'error' }
)

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

/* ===== Turno helpers (visual) ===== */
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

/* ===== Carga y guardado ===== */
async function load() {
  loading.value = true
  try {
    const d = await getDateo(id)
    dateo.value = d
    form.value.resultado = d.resultado ?? 'PENDIENTE'
    form.value.observacion = d.observacion ?? ''
    form.value.imagen_url = d.imagen_url ?? null
    form.value.imagen_mime = d.imagen_mime ?? null
    form.value.imagen_tamano_bytes = d.imagen_tamano_bytes ?? null
    form.value.imagen_hash = d.imagen_hash ?? null
    form.value.imagen_origen_id = d.imagen_origen_id ?? null

    // siempre que recargo desde BD, elimino cualquier preview local
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    evidenciaModel.value = null
    evidenciaFile.value = null
  } catch (e) {
    const message =
      (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
      'No se pudo cargar el dateo'
    snackbar.value = { visible: true, msg: message, color: 'error' }
  } finally {
    loading.value = false
  }
}

async function guardar() {
  saving.value = true
  try {
    await updateDateo(id, {
      resultado: form.value.resultado,
      observacion: form.value.observacion,
    })
    await load()
    snackbar.value = { visible: true, msg: 'Cambios guardados', color: 'success' }
  } catch (e) {
    const message =
      (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
      'No se pudo guardar'
    snackbar.value = { visible: true, msg: message, color: 'error' }
  } finally {
    saving.value = false
  }
}

/* Subida + persistencia de imagen */
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

async function subirYAplicar() {
  try {
    await uploadImagen()
    if (!form.value.imagen_url) throw new Error('No se recibió la URL de la imagen')

    await updateDateo(id, {
      imagen_url: form.value.imagen_url,
      imagen_mime: form.value.imagen_mime ?? null,
      imagen_tamano_bytes: form.value.imagen_tamano_bytes ?? null,
      imagen_hash: form.value.imagen_hash ?? null,
      imagen_origen_id: form.value.imagen_origen_id ?? null,
    })

    evidenciaModel.value = null
    evidenciaFile.value = null
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }

    await load()
    snackbar.value = { visible: true, msg: 'Evidencia actualizada', color: 'success' }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo actualizar la evidencia'
    snackbar.value = { visible: true, msg: message, color: 'error' }
  }
}

const dlgEliminar = ref<{ visible: boolean; loading: boolean }>({ visible: false, loading: false })
function openEliminar() { dlgEliminar.value.visible = true }
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

function volver() { router.push({ name: 'ComercialDateos' }) }

onMounted(load)
</script>

<style scoped>
.g-4 { gap: 16px; }
.g-2 { gap: 8px; }
.gap-1 { gap: 4px; }
.font-weight-600 { font-weight: 600; }
</style>
