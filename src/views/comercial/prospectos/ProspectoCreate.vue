<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 text-h5 font-weight-bold">➕ Nuevo Prospecto</v-card-title>
      <v-divider />
      <v-card-text class="pt-6">
        <v-form @submit.prevent="submit">
          <v-row class="g-3">
            <v-col cols="12" sm="4">
              <v-text-field v-model="form.nombre" label="Nombre" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="form.telefono" label="Teléfono" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="form.placa" label="Placa" variant="outlined" density="comfortable" />
            </v-col>

            <v-col cols="12" sm="4">
              <v-select
                v-model="form.convenio_id"
                :items="conveniosItems"
                item-title="nombre"
                item-value="id"
                label="Convenio (opcional)"
                variant="outlined"
                density="comfortable"
                :loading="conveniosLoading"
                clearable
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-checkbox v-model="form.soat_vigente" label="SOAT vigente" density="comfortable" hide-details />
              <v-text-field v-model="form.soat_vencimiento" type="date" label="Vencimiento SOAT" variant="outlined" density="comfortable" />
            </v-col>

            <v-col cols="12" sm="4">
              <v-checkbox v-model="form.tecno_vigente" label="Técnico-mecánica vigente" density="comfortable" hide-details />
              <v-text-field v-model="form.tecno_vencimiento" type="date" label="Vencimiento Tecno" variant="outlined" density="comfortable" />
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
import { useRouter } from 'vue-router'
import { createProspecto, listConveniosLight } from '@/services/prospectosService'

const router = useRouter()

const form = ref({
  nombre: '',
  telefono: '',
  placa: '',
  convenio_id: null as number | null,
  soat_vigente: false,
  soat_vencimiento: '',
  tecno_vigente: false,
  tecno_vencimiento: '',
})

const loading = ref(false)

/* convenios */
const conveniosItems = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)
async function loadConvenios() {
  conveniosLoading.value = true
  try { conveniosItems.value = await listConveniosLight() } finally { conveniosLoading.value = false }
}

async function submit() {
  loading.value = true
  try {
    const created = await createProspecto({ ...form.value })
    router.push({ name: 'comercial.prospectos.detail', params: { id: created.id } })
  } finally { loading.value = false }
}

function volver() { router.push({ name: 'comercial.prospectos.list' }) }

loadConvenios()
</script>
