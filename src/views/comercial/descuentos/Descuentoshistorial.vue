<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">

      <!-- ── Título + Filtros ── -->
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">🏷️ Historial de Descuentos</div>
        <div class="d-flex gap-2 flex-wrap align-center">

          <!-- Rango fechas -->
          <v-text-field
            v-model="filters.fechaDesde"
            label="Desde"
            type="date"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
          />
          <v-text-field
            v-model="filters.fechaHasta"
            label="Hasta"
            type="date"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
          />

          <!-- Tipo de descuento -->
          <v-autocomplete
            v-model="filters.descuentoId"
            :items="descuentosItems"
            item-title="nombre"
            item-value="id"
            label="Tipo de descuento"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :loading="catalogLoading"
            style="min-width: 200px"
          />

          <!-- Origen -->
          <v-select
            v-model="filters.origen"
            :items="origenItems"
            item-title="label"
            item-value="value"
            label="Origen"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            style="min-width: 180px"
          />

          <!-- Asesor comercial -->
          <v-autocomplete
            v-model="filters.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor comercial"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :loading="catalogLoading"
            style="min-width: 200px"
          />

          <!-- Autorizador -->
          <v-text-field
            v-model="filters.autorizador"
            label="Autorizador"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            style="min-width: 180px"
            @keyup.enter="reload"
          />

          <v-btn color="primary" :loading="loading" @click="reload" prepend-icon="mdi-magnify">
            Buscar
          </v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetFilters" prepend-icon="mdi-filter-remove">
            Limpiar
          </v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <!-- ── Chips resumen ── -->
      <v-card-text class="pt-4 pb-2">
        <div class="d-flex flex-wrap gap-3 align-center">
          <v-chip variant="tonal" size="large">
            Total registros: <strong class="ms-1">{{ totalItems }}</strong>
          </v-chip>
          <v-chip variant="tonal" size="large" color="blue">
            Pre-marcados dateo:
            <strong class="ms-1">{{ conteoOrigen('dateo') }}</strong>
          </v-chip>
          <v-chip variant="tonal" size="large" color="purple">
            Aplicados en caja:
            <strong class="ms-1">{{ conteoOrigen('caja') }}</strong>
          </v-chip>
        </div>
      </v-card-text>

      <!-- ── Tabla ── -->
      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        @update:options="onTableOptions"
        item-value="ticket_id"
        no-data-text="No hay descuentos aplicados en el rango seleccionado"
      >

        <!-- Fecha -->
        <template #item.confirmado_at="{ item }">
          <span class="text-body-2">{{ formatDateTime(item.confirmado_at) }}</span>
        </template>

        <!-- Placa / Turno -->
        <template #item.placa="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.placa || '—' }}</span>
            <span class="text-caption text-medium-emphasis">
              {{ item.servicio_codigo || '' }}
              <span v-if="item.turno_global">#G{{ item.turno_global }}</span>
              <span v-if="item.tipo_vehiculo"> · {{ item.tipo_vehiculo }}</span>
            </span>
          </div>
        </template>

        <!-- Descuento -->
        <template #item.descuento="{ item }">
          <v-chip
            v-if="item.descuento"
            size="small"
            color="orange-darken-2"
            variant="tonal"
            prepend-icon="mdi-tag-check"
          >
            {{ item.descuento.nombre }}
          </v-chip>
          <span v-else class="text-caption text-medium-emphasis">—</span>
          <div v-if="item.descuento" class="text-caption text-medium-emphasis mt-1">
            Código: {{ item.descuento.codigo }}
          </div>
        </template>

        <!-- Origen -->
        <template #item.origen="{ item }">
          <v-chip
            size="small"
            :color="item.origen === 'dateo' ? 'blue' : 'purple'"
            variant="flat"
          >
            <v-icon start size="14">
              {{ item.origen === 'dateo' ? 'mdi-calendar-check' : 'mdi-cash-register' }}
            </v-icon>
            {{ item.origen === 'dateo' ? 'Pre-marcado dateo' : 'Aplicado en caja' }}
          </v-chip>
        </template>

        <!-- Comercial del dateo -->
        <template #item.comercial="{ item }">
          <div v-if="item.comercial" class="d-flex flex-column">
            <span class="text-body-2 font-weight-medium">{{ item.comercial.nombre }}</span>
            <span class="text-caption text-medium-emphasis">{{ item.comercial.tipo || 'Comercial' }}</span>
          </div>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Cajero -->
        <template #item.cajero="{ item }">
          <span v-if="item.cajero" class="text-body-2">{{ item.cajero.nombre }}</span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Autorizado por -->
        <template #item.autorizado_por="{ item }">
          <div v-if="item.autorizado_por">
            <v-chip size="x-small" color="deep-purple" variant="tonal" prepend-icon="mdi-shield-check">
              {{ item.autorizado_por.nombre }}
            </v-chip>
          </div>
          <span v-else class="text-caption text-medium-emphasis">
            {{ item.origen === 'dateo' ? 'N/A (pre-marcado)' : '—' }}
          </span>
        </template>

        <!-- Monto -->
        <template #item.descuento_monto_aplicado="{ item }">
          <span v-if="item.descuento_monto_aplicado != null" class="font-weight-medium text-orange-darken-2">
            {{ formatCOP(item.descuento_monto_aplicado) }}
          </span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Acciones -->
        <template #item.acciones="{ item }">
          <v-btn
            size="small"
            variant="text"
            icon="mdi-eye"
            @click="verDetalle(item)"
          />
        </template>

      </v-data-table-server>
    </v-card>

    <!-- ── Modal detalle ── -->
    <v-dialog v-model="detailDialog.visible" max-width="680" scrollable>
      <v-card v-if="detailDialog.item">
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          <span>Detalle descuento — Ticket #{{ detailDialog.item.ticket_id }}</span>
          <v-chip
            size="small"
            :color="detailDialog.item.origen === 'dateo' ? 'blue' : 'purple'"
            variant="flat"
          >
            {{ detailDialog.item.origen === 'dateo' ? 'Pre-marcado dateo' : 'Aplicado en caja' }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-card-text class="pt-4">
          <v-row dense>

            <!-- Fecha -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Fecha confirmación:</strong><br />
                {{ formatDateTime(detailDialog.item.confirmado_at) }}
              </div>
            </v-col>

            <!-- Placa / Vehículo -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Placa:</strong><br />
                <span class="font-weight-medium text-h6">{{ detailDialog.item.placa || '—' }}</span>
                <span v-if="detailDialog.item.tipo_vehiculo" class="text-caption ms-1 text-medium-emphasis">
                  ({{ detailDialog.item.tipo_vehiculo }})
                </span>
              </div>
            </v-col>

            <!-- Turno -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Turno:</strong><br />
                <span v-if="detailDialog.item.turno_global">#Global {{ detailDialog.item.turno_global }}</span>
                <span v-if="detailDialog.item.turno_servicio"> · #Serv {{ detailDialog.item.turno_servicio }}</span>
                <span v-if="!detailDialog.item.turno_global && !detailDialog.item.turno_servicio">—</span>
              </div>
            </v-col>

            <!-- Servicio -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Servicio:</strong><br />
                {{ detailDialog.item.servicio_nombre || detailDialog.item.servicio_codigo || '—' }}
              </div>
            </v-col>

            <v-col cols="12"><v-divider class="my-2" /></v-col>

            <!-- Descuento -->
            <v-col cols="12">
              <v-card variant="tonal" color="orange-darken-2" class="mb-3">
                <v-card-text>
                  <div class="d-flex align-center gap-2 mb-2">
                    <v-icon color="orange-darken-2">mdi-tag-check</v-icon>
                    <span class="font-weight-bold text-body-1">{{ detailDialog.item.descuento?.nombre }}</span>
                    <span class="text-caption text-medium-emphasis">({{ detailDialog.item.descuento?.codigo }})</span>
                  </div>
                  <div v-if="detailDialog.item.descuento_monto_aplicado != null" class="text-body-2">
                    <strong>Monto descontado:</strong>
                    {{ formatCOP(detailDialog.item.descuento_monto_aplicado) }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    🏷️ Efecto: la comisión se calculó con valor básico de recurrencia
                    en lugar del valor nuevo directo.
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Comercial -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Comercial (dateo):</strong><br />
                <span v-if="detailDialog.item.comercial">
                  {{ detailDialog.item.comercial.nombre }}
                  <span class="text-caption text-medium-emphasis ms-1">
                    ({{ detailDialog.item.comercial.tipo || 'Comercial' }})
                  </span>
                </span>
                <span v-else class="text-medium-emphasis">—</span>
              </div>
            </v-col>

            <!-- Cajero -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Confirmado por (cajero):</strong><br />
                {{ detailDialog.item.cajero?.nombre || '—' }}
              </div>
            </v-col>

            <!-- Autorizador -->
            <v-col cols="12" v-if="detailDialog.item.origen === 'caja'">
              <div class="text-body-2">
                <strong>Autorizado por:</strong><br />
                <v-chip
                  v-if="detailDialog.item.autorizado_por"
                  color="deep-purple"
                  variant="tonal"
                  prepend-icon="mdi-shield-check"
                  size="small"
                >
                  {{ detailDialog.item.autorizado_por.nombre }}
                </v-chip>
                <span v-else class="text-medium-emphasis">Sin registro de autorizador</span>
              </div>
            </v-col>

            <v-col cols="12" v-else>
              <div class="text-caption text-medium-emphasis">
                ℹ️ Pre-marcado por el comercial al crear el dateo. No requiere autorizador en caja.
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
import { ref, onMounted } from 'vue'
import { get } from '@/services/http'
import { formatCOP } from '@/services/comisionesService'
import { listAgentesCaptacion } from '@/services/comisionesService'

/* ── Tipos ── */
interface DescuentoLight {
  id: number
  codigo: string
  nombre: string
}

interface PersonaLight {
  id: number
  nombre: string
  tipo?: string | null
}

interface HistorialRow {
  ticket_id:               number
  confirmado_at:           string | null
  placa:                   string | null
  turno_id:                number | null
  turno_global:            number | null
  turno_servicio:          number | null
  servicio_nombre:         string | null
  servicio_codigo:         string | null
  tipo_vehiculo:           string | null
  descuento:               DescuentoLight | null
  descuento_monto_aplicado: number | null
  origen:                  'dateo' | 'caja'
  comercial:               PersonaLight | null
  dateo_id:                number | null
  cajero:                  PersonaLight | null
  autorizado_por:          PersonaLight | null
}

interface HistorialMeta {
  total:       number
  page:        number
  per_page:    number
  last_page:   number
  fecha_desde: string
  fecha_hasta: string
}

/* ── Estado ── */
const rows        = ref<HistorialRow[]>([])
const totalItems  = ref(0)
const page        = ref(1)
const itemsPerPage = ref(50)
const loading     = ref(false)
const catalogLoading = ref(false)

/* ── Catálogos ── */
const descuentosItems = ref<{ id: number; nombre: string; codigo: string }[]>([])
const asesoresItems   = ref<{ id: number; nombre: string }[]>([])

/* ── Filtros ── */
function hoy() {
  return new Date().toISOString().slice(0, 10)
}

const filters = ref({
  fechaDesde:  hoy(),
  fechaHasta:  hoy(),
  descuentoId: null as number | null,
  origen:      null as 'dateo' | 'caja' | null,
  asesorId:    null as number | null,
  autorizador: '',
})

const origenItems = [
  { label: '🗓️ Pre-marcado en dateo', value: 'dateo' },
  { label: '🏧 Aplicado en caja',     value: 'caja'  },
]

/* ── Headers tabla ── */
const headers = [
  { title: 'Fecha',          key: 'confirmado_at',           sortable: false },
  { title: 'Placa / Turno',  key: 'placa',                   sortable: false },
  { title: 'Descuento',      key: 'descuento',               sortable: false },
  { title: 'Origen',         key: 'origen',                  sortable: false },
  { title: 'Comercial',      key: 'comercial',               sortable: false },
  { title: 'Cajero',         key: 'cajero',                  sortable: false },
  { title: 'Autorizado por', key: 'autorizado_por',          sortable: false },
  { title: 'Monto desc.',    key: 'descuento_monto_aplicado', sortable: false },
  { title: '',               key: 'acciones',                sortable: false, align: 'end' as const },
]

/* ── Helpers ── */
function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(d)
}

function conteoOrigen(origen: 'dateo' | 'caja') {
  return rows.value.filter(r => r.origen === origen).length
}

/* ── Carga catálogos ── */
async function loadCatalogos() {
  catalogLoading.value = true
  try {
    const [descs, asesores] = await Promise.all([
      get<{ success: boolean; data: { id: number; codigo: string; nombre: string }[] }>(
        '/api/descuentos/activos',
        { credentials: 'include', headers: { Accept: 'application/json' } }
      ),
      listAgentesCaptacion(),
    ])
    descuentosItems.value = Array.isArray(descs.data) ? descs.data : []
    asesoresItems.value   = asesores
  } catch (err) {
    console.error('Error cargando catálogos:', err)
  } finally {
    catalogLoading.value = false
  }
}

/* ── Carga datos ── */
async function loadHistorial() {
  loading.value = true
  try {
    const params: Record<string, string> = {
      fecha_desde: filters.value.fechaDesde || hoy(),
      fecha_hasta: filters.value.fechaHasta || hoy(),
      page:        String(page.value),
      per_page:    String(itemsPerPage.value),
    }
    if (filters.value.descuentoId) params.descuento_id = String(filters.value.descuentoId)
    if (filters.value.origen)      params.origen       = filters.value.origen
    if (filters.value.asesorId)    params.asesor_id    = String(filters.value.asesorId)

    const qs  = new URLSearchParams(params).toString()
    const res = await get<{ success: boolean; meta: HistorialMeta; data: HistorialRow[] }>(
      `/api/descuentos/historial?${qs}`,
      { credentials: 'include', headers: { Accept: 'application/json' } }
    )

    let data = res.data ?? []

    // Filtro local de autorizador (el backend no filtra texto libre)
    if (filters.value.autorizador.trim()) {
      const q = filters.value.autorizador.trim().toLowerCase()
      data = data.filter(r =>
        r.autorizado_por?.nombre?.toLowerCase().includes(q)
      )
    }

    rows.value       = data
    totalItems.value = res.meta?.total ?? data.length
  } catch (err) {
    console.error('Error cargando historial:', err)
    rows.value       = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadHistorial()
}

function resetFilters() {
  filters.value = {
    fechaDesde:  hoy(),
    fechaHasta:  hoy(),
    descuentoId: null,
    origen:      null,
    asesorId:    null,
    autorizador: '',
  }
  reload()
}

function onTableOptions(opts: { page: number; itemsPerPage: number }) {
  page.value         = opts.page
  itemsPerPage.value = opts.itemsPerPage
  loadHistorial()
}

/* ── Modal detalle ── */
const detailDialog = ref<{ visible: boolean; item: HistorialRow | null }>({
  visible: false,
  item:    null,
})

function verDetalle(item: HistorialRow) {
  detailDialog.value = { visible: true, item }
}

/* ── Init ── */
onMounted(() => {
  loadCatalogos()
  loadHistorial()
})
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
