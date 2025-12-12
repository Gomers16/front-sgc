<template>
  <v-container class="py-4 py-sm-6">
    <v-card elevation="10" class="rounded-xl rounded-sm-2xl">
      <v-card-title class="d-flex justify-space-between align-center flex-wrap py-3 py-sm-5 px-3 px-sm-4">
        <div class="d-flex align-center">
          <v-avatar
            class="mr-2 mr-sm-4"
            :size="$vuetify.display.xs ? 40 : 46"
            color="primary"
          >
            <v-icon :size="$vuetify.display.xs ? 20 : 24">mdi-clipboard-plus</v-icon>
          </v-avatar>
          <div>
            <div class="text-subtitle-1 text-sm-h5 font-weight-bold">
              <span class="d-none d-sm-inline">Nuevo dateo</span>
              <span class="d-sm-none">Nuevo</span>
            </div>
            <div class="text-caption text-sm-body-2 text-medium-emphasis d-none d-sm-block">
              Registrar nueva captación de cliente
            </div>
          </div>
        </div>
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          :size="$vuetify.display.xs ? 'small' : 'default'"
          @click="router.back()"
        >
          Volver
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-4 py-sm-6 px-3 px-sm-4">
        <!-- Formulario -->
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row>
            <!-- Canal -->
            <v-col cols="12" md="6">
              <v-select
                v-model="form.canal"
                :items="canalesOptions"
                label="Canal de captación"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-source-branch"
                :disabled="canalBloqueado"
              />
            </v-col>

            <!-- Tipo de Asesor (solo si canal es ASESOR o TELE) -->
            <v-col v-if="showTipoAsesor" cols="12" md="6">
              <v-select
                v-model="form.tipo_asesor"
                :items="['ASESOR_COMERCIAL', 'ASESOR_CONVENIO']"
                label="Tipo de Asesor"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-account-settings"
                :disabled="tipoAsesorBloqueado"
              />
            </v-col>

            <!-- Agente (si canal es ASESOR o TELE) -->
            <v-col v-if="mostrarAgente" cols="12" md="6">
              <v-autocomplete
                v-model="form.agente_id"
                :items="filteredAgentes"
                item-title="nombre"
                item-value="id"
                label="Agente / Asesor"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rules="mostrarAgente ? [rules.required] : []"
                prepend-inner-icon="mdi-account"
                :disabled="agenteBloqueado"
                :clearable="!agenteBloqueado"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar :size="$vuetify.display.xs ? 28 : 32" color="primary">
                        <v-icon :size="$vuetify.display.xs ? 16 : 20">mdi-account</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-caption text-sm-body-2">
                      {{ item.raw.nombre }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ item.raw.tipo }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Convenio -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.convenio_id"
                :items="conveniosVisibles"
                item-title="nombre"
                item-value="id"
                label="Convenio (opcional)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-handshake"
                clearable
                :disabled="isConvenioDisabled || convenioBloqueado"
                :loading="conveniosLoading"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar :size="$vuetify.display.xs ? 28 : 32" color="secondary">
                        <v-icon :size="$vuetify.display.xs ? 16 : 20">mdi-handshake</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-caption text-sm-body-2">
                      {{ item.raw.nombre }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Placa -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.placa"
                label="Placa del vehículo *"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rules="[rules.required, rules.placaLength]"
                prepend-inner-icon="mdi-car"
                @input="normalizePlaca"
                :counter="6"
                :maxlength="6"
                hint="Exactamente 6 caracteres en mayúsculas"
                persistent-hint
              />
            </v-col>

            <!-- Teléfono -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.telefono"
                label="Teléfono cliente (opcional)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-phone"
                @input="normalizeTelefono"
              />
            </v-col>

            <!-- Observación -->
            <v-col cols="12">
              <v-textarea
                v-model="form.observacion"
                label="Observaciones (opcional)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rows="$vuetify.display.xs ? 2 : 3"
                prepend-inner-icon="mdi-note-text"
              />
            </v-col>

            <!-- Imagen (opcional) -->
            <v-col cols="12">
              <v-file-input
                v-model="imageFile"
                label="Evidencia fotográfica (opcional)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                accept="image/*"
                prepend-icon="mdi-camera"
                :rules="[maxSizeRule]"
                show-size
                :multiple="false"
                @change="handleImageChange"
                @click:clear="handleClearImage"
              >
                <template #selection="{ fileNames }">
                  <v-chip :size="$vuetify.display.xs ? 'x-small' : 'small'" label color="primary">
                    {{ fileNames[0] }}
                  </v-chip>
                </template>
              </v-file-input>

              <small class="text-caption text-medium-emphasis">
                Tamaño máx. {{ MAX_IMAGE_MB }}MB. Formatos: JPG/PNG/WEBP/HEIC…
              </small>

              <div v-if="imagePreview" class="mt-2">
                <v-img
                  :src="imagePreview"
                  :max-width="$vuetify.display.xs ? '100%' : '300'"
                  :max-height="$vuetify.display.xs ? 150 : 200"
                  class="rounded"
                />
              </div>
            </v-col>
          </v-row>

          <!-- Acciones -->
          <v-divider class="my-3 my-sm-4" />

          <div class="d-flex gap-2 flex-wrap">
            <v-btn
              color="primary"
              :loading="loading || uploading"
              :disabled="!canSubmit || loading || uploading"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              :block="$vuetify.display.xs"
              @click="showConfirmDialog = true"
              prepend-icon="mdi-content-save"
            >
              <span v-if="uploading">Subiendo imagen...</span>
              <span v-else-if="$vuetify.display.xs">Guardar</span>
              <span v-else>Guardar dateo</span>
            </v-btn>
            <v-btn
              variant="text"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              :block="$vuetify.display.xs"
              :disabled="loading || uploading"
              @click="router.back()"
            >
              Cancelar
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Modal de confirmación -->
    <v-dialog
      v-model="showConfirmDialog"
      :max-width="$vuetify.display.xs ? '100%' : '500'"
      :fullscreen="$vuetify.display.xs"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-4 py-sm-6">
          <v-icon color="warning" :size="$vuetify.display.xs ? 48 : 60">
            mdi-help-circle
          </v-icon>
        </v-card-title>
        <v-card-text class="text-center px-3 px-sm-4">
          <div class="text-subtitle-1 text-sm-h5 font-weight-bold mb-2">¿Estás seguro?</div>
          <div class="text-caption text-sm-body-1 text-medium-emphasis">
            ¿Deseas crear este dateo con los datos ingresados?
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-4 pb-sm-6 gap-2">
          <v-btn
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :disabled="loading || uploading"
            @click="showConfirmDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :loading="loading || uploading"
            @click="confirmCreate"
          >
            Sí, crear dateo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de éxito -->
    <v-dialog
      v-model="showSuccessDialog"
      :max-width="$vuetify.display.xs ? '100%' : '500'"
      :fullscreen="$vuetify.display.xs"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-4 py-sm-6">
          <v-icon color="success" :size="$vuetify.display.xs ? 48 : 60">
            mdi-check-circle
          </v-icon>
        </v-card-title>
        <v-card-text class="text-center px-3 px-sm-4">
          <div class="text-subtitle-1 text-sm-h5 font-weight-bold mb-2">
            ¡Dateo creado exitosamente!
          </div>
          <div class="text-caption text-sm-body-1 text-medium-emphasis">
            El dateo ha sido registrado correctamente en el sistema.
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-4 pb-sm-6">
          <v-btn
            color="primary"
            variant="elevated"
            :size="$vuetify.display.xs ? 'default' : 'large'"
            @click="handleConfirmSuccess"
          >
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para errores -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createDateo } from '@/services/dateosService'
import { listAgentesCaptacion, listConveniosAsignados } from '@/services/conveniosService'
import { uploadImage, type UploadImageResponse } from '@/services/uploadsService'
import { listConveniosLight } from '@/services/dateosService'

const router = useRouter()
const route = useRoute()

interface FormRef {
  validate: () => Promise<{ valid: boolean }>
}

interface CreateDateoPayload {
  canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
  origen: 'UI'
  agente_id: number | null
  convenio_id: number | null
  placa: string | null
  telefono: string | null
  observacion: string | null
  imagen_url?: string | null
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
}

/* ===== Contexto desde ficha ===== */
const fromAsesor = ref<number | null>(null)
const canalBloqueado = ref(false)
const tipoAsesorBloqueado = ref(false)
const agenteBloqueado = ref(false)
const convenioBloqueado = ref(false)

/* ===== Estado del formulario ===== */
const formRef = ref<FormRef | null>(null)
const loading = ref(false)
const uploading = ref(false)
const showConfirmDialog = ref(false)
const showSuccessDialog = ref(false)
const snackbar = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({
  show: false,
  text: '',
  color: 'success',
})

const form = ref({
  canal: 'ASESOR' as 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES',
  agente_id: null as number | null,
  convenio_id: null as number | null,
  placa: '',
  telefono: '',
  observacion: '',
  tipo_asesor: null as 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | null,
  imagen_url: null as string | null,
  imagen_mime: null as string | null,
  imagen_tamano_bytes: null as number | null,
  imagen_hash: null as string | null,
  imagen_origen_id: null as string | number | null,
})

/* ===== Opciones de selects ===== */
const canalesOptions = [
  { title: 'Asesor', value: 'ASESOR' },
  { title: 'Telemercadeo', value: 'TELE' },
  { title: 'Fachada', value: 'FACHADA' },
  { title: 'Redes sociales', value: 'REDES' },
]

const agentes = ref<{ id: number; nombre: string; tipo: string }[]>([])
const conveniosAll = ref<{ id: number; nombre: string }[]>([])
const conveniosAsignados = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)

const filteredAgentes = computed(() => {
  return agentes.value.filter((agente) =>
    form.value.canal === 'ASESOR' && form.value.tipo_asesor === 'ASESOR_COMERCIAL'
      ? agente.tipo === 'ASESOR_COMERCIAL'
      : form.value.canal === 'ASESOR' && form.value.tipo_asesor === 'ASESOR_CONVENIO'
      ? agente.tipo === 'ASESOR_CONVENIO'
      : true
  )
})

/* ===== Convenios visibles ===== */
const conveniosVisibles = computed(() => {
  const tipo = form.value.tipo_asesor
  const agenteId = form.value.agente_id

  if (!tipo) {
    return conveniosAll.value
  }

  if (tipo === 'ASESOR_COMERCIAL' && agenteId) {
    return conveniosAsignados.value.length > 0 ? conveniosAsignados.value : conveniosAll.value
  }

  if (tipo === 'ASESOR_CONVENIO' && form.value.convenio_id) {
    const convenio = conveniosAll.value.find((c) => c.id === form.value.convenio_id)
    return convenio ? [convenio] : []
  }

  return conveniosAll.value
})

/* ===== Deshabilitar convenio cuando es asesor convenio ===== */
const isConvenioDisabled = computed(() => {
  return form.value.tipo_asesor === 'ASESOR_CONVENIO' && form.value.agente_id !== null
})

/* ===== Imagen ===== */
const imageFile = ref<File | File[] | null>(null)
const imagePreview = ref('')
const MAX_IMAGE_MB = 8

function maxSizeRule(v: File | File[] | null) {
  const f = Array.isArray(v) ? v?.[0] : v
  if (!f) return true
  return f.size <= MAX_IMAGE_MB * 1024 * 1024 || `La imagen no debe superar ${MAX_IMAGE_MB}MB`
}

function handleImageChange() {
  console.log('📁 handleImageChange - imageFile.value:', imageFile.value)

  // Limpiar preview anterior
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
    imagePreview.value = ''
  }

  // Limpiar datos de imagen anterior
  form.value.imagen_url = null
  form.value.imagen_mime = null
  form.value.imagen_tamano_bytes = null
  form.value.imagen_hash = null
  form.value.imagen_origen_id = null

  // Obtener el archivo
  let file: File | null = null

  if (Array.isArray(imageFile.value)) {
    file = imageFile.value[0] || null
  } else if (imageFile.value instanceof File) {
    file = imageFile.value
  }

  if (file && file instanceof File) {
    console.log('✅ Archivo válido seleccionado:', file.name, `(${file.size} bytes)`)
    imagePreview.value = URL.createObjectURL(file)
  } else {
    console.log('ℹ️ No se seleccionó ningún archivo válido')
  }
}

function handleClearImage() {
  console.log('🧹 Limpiando imagen...')

  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }

  imagePreview.value = ''
  imageFile.value = null

  form.value.imagen_url = null
  form.value.imagen_mime = null
  form.value.imagen_tamano_bytes = null
  form.value.imagen_hash = null
  form.value.imagen_origen_id = null
}

onBeforeUnmount(() => {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }
})

/* ===== Reglas ===== */
const rules = {
  required: (v: unknown) => !!v || 'Este campo es requerido',
  placaLength: (v: unknown) => {
    if (!v) return 'La placa es requerida'
    const trimmed = v.toString().trim()
    return trimmed.length === 6 || 'La placa debe tener exactamente 6 caracteres'
  },
}

/* ===== Computed ===== */
const showTipoAsesor = computed(() => {
  return form.value.canal === 'ASESOR' || form.value.canal === 'TELE'
})

const mostrarAgente = computed(() => {
  return form.value.canal === 'ASESOR' || form.value.canal === 'TELE'
})

const canSubmit = computed(() => {
  return !!form.value.placa?.trim() && form.value.placa.trim().length === 6
})

/* ===== Normalización ===== */
function normalizePlaca() {
  if (!form.value.placa) return
  form.value.placa = form.value.placa.toUpperCase().replace(/[\s-]/g, '').slice(0, 6)
}

function normalizeTelefono() {
  if (!form.value.telefono) return
  form.value.telefono = form.value.telefono.replace(/\D/g, '')
}

/* ===== Convenios por asesor ===== */
async function loadConveniosAsignadosByAsesor(asesorId: number) {
  if (!asesorId) {
    conveniosAsignados.value = []
    return
  }
  conveniosLoading.value = true
  try {
    conveniosAsignados.value = await listConveniosAsignados(asesorId)
  } catch (error) {
    console.error('Error cargando convenios asignados:', error)
    conveniosAsignados.value = []
  } finally {
    conveniosLoading.value = false
  }
}

/* ===== Auto-seleccionar convenio para asesor convenio ===== */
function autoSeleccionarConvenioAsesorConvenio() {
  if (!form.value.agente_id) return
  const asesor = agentes.value.find((a) => a.id === form.value.agente_id)
  if (!asesor) return

  const convenio = conveniosAll.value.find((c) => c.nombre === asesor.nombre)
  if (convenio) {
    form.value.convenio_id = convenio.id
  }
}

/* ===== Watchers ===== */
watch(
  () => form.value.tipo_asesor,
  () => {
    if (fromAsesor.value && tipoAsesorBloqueado.value && agenteBloqueado.value) {
      return
    }

    form.value.agente_id = null
    form.value.convenio_id = null
    conveniosAsignados.value = []
  }
)

watch(
  () => form.value.agente_id,
  async (nuevoAgenteId) => {
    form.value.convenio_id = null
    conveniosAsignados.value = []

    if (!nuevoAgenteId) return

    if (form.value.tipo_asesor === 'ASESOR_COMERCIAL') {
      await loadConveniosAsignadosByAsesor(nuevoAgenteId)
      return
    }

    if (form.value.tipo_asesor === 'ASESOR_CONVENIO') {
      autoSeleccionarConvenioAsesorConvenio()
    }
  }
)

/* ===== 🔥 Subir imagen con validación robusta ===== */
async function subirImagen(): Promise<boolean> {
  console.log('🔍 DEBUG subirImagen - imageFile.value:', imageFile.value)
  console.log('🔍 DEBUG tipo:', typeof imageFile.value)
  console.log('🔍 DEBUG es array?:', Array.isArray(imageFile.value))

  // Obtener el archivo según el tipo
  let file: File | null = null

  if (Array.isArray(imageFile.value)) {
    file = imageFile.value[0] || null
    console.log('🔍 DEBUG primer elemento array:', file)
  } else if (imageFile.value instanceof File) {
    file = imageFile.value
    console.log('🔍 DEBUG es File directo:', file)
  }

  // Validar que existe el archivo
  if (!file) {
    console.log('ℹ️ No hay imagen para subir')
    return true // No hay imagen, ok
  }

  // Validar que es realmente un File
  if (!(file instanceof File)) {
    console.error('❌ El objeto no es un File:', file)
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error: el archivo seleccionado no es válido.'
    }
    return false
  }

  uploading.value = true
  try {
    console.log('📤 Subiendo imagen:', file.name, `(${file.size} bytes)`)
    const data: UploadImageResponse = await uploadImage(file)

    form.value.imagen_url = data.url ?? null
    form.value.imagen_mime = data.mime ?? file.type ?? null
    form.value.imagen_tamano_bytes = typeof data.size === 'number' ? data.size : file.size
    form.value.imagen_hash = data.hash ?? null
    form.value.imagen_origen_id = data.id ?? null

    console.log('✅ Imagen subida exitosamente:', form.value.imagen_url)
    return true
  } catch (error) {
    console.error('❌ Error subiendo imagen:', error)
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error al subir la imagen. Intenta de nuevo.'
    }
    return false
  } finally {
    uploading.value = false
  }
}

/* ===== Confirmar creación ===== */
async function confirmCreate() {
  showConfirmDialog.value = false
  await handleSubmit()
}

/* ===== 🔥 Submit con subida automática de imagen ===== */
async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid?.valid) {
    snackbar.value = { show: true, color: 'error', text: 'Completa los campos obligatorios.' }
    return
  }

  loading.value = true

  try {
    // 🔥 PASO 1: Subir imagen si existe
    const imagenSubida = await subirImagen()
    if (!imagenSubida) {
      loading.value = false
      return // Error al subir imagen
    }

    // 🔥 PASO 2: Preparar payload con todos los campos (incluida imagen)
    const payload: CreateDateoPayload = {
      canal: form.value.canal,
      origen: 'UI',
      agente_id: form.value.agente_id,
      convenio_id: form.value.convenio_id,
      placa: form.value.placa ? form.value.placa.toUpperCase().trim() : null,
      telefono: form.value.telefono || null,
      observacion: form.value.observacion || null,
    }

    // 🔥 Agregar campos de imagen si existen
    if (form.value.imagen_url) {
      payload.imagen_url = form.value.imagen_url
      payload.imagen_mime = form.value.imagen_mime ?? null
      payload.imagen_tamano_bytes = form.value.imagen_tamano_bytes ?? null
      payload.imagen_hash = form.value.imagen_hash ?? null
      payload.imagen_origen_id = form.value.imagen_origen_id ?? null
    }

    console.log('🔥 Creando dateo con payload:', payload)

    await createDateo(payload)

    console.log('✅ Dateo creado exitosamente')
    showSuccessDialog.value = true
  } catch (error) {
    console.error('❌ Error creando dateo:', error)
    const errorObj = error as { response?: { data?: { message?: string } }; message?: string }
    const msg = errorObj?.response?.data?.message || errorObj?.message || 'Error al crear el dateo'
    snackbar.value = { show: true, color: 'error', text: msg }
  } finally {
    loading.value = false
  }
}

/* ===== Confirmar y redirigir ===== */
function handleConfirmSuccess() {
  showSuccessDialog.value = false

  if (fromAsesor.value) {
    router
      .push({
        name: 'FichaComercialAsesor',
        params: { id: String(fromAsesor.value) },
      })
      .catch((err) => {
        console.error('Error navegando a FichaComercialAsesor:', err)
      })
  } else {
    router
      .push({ name: 'ComercialDateos' })
      .catch((err) => {
        console.error('Error navegando a ComercialDateos:', err)
        router.push('/comercial/dateos')
      })
  }
}

/* ===== Inicializar desde ficha ===== */
function inicializarDesdeFicha() {
  if (!fromAsesor.value) return

  const asesor = agentes.value.find((a) => a.id === fromAsesor.value)
  if (!asesor) return

  form.value.canal = 'ASESOR'
  canalBloqueado.value = true

  const tipo = asesor.tipo === 'ASESOR_CONVENIO' ? 'ASESOR_CONVENIO' : 'ASESOR_COMERCIAL'
  form.value.tipo_asesor = tipo
  tipoAsesorBloqueado.value = true

  form.value.agente_id = asesor.id
  agenteBloqueado.value = true

  if (tipo === 'ASESOR_COMERCIAL') {
    convenioBloqueado.value = false
    loadConveniosAsignadosByAsesor(asesor.id)
  } else {
    convenioBloqueado.value = true
    autoSeleccionarConvenioAsesorConvenio()
  }
}

/* ===== Cargar catálogos ===== */
async function loadCatalogos() {
  try {
    const agentesData = await listAgentesCaptacion()
    agentes.value = agentesData

    try {
      const conveniosData = await listConveniosLight()
      conveniosAll.value = conveniosData || []
    } catch (error) {
      console.error('Error cargando convenios:', error)
      conveniosAll.value = []
    }

    if (fromAsesor.value) {
      inicializarDesdeFicha()
    }
  } catch (error) {
    console.error('Error cargando catálogos:', error)
  }
}

onMounted(() => {
  const q = route.query.fromFicha as string | undefined
  fromAsesor.value = q ? Number(q) : null
  loadCatalogos()
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

@media (max-width: 599px) {
  .gap-2 {
    gap: 6px;
  }
}
</style>
