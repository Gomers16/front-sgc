<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-5">
        <div class="text-h5 font-weight-bold">🤝 Convenios</div>

        <div class="d-flex gap-2 flex-wrap">
          <v-text-field
            v-model="filters.texto"
            label="Buscar por nombre"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 280px"
          />

          <v-select
            v-model="filters.activo"
            :items="estadoItems"
            item-title="label"
            item-value="value"
            label="Estado"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 160px"
          />

          <v-btn color="primary" :loading="loading" @click="reload">Aplicar</v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetFilters">Limpiar</v-btn>
        </div>
      </v-card-title>

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
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="flat">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <template #item.vigencia="{ item }">
          {{ fmtDate(item.vigencia_desde) }} – {{ fmtDate(item.vigencia_hasta) }}
        </template>

        <template #item.asesor="{ item }">
          <span class="text-medium-emphasis" v-if="!asesorActivoMap[item.id]">—</span>
          <span v-else>{{ asesorActivoMap[item.id]?.asesor?.nombre }}</span>
        </template>

        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="verDetalle(item.id)" />
            <v-btn size="small" variant="text" icon="mdi-account-plus" @click="openAsignar(item.id)" />
            <v-btn size="small" variant="text" icon="mdi-account-remove" color="error" @click="openRetirar(item.id)" />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Asignar asesor -->
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

    <!-- Retirar asesor -->
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  listConvenios,
  getAsesorActivo,
  asignarAsesorConvenio,
  retirarAsesorConvenio,
  listAgentesCaptacion,
} from '@/services/conveniosService'

/** Tipos lightweight para no depender de exports opcionales del service */
type ConvenioLite = {
  id: number
  nombre: string
  activo: boolean | 0 | 1
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
}
type AsesorActivoLite = {
  asesor?: { id: number; nombre: string; tipo?: string } | null
  convenio_id?: number
  activo?: boolean
}

const router = useRouter()

/* Filtros */
const filters = ref<{ texto: string; activo: '' | 0 | 1 | boolean }>({
  texto: '',
  activo: '',
})
const estadoItems = [
  { label: 'Activos', value: 1 },
  { label: 'Inactivos', value: 0 },
]

/* Tabla */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Vigencia', key: 'vigencia', sortable: false },
  { title: 'Asesor activo', key: 'asesor', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' },
]
const rows = ref<ConvenioLite[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<any>([{ key: 'id', order: 'desc' }])
const loading = ref(false)

/* Asesor activo cache por convenioId */
const asesorActivoMap = ref<Record<number, AsesorActivoLite>>({})

/* Catálogo asesores */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

/* Helpers UI */
function fmtDate(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  try {
    return d.toLocaleDateString()
  } catch {
    return s
  }
}

/* Data */
async function loadItems() {
  loading.value = true
  try {
    const sort = Array.isArray(sortBy.value) && sortBy.value[0] ? sortBy.value[0] : { key: 'id', order: 'desc' }
    const res = await listConvenios({
      page: page.value,
      perPage: itemsPerPage.value,
      texto: filters.value.texto || undefined,
      activo: filters.value.activo === '' ? undefined : filters.value.activo,
      sortBy: sort.key,
      order: sort.order,
    })

    rows.value = res.data as ConvenioLite[]
    totalItems.value = Number(res.total || 0)

    // Cargar asesor activo por convenio (lazy, tolerante a errores)
    asesorActivoMap.value = {}
    for (const c of rows.value) {
      try {
        const info = await getAsesorActivo(c.id)
        asesorActivoMap.value[c.id] = info as AsesorActivoLite
      } catch {
        // ignora fallos individuales
      }
    }
  } finally {
    loading.value = false
  }
}

function reload() { page.value = 1; loadItems() }
function resetFilters() { filters.value = { texto: '', activo: '' }; reload() }
function verDetalle(id: number) { router.push({ name: 'comercial.convenios.detail', params: { id } }) }

/* Dialog Asignar */
const dlgAsignar = ref<{ visible: boolean; convenioId: number | null; asesorId: number | null; loading: boolean }>({
  visible: false, convenioId: null, asesorId: null, loading: false,
})
function openAsignar(convenioId: number) {
  dlgAsignar.value = { visible: true, convenioId, asesorId: null, loading: false }
  if (!asesoresItems.value.length) loadAsesores()
}
async function confirmAsignar() {
  if (!dlgAsignar.value.convenioId || !dlgAsignar.value.asesorId) return
  dlgAsignar.value.loading = true
  try {
    await asignarAsesorConvenio(dlgAsignar.value.convenioId, { asesor_id: dlgAsignar.value.asesorId })
    const info = await getAsesorActivo(dlgAsignar.value.convenioId)
    asesorActivoMap.value[dlgAsignar.value.convenioId] = info as AsesorActivoLite
    dlgAsignar.value.visible = false
  } finally {
    dlgAsignar.value.loading = false
  }
}

/* Dialog Retirar */
const dlgRetirar = ref<{ visible: boolean; convenioId: number | null; motivo: string; loading: boolean }>({
  visible: false, convenioId: null, motivo: '', loading: false,
})
function openRetirar(convenioId: number) {
  dlgRetirar.value = { visible: true, convenioId, motivo: '', loading: false }
}
async function confirmRetirar() {
  if (!dlgRetirar.value.convenioId) return
  dlgRetirar.value.loading = true
  try {
    await retirarAsesorConvenio(dlgRetirar.value.convenioId, { motivo: dlgRetirar.value.motivo || undefined })
    const info = await getAsesorActivo(dlgRetirar.value.convenioId)
    asesorActivoMap.value[dlgRetirar.value.convenioId] = info as AsesorActivoLite
    dlgRetirar.value.visible = false
  } finally {
    dlgRetirar.value.loading = false
  }
}

/* Init */
loadAsesores()
loadItems()
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
