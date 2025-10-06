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
            <div class="text-body-2"><strong>Creado:</strong> {{ fmt(dateo?.created_at) }}</div>
            <div class="text-body-2"><strong>Agente:</strong> {{ dateo?.agente?.nombre || '—' }} <span v-if="dateo?.agente" class="text-medium-emphasis">({{ dateo?.agente?.tipo }})</span></div>
            <div class="text-body-2"><strong>Placa:</strong> {{ dateo?.placa || '—' }}</div>
            <div class="text-body-2"><strong>Teléfono:</strong> {{ dateo?.telefono || '—' }}</div>
            <div class="text-body-2"><strong>Convenio:</strong> {{ dateo?.convenio_id || '—' }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Resultado / Turno -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">Resultado</v-card-title>
          <v-divider />
          <v-card-text>
            <v-row class="g-2">
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.resultado"
                  :items="resultadoItems"
                  label="Resultado"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.consumido_turno_id"
                  type="number"
                  label="Turno consumido (opcional)"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-spacer />
            <v-btn color="primary" @click="guardar" :loading="saving" prepend-icon="mdi-content-save">Guardar</v-btn>
            <v-btn color="error" variant="tonal" @click="openEliminar" prepend-icon="mdi-delete">Eliminar</v-btn>
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
                <v-text-field v-model="form.imagen_url" label="URL evidencia" variant="outlined" />
                <v-img v-if="form.imagen_url" :src="form.imagen_url" class="mt-2 rounded" height="160" cover />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-spacer />
            <v-btn color="primary" @click="guardar" :loading="saving" prepend-icon="mdi-content-save">Guardar</v-btn>
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getDateo,
  updateDateo,
  deleteDateo,
  formatDateTime as fmt,
  type Dateo,
  type ResultadoDateo,
} from '@/services/dateosService'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const loading = ref(true)
const saving = ref(false)
const dateo = ref<Dateo | null>(null)

const resultadoItems: { title: string; value: ResultadoDateo }[] = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'Exitoso', value: 'EXITOSO' },
  { title: 'No exitoso', value: 'NO_EXITOSO' },
]

const form = ref<{
  resultado: ResultadoDateo
  consumido_turno_id: number | null
  observacion: string
  imagen_url: string
}>({
  resultado: 'PENDIENTE',
  consumido_turno_id: null,
  observacion: '',
  imagen_url: '',
})

async function load() {
  loading.value = true
  try {
    const d = await getDateo(id)
    dateo.value = d
    form.value.resultado = (d.resultado as any) || 'PENDIENTE'
    form.value.consumido_turno_id = d.consumido_turno_id || null
    form.value.observacion = d.observacion || ''
    form.value.imagen_url = d.imagen_url || ''
  } finally { loading.value = false }
}

async function guardar() {
  saving.value = true
  try {
    await updateDateo(id, { ...form.value })
    await load()
  } finally { saving.value = false }
}

const dlgEliminar = ref<{ visible: boolean; loading: boolean }>({ visible: false, loading: false })
function openEliminar() { dlgEliminar.value.visible = true }
async function doEliminar() {
  dlgEliminar.value.loading = true
  try { await deleteDateo(id); router.push({ name: 'comercial.dateos.list' }) }
  finally { dlgEliminar.value.loading = false }
}

function volver() { router.push({ name: 'comercial.dateos.list' }) }

onMounted(load)
</script>

<style scoped>
.g-4 { gap: 16px; }
.g-2 { gap: 8px; }
</style>
