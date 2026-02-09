<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">👥 Clientes</div>

        <!-- 🔎 Filtros CON AUTO-MAYÚSCULAS -->
        <div class="d-flex gap-2 flex-wrap">
          <v-text-field
            v-model="q"
            label="🔍 Buscar por nombre, teléfono, documento o PLACA"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 400px"
            class="text-uppercase-input"
            @input="toUpperCase"
            @keyup.enter="reload"
          >
            <template #prepend-inner>
              <v-icon size="small" color="primary">mdi-magnify</v-icon>
            </template>
          </v-text-field>
          <v-btn color="primary" :loading="loading" @click="reload">
            <v-icon left>mdi-magnify</v-icon>
            Buscar
          </v-btn>
          <v-btn variant="text" :disabled="loading" @click="clear">Limpiar</v-btn>
        </div>
      </v-card-title>

      <!-- 💡 Hint de búsqueda -->
      <v-card-subtitle v-if="q" class="pb-0">
        <v-chip size="small" color="primary" variant="tonal" prepend-icon="mdi-information">
          Buscando "{{ q }}" en nombre, teléfono, documento y placas de vehículos
        </v-chip>
      </v-card-subtitle>

      <!-- 📋 Tabla -->
      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        :sort-by="sortBy"
        @update:options="onUpdateOptions"
        item-value="id"
      >
        <template #item.nombre="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.nombre || '—' }}</span>
            <small class="text-medium-emphasis">ID: {{ item.id }}</small>
          </div>
        </template>

        <template #item.documento="{ item }">
          <span v-if="item.docTipo && item.docNumero">{{ item.docTipo }} {{ item.docNumero }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.telefono="{ item }">
          <span>{{ item.telefono }}</span>
        </template>

        <template #item.email="{ item }">
          <span>{{ item.email || '—' }}</span>
        </template>

        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              size="small"
              variant="text"
              icon="mdi-eye"
              color="primary"
              @click="verDetalle(item.id)"
            >
              <v-icon>mdi-eye</v-icon>
              <v-tooltip activator="parent">Ver detalle</v-tooltip>
            </v-btn>
          </div>
        </template>

        <!-- Sin resultados -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-account-search</v-icon>
            <p class="text-h6 mt-4 text-grey">
              {{ q ? 'No se encontraron clientes' : 'No hay clientes registrados' }}
            </p>
            <p v-if="q" class="text-grey">
              Intenta buscar por <strong>nombre, teléfono, documento o placa</strong>
            </p>
          </div>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ClientesService } from '@/services/clientes_service'

const router = useRouter()

/* =========================
   Interfaces
========================= */
interface Cliente {
  id: number
  nombre: string
  docTipo?: string
  docNumero?: string
  telefono: string
  email?: string
}

interface DataTableOptions {
  page?: number
  itemsPerPage?: number
  sortBy?: Array<{ key: string; order: 'asc' | 'desc' }>
}

interface PaginatedResponse {
  data: Cliente[]
  meta?: {
    total: number
  }
  total?: number
}

/* =========================
   Tabla
========================= */
const headers = [
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Documento', key: 'documento', sortable: false },
  { title: 'Teléfono', key: 'telefono', sortable: true },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const rows = ref<Cliente[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([{ key: 'id', order: 'asc' }])
const loading = ref(false)

/* =========================
   Filtros CON AUTO-MAYÚSCULAS
========================= */
const q = ref('')

// 🔥 Convertir a mayúsculas mientras escribes
function toUpperCase() {
  q.value = q.value.toUpperCase()
}

function onUpdateOptions(opts: DataTableOptions) {
  if (opts?.page !== undefined) page.value = opts.page
  if (opts?.itemsPerPage !== undefined) itemsPerPage.value = opts.itemsPerPage
  if (opts?.sortBy !== undefined) sortBy.value = opts.sortBy
  loadItems()
}

async function loadItems() {
  loading.value = true
  try {
    const res = (await ClientesService.list({
      page: page.value,
      perPage: itemsPerPage.value,
      q: q.value || undefined,
    })) as PaginatedResponse

    // Adonis paginate → { data, meta }
    const data = res?.data ?? []
    const total = res?.meta?.total ?? res?.total ?? (Array.isArray(data) ? data.length : 0)

    rows.value = data
    totalItems.value = total
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadItems()
}

function clear() {
  q.value = ''
  reload()
}

function verDetalle(id: number) {
  router.push({ name: 'ClienteDetalle', params: { id } }).catch(() => {})
}

/* init */
loadItems()
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.text-medium-emphasis {
  opacity: 0.7;
}

/* 🔥 Forzar mayúsculas visualmente */
.text-uppercase-input :deep(input) {
  text-transform: uppercase !important;
}
</style>
