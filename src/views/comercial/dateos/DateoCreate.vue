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
        <!-- Mensajes de error/éxito -->
        <v-expand-transition>
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-5"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>
        </v-expand-transition>

        <v-expand-transition>
          <v-alert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-5"
            closable
            @click:close="successMessage = ''"
          >
            {{ successMessage }}
          </v-alert>
        </v-expand-transition>

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
                clearable
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

            <!-- Convenio (opcional) -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.convenio_id"
                :items="convenios"
                item-title="nombre"
                item-value="id"
                label="Convenio (opcional)"
                variant="outlined"
                prepend-inner-icon="mdi-handshake"
                clearable
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
                label="Placa del vehículo"
                variant="outlined"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-car"
                @input="normalizePlaca"
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

          <div class="d-flex justify-end gap-2">
            <v-btn variant="text" @click="router.back()">
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
              prepend-icon="mdi-content-save"
            >
              Crear dateo
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createDateo } from '@/services/dateosService'
import { listAgentesCaptacion } from '@/services/conveniosService'

const router = useRouter()

/* ===== Estado del formulario ===== */
const formRef = ref<any>(null)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

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
const convenios = ref<{ id: number; nombre: string }[]>([])

const filteredAgentes = computed(() => {
  return agentes.value.filter((agente) =>
    form.value.canal === 'ASESOR' && form.value.tipo_asesor === 'ASESOR_COMERCIAL'
    ? agente.tipo === 'ASESOR_COMERCIAL'
    : form.value.canal === 'ASESOR' && form.value.tipo_asesor === 'ASESOR_CONVENIO'
    ? agente.tipo === 'ASESOR_CONVENIO'
    : true
  )
})

/* ===== Imagen ===== */
const imageFile = ref<File[]>([])
const imagePreview = ref('')

/* ===== Reglas de validación ===== */
const rules = {
  required: (v: any) => !!v || 'Este campo es requerido',
}

/* ===== Computed ===== */
const showTipoAsesor = computed(() => {
  return form.value.canal === 'ASESOR' || form.value.canal === 'TELE'
})

const mostrarAgente = computed(() => {
  return form.value.canal === 'ASESOR' || form.value.canal === 'TELE'
})

/* ===== Funciones de normalización ===== */
function normalizePlaca() {
  if (!form.value.placa) return
  // Convertir a mayúsculas y quitar espacios/guiones
  form.value.placa = form.value.placa
    .toUpperCase()
    .replace(/[\s-]/g, '')
}

function normalizeTelefono() {
  if (!form.value.telefono) return
  // Quitar todo excepto números
  form.value.telefono = form.value.telefono.replace(/\D/g, '')
}

/* ===== Subir imagen (opcional) ===== */
async function uploadImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/uploads/images', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

/* ===== Submit ===== */
async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid?.valid) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // 1. Subir imagen si existe
    let imagen_url: string | null = null
    if (imageFile.value && imageFile.value.length > 0) {
      imagen_url = await uploadImage(imageFile.value[0])
    }

    // 2. Crear dateo
    const payload = {
      canal: form.value.canal,
      origen: 'UI' as const,
      agente_id: form.value.agente_id,
      convenio_id: form.value.convenio_id,
      placa: form.value.placa || null,
      telefono: form.value.telefono || null,
      observacion: form.value.observacion || null,
      imagen_url,
    }

    await createDateo(payload)

    successMessage.value = '¡Dateo creado exitosamente!'

    // Esperar 1 segundo y redirigir
    setTimeout(() => {
      router.push({ name: 'Dateos' })
    }, 1000)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || error?.message || 'Error al crear el dateo'
  } finally {
    loading.value = false
  }
}

/* ===== Cargar catálogos ===== */
async function loadCatalogos() {
  try {
    // Cargar agentes
    const agentesData = await listAgentesCaptacion()
    agentes.value = agentesData

    // Cargar convenios
    const conveniosRes = await fetch('/api/convenios/light?activo=1', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    const conveniosData = await conveniosRes.json()
    convenios.value = conveniosData.data || []
  } catch (error) {
    console.error('Error cargando catálogos:', error)
  }
}

onMounted(() => {
  loadCatalogos()
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
