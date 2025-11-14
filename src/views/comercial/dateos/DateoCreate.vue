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
            <!-- CANAL -->
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

            <!-- TIPO (solo cuando canal = ASESOR) -->
            <v-col cols="12" sm="4" v-if="form.canal === 'ASESOR'">
              <v-select
                v-model="tipoAsesor"
                :items="tipoAsesorItems"
                label="Tipo de asesor"
                variant="outlined"
                density="comfortable"
                :rules="[v => (form.canal !== 'ASESOR' || !!v) || 'Selecciona Comercial o Convenio']"
              />
            </v-col>

            <!-- ASESOR -->
            <v-col cols="12" sm="4">
              <v-autocomplete
                v-model="form.agente_id"
                :items="asesoresFiltrados"
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

            <!-- CONVENIO -->
            <v-col cols="12" sm="4">
              <v-autocomplete
                v-model="form.convenio_id"
                :items="conveniosFiltrados"
                item-title="nombre"
                item-value="id"
                :label="labelConvenio"
                variant="outlined"
                density="comfortable"
                :loading="conveniosLoading"
                :disabled="!habilitaConvenio"
                clearable
              />
            </v-col>

            <!-- PLACA -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.placa"
                label="Placa"
                variant="outlined"
                density="comfortable"
                :rules="placaRules"
                @blur="normalizePlacaInput"
              />
            </v-col>

            <!-- TELÉFONO -->
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

            <!-- OBSERVACIÓN -->
            <v-col cols="12">
              <v-textarea
                v-model="form.observacion"
                label="Observación"
                variant="outlined"
                density="comfortable"
                rows="3"
              />
            </v-col>

            <!-- EVIDENCIA -->
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
import { listConveniosAsignados } from '@/services/conveniosService'
import { uploadImage, type UploadImageResponse } from '@/services/uploadsService'

const router = useRouter()
const route = useRoute()

/* ================== CANAL / TIPO ================== */
const canalItems: { title: string; value: CanalCaptacion }[] = [
  { title: 'Fachada', value: 'FACHADA' },
  { title: 'Asesor', value: 'ASESOR' },
  { title: 'Telemercadeo', value: 'TELE' },
  { title: 'Redes/Ads', value: 'REDES' },
]

type TipoAsesor = 'COMERCIAL' | 'CONVENIO' | null
const tipoAsesor = ref<TipoAsesor>(null)
const tipoAsesorItems = [
  { title: 'Comercial', value: 'COMERCIAL' },
  { title: 'Convenio', value: 'CONVENIO' },
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

/* ================== ASESOR ================== */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

const asesoresComercialesUI = computed(() =>
  asesoresItems.value.filter((a) => String(a.tipo || '').toUpperCase().includes('COMERCIAL'))
)

const asesoresConvenioUI = computed(() =>
  asesoresItems.value.filter((a) => String(a.tipo || '').toUpperCase().includes('CONVENIO'))
)

const asesoresTeleUI = computed(() =>
  asesoresItems.value.filter((a) => String(a.tipo || '').toUpperCase().includes('TELE'))
)

/** Lista que realmente ve el usuario según canal/tipo */
const asesoresFiltrados = computed(() => {
  if (form.value.canal === 'TELE') {
    return asesoresTeleUI.value
  }
  if (form.value.canal === 'ASESOR') {
    if (tipoAsesor.value === 'COMERCIAL') return asesoresComercialesUI.value
    if (tipoAsesor.value === 'CONVENIO') return asesoresConvenioUI.value
    return []
  }
  return []
})

/* ================== CONVENIOS ================== */
/** conveniosAll = catálogo general (para auto-match de asesores convenio)
 *  conveniosAsignados = sólo los asignados a un comercial
 */
const conveniosItems = ref<{ id: number; nombre: string }[]>([])
const conveniosAsignados = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)

async function loadConveniosAll() {
  conveniosLoading.value = true
  try {
    conveniosItems.value = await listConveniosLight()
  } finally {
    conveniosLoading.value = false
  }
}

async function loadConveniosAsignadosByAsesor(asesorId: number) {
  if (!asesorId) {
    conveniosAsignados.value = []
    return
  }
  conveniosLoading.value = true
  try {
    conveniosAsignados.value = await listConveniosAsignados(asesorId)
  } catch {
    conveniosAsignados.value = []
  } finally {
    conveniosLoading.value = false
  }
}

/** Convenios que ve el usuario:
 *  - canal ≠ ASESOR → ninguno
 *  - tipoAsesor = CONVENIO → solo el convenio auto-asignado
 *  - tipoAsesor = COMERCIAL → sólo los asignados a ese comercial
 */
const conveniosFiltrados = computed(() => {
  if (form.value.canal !== 'ASESOR' || !form.value.agente_id) return []

  if (tipoAsesor.value === 'CONVENIO') {
    const seleccionado = conveniosItems.value.find((c) => c.id === form.value.convenio_id)
    return seleccionado ? [seleccionado] : []
  }

  // COMERCIAL → sólo convenios asignados a ese asesor
  return conveniosAsignados.value
})

const labelConvenio = computed(() => {
  if (form.value.canal !== 'ASESOR') return 'Convenio'
  if (tipoAsesor.value === 'CONVENIO') return 'Convenio (ligado al asesor, no editable)'
  if (tipoAsesor.value === 'COMERCIAL') return 'Convenio (opcional, sólo asignados al asesor)'
  return 'Convenio'
})

/** Habilitar o no el campo convenio */
const habilitaConvenio = computed(() => {
  if (form.value.canal !== 'ASESOR') return false
  if (!form.value.agente_id) return false
  // Si el tipo es CONVENIO, el convenio se fija solo y se bloquea
  if (tipoAsesor.value === 'CONVENIO') return false
  // Tipo COMERCIAL → usuario puede escoger (o ninguno)
  return true
})

/* ================== REGLAS UI ================== */
const requiereAsesor = computed(
  () => form.value.canal === 'ASESOR' || form.value.canal === 'TELE'
)

/* ✔ Reglas de validación de placa: obligatoria y 6 caracteres */
const placaRules = [
  (v: string | null | undefined) => !!v || 'La placa es obligatoria',
  (v: string | null | undefined) =>
    (!!v && v.replace(/[\s-]/g, '').length === 6) || 'La placa debe tener 6 caracteres',
]

/* Placa SIEMPRE en mayúscula mientras se escribe */
watch(
  () => form.value.placa,
  (val) => {
    if (val == null) return
    const upper = val.toUpperCase()
    if (val !== upper) {
      form.value.placa = upper
    }
  }
)

function normalizePlacaInput() {
  form.value.placa = (form.value.placa || '').replace(/[\s-]/g, '').toUpperCase()
}
function digitsOnly() {
  form.value.telefono = (form.value.telefono || '').replace(/\D/g, '')
}

/* Cuando cambia el CANAL:
 *  - si deja de ser ASESOR/TELE → limpiamos tipo, asesor y convenio
 *  - si es TELE → tipoAsesor no aplica
 */
watch(
  () => form.value.canal,
  (nuevo) => {
    if (nuevo !== 'ASESOR' && nuevo !== 'TELE') {
      tipoAsesor.value = null
      form.value.agente_id = null
      form.value.convenio_id = null
      conveniosAsignados.value = []
    }
    if (nuevo === 'TELE') {
      tipoAsesor.value = null
      form.value.convenio_id = null
      conveniosAsignados.value = []
    }
  }
)

/* Cuando cambia el TIPO de asesor: limpiamos asesor y convenio */
watch(
  () => tipoAsesor.value,
  () => {
    form.value.agente_id = null
    form.value.convenio_id = null
    conveniosAsignados.value = []
  }
)

/* Helper: auto-vincular convenio para asesores CONVENIO */
function autoVincularConvenioDeAsesorConvenio() {
  if (!form.value.agente_id) return
  const asesor = asesoresConvenioUI.value.find((a) => a.id === form.value.agente_id)
  if (!asesor) return
  const conv = conveniosItems.value.find((c) => c.nombre === asesor.nombre)
  if (conv) {
    form.value.convenio_id = conv.id
  }
}

/* Cuando cambia el ASESOR:
 *  - siempre limpiamos convenio
 *  - si tipo = CONVENIO → buscamos su convenio 1:1 por nombre y lo fijamos
 *  - si tipo = COMERCIAL → cargamos sólo convenios asignados
 */
watch(
  () => form.value.agente_id,
  async (nuevo) => {
    form.value.convenio_id = null
    conveniosAsignados.value = []

    if (!nuevo || form.value.canal !== 'ASESOR') return

    if (tipoAsesor.value === 'CONVENIO') {
      autoVincularConvenioDeAsesorConvenio()
      return
    }

    if (tipoAsesor.value === 'COMERCIAL') {
      await loadConveniosAsignadosByAsesor(nuevo)
    }
  }
)

/* Si los convenios generales cargan después y ya hay un asesor CONVENIO seleccionado,
 * volvemos a intentar auto-vincular (por si antes no existía en lista).
 */
watch(
  () => conveniosItems.value,
  () => {
    if (form.value.canal === 'ASESOR' && tipoAsesor.value === 'CONVENIO' && form.value.agente_id) {
      autoVincularConvenioDeAsesorConvenio()
    }
  }
)

/* ================== EVIDENCIA ================== */
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
    form.value.imagen_tamano_bytes =
      typeof data.size === 'number' ? data.size : evidenciaFile.value.size
    form.value.imagen_hash = data.hash ?? null
    form.value.imagen_origen_id = data.id ?? null
    return true
  } finally {
    uploading.value = false
  }
}

/* ================== SUBMIT ================== */
const dlgBloqueo = ref<{ visible: boolean; hasta: string | null; por: string | null }>({
  visible: false,
  hasta: null,
  por: null,
})

async function submit() {
  errorMsg.value = null

  if (!form.value.canal) {
    errorMsg.value = 'Selecciona un canal.'
    return
  }
  if (form.value.canal === 'ASESOR' && !tipoAsesor.value) {
    errorMsg.value = 'Selecciona si el asesor es Comercial o Convenio.'
    return
  }
  if (!form.value.placa) {
    errorMsg.value = 'La placa es obligatoria.'
    return
  }
  if (requiereAsesor.value && !form.value.agente_id) {
    errorMsg.value = 'Debes seleccionar un asesor para el canal elegido.'
    return
  }
  // Convenio:
  //  - tipo COMERCIAL → opcional (puede ser ninguno → convenio_id null)
  //  - tipo CONVENIO → viene autoasignado y bloqueado
  //  - backend valida que no se rompan las reglas de negocio

  normalizePlacaInput()
  const placaNormalizada = (form.value.placa || '').replace(/[\s-]/g, '')
  if (placaNormalizada.length !== 6) {
    errorMsg.value = 'La placa debe tener exactamente 6 caracteres.'
    return
  }

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
      agente_id: form.value.agente_id ?? undefined,
      convenio_id: form.value.convenio_id ?? undefined,
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

function volver() {
  router.push({ name: 'ComercialDateos' })
}

/* Carga inicial */
loadAsesores()
loadConveniosAll()
</script>

<style scoped>
.g-3 {
  gap: 12px;
}
</style>
