<template>
  <v-container class="py-6">
    <v-card elevation="10" class="rounded-2xl">
      <v-card-title class="d-flex justify-space-between align-center flex-wrap py-5">
        <div class="d-flex align-center">
          <v-avatar class="mr-4" size="46" color="primary">
            <v-icon>mdi-clipboard-plus</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Nuevo dateo</div>
            <div class="text-medium-emphasis">Registrar nueva captación de cliente</div>
          </div>
        </div>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.back()">
          Volver
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-6">
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
                :rules="mostrarAgente ? [rules.required] : []"
                prepend-inner-icon="mdi-account"
                :disabled="agenteBloqueado"
                :clearable="!agenteBloqueado"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar size="32" color="primary">
                        <v-icon size="20">mdi-account</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ item.raw.nombre }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.tipo }}</v-list-item-subtitle>
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
                prepend-inner-icon="mdi-handshake"
                clearable
                :disabled="isConvenioDisabled || convenioBloqueado"
                :loading="conveniosLoading"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar size="32" color="secondary">
                        <v-icon size="20">mdi-handshake</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ item.raw.nombre }}</v-list-item-title>
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
                rows="3"
                prepend-inner-icon="mdi-note-text"
              />
            </v-col>

            <!-- Imagen (opcional) -->
            <v-col cols="12">
              <v-file-input
                v-model="imageFile"
                label="Evidencia fotográfica (opcional)"
                variant="outlined"
                accept="image/*"
                prepend-icon="mdi-camera"
                @change="handleImageChange"
              >
                <template #selection="{ fileNames }">
                  <v-chip size="small" label color="primary">
                    {{ fileNames[0] }}
                  </v-chip>
                </template>
              </v-file-input>

              <div v-if="imagePreview" class="mt-2">
                <v-img
                  :src="imagePreview"
                  max-width="300"
                  max-height="200"
                  class="rounded"
                />
              </div>
            </v-col>
          </v-row>

          <!-- Acciones -->
          <v-divider class="my-4" />

          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!canSubmit || loading"
              @click="showConfirmDialog = true"
              prepend-icon="mdi-content-save"
            >
              Guardar
            </v-btn>
            <v-btn variant="text" @click="router.back()">
              Cancelar
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Modal de confirmación -->
    <v-dialog v-model="showConfirmDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-6">
          <v-icon color="warning" size="60">mdi-help-circle</v-icon>
        </v-card-title>
        <v-card-text class="text-center">
          <div class="text-h5 font-weight-bold mb-2">¿Estás seguro?</div>
          <div class="text-body-1 text-medium-emphasis">
            ¿Deseas crear este dateo con los datos ingresados?
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-6 gap-2">
          <v-btn variant="text" @click="showConfirmDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loading"
            @click="confirmCreate"
          >
            Sí, crear dateo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de éxito -->
    <v-dialog v-model="showSuccessDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-6">
          <v-icon color="success" size="60">mdi-check-circle</v-icon>
        </v-card-title>
        <v-card-text class="text-center">
          <div class="text-h5 font-weight-bold mb-2">¡Dateo creado exitosamente!</div>
          <div class="text-body-1 text-medium-emphasis">
            El dateo ha sido registrado correctamente en el sistema.
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-6">
          <v-btn
            color="primary"
            variant="elevated"
            size="large"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createDateo } from '@/services/dateosService'
import { listAgentesCaptacion, listConveniosAsignados } from '@/services/conveniosService'

const router = useRouter()
const route = useRoute()

/* ===== Contexto desde ficha ===== */
const fromAsesor = ref<number | null>(null)
const canalBloqueado = ref(false)
const tipoAsesorBloqueado = ref(false)
const agenteBloqueado = ref(false)
const convenioBloqueado = ref(false)

/* ===== Estado del formulario ===== */
const formRef = ref<any>(null)
const loading = ref(false)
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
const imageFile = ref<File[]>([])
const imagePreview = ref('')

/* ===== Reglas ===== */
const rules = {
  required: (v: any) => !!v || 'Este campo es requerido',
  placaLength: (v: any) => {
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
  // 🔥 Forzar mayúsculas y eliminar espacios/guiones
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
  (nuevo) => {
    // Si viene desde ficha y los combos están bloqueados, no reseteamos nada
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

/* ===== Subir imagen ===== */
async function uploadImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/uploads/images', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) throw new Error('Error al subir imagen')

    const data = await response.json()
    return data.url || data.path || null
  } catch (error) {
    console.error('Error subiendo imagen:', error)
    return null
  }
}

function handleImageChange(event: Event) {
  const files = imageFile.value
  if (files && files.length > 0) {
    const file = files[0]
    imagePreview.value = URL.createObjectURL(file)
  } else {
    imagePreview.value = ''
  }
}

/* ===== Confirmar creación ===== */
async function confirmCreate() {
  showConfirmDialog.value = false
  await handleSubmit()
}

/* ===== Submit ===== */
async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid?.valid) {
    snackbar.value = { show: true, color: 'error', text: 'Completa los campos obligatorios.' }
    return
  }

  loading.value = true

  try {
    let imagen_url: string | null = null
    if (imageFile.value && imageFile.value.length > 0) {
      imagen_url = await uploadImage(imageFile.value[0])
    }

    const payload = {
      canal: form.value.canal,
      origen: 'UI' as const,
      agente_id: form.value.agente_id,
      convenio_id: form.value.convenio_id,
      placa: form.value.placa ? form.value.placa.toUpperCase().trim() : null,
      telefono: form.value.telefono || null,
      observacion: form.value.observacion || null,
      imagen_url,
    }

    await createDateo(payload)
    showSuccessDialog.value = true
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Error al crear el dateo'
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

  // Siempre canal asesor
  form.value.canal = 'ASESOR'
  canalBloqueado.value = true

  // Tipo asesor según agente
  const tipo =
    asesor.tipo === 'ASESOR_CONVENIO' ? 'ASESOR_CONVENIO' : 'ASESOR_COMERCIAL'
  form.value.tipo_asesor = tipo
  tipoAsesorBloqueado.value = true

  // Agente fijo
  form.value.agente_id = asesor.id
  agenteBloqueado.value = true

  // Lógica por tipo
  if (tipo === 'ASESOR_COMERCIAL') {
    // Puede elegir convenio, pero cargamos los suyos
    convenioBloqueado.value = false
    loadConveniosAsignadosByAsesor(asesor.id)
  } else {
    // ASESOR_CONVENIO: su convenio se auto-selecciona y se bloquea
    convenioBloqueado.value = true
    autoSeleccionarConvenioAsesorConvenio()
  }
}

/* ===== Cargar catálogos ===== */
async function loadCatalogos() {
  try {
    const agentesData = await listAgentesCaptacion()
    agentes.value = agentesData

    const conveniosRes = await fetch('/api/convenios/light?activo=1', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    const conveniosData = await conveniosRes.json()
    conveniosAll.value = conveniosData.data || []

    // Si venimos desde ficha, configuramos y bloqueamos
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
</style>
