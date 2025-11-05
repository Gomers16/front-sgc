<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">💸 Comisiones</div>
        <div class="d-flex gap-2 flex-wrap">
          <v-text-field
            v-model="filters.mes"
            label="Mes"
            type="month"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 170px"
          />

          <v-select
            v-model="filters.estado"
            :items="estadoItems"
            item-title="label"
            item-value="value"
            label="Estado"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
            clearable
          />

          <v-autocomplete
            v-model="filters.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :loading="asesoresLoading"
            style="min-width: 240px"
          />

          <v-btn color="primary" :loading="loading" @click="reload">
            Aplicar filtros
          </v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetFilters">Limpiar</v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <!-- Resumen rápido -->
      <v-card-text class="pt-5">
        <div class="d-flex flex-wrap gap-3">
          <v-chip variant="tonal" size="large">
            Total página:
            <strong class="ms-1">{{ formatCOP(totalPagina) }}</strong>
          </v-chip>
          <v-chip variant="tonal" size="large" color="warning" v-if="pendientesPagina > 0">
            Pendientes: <strong class="ms-1">{{ pendientesPagina }}</strong>
          </v-chip>
          <v-chip variant="tonal" size="large" color="success" v-if="pagadasPagina > 0">
            Pagadas: <strong class="ms-1">{{ pagadasPagina }}</strong>
          </v-chip>
        </div>
      </v-card-text>

      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        :sort-by="sortBy"
        @update:options="loadItems"
        item-value="id"
      >
        <template #item.estado="{ item }">
          <v-chip :color="estadoColor(item.estado)" size="small" variant="flat">
            {{ item.estado }}
          </v-chip>
        </template>

        <template #item.turno="{ item }">
          <div class="d-flex flex-column">
            <span>
              Turno global:
              #{{ item.turno?.numero_global || item.turno?.numero || item.turno?.id }}
            </span>
            <span class="text-caption text-medium-emphasis">
              Turno servicio:
              <span v-if="item.turno?.numero_servicio">
                {{ item.turno?.servicio?.codigo || 'SERV' }}
                #{{ item.turno?.numero_servicio }}
              </span>
              <span v-else>
                {{ item.turno?.servicio?.codigo || 'SERV' }}
              </span>
              ·
              {{ item.turno?.placa || '—' }} ·
              {{ item.turno?.servicio?.nombre || item.turno?.servicio?.codigo || '—' }}
            </span>
          </div>
        </template>

        <template #item.valor_unitario="{ item }">
          {{ formatCOP(item.valor_unitario) }}
        </template>

        <template #item.valor_cliente="{ item }">
          {{ formatCOP(item.valor_cliente ?? 0) }}
        </template>

        <template #item.valor_total="{ item }">
          {{ formatCOP(item.valor_total) }}
        </template>

        <template #item.asesor="{ item }">
          {{ item.asesor?.nombre || '—' }}
        </template>

        <template #item.convenio="{ item }">
          {{ item.convenio?.nombre || '—' }}
        </template>

        <!-- Fecha/hora en 12h -->
        <template #item.generado_at="{ item }">
          {{ formatDateTime(item.generado_at) }}
        </template>

        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="verDetalle(item)" />
            <v-btn
              v-if="item.estado === 'PENDIENTE'"
              size="small"
              variant="text"
              color="warning"
              @click="confirmAprobar(item.id)"
              icon="mdi-check-decagram"
            />
            <v-btn
              v-if="item.estado === 'APROBADA'"
              size="small"
              variant="text"
              color="success"
              @click="confirmPagar(item.id)"
              icon="mdi-cash-multiple"
            />
            <v-btn
              v-if="item.estado === 'PENDIENTE' || item.estado === 'APROBADA'"
              size="small"
              variant="text"
              color="error"
              @click="confirmAnular(item.id)"
              icon="mdi-cancel"
            />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Diálogos de confirmación -->
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

    <!-- 🧾 Modal de detalle de comisión -->
    <v-dialog v-model="detailDialog.visible" max-width="560">
      <v-card v-if="detailDialog.item">
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          <span>Detalle comisión #{{ detailDialog.item.id }}</span>
          <v-chip :color="estadoColor(detailDialog.item.estado)" size="small" variant="flat">
            {{ detailDialog.item.estado }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <strong>Generado:</strong>
              <div>{{ formatDateTime(detailDialog.item.generado_at) }}</div>
            </v-col>

            <!-- Asesor + cuánto se le paga -->
            <v-col cols="12" md="6">
              <strong>Asesor:</strong>
              <div>{{ detailDialog.item.asesor?.nombre || '—' }}</div>
              <div class="text-caption text-medium-emphasis">
                Comisión asesor:
                <strong>{{ formatCOP(detailDialog.item.valor_unitario) }}</strong>
              </div>
            </v-col>

            <!-- Convenio + cuánto se le paga -->
            <v-col cols="12" md="6">
              <strong>Convenio:</strong>
              <div>{{ detailDialog.item.convenio?.nombre || '—' }}</div>
              <div
                v-if="detailDialog.item.valor_cliente && detailDialog.item.valor_cliente > 0"
                class="text-caption text-medium-emphasis"
              >
                Comisión convenio:
                <strong>{{ formatCOP(detailDialog.item.valor_cliente) }}</strong>
              </div>
            </v-col>

            <!-- Turno global / servicio -->
            <v-col cols="12" md="6">
              <strong>Turno global:</strong>
              <div>
                #{{ detailDialog.item.turno?.numero_global
                  || detailDialog.item.turno?.numero
                  || detailDialog.item.turno?.id
                  || '—'
                }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Fecha turno: {{ formatDateTime(detailDialog.item.turno?.fecha) }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <strong>Turno servicio:</strong>
              <div>
                <span v-if="detailDialog.item.turno?.numero_servicio">
                  {{ detailDialog.item.turno?.servicio?.codigo || 'SERV' }}
                  #{{ detailDialog.item.turno?.numero_servicio }}
                </span>
                <span v-else>
                  {{ detailDialog.item.turno?.servicio?.codigo || 'SERV' }}
                </span>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ detailDialog.item.turno?.placa || '—' }} ·
                {{
                  detailDialog.item.turno?.servicio?.nombre ||
                  detailDialog.item.turno?.servicio?.codigo ||
                  '—'
                }}
              </div>
            </v-col>

            <v-col cols="12" class="mt-2">
              <v-divider />
            </v-col>

            <v-col cols="12" md="4">
              <strong>Cantidad:</strong>
              <div>{{ detailDialog.item.cantidad }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <strong>Valor dateo (asesor):</strong>
              <div>{{ formatCOP(detailDialog.item.valor_unitario) }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <strong>Cliente / Convenio:</strong>
              <div>{{ formatCOP(detailDialog.item.valor_cliente ?? 0) }}</div>
            </v-col>

            <v-col cols="12" class="mt-2">
              <v-divider />
            </v-col>

            <v-col cols="12" class="text-right">
              <strong>Total comisión:</strong>
              <div class="text-h6">
                {{ formatCOP(detailDialog.item.valor_total) }}
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  listComisiones,
  aprobarComision,
  pagarComision,
  anularComision,
  listAgentesCaptacion,
  formatCOP,
  type ComisionListItem,
  type ComisionEstado,
} from '@/services/comisionesService'

/* Filtros */
const filters = ref<{ mes: string; asesorId: number | null; estado: ComisionEstado | '' }>({
  mes: '',
  asesorId: null,
  estado: '',
})

/* Tabla */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Turno', key: 'turno', sortable: false },
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Convenio', key: 'convenio', sortable: false },
  { title: 'Valor unitario (dateo)', key: 'valor_unitario', sortable: true },
  { title: 'Comisión Placa', key: 'valor_cliente', sortable: false },
  { title: 'Valor total', key: 'valor_total', sortable: true },
  { title: 'Generado', key: 'generado_at', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' },
]

const rows = ref<ComisionListItem[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<any>([{ key: 'id', order: 'desc' }])
const loading = ref(false)

/* Catálogos */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)

const estadoItems = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Aprobada', value: 'APROBADA' },
  { label: 'Pagada', value: 'PAGADA' },
  { label: 'Anulada', value: 'ANULADA' },
]

/* Resumen */
const totalPagina = computed(() => rows.value.reduce((acc, r) => acc + (r.valor_total || 0), 0))
const pendientesPagina = computed(() => rows.value.filter((r) => r.estado === 'PENDIENTE').length)
const pagadasPagina = computed(() => rows.value.filter((r) => r.estado === 'PAGADA').length)

function estadoColor(e: ComisionEstado) {
  switch (e) {
    case 'PENDIENTE':
      return 'warning'
    case 'APROBADA':
      return 'info'
    case 'PAGADA':
      return 'success'
    case 'ANULADA':
      return 'error'
    default:
      return undefined
  }
}

/** Formato bonito de fecha/hora (12h, sin segundos) */
function formatDateTime(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

async function loadItems() {
  loading.value = true
  try {
    const sort = Array.isArray(sortBy.value) && sortBy.value[0] ? sortBy.value[0] : { key: 'id', order: 'desc' }
    const res = await listComisiones({
      page: page.value,
      perPage: itemsPerPage.value,
      mes: filters.value.mes || undefined,
      asesorId: filters.value.asesorId || undefined,
      estado: (filters.value.estado as any) || undefined,
      sortBy: sort.key,
      order: sort.order,
    })
    rows.value = res.data
    totalItems.value = res.total
  } catch {
    rows.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadItems()
}

function resetFilters() {
  filters.value = { mes: '', asesorId: null, estado: '' }
  reload()
}

/* Dialogo confirmación */
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

function confirmAprobar(id: number) {
  openConfirm('Aprobar comisión', '¿Confirmas aprobar esta comisión?', 'info', async () => {
    dialog.value.visible = false
    await aprobarComision(id)
    loadItems()
  })
}
function confirmPagar(id: number) {
  openConfirm('Pagar comisión', '¿Confirmas registrar el pago?', 'success', async () => {
    dialog.value.visible = false
    await pagarComision(id)
    loadItems()
  })
}
function confirmAnular(id: number) {
  openConfirm('Anular comisión', '¿Seguro que deseas anularla?', 'error', async () => {
    dialog.value.visible = false
    await anularComision(id)
    loadItems()
  })
}

/* Modal de detalle */
const detailDialog = ref<{ visible: boolean; item: ComisionListItem | null }>({
  visible: false,
  item: null,
})

function verDetalle(item: ComisionListItem) {
  detailDialog.value = { visible: true, item }
}

/* Init */
loadAsesores()
loadItems()
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
</style>
