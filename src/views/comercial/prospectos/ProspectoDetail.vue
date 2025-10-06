<template>
  <v-container class="py-6">
    <v-btn variant="text" class="mb-3" prepend-icon="mdi-arrow-left" @click="volver">Volver</v-btn>

    <v-skeleton-loader v-if="loading" type="card, card, table" />

    <v-row v-else class="g-4">
      <!-- Ficha -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">Prospecto #{{ prospecto?.id }}</v-card-title>
          <v-divider />
          <v-card-text>
            <div class="text-body-2"><strong>Nombre:</strong> {{ prospecto?.nombre || '—' }}</div>
            <div class="text-body-2"><strong>Teléfono:</strong> {{ prospecto?.telefono || '—' }}</div>
            <div class="text-body-2"><strong>Placa:</strong> {{ prospecto?.placa || '—' }}</div>
            <div class="text-body-2"><strong>Convenio:</strong> {{ prospecto?.convenio_id || '—' }}</div>
            <v-divider class="my-3" />
            <div class="text-body-2">
              <strong>SOAT:</strong>
              <v-chip :color="prospecto?.soat_vigente ? 'success' : 'error'" size="small" variant="flat" class="ms-2">
                {{ prospecto?.soat_vigente ? 'Vigente' : 'Vencido' }}
              </v-chip>
              <span class="text-caption text-medium-emphasis ms-2">{{ formatDate(prospecto?.soat_vencimiento) }}</span>
            </div>
            <div class="text-body-2 mt-1">
              <strong>Tecno:</strong>
              <v-chip :color="prospecto?.tecno_vigente ? 'success' : 'error'" size="small" variant="flat" class="ms-2">
                {{ prospecto?.tecno_vigente ? 'Vigente' : 'Vencido' }}
              </v-chip>
              <span class="text-caption text-medium-emphasis ms-2">{{ formatDate(prospecto?.tecno_vencimiento) }}</span>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0 d-flex flex-wrap gap-2">
            <v-btn variant="tonal" prepend-icon="mdi-clipboard-plus" @click="irCrearDateo">Crear dateo</v-btn>
            <v-btn variant="tonal" prepend-icon="mdi-clipboard-text-clock" @click="irCrearTurno">Crear turno</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Asignación -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">Asignación de asesor</v-card-title>
          <v-divider />
          <v-card-text>
            <div v-if="detalle?.asignacion_activa?.asesor" class="text-body-2">
              <strong>{{ detalle.asignacion_activa.asesor.nombre }}</strong>
              <span class="text-medium-emphasis"> ({{ detalle.asignacion_activa.asesor.tipo }})</span>
              <div class="text-caption text-medium-emphasis">Desde: {{ formatDate(detalle.asignacion_activa.fecha_asignacion) }}</div>
            </div>
            <div v-else class="text-medium-emphasis">Sin asignación activa.</div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0 d-flex gap-2 flex-wrap">
            <v-btn variant="tonal" prepend-icon="mdi-account-plus" @click="openAsignar">Asignar asesor</v-btn>
            <v-btn variant="tonal" color="error" prepend-icon="mdi-account-remove" @click="openRetirar" :disabled="!detalle?.asignacion_activa">Retirar</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Historial de asignaciones -->
      <v-col cols="12">
        <v-card elevation="4" class="rounded-lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">Historial de asignaciones</v-card-title>
          <v-divider />
          <v-card-text>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Asesor</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Motivo fin</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in detalle?.historial_asignaciones || []" :key="a.id">
                  <td>{{ a.asesor?.nombre }}</td>
                  <td>{{ formatDate(a.fecha_asignacion) }}</td>
                  <td>{{ formatDate(a.fecha_fin) }}</td>
                  <td>{{ a.motivo_fin || '—' }}</td>
                  <td>
                    <v-chip :color="a.activo ? 'success' : 'default'" size="small" variant="flat">
                      {{ a.activo ? 'Sí' : 'No' }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="!detalle?.historial_asignaciones?.length">
                  <td colspan="5" class="text-medium-emphasis">Sin movimientos.</td>
                </tr>
              </tbody>
            </v-table>
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
            variant="outlined"
            :loading="asesoresLoading"
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
  getProspecto,
  asignarAsesor,
  retirarAsesor,
  listAgentesCaptacion,
  formatDate,
  type ProspectoDetail,
} from '@/services/prospectosService'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const loading = ref(true)
const prospecto = ref<ProspectoDetail | null>(null)
const detalle = prospecto // alias para legibilidad

async function load() {
  loading.value = true
  try { prospecto.value = await getProspecto(id) }
  finally { loading.value = false }
}

/* Navegación a otros módulos */
function irCrearDateo() {
  router.push({ name: 'comercial.dateos.create', query: { placa: prospecto.value?.placa || '', telefono: prospecto.value?.telefono || '' } })
}
function irCrearTurno() {
  router.push({ name: 'rtm.crear', query: { placa: prospecto.value?.placa || '' } })
}

/* Asignar/Retirar */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)

async function ensureAsesores() {
  if (asesoresItems.value.length) return
  asesoresLoading.value = true
  try { asesoresItems.value = await listAgentesCaptacion() } finally { asesoresLoading.value = false }
}

const dlgAsignar = ref<{ visible: boolean; asesorId: number | null; loading: boolean }>({
  visible: false, asesorId: null, loading: false,
})
function openAsignar() {
  dlgAsignar.value = { visible: true, asesorId: null, loading: false }
  ensureAsesores()
}
async function confirmAsignar() {
  if (!dlgAsignar.value.asesorId) return
  dlgAsignar.value.loading = true
  try {
    await asignarAsesor(id, { asesor_id: dlgAsignar.value.asesorId })
    await load()
    dlgAsignar.value.visible = false
  } finally { dlgAsignar.value.loading = false }
}

const dlgRetirar = ref<{ visible: boolean; motivo: string; loading: boolean }>({
  visible: false, motivo: '', loading: false,
})
function openRetirar() {
  dlgRetirar.value = { visible: true, motivo: '', loading: false }
}
async function confirmRetirar() {
  dlgRetirar.value.loading = true
  try {
    await retirarAsesor(id, { motivo: dlgRetirar.value.motivo || undefined })
    await load()
    dlgRetirar.value.visible = false
  } finally { dlgRetirar.value.loading = false }
}

function volver() { router.push({ name: 'comercial.prospectos.list' }) }

onMounted(load)
</script>

<style scoped>
.g-4 { gap: 16px; }
</style>
