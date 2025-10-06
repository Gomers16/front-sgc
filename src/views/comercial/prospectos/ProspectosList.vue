<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">👤 Prospectos</div>
        <div class="d-flex gap-2 flex-wrap">
          <v-text-field v-model="filters.placa" label="Placa" variant="outlined" density="comfortable" hide-details clearable style="min-width: 130px" />
          <v-text-field v-model="filters.telefono" label="Teléfono" variant="outlined" density="comfortable" hide-details clearable style="min-width: 160px" />
          <v-text-field v-model="filters.nombre" label="Nombre" variant="outlined" density="comfortable" hide-details clearable style="min-width: 200px" />

          <v-autocomplete
            v-model="filters.convenioId"
            :items="conveniosItems"
            item-title="nombre"
            item-value="id"
            label="Convenio"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            :loading="conveniosLoading"
            style="min-width: 220px"
          />

          <v-autocomplete
            v-model="filters.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor (asignado)"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            :loading="asesoresLoading"
            style="min-width: 220px"
          />

          <v-select
            v-model="filters.vigente"
            :items="vigenteItems"
            label="Asignación activa"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 180px"
          />

          <v-text-field v-model="filters.desde" type="date" label="Desde" variant="outlined" density="comfortable" hide-details style="min-width: 150px" />
          <v-text-field v-model="filters.hasta" type="date" label="Hasta" variant="outlined" density="comfortable" hide-details style="min-width: 150px" />

          <v-btn color="primary" :loading="loading" @click="reload">Aplicar</v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetFilters">Limpiar</v-btn>
          <v-btn color="secondary" prepend-icon="mdi-plus" @click="irCrear">Nuevo</v-btn>
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
        <template #item.soat="{ item }">
          <v-chip :color="item.soat_vigente ? 'success' : 'error'" size="small" variant="flat">
            {{ item.soat_vigente ? 'Vigente' : 'Vencido' }}
          </v-chip>
          <span class="text-caption text-medium-emphasis ms-2">{{ formatDate(item.soat_vencimiento) }}</span>
        </template>

        <template #item.tecno="{ item }">
          <v-chip :color="item.tecno_vigente ? 'success' : 'error'" size="small" variant="flat">
            {{ item.tecno_vigente ? 'Vigente' : 'Vencido' }}
          </v-chip>
          <span class="text-caption text-medium-emphasis ms-2">{{ formatDate(item.tecno_vencimiento) }}</span>
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

    <!-- Asignar -->
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

    <!-- Retirar -->
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
  listProspectos,
  asignarAsesor,
  retirarAsesor,
  listAgentesCaptacion,
  listConveniosLight,
  formatDate,
  type Prospecto,
} from '@/services/prospectosService'

const router = useRouter()

/* Filtros */
const filters = ref<{
  placa: string
  telefono: string
  nombre: string
  convenioId: number | null
  asesorId: number | null
  vigente: '' | 0 | 1 | boolean
  desde: string
  hasta: string
}>({
  placa: '',
  telefono: '',
  nombre: '',
  convenioId: null,
  asesorId: null,
  vigente: '',
  desde: '',
  hasta: '',
})

const vigenteItems = [
  { title: 'Con asignación activa', value: 1 },
  { title: 'Sin asignación activa', value: 0 },
]

/* Tabla */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Teléfono', key: 'telefono', sortable: true },
  { title: 'Placa', key: 'placa', sortable: true },
  { title: 'SOAT', key: 'soat', sortable: false },
  { title: 'Tecno', key: 'tecno', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' },
]
const rows = ref<Prospecto[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<any>([{ key: 'id', order: 'desc' }])
const loading = ref(false)

/* Catálogos */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)
const conveniosItems = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)

async function loadAsesores() {
  asesoresLoading.value = true
  try { asesoresItems.value = await listAgentesCaptacion() } finally { asesoresLoading.value = false }
}
async function loadConvenios() {
  conveniosLoading.value = true
  try { conveniosItems.value = await listConveniosLight() } finally { conveniosLoading.value = false }
}

/* CRUD */
async function loadItems() {
  loading.value = true
  try {
    const sort = Array.isArray(sortBy.value) && sortBy.value[0] ? sortBy.value[0] : { key: 'id', order: 'desc' }
    const res = await listProspectos({
      page: page.value,
      perPage: itemsPerPage.value,
      placa: filters.value.placa || undefined,
      telefono: filters.value.telefono || undefined,
      nombre: filters.value.nombre || undefined,
      convenioId: filters.value.convenioId || undefined,
      asesorId: filters.value.asesorId || undefined,
      vigente: filters.value.vigente === '' ? undefined : filters.value.vigente,
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
      sortBy: sort.key,
      order: sort.order,
    })
    rows.value = res.data
    totalItems.value = res.total
  } finally { loading.value = false }
}

function reload() { page.value = 1; loadItems() }
function resetFilters() {
  filters.value = { placa: '', telefono: '', nombre: '', convenioId: null, asesorId: null, vigente: '', desde: '', hasta: '' }
  reload()
}

/* Acciones / navegación */
function irCrear() {
  // Ajusta al nombre real de tu ruta de creación
  router.push({ name: 'comercial.prospectos.new' }).catch(() => {})
}
function verDetalle(id: number) {
  // Ajusta al nombre real de tu ruta de detalle
  router.push({ name: 'comercial.prospectos.detail', params: { id } }).catch(() => {})
}

/* Diálogos */
const dlgAsignar = ref<{ visible: boolean; id: number | null; asesorId: number | null; loading: boolean }>({
  visible: false, id: null, asesorId: null, loading: false,
})
function openAsignar(id: number) {
  dlgAsignar.value = { visible: true, id, asesorId: null, loading: false }
  if (!asesoresItems.value.length) loadAsesores()
}
async function confirmAsignar() {
  if (!dlgAsignar.value.id || !dlgAsignar.value.asesorId) return
  dlgAsignar.value.loading = true
  try {
    await asignarAsesor(dlgAsignar.value.id, { asesor_id: dlgAsignar.value.asesorId })
    dlgAsignar.value.visible = false
    loadItems()
  } finally { dlgAsignar.value.loading = false }
}

const dlgRetirar = ref<{ visible: boolean; id: number | null; motivo: string; loading: boolean }>({
  visible: false, id: null, motivo: '', loading: false,
})
function openRetirar(id: number) {
  dlgRetirar.value = { visible: true, id, motivo: '', loading: false }
}
async function confirmRetirar() {
  if (!dlgRetirar.value.id) return
  dlgRetirar.value.loading = true
  try {
    await retirarAsesor(dlgRetirar.value.id, { motivo: dlgRetirar.value.motivo || undefined })
    dlgRetirar.value.visible = false
    loadItems()
  } finally { dlgRetirar.value.loading = false }
}

/* Init */
loadAsesores()
loadConvenios()
loadItems()
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
