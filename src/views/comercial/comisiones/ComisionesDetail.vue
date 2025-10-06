<template>
  <v-container class="py-6">
    <v-btn variant="text" class="mb-3" prepend-icon="mdi-arrow-left" @click="volver">Volver</v-btn>

    <v-skeleton-loader v-if="loading" type="card, card, card" />

    <v-row v-else class="g-4">
      <!-- Estado e Identificación -->
      <v-col cols="12" md="4">
        <v-card class="rounded-lg" elevation="4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Comisión #{{ comision?.id }}</span>
            <v-chip :color="estadoColor(comision?.estado)" variant="flat" size="small">
              {{ comision?.estado }}
            </v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div class="text-body-2"><strong>Generada:</strong> {{ fmt(comision?.generado_at) }}</div>
            <div class="text-body-2" v-if="comision?.aprobado_at"><strong>Aprobada:</strong> {{ fmt(comision?.aprobado_at) }}</div>
            <div class="text-body-2" v-if="comision?.pagado_at"><strong>Pagada:</strong> {{ fmt(comision?.pagado_at) }}</div>
            <div class="text-body-2" v-if="comision?.anulado_at"><strong>Anulada:</strong> {{ fmt(comision?.anulado_at) }}</div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0 d-flex flex-wrap gap-2">
            <v-btn
              v-if="comision?.estado === 'PENDIENTE'"
              color="info"
              @click="doAprobar"
              prepend-icon="mdi-check-decagram"
            >Aprobar</v-btn>
            <v-btn
              v-if="comision?.estado === 'APROBADA'"
              color="success"
              @click="doPagar"
              prepend-icon="mdi-cash-multiple"
            >Marcar pagada</v-btn>
            <v-btn
              v-if="comision && (comision.estado === 'PENDIENTE' || comision.estado === 'APROBADA')"
              color="error"
              variant="tonal"
              @click="doAnular"
              prepend-icon="mdi-cancel"
            >Anular</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Turno / Asesor / Convenio -->
      <v-col cols="12" md="8">
        <v-card class="rounded-lg" elevation="4">
          <v-card-title class="text-subtitle-1 font-weight-bold">Origen</v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <div class="text-body-2"><strong>Turno:</strong> #{{ comision?.turno?.numero || comision?.turno?.id }}</div>
                <div class="text-body-2"><strong>Fecha:</strong> {{ fmt(comision?.turno?.fecha) }}</div>
                <div class="text-body-2"><strong>Placa:</strong> {{ comision?.turno?.placa || '—' }}</div>
                <div class="text-body-2">
                  <strong>Servicio:</strong> {{ comision?.turno?.servicio?.nombre || comision?.turno?.servicio?.codigo || '—' }}
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-body-2"><strong>Asesor:</strong> {{ comision?.asesor?.nombre || '—' }} <span v-if="comision?.asesor">({{ comision?.asesor?.tipo }})</span></div>
                <div class="text-body-2"><strong>Convenio:</strong> {{ comision?.convenio?.nombre || '—' }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Valores -->
      <v-col cols="12">
        <v-card class="rounded-lg" elevation="4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Valores</span>
            <div class="text-body-2 text-medium-emphasis">Total: <strong>{{ formatCOP(totalCalc) }}</strong></div>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="form.cantidad"
                  type="number"
                  label="Cantidad"
                  variant="outlined"
                  density="comfortable"
                  :readonly="!editable"
                  min="1"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="form.valor_unitario"
                  type="number"
                  label="Valor unitario"
                  variant="outlined"
                  density="comfortable"
                  :readonly="!editable"
                  min="0"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  :model-value="formatCOP(totalCalc)"
                  label="Valor total"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-spacer />
            <v-btn color="primary" :disabled="!editable" @click="guardarValores" prepend-icon="mdi-content-save">
              Guardar cambios
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Confirm genérico -->
    <v-dialog v-model="dialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">{{ dialog.title }}</v-card-title>
        <v-card-text>{{ dialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.visible = false">Cancelar</v-btn>
          <v-btn :color="dialog.color" @click="dialog.onConfirm">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getComision,
  patchValores,
  aprobarComision,
  pagarComision,
  anularComision,
  formatCOP,
  type ComisionDetail,
  type ComisionEstado,
} from '@/services/comisionesService'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const comision = ref<ComisionDetail | null>(null)
const loading = ref(true)

const form = ref<{ cantidad: number; valor_unitario: number }>({
  cantidad: 1,
  valor_unitario: 0,
})

const totalCalc = computed(() => {
  const c = Number(form.value.cantidad || 0)
  const vu = Number(form.value.valor_unitario || 0)
  return Math.max(0, c * vu)
})

const editable = computed(() => comision.value?.estado === 'PENDIENTE')

function estadoColor(e?: ComisionEstado) {
  switch (e) {
    case 'PENDIENTE': return 'warning'
    case 'APROBADA': return 'info'
    case 'PAGADA': return 'success'
    case 'ANULADA': return 'error'
    default: return undefined
  }
}

function fmt(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return d }
}

async function load() {
  loading.value = true
  try {
    const data = await getComision(id)
    comision.value = data
    form.value.cantidad = Number(data.cantidad || 1)
    form.value.valor_unitario = Number(data.valor_unitario || 0)
  } finally {
    loading.value = false
  }
}

async function guardarValores() {
  await patchValores(id, {
    cantidad: Number(form.value.cantidad),
    valor_unitario: Number(form.value.valor_unitario),
  })
  await load()
}

function volver() {
  router.push({ name: 'comercial.comisiones.list' })
}

/* Confirmaciones */
const dialog = ref<{ visible: boolean; title: string; message: string; color: string; onConfirm: () => void }>({
  visible: false,
  title: '',
  message: '',
  color: 'primary',
  onConfirm: () => {},
})

function openConfirm(title: string, message: string, color: string, onConfirm: () => void) {
  dialog.value = { visible: true, title, message, color, onConfirm }
}

function doAprobar() {
  openConfirm('Aprobar comisión', '¿Confirmas aprobar esta comisión?', 'info', async () => {
    dialog.value.visible = false
    await aprobarComision(id)
    await load()
  })
}
function doPagar() {
  openConfirm('Marcar pagada', '¿Confirmas registrar el pago?', 'success', async () => {
    dialog.value.visible = false
    await pagarComision(id)
    await load()
  })
}
function doAnular() {
  openConfirm('Anular comisión', '¿Seguro que deseas anularla?', 'error', async () => {
    dialog.value.visible = false
    await anularComision(id)
    await load()
  })
}

onMounted(load)
</script>

<style scoped>
.g-4 { gap: 16px; }
</style>
