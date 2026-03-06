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
                <div class="text-body-2">
                  <strong>Asesor:</strong> {{ comision?.asesor?.nombre || '—' }}
                  <span v-if="comision?.asesor">({{ comision?.asesor?.tipo }})</span>
                </div>
                <div class="text-body-2"><strong>Convenio:</strong> {{ comision?.convenio?.nombre || '—' }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- INFORMACIÓN DE RECURRENCIA (3 ESTADOS) -->
      <v-col cols="12" v-if="comision?.turno">
        <v-card class="rounded-lg" elevation="4">
          <v-card-title class="d-flex align-center gap-2">
            <v-icon :color="recurrenciaIconColor">{{ recurrenciaIcono }}</v-icon>
            <span class="text-subtitle-1 font-weight-bold">{{ recurrenciaLabel }}</span>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <!-- CLIENTE RECURRENTE -->
            <template v-if="comision.turno.es_recurrente && !comision.turno.es_recuperacion">
              <v-row>
                <v-col cols="12" md="4">
                  <div class="text-body-2">
                    <strong>Última visita:</strong>
                    {{ fmt(comision.turno.fecha_ultima_visita) }}
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-body-2">
                    <strong>Meses desde última visita:</strong>
                    {{ comision.turno.meses_desde_ultima_visita || '—' }} meses
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-body-2">
                    <strong>Turno anterior:</strong>
                    #{{ comision.turno.ultimo_turno_id || '—' }}
                  </div>
                </v-col>
                <v-col cols="12">
                  <v-alert type="warning" variant="tonal" density="compact">
                    <strong>🔄 Comisión recurrente aplicada:</strong>
                    El cliente vino hace <strong>{{ comision.turno.meses_desde_ultima_visita }} meses</strong>
                    (menos del umbral configurado). Se aplicó el valor de dateo recurrente reducido
                    en lugar de la comisión normal.
                  </v-alert>
                </v-col>
              </v-row>
            </template>

            <!-- CLIENTE RECUPERACIÓN -->
            <template v-else-if="comision.turno.es_recuperacion">
              <v-row>
                <v-col cols="12" md="4">
                  <div class="text-body-2">
                    <strong>Última visita:</strong>
                    {{ fmt(comision.turno.fecha_ultima_visita) }}
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-body-2">
                    <strong>Meses desde última visita:</strong>
                    {{ comision.turno.meses_desde_ultima_visita || '—' }} meses
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-body-2">
                    <strong>Turno anterior:</strong>
                    #{{ comision.turno.ultimo_turno_id || '—' }}
                  </div>
                </v-col>
                <v-col cols="12">
                  <v-alert type="warning" variant="tonal" density="compact" color="amber-darken-2">
                    <strong>💛 Comisión recuperación aplicada:</strong>
                    El cliente regresó después de <strong>{{ comision.turno.meses_desde_ultima_visita }} meses</strong>
                    (superó el umbral configurado). Se aplicó el valor de dateo recuperación intermedio.
                  </v-alert>
                </v-col>
              </v-row>
            </template>

            <!-- CLIENTE NUEVO -->
            <template v-else>
              <v-row>
                <v-col cols="12">
                  <v-alert type="success" variant="tonal" density="compact">
                    <strong>✨ Cliente nuevo:</strong>
                    Es la primera visita de este cliente en el sistema.
                    Se aplica la comisión estándar de dateo completa.
                  </v-alert>
                </v-col>
              </v-row>
            </template>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 🆕 TARJETA DESCUENTO INFORMATIVO (solo si tiene descuento) -->
      <v-col cols="12" v-if="comision?.descuento">
        <v-card class="rounded-lg" elevation="4" color="orange-darken-2" variant="tonal">
          <v-card-title class="d-flex align-center gap-2">
            <v-icon color="orange-darken-2">mdi-tag-check</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Descuento informativo aplicado</span>
            <v-chip
              size="small"
              class="ms-2"
              :color="comision.descuento_origen === 'dateo' ? 'blue' : 'purple'"
              variant="flat"
            >
              <v-icon start size="14">
                {{ comision.descuento_origen === 'dateo' ? 'mdi-calendar-check' : 'mdi-cash-register' }}
              </v-icon>
              {{ comision.descuento_origen === 'dateo' ? 'Pre-marcado en el dateo' : 'Aplicado en caja' }}
            </v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <!-- Nombre y código del descuento -->
              <v-col cols="12" md="4">
                <div class="text-caption text-medium-emphasis text-uppercase mb-1">Descuento</div>
                <div class="text-body-1 font-weight-medium">{{ comision.descuento.nombre }}</div>
                <div class="text-caption text-medium-emphasis">Código: {{ comision.descuento.codigo }}</div>
              </v-col>

              <!-- Fecha de aplicación -->
              <v-col cols="12" md="4" v-if="comision.descuento_aplicado_at">
                <div class="text-caption text-medium-emphasis text-uppercase mb-1">Aplicado el</div>
                <div class="text-body-2">{{ fmt(comision.descuento_aplicado_at) }}</div>
              </v-col>

              <!-- Cajero que lo procesó -->
              <v-col cols="12" md="4" v-if="comision.descuento_aplicado_por">
                <div class="text-caption text-medium-emphasis text-uppercase mb-1">Procesado por (cajero)</div>
                <div class="text-body-2 font-weight-medium">{{ comision.descuento_aplicado_por.nombre }}</div>
              </v-col>

              <!-- Quién autorizó (solo origen caja) -->
              <v-col cols="12" md="4" v-if="comision.descuento_origen === 'caja' && comision.descuento_autorizado_por">
                <div class="text-caption text-medium-emphasis text-uppercase mb-1">Autorizado por</div>
                <div class="text-body-2 font-weight-medium">{{ comision.descuento_autorizado_por.nombre }}</div>
              </v-col>

              <!-- Separador y efecto -->
              <v-col cols="12">
                <v-divider class="my-2" />
                <v-alert
                  type="info"
                  variant="tonal"
                  density="compact"
                  color="orange-darken-3"
                  prepend-icon="mdi-information-outline"
                >
                  <template v-if="comision.descuento_origen === 'dateo'">
                    <strong>Pre-marcado por el comercial al crear el dateo.</strong>
                    La comisión de este dateo se calculó con el valor básico de recurrencia
                    en lugar del valor nuevo directo.
                  </template>
                  <template v-else>
                    <strong>Aplicado manualmente en caja al confirmar el ticket.</strong>
                    La comisión de este dateo se calculó con el valor básico de recurrencia
                    en lugar del valor nuevo directo.
                  </template>
                </v-alert>
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
                  :label="labelValorUnitario"
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

            <!-- Desglose dateo + incentivo -->
            <v-row v-if="comision?.monto_asesor != null || comision?.monto_convenio != null" dense class="mt-1">
              <v-col cols="12">
                <v-divider class="mb-3" />
                <div class="text-caption text-medium-emphasis d-flex flex-wrap gap-3">
                  <span>
                    💼 Dateo asesor:
                    <strong>{{ formatCOP(Number(comision?.monto_asesor ?? 0)) }}</strong>
                  </span>
                  <span>
                    🏢 Incentivo convenio:
                    <strong>{{ formatCOP(Number(comision?.monto_convenio ?? 0)) }}</strong>
                  </span>
                </div>
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

// ====== LÓGICA 3 ESTADOS ======
const esRecurrente = computed(() =>
  !!(comision.value?.turno?.es_recurrente && !comision.value?.turno?.es_recuperacion)
)
const esRecuperacion = computed(() =>
  !!(comision.value?.turno?.es_recuperacion)
)

const recurrenciaLabel = computed(() => {
  if (esRecurrente.value) return 'Cliente RECURRENTE'
  if (esRecuperacion.value) return 'Cliente RECUPERACIÓN'
  return 'Cliente NUEVO'
})

const recurrenciaIcono = computed(() => {
  if (esRecurrente.value) return 'mdi-account-clock'
  if (esRecuperacion.value) return 'mdi-account-reactivate'
  return 'mdi-account-star'
})

const recurrenciaIconColor = computed(() => {
  if (esRecurrente.value) return 'warning'
  if (esRecuperacion.value) return 'amber-darken-2'
  return 'success'
})

const labelValorUnitario = computed(() => {
  if (esRecurrente.value) return 'Valor dateo (recurrente)'
  if (esRecuperacion.value) return 'Valor dateo (recuperación)'
  // 🆕 Si tiene descuento informativo, indicar que fue ajustado
  if (comision.value?.descuento) return 'Valor dateo (con descuento informativo)'
  return 'Valor unitario (dateo)'
})

function estadoColor(e?: ComisionEstado) {
  switch (e) {
    case 'PENDIENTE': return 'warning'
    case 'APROBADA': return 'info'
    case 'PAGADA': return 'success'
    case 'ANULADA': return 'error'
    default: return undefined
  }
}

function fmt(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('es-CO') } catch { return d }
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
const dialog = ref<{
  visible: boolean
  title: string
  message: string
  color: string
  onConfirm: () => void
}>({
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
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
