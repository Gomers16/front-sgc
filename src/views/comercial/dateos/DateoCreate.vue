<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 text-h5 font-weight-bold">➕ Nuevo Dateo</v-card-title>
      <v-divider />
      <v-card-text class="pt-6">
        <v-expand-transition>
          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            class="mb-4"
            density="comfortable"
            border="start"
          >
            {{ errorMsg }}
          </v-alert>
        </v-expand-transition>

        <v-form @submit.prevent="submit">
          <v-row class="g-3">
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.canal"
                :items="canalItems"
                label="Canal"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Requerido']"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-autocomplete
                v-model="form.agente_id"
                :items="asesoresItems"
                item-title="nombre"
                item-value="id"
                label="Asesor (requerido si canal es ASESOR o TELE)"
                variant="outlined"
                density="comfortable"
                :loading="asesoresLoading"
                :disabled="!requiereAsesor"
                clearable
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item?.raw?.nombre">
                    <template #append>
                      <v-chip size="x-small" variant="flat">
                        {{ mapTipoCorto(item?.raw?.tipo) }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <div class="d-flex align-center gap-1">
                    <span>{{ item?.raw?.nombre }}</span>
                    <v-chip size="x-small" variant="flat">
                      {{ mapTipoCorto(item?.raw?.tipo) }}
                    </v-chip>
                  </div>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- ✅ Convenio (requerido si canal = ASESOR) -->
            <v-col cols="12" sm="4">
              <v-autocomplete
                v-model="form.convenio_id"
                :items="conveniosItems"
                item-title="nombre"
                item-value="id"
                label="Convenio (requerido si canal es ASESOR)"
                variant="outlined"
                density="comfortable"
                :loading="conveniosLoading"
                :disabled="!requiereConvenio"
                clearable
                :rules="[v => (!requiereConvenio || !!v) || 'Selecciona un convenio']"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.placa"
                label="Placa"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'La placa es obligatoria']"
                @blur="normalizePlacaInput"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.telefono"
                label="Teléfono"
                variant="outlined"
                density="comfortable"
                @blur="digitsOnly"
                hint="Opcional"
                persistent-hint
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.observacion"
                label="Observación"
                variant="outlined"
                density="comfortable"
                rows="3"
              />
            </v-col>

            <!-- Evidencia -->
            <v-col cols="12" sm="8">
              <v-file-input
                v-model="evidenciaModel"
                label="Evidencia (foto)"
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
                Tamaño máx. {{ MAX_IMAGE_MB }}MB. Formatos: JPG, PNG, HEIC, WEBP…
              </small>
            </v-col>

            <v-col cols="12" sm="4" v-if="previewUrl">
              <v-img :src="previewUrl" class="rounded" height="160" cover />
            </v-col>
          </v-row>

          <div class="d-flex justify-end mt-4">
            <v-btn variant="text" class="me-2" @click="volver">Cancelar</v-btn>
            <v-btn color="primary" type="submit" :loading="loading || uploading">Guardar</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Conflicto (bloqueo) -->
    <v-dialog v-model="dlgBloqueo.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Dateo bloqueado</v-card-title>
        <v-card-text>
          Ya existe un dateo activo para esta placa/teléfono.<br />
          <strong>Bloqueado hasta:</strong> {{ dlgBloqueo.hasta || '—' }}<br />
          <strong>Asignado a:</strong> {{ dlgBloqueo.por || '—' }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="dlgBloqueo.visible = false">Entendido</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  createDateo,
  listAgentesCaptacion,
  listConveniosLight,
  type CanalCaptacion,
  type Dateo,
  type DateoImagenMeta,
} from '@/services/dateosService'
import { uploadImage, type UploadImageResponse } from '@/services/uploadsService'

const router = useRouter()
const route = useRoute()

const canalItems: { title: string; value: CanalCaptacion }[] = [
  { title: 'Fachada', value: 'FACHADA' },
  { title: 'Asesor', value: 'ASESOR' },
  { title: 'Telemercadeo', value: 'TELE' },
  { title: 'Redes/Ads', value: 'REDES' },
]

type FormShape = {
  canal: CanalCaptacion | null
  agente_id: number | null
  convenio_id: number | null
  placa: string
  telefono: string
  observacion: string
} & DateoImagenMeta

const form = ref<FormShape>({
  canal: null,
  agente_id: null,
  convenio_id: null,
  placa: (route.query.placa as string) || '',
  telefono: (route.query.telefono as string) || '',
  observacion: '',
})

const loading = ref(false)
const errorMsg = ref<string | null>(null)

/* asesores */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)
async function loadAsesores() {
  asesoresLoading.value = true
  try { asesoresItems.value = await listAgentesCaptacion() }
  finally { asesoresLoading.value = false }
}

/* convenios */
const conveniosItems = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)
async function loadConvenios() {
  conveniosLoading.value = true
  try { conveniosItems.value = await listConveniosLight() }
  finally { conveniosLoading.value = false }
}

/* reglas */
const requiereAsesor = computed(() => form.value.canal === 'ASESOR' || form.value.canal === 'TELE')
const requiereConvenio = computed(() => form.value.canal === 'ASESOR')

function normalizePlacaInput() {
  form.value.placa = (form.value.placa || '').replace(/[\s-]/g, '').toUpperCase()
}
function digitsOnly() {
  form.value.telefono = (form.value.telefono || '').replace(/\D/g, '')
}

/* Evidencia */
const evidenciaModel = ref<File | File[] | null>(null)
const evidenciaFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const uploading = ref(false)
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
  return f.size <= MAX_IMAGE_MB * 1024 * 1024 || `La imagen no debe superar {{ MAX_IMAGE_MB }}MB`
}

function hayArchivoSeleccionado(): boolean {
  const v = evidenciaModel.value
  return !!(Array.isArray(v) ? v?.[0] : v)
}

function mapTipoCorto(t?: string) {
  const u = String(t || '').toUpperCase()
  if (u.includes('CONVENIO')) return 'Convenio'
  if (u.includes('COMERCIAL')) return 'Comercial'
  if (u.includes('TELE')) return 'Tele'
  return ''
}

async function uploadImagenSiHaceFaltaStrict() {
  if (!hayArchivoSeleccionado()) return false
  if (!evidenciaFile.value) {
    const f = Array.isArray(evidenciaModel.value) ? evidenciaModel.value[0] : evidenciaModel.value
    if (f instanceof File) evidenciaFile.value = f
  }
  if (!evidenciaFile.value) throw new Error('No se reconoció el archivo de evidencia')

  uploading.value = true
  try {
    const data: UploadImageResponse = await uploadImage(evidenciaFile.value)
    if (!data?.url) throw new Error('El servidor no devolvió la URL de la imagen')

    form.value.imagen_url = data.url
    form.value.imagen_mime = data.mime ?? evidenciaFile.value.type ?? null
    form.value.imagen_tamano_bytes = typeof data.size === 'number' ? data.size : evidenciaFile.value.size
    form.value.imagen_hash = data.hash ?? null
    form.value.imagen_origen_id = data.id ?? null
    return true
  } finally {
    uploading.value = false
  }
}

const dlgBloqueo = ref<{ visible: boolean; hasta: string | null; por: string | null }>({
  visible: false, hasta: null, por: null,
})

async function submit() {
  errorMsg.value = null
  if (!form.value.canal) { errorMsg.value = 'Selecciona un canal.'; return }
  if (!form.value.placa) { errorMsg.value = 'La placa es obligatoria.'; return }
  if (requiereAsesor.value && !form.value.agente_id) {
    errorMsg.value = 'Debes seleccionar un asesor para el canal elegido.'; return
  }
  if (requiereConvenio.value && !form.value.convenio_id) {
    errorMsg.value = 'Debes seleccionar un convenio para el canal ASESOR.'; return
  }

  normalizePlacaInput()
  digitsOnly()

  try {
    const subio = await uploadImagenSiHaceFaltaStrict()
    if (subio && !form.value.imagen_url) {
      errorMsg.value = 'No se pudo subir la imagen'
      return
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'No se pudo subir la imagen'
    return
  }

  loading.value = true
  try {
    const payload: Partial<Dateo> = {
      canal: form.value.canal!,
      agente_id: form.value.agente_id,
      convenio_id: form.value.convenio_id,
      placa: form.value.placa,
      telefono: form.value.telefono || undefined,
      observacion: form.value.observacion || undefined,
      imagen_url: form.value.imagen_url,
      imagen_mime: form.value.imagen_mime ?? undefined,
      imagen_tamano_bytes: form.value.imagen_tamano_bytes ?? undefined,
      imagen_hash: form.value.imagen_hash ?? undefined,
      imagen_origen_id: form.value.imagen_origen_id ?? undefined,
      origen: 'UI',
    }

    const created = await createDateo(payload)
    router.push({ name: 'ComercialDateoDetalle', params: { id: created.id } })
  } catch (e) {
    const msg = (e as any)?.response?.data?.message || (e instanceof Error ? e.message : null)
    if (msg?.includes('dateo activo')) {
      dlgBloqueo.value = {
        visible: true,
        hasta: (e as any)?.response?.data?.bloqueadoHasta ?? null,
        por: (e as any)?.response?.data?.por ?? null,
      }
    } else {
      errorMsg.value = msg || 'No se pudo crear el dateo'
    }
  } finally {
    loading.value = false
  }
}

function volver() { router.push({ name: 'ComercialDateos' }) }

loadAsesores()
loadConvenios()
</script>

<style scoped>
.g-3 { gap: 12px; }
</style>
