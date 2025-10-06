<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 text-h5 font-weight-bold">➕ Nuevo Dateo</v-card-title>
      <v-divider />
      <v-card-text class="pt-6">
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
                label="Asesor (si canal es ASESOR o TELE)"
                variant="outlined"
                density="comfortable"
                :loading="asesoresLoading"
                :disabled="form.canal === 'FACHADA' || form.canal === 'REDES'"
                clearable
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.convenio_id"
                type="number"
                label="Convenio (opcional)"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-text-field v-model="form.placa" label="Placa" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="form.telefono" label="Teléfono" variant="outlined" density="comfortable" />
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="form.observacion" label="Observación" variant="outlined" density="comfortable" rows="3" />
            </v-col>

            <v-col cols="12">
              <v-text-field v-model="form.imagen_url" label="URL evidencia (opcional)" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>

          <div class="d-flex justify-end mt-4">
            <v-btn variant="text" class="me-2" @click="volver">Cancelar</v-btn>
            <v-btn color="primary" type="submit" :loading="loading">Guardar</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createDateo, listAgentesCaptacion, type CanalCaptacion } from '@/services/dateosService'

const router = useRouter()
const route = useRoute()

const canalItems: { title: string; value: CanalCaptacion }[] = [
  { title: 'Fachada', value: 'FACHADA' },
  { title: 'Asesor', value: 'ASESOR' },
  { title: 'Telemercadeo', value: 'TELE' },
  { title: 'Redes/Ads', value: 'REDES' },
]

const form = ref<{ canal: CanalCaptacion | null; agente_id: number | null; convenio_id: number | null; placa: string; telefono: string; observacion: string; imagen_url: string }>({
  canal: null,
  agente_id: null,
  convenio_id: null,
  placa: (route.query.placa as string) || '',
  telefono: (route.query.telefono as string) || '',
  observacion: '',
  imagen_url: '',
})

const loading = ref(false)

/* asesores */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)
async function loadAsesores() {
  asesoresLoading.value = true
  try { asesoresItems.value = await listAgentesCaptacion() } finally { asesoresLoading.value = false }
}

async function submit() {
  if (!form.value.canal) return
  if ((form.value.canal === 'ASESOR' || form.value.canal === 'TELE') && !form.value.agente_id) {
    // regla básica UI
    alert('Debes seleccionar un asesor para el canal elegido.')
    return
  }

  loading.value = true
  try {
    const payload = { ...form.value }
    const created = await createDateo(payload as any)
    router.push({ name: 'comercial.dateos.detail', params: { id: created.id } })
  } finally { loading.value = false }
}

function volver() {
  router.push({ name: 'comercial.dateos.list' })
}

loadAsesores()
</script>
