<!-- src/views/comercial/clientes/ClienteEdit.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">✏️ Editar Cliente</div>
        <v-btn color="primary" prepend-icon="mdi-arrow-left" @click="volver">Volver</v-btn>
      </v-card-title>

      <v-divider />

      <!-- Loading -->
      <v-card-text v-if="loading" class="py-12 text-center">
        <v-progress-circular indeterminate size="48" color="primary" />
        <div class="mt-4 text-subtitle-1">Cargando cliente...</div>
      </v-card-text>

      <!-- Formulario -->
      <v-card-text v-else-if="form">
        <v-form @submit.prevent="submit">
          <v-row>
            <!-- Nombre -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.nombre"
                label="Nombre *"
                variant="outlined"
                density="comfortable"
                :rules="[rReq]"
                hide-details="auto"
                clearable
              />
            </v-col>

            <!-- Teléfono -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.telefono"
                label="Teléfono *"
                variant="outlined"
                density="comfortable"
                :rules="[rReq, rTel]"
                hide-details="auto"
                clearable
                @update:model-value="onTelefonoInput"
              />
            </v-col>

            <!-- Tipo de documento -->
            <v-col cols="12" md="3">
              <v-select
                v-model="form.doc_tipo"
                :items="tiposDocumento"
                label="Tipo de documento"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                clearable
              />
            </v-col>

            <!-- Número de documento -->
            <v-col cols="12" md="3">
              <v-text-field
                v-model="form.doc_numero"
                label="Número de documento"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                clearable
              />
            </v-col>

            <!-- Email -->
            <v-col cols="12" md="12">
              <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                variant="outlined"
                density="comfortable"
                :rules="[rEmail]"
                hide-details="auto"
                clearable
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="!canSubmit || saving"
              @click="submit"
              prepend-icon="mdi-content-save"
            >
              Guardar cambios
            </v-btn>
            <v-btn variant="text" @click="volver">Cancelar</v-btn>
          </div>
        </v-form>
      </v-card-text>

      <v-card-text v-else>
        <v-alert type="error" variant="tonal">
          ❌ No se pudo cargar el cliente.
        </v-alert>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClientesService } from '@/services/clientes_service'

const route = useRoute()
const router = useRouter()

interface ClienteEditForm {
  nombre: string
  telefono: string
  doc_tipo: 'CC' | 'NIT' | 'CE' | 'PAS' | null
  doc_numero: string
  email: string
}

const tiposDocumento = [
  { title: 'Cédula de Ciudadanía', value: 'CC' },
  { title: 'NIT', value: 'NIT' },
  { title: 'Cédula de Extranjería', value: 'CE' },
  { title: 'Pasaporte', value: 'PAS' },
]

const form = ref<ClienteEditForm | null>(null)
const loading = ref(true)
const saving = ref(false)
const snackbar = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({
  show: false,
  text: '',
  color: 'success',
})

// Validaciones
type RuleFn = (v: unknown) => true | string
const rReq: RuleFn = (v) => (!!v && String(v).trim().length > 0) || 'Requerido'
const rTel: RuleFn = (v) => (!v || /^\d{7,15}$/.test(String(v))) || 'Solo dígitos (7-15)'
const rEmail: RuleFn = (v) => {
  if (!v || String(v).trim() === '') return true
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(String(v)) || 'Email inválido'
}

function onTelefonoInput(val?: string): void {
  if (form.value) {
    form.value.telefono = (val || '').replace(/\D+/g, '')
  }
}

const canSubmit = computed<boolean>(() => {
  if (!form.value) return false
  return !!form.value.nombre?.trim() && !!form.value.telefono?.trim()
})

async function fetchCliente() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const cliente = await ClientesService.getById(id) as any

    // Convertir a formato del formulario
    form.value = {
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      doc_tipo: cliente.docTipo || cliente.doc_tipo || null,
      doc_numero: cliente.docNumero || cliente.doc_numero || '',
      email: cliente.email || '',
    }
  } catch (err) {
    console.error('❌ Error cargando cliente:', err)
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error al cargar el cliente',
    }
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!canSubmit.value || !form.value) return

  saving.value = true
  try {
    const id = Number(route.params.id)

    await ClientesService.update(id, {
      nombre: form.value.nombre.trim() || null,
      telefono: form.value.telefono.trim(),
      doc_tipo: form.value.doc_tipo || null,
      doc_numero: form.value.doc_numero?.trim() || null,
      email: form.value.email?.trim() || null,
    })

    snackbar.value = {
      show: true,
      color: 'success',
      text: '✅ Cliente actualizado correctamente',
    }

    // Volver al detalle después de 1 segundo
    setTimeout(() => {
      router.push({
        name: 'ClienteDetalle',
        params: { id },
      }).catch(() => {})
    }, 1000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error actualizando cliente'
    snackbar.value = {
      show: true,
      color: 'error',
      text: msg,
    }
  } finally {
    saving.value = false
  }
}

function volver() {
  const id = Number(route.params.id)
  router.push({
    name: 'ClienteDetalle',
    params: { id },
  }).catch(() => {})
}

async function loadCiudades() {
  loadingCiudades.value = true
  try {
    const response = await get<{ data?: Ciudad[] } | Ciudad[]>('api/ciudades', {
      params: { activo: 1, perPage: 100 }
    })
    const rawCiudades = Array.isArray(response) ? response : (response?.data ?? [])

    // 🔥 Filtrar duplicados por ID
    const seen = new Set<number>()
    ciudades.value = rawCiudades.filter(ciudad => {
      if (seen.has(ciudad.id)) return false
      seen.add(ciudad.id)
      return true
    })
  } catch (err) {
    console.error('Error cargando ciudades:', err)
    ciudades.value = []
  } finally {
    loadingCiudades.value = false
  }
}

onMounted(() => {
  fetchCliente()
  loadCiudades()
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.text-h5 {
  font-weight: bold;
}
</style>
