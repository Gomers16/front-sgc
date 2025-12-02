<!-- src/views/comercial/prospectos/ProspectoEdit.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">✏️ Editar prospecto</div>
        <v-btn color="primary" prepend-icon="mdi-arrow-left" @click="volver">Volver</v-btn>
      </v-card-title>

      <v-divider />

      <!-- Loading -->
      <v-card-text v-if="loading" class="py-12 text-center">
        <v-progress-circular indeterminate size="48" color="primary" />
        <div class="mt-4 text-subtitle-1">Cargando prospecto...</div>
      </v-card-text>

      <!-- Formulario -->
      <v-card-text v-else-if="form">
        <v-form @submit.prevent="submit">
          <v-row>
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

            <v-col cols="12" md="3">
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
  <v-col cols="12" md="3">
  <v-text-field
    v-model="form.cedula"
    label="Cédula *"
    variant="outlined"
    density="comfortable"
    :rules="[rReq, rCedula]"
    hide-details="auto"
    clearable
    @update:model-value="onCedulaInput"
  />
</v-col>

            <v-col cols="12" md="3">
              <v-text-field
                v-model="form.placa"
                label="Placa *"
                variant="outlined"
                density="comfortable"
                :rules="[rReq]"
                hide-details="auto"
                clearable
                @update:model-value="onPlacaInput"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.observaciones"
                label="Observaciones"
                variant="outlined"
                density="comfortable"
                auto-grow
                rows="2"
                hide-details="auto"
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Documentos -->
          <div class="text-subtitle-1 font-weight-medium mb-2">📄 Documentos</div>

          <!-- SOAT / RTM -->
          <v-row>
            <v-col cols="12" md="6">
              <div class="d-flex align-center gap-2 mb-2">
                <v-switch v-model="form.soat_vigente" color="primary" hide-details />
                <span>SOAT vigente</span>
              </div>
              <v-text-field
                v-model="form.soat_vencimiento"
                type="date"
                label="Vencimiento SOAT"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12" md="6">
              <div class="d-flex align-center gap-2 mb-2">
                <v-switch v-model="form.tecno_vigente" color="primary" hide-details />
                <span>Tecnomecánica vigente</span>
              </div>
              <v-text-field
                v-model="form.tecno_vencimiento"
                type="date"
                label="Vencimiento RTM"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
          </v-row>

          <!-- Preventiva / Peritaje -->
          <v-row>
            <v-col cols="12" md="6">
              <div class="d-flex align-center gap-2 mb-2">
                <v-switch v-model="form.preventiva_vigente" color="primary" hide-details />
                <span>Preventiva vigente</span>
              </div>
              <v-text-field
                v-model="form.preventiva_vencimiento"
                type="date"
                label="Vencimiento Preventiva"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.peritaje_ultima_fecha"
                type="date"
                label="Fecha de peritaje"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
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
          ❌ No se pudo cargar el prospecto.
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
import { getProspectoById, patchProspecto } from '@/services/prospectosService'

const route = useRoute()
const router = useRouter()

interface ProspectoEditForm {
  nombre: string
  telefono: string
  cedula: string
  placa: string
  observaciones: string
  soat_vigente: boolean
  soat_vencimiento: string
  tecno_vigente: boolean
  tecno_vencimiento: string
  preventiva_vigente: boolean
  preventiva_vencimiento: string
  peritaje_ultima_fecha: string
}

const form = ref<ProspectoEditForm | null>(null)
const loading = ref(true)
const saving = ref(false)
const snackbar = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({
  show: false,
  text: '',
  color: 'success',
})

type RuleFn = (v: unknown) => true | string
const rReq: RuleFn = (v) => (!!v && String(v).trim().length > 0) || 'Requerido'
const rTel: RuleFn = (v) => (!v || /^\d{7,15}$/.test(String(v))) || 'Solo dígitos (7-15)'
const rCedula: RuleFn = (v) => {
  if (!v || String(v).trim().length === 0) return 'Cédula es requerida'
  const digits = String(v).replace(/\D+/g, '')
  if (digits.length < 6 || digits.length > 10) return 'Cédula: 6-10 dígitos'
  return true
}

function onPlacaInput(val?: string): void {
  if (form.value) {
    form.value.placa = (val || '').toUpperCase().replace(/[\s-]+/g, '')
  }
}

function onTelefonoInput(val?: string): void {
  if (form.value) {
    form.value.telefono = (val || '').replace(/\D+/g, '')
  }
}
function onCedulaInput(val?: string): void {
  if (form.value) {
    form.value.cedula = (val || '').replace(/\D+/g, '')
  }
}

const canSubmit = computed<boolean>(() => {
  if (!form.value) return false
  return !!form.value.nombre?.trim() &&
         !!form.value.telefono?.trim() &&
         !!form.value.placa?.trim() &&
         !!form.value.cedula?.trim()
})

async function fetchProspecto() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const prospecto = await getProspectoById(id)

    // Convertir a formato del formulario
    form.value = {
      nombre: prospecto.nombre || '',
      telefono: prospecto.telefono || '',
      cedula: prospecto.cedula || '',
      placa: prospecto.placa || '',
      observaciones: prospecto.observaciones || '',
      soat_vigente: !!prospecto.soat_vigente,
      soat_vencimiento: prospecto.soat_vencimiento || '',
      tecno_vigente: !!prospecto.tecno_vigente,
      tecno_vencimiento: prospecto.tecno_vencimiento || '',
      preventiva_vigente: !!prospecto.preventiva_vigente,
      preventiva_vencimiento: prospecto.preventiva_vencimiento || '',
      peritaje_ultima_fecha: prospecto.peritaje_ultima_fecha || '',
    }
  } catch (err) {
    console.error('❌ Error cargando prospecto:', err)
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error al cargar el prospecto',
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

    await patchProspecto(id, {
      nombre: form.value.nombre.trim(),
      telefono: form.value.telefono || null,
      cedula: form.value.cedula || null,
      placa: form.value.placa.toUpperCase().replace(/[\s-]+/g, ''),
      observaciones: form.value.observaciones || null,
      soatVigente: form.value.soat_vigente,
      soatVencimiento: form.value.soat_vencimiento || null,
      tecnoVigente: form.value.tecno_vigente,
      tecnoVencimiento: form.value.tecno_vencimiento || null,
      preventivaVigente: form.value.preventiva_vigente,
      preventivaVencimiento: form.value.preventiva_vencimiento || null,
      peritajeUltimaFecha: form.value.peritaje_ultima_fecha || null,
    })

    snackbar.value = {
      show: true,
      color: 'success',
      text: '✅ Prospecto actualizado correctamente',
    }

    // Volver al detalle después de 1 segundo
    setTimeout(() => {
      router.push({
        name: 'ComercialProspectoDetalle',
        params: { id },
      }).catch(() => {})
    }, 1000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error actualizando prospecto'
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
    name: 'ComercialProspectoDetalle',
    params: { id },
  }).catch(() => {})
}

onMounted(fetchProspecto)
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.text-h5 {
  font-weight: bold;
}
</style>
