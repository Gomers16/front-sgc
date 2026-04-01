<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">

      <!-- ── CABECERA ── -->
      <v-card-title class="py-5 px-6 d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="text-h5 font-weight-bold d-flex align-center gap-2">
          🧾 Comprobantes de pago
        </div>
        <div class="d-flex gap-2">
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-filter-variant"
            @click="showFilters = !showFilters"
          >
            Filtros
            <v-badge
              v-if="activeFiltersCount > 0"
              :content="activeFiltersCount"
              color="primary"
              inline
            />
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="cargar"
          >
            Actualizar
          </v-btn>
        </div>
      </v-card-title>

      <!-- ── FILTROS ── -->
      <v-expand-transition>
        <div v-show="showFilters">
          <v-divider />
          <v-card-text class="pt-4 pb-2 px-6">
            <v-row dense>
              <v-col cols="12" sm="6" md="2">
                <v-text-field
                  v-model="filters.numero"
                  label="N° comprobante"
                  type="number"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                  prepend-inner-icon="mdi-pound"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="filters.q"
                  label="Placa / Beneficiario"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  @keyup.enter="applyFilters"
                />
              </v-col>
              <v-col cols="12" sm="6" md="2">
                <v-text-field
                  v-model="filters.desde"
                  label="Desde"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="2">
                <v-text-field
                  v-model="filters.hasta"
                  label="Hasta"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="3" class="d-flex align-center gap-2">
                <v-btn color="primary" size="small" :loading="loading" @click="applyFilters">
                  Buscar
                </v-btn>
                <v-btn variant="text" size="small" @click="limpiarFiltros">
                  Limpiar
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </div>
      </v-expand-transition>

      <v-divider />

      <!-- ── TABLA ── -->
      <v-card-text class="pa-0">
        <v-data-table-server
          :headers="headers"
          :items="items"
          :items-length="total"
          v-model:page="page"
          v-model:items-per-page="perPage"
          :loading="loading"
          @update:options="cargar"
          item-value="id"
          class="rounded-0"
        >
          <!-- Número -->
          <template #item.numero="{ item }">
            <v-chip color="primary" size="small" variant="flat">
              #{{ item.numero }}
            </v-chip>
          </template>

          <!-- Beneficiario -->
          <template #item.beneficiario_nombre="{ item }">
            <div class="d-flex flex-column">
              <span class="font-weight-medium">{{ item.beneficiario_nombre }}</span>
              <div class="d-flex align-center gap-1 mt-1">
                <v-chip
                  size="x-small"
                  :color="item.beneficiario_tipo === 'CONVENIO' ? 'primary' : 'teal'"
                  variant="tonal"
                >
                  {{ item.beneficiario_tipo }}
                </v-chip>
                <span v-if="item.medio_pago" class="text-caption text-medium-emphasis">
                  💳 {{ item.medio_pago }}
                </span>
              </div>
            </div>
          </template>

          <!-- Vehículos -->
          <template #item.vehiculos="{ item }">
            <div class="d-flex gap-2">
              <v-chip
                v-if="item.total_motos > 0"
                size="x-small"
                color="deep-purple"
                variant="tonal"
              >
                🏍️ {{ item.total_motos }}
              </v-chip>
              <v-chip
                v-if="item.total_vehiculos > 0"
                size="x-small"
                color="teal"
                variant="tonal"
              >
                🚗 {{ item.total_vehiculos }}
              </v-chip>
            </div>
          </template>

          <!-- Total -->
          <template #item.total_general="{ item }">
            <span class="font-weight-bold text-success">
              {{ formatCOP(item.total_general) }}
            </span>
          </template>

          <!-- Período -->
          <template #item.periodo="{ item }">
            <span v-if="item.periodo_desde || item.periodo_hasta" class="text-caption">
              {{ item.periodo_desde || '—' }} → {{ item.periodo_hasta || '—' }}
            </span>
            <span v-else class="text-caption text-medium-emphasis">Sin período</span>
          </template>

          <!-- Evidencia -->
          <template #item.evidencia="{ item }">
            <v-icon
              v-if="item.evidencia_url"
              color="success"
              size="20"
              title="Tiene evidencia adjunta"
            >
              mdi-paperclip-check
            </v-icon>
            <v-icon
              v-else
              color="grey-lighten-1"
              size="20"
              title="Sin evidencia"
            >
              mdi-paperclip-off
            </v-icon>
          </template>

          <!-- Fecha -->
          <template #item.created_at="{ item }">
            <span class="text-caption">{{ formatDate(item.created_at) }}</span>
          </template>

          <!-- Acciones -->
          <template #item.acciones="{ item }">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              icon="mdi-eye"
              :to="{ name: 'ComercialComprobanteDetalle', params: { id: item.id } }"
            />
          </template>

          <!-- Sin datos -->
          <template #no-data>
            <div class="text-center py-10 text-medium-emphasis">
              <v-icon size="48" class="mb-3">mdi-file-document-outline</v-icon>
              <div class="text-body-1">No hay comprobantes registrados</div>
              <div class="text-caption mt-1">
                Genera comprobantes desde la vista de Comisiones
              </div>
            </div>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  listComprobantes,
  formatCOP,
  formatDate,
  type ComprobantePago,
} from '@/services/comprobantesService'

/* ── Estado ── */
const showFilters = ref(true)
const loading = ref(false)
const items = ref<ComprobantePago[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)

const filters = ref({
  q: '',
  numero: '',
  desde: '',
  hasta: '',
})

const activeFiltersCount = computed(() =>
  [filters.value.q, filters.value.numero, filters.value.desde, filters.value.hasta]
    .filter(Boolean).length
)

/* ── Headers ── */
const headers = [
  { title: 'N°', key: 'numero', sortable: false, width: '90px' },
  { title: 'Beneficiario', key: 'beneficiario_nombre', sortable: false },
  { title: 'Vehículos', key: 'vehiculos', sortable: false },
  { title: 'Total', key: 'total_general', sortable: false },
  { title: 'Período', key: 'periodo', sortable: false },
  { title: 'Evidencia', key: 'evidencia', sortable: false, align: 'center' as const },
  { title: 'Generado', key: 'created_at', sortable: false },
  { title: '', key: 'acciones', sortable: false, align: 'end' as const, width: '60px' },
]

/* ── Carga ── */
async function cargar() {
  loading.value = true
  try {
    const res = await listComprobantes({
      page: page.value,
      perPage: perPage.value,
      q: filters.value.q || undefined,
      numero: filters.value.numero ? Number(filters.value.numero) : undefined,
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
    })
    items.value = res.data
    total.value = res.total
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  cargar()
}

function limpiarFiltros() {
  filters.value = { q: '', numero: '', desde: '', hasta: '' }
  page.value = 1
  cargar()
}

onMounted(cargar)
</script>
