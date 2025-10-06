<template>
  <v-container class="py-6">
    <v-btn variant="text" class="mb-3" prepend-icon="mdi-arrow-left" @click="volver">Volver</v-btn>

    <v-skeleton-loader v-if="loading" type="card, card" />

    <v-row v-else class="g-4">
      <!-- Ficha del convenio -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Convenio #{{ convenio?.id }}</span>
            <v-chip :color="convenio?.activo ? 'success' : 'error'" variant="flat" size="small">
              {{ convenio?.activo ? 'Activo' : 'Inactivo' }}
            </v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div class="text-h6 mb-1">{{ convenio?.nombre }}</div>
            <div class="text-body-2 text-medium-emphasis mb-3">{{ convenio?.descripcion || '—' }}</div>
            <div class="text-body-2">
              <strong>Vigencia:</strong>
              {{ formatDate(convenio?.vigencia_desde) }} – {{ formatDate(convenio?.vigencia_hasta) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Asesor activo / acciones -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">Asesor activo</v-card-title>
          <v-divider />
          <v-card-text>
            <div class="text-body-2" v-if="asesor?.asesor">
              <strong>{{ asesor.asesor.nombre }}</strong>
              <span class="text-medium-emphasis"> ({{ asesor.asesor.tipo }})</span>
              <div class="text-caption text-medium-emphasis">Desde: {{ formatDate(asesor.desde) }}</div>
            </div>
            <div class="text-medium-emphasis" v-else>Sin asesor asignado.</div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0 d-flex gap-2 flex-wrap">
            <v-btn variant="tonal" prepend-icon="mdi-account-plus" @click="openAsignar">Asignar asesor</v-btn>
            <v-btn variant="tonal" color="error" prepend-icon="mdi-account-remove" @click="openRetirar" :disabled="!asesor?.asesor">Retirar asesor</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Auto-dateo por convenio -->
      <v-col cols="12">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">Crear dateo automático</v-card-title>
          <v-divider />
          <v-card-text>
            <v-row class="g-2">
              <v-col cols="12" sm="4">
                <v-text-field v-model="autoDateo.placa" label="Placa (opcional)" variant="outlined" hide-details />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="autoDateo.telefono" label="Teléfono (opcional)" variant="outlined" hide-details />
              </v-col>
              <v-col cols="12" sm="4" class="d-flex align-end">
                <v-btn color="primary" :loading="autoDateo.loading" @click="dispararAutoDateo">Crear dateo</v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Diálogo Asignar -->
    <v-dialog v-model="dlgAsignar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Asignar asesor</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="dlgAsignar.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor"
            :loading="asesoresLoading"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgAsignar.visible = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="dlgAsignar.loading" @click="confirmAsignar">Asignar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo Retirar -->
    <v-dialog v-model="dlgRetirar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Retirar asesor</v-card-title>
        <v-card-text>
          <v-text-field v-model="dlgRetirar.motivo" label="Motivo (opcional)" variant="outlined" hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgRetirar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgRetirar.loading" @click="confirmRetirar">Retirar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getConvenio,
  getAsesorActivo,
  listAgentesCaptacion,
  asignarAsesorConvenio,
  retirarAsesorConvenio,
  crearDateoAutoPorConvenio,
  formatDate,
  type Convenio,
  type AsesorActivoResp,
} from '@/services/conveniosService'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const loading = ref(true)
const convenio = ref<Convenio | null>(null)
const asesor = ref<AsesorActivoResp | null>(null)

/* Auto-dateo */
const autoDateo = ref<{ placa: string; telefono: string; loading: boolean }>({
  placa: '', telefono: '', loading: false,
})
async function dispararAutoDateo() {
  autoDateo.value.loading = true
  try {
    await crearDateoAutoPorConvenio({
      placa: autoDateo.value.placa || undefined,
      telefono: autoDateo.value.telefono || undefined,
      convenioId: id,
    })
    // Podrías mostrar un toast de éxito
  } finally {
    autoDateo.value.loading = false
  }
}

async function load() {
  loading.value = true
  try {
    convenio.value = await getConvenio(id)
    asesor.value = await getAsesorActivo(id)
  } finally { loading.value = false }
}

/* Dialog Asignar */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)
const dlgAsignar = ref<{ visible: boolean; asesorId: number | null; loading: boolean }>({
  visible: false, asesorId: null, loading: false,
})
function openAsignar() {
  dlgAsignar.value = { visible: true, asesorId: null, loading: false }
  if (!asesoresItems.value.length) {
    asesoresLoading.value = true
    listAgentesCaptacion().then(r => (asesoresItems.value = r)).finally(() => (asesoresLoading.value = false))
  }
}
async function confirmAsignar() {
  if (!dlgAsignar.value.asesorId) return
  dlgAsignar.value.loading = true
  try {
    await asignarAsesorConvenio(id, { asesor_id: dlgAsignar.value.asesorId })
    asesor.value = await getAsesorActivo(id)
    dlgAsignar.value.visible = false
  } finally { dlgAsignar.value.loading = false }
}

/* Dialog Retirar */
const dlgRetirar = ref<{ visible: boolean; motivo: string; loading: boolean }>({
  visible: false, motivo: '', loading: false,
})
function openRetirar() {
  dlgRetirar.value = { visible: true, motivo: '', loading: false }
}
async function confirmRetirar() {
  dlgRetirar.value.loading = true
  try {
    await retirarAsesorConvenio(id, { motivo: dlgRetirar.value.motivo || undefined })
    asesor.value = await getAsesorActivo(id)
    dlgRetirar.value.visible = false
  } finally { dlgRetirar.value.loading = false }
}

function volver() {
  router.push({ name: 'comercial.convenios.list' })
}

onMounted(load)
</script>

<style scoped>
.g-4 { gap: 16px; }
.g-2 { gap: 8px; }
</style>
