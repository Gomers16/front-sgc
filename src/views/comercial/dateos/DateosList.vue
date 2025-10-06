<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">🗒️ Dateos</div>
        <div class="d-flex gap-2 flex-wrap">
          <v-text-field v-model="filters.placa" label="Placa" variant="outlined" density="comfortable" hide-details clearable style="min-width: 130px" />
          <v-text-field v-model="filters.telefono" label="Teléfono" variant="outlined" density="comfortable" hide-details clearable style="min-width: 160px" />

          <v-select
            v-model="filters.canal"
            :items="canalItems"
            label="Canal"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 160px"
          />

          <v-autocomplete
            v-model="filters.agenteId"
            :items="agentesVisibles"
            item-title="nombre"
            item-value="id"
            :label="filters.canal === 'CONVENIO' ? 'Convenio' : 'Agente / Convenio'"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            :loading="asesoresLoading"
            style="min-width: 260px"
          >
            <!-- item -->
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="item?.raw?.nombre">
                <template #append>
                  <v-chip size="x-small" variant="flat">{{ mapTipo(item?.raw?.tipo) }}</v-chip>
                </template>
              </v-list-item>
            </template>
            <!-- selected -->
            <template #selection="{ item }">
              <div class="d-flex align-center gap-1">
                <span>{{ item?.raw?.nombre }}</span>
                <v-chip size="x-small" variant="flat">{{ mapTipo(item?.raw?.tipo) }}</v-chip>
              </div>
            </template>
          </v-autocomplete>

          <v-select
            v-model="filters.resultado"
            :items="resultadoItems"
            label="Resultado"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 170px"
          />

          <v-text-field v-model="filters.desde" type="date" label="Desde" variant="outlined" density="comfortable" hide-details style="min-width: 150px" />
          <v-text-field v-model="filters.hasta" type="date" label="Hasta" variant="outlined" density="comfortable" hide-details style="min-width: 150px" />

          <v-btn color="primary" :loading="loading" @click="reload">Aplicar</v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetFilters">Limpiar</v-btn>
          <v-btn color="secondary" @click="irCrear" prepend-icon="mdi-plus">Nuevo</v-btn>
        </div>
      </v-card-title>

      <v-expand-transition>
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mx-6 mb-3"
          density="comfortable"
        >
          {{ errorMsg }}
        </v-alert>
      </v-expand-transition>

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
        <template #item.canal="{ item }">
          <v-chip size="small" variant="flat">{{ canalMostrado(item) }}</v-chip>
        </template>

        <template #item.agente="{ item }">
          <div class="d-flex align-center gap-1">
            <span>{{ item.agente?.nombre || '—' }}</span>
            <v-chip v-if="item.agente?.tipo" size="x-small" variant="flat">
              {{ mapTipo(item.agente.tipo) }}
            </v-chip>
          </div>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>

        <template #item.resultado="{ item }">
          <v-chip
            v-if="item.resultado && item.resultado !== 'PENDIENTE'"
            :color="item.resultado === 'EXITOSO' ? 'success' : 'error'"
            size="small"
            variant="flat"
          >
            {{ item.resultado }}
          </v-chip>
          <span v-else class="text-medium-emphasis">PENDIENTE</span>
        </template>

        <template #item.consumido_turno_id="{ item }">
          <span class="text-medium-emphasis">{{ item.consumido_turno_id || '—' }}</span>
        </template>

        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="verDetalle(item.id)" />
            <v-btn size="small" variant="text" icon="mdi-clipboard-check" color="success" @click="marcarResultado(item.id, 'EXITOSO')" />
            <v-btn size="small" variant="text" icon="mdi-clipboard-remove" color="error" @click="marcarResultado(item.id, 'NO_EXITOSO')" />
            <v-btn size="small" variant="text" icon="mdi-clipboard-text-clock" @click="marcarResultado(item.id, 'PENDIENTE')" />
            <v-btn size="small" variant="text" icon="mdi-link-variant" @click="openVincularTurno(item.id)" />
            <v-btn size="small" variant="text" icon="mdi-delete" color="error" @click="confirmEliminar(item.id)" />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Vincular turno -->
    <v-dialog v-model="dlgTurno.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">Vincular turno al dateo</v-card-title>
        <v-card-text>
          <v-text-field v-model.number="dlgTurno.turnoId" label="ID del turno" type="number" variant="outlined" hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgTurno.visible = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="dlgTurno.loading" @click="confirmVincular">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Eliminar -->
    <v-dialog v-model="dlgEliminar.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">Eliminar dateo</v-card-title>
        <v-card-text>¿Seguro que deseas eliminar este dateo?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgEliminar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgEliminar.loading" @click="doEliminar">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  listDateos,
  updateDateo,
  deleteDateo,
  listAgentesCaptacion,
  formatDateTime,
  type Dateo,
  type ResultadoDateo,
  type CanalCaptacion,
} from '@/services/dateosService'

const router = useRouter()

/* Filtros */
const filters = ref<{
  placa: string
  telefono: string
  canal: CanalCaptacion | '' | 'CONVENIO'
  agenteId: number | null
  resultado: ResultadoDateo | ''
  desde: string
  hasta: string
}>({
  placa: '',
  telefono: '',
  canal: '',
  agenteId: null,
  resultado: '',
  desde: '',
  hasta: '',
})

/** Canales: añadimos CONVENIO para la UI */
const canalItems: { title: string; value: CanalCaptacion | 'CONVENIO' }[] = [
  { title: 'Fachada', value: 'FACHADA' },
  { title: 'Asesor', value: 'ASESOR' },
  { title: 'Telemercadeo', value: 'TELE' },
  { title: 'Redes/Ads', value: 'REDES' },
  { title: 'Convenio', value: 'CONVENIO' },
]

const resultadoItems: { title: string; value: ResultadoDateo }[] = [
  { title: 'Exitoso', value: 'EXITOSO' },
  { title: 'No exitoso', value: 'NO_EXITOSO' },
]

/* Tabla */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Canal', key: 'canal', sortable: true },
  { title: 'Agente', key: 'agente', sortable: false },
  { title: 'Placa', key: 'placa', sortable: true },
  { title: 'Teléfono', key: 'telefono', sortable: true },
  { title: 'Creado', key: 'created_at', sortable: true },
  { title: 'Resultado', key: 'resultado', sortable: true },
  { title: 'Turno', key: 'consumido_turno_id', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' },
]
const rows = ref<Dateo[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<any>([{ key: 'id', order: 'desc' }])
const loading = ref(false)
const errorMsg = ref<string | null>(null)

/* Catálogo asesores (incluye ASESOR_INTERNO, TELEMERCADEO, CONVENIO, ASESOR_EXTERNO) */
const asesoresItems = ref<{ id: number; nombre: string; tipo: 'ASESOR_INTERNO' | 'TELEMERCADEO' | 'CONVENIO' | 'ASESOR_EXTERNO' }[]>([])
const asesoresLoading = ref(false)

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

/** Mapeo de tipo para UI (ocultar “externo”) */
function mapTipo(t?: string) {
  if (t === 'ASESOR_INTERNO') return 'Asesor'
  if (t === 'TELEMERCADEO') return 'Tele'
  if (t === 'CONVENIO' || t === 'ASESOR_EXTERNO') return 'Convenio'
  return t || '—'
}

/** ¿Este row es de convenio? (incluye los antiguos externos) */
function esConvenioRow(row: any) {
  const tipo = row?.agente?.tipo
  return tipo === 'CONVENIO' || tipo === 'ASESOR_EXTERNO'
}

/** Canal mostrado en UI */
function canalMostrado(row: any) {
  // Si el agente es convenio/externo → mostrar "CONVENIO"
  if (esConvenioRow(row)) return 'CONVENIO'
  return row?.canal || '—'
}

/** Filtrado dinámico del combo según canal */
const agentesVisibles = computed(() => {
  const canal = filters.value.canal
  if (canal === 'ASESOR') {
    return asesoresItems.value.filter(a => a.tipo === 'ASESOR_INTERNO')
  }
  if (canal === 'TELE') {
    return asesoresItems.value.filter(a => a.tipo === 'TELEMERCADEO')
  }
  if (canal === 'CONVENIO') {
    // considerar también ASESOR_EXTERNO como convenio para UI
    return asesoresItems.value.filter(a => a.tipo === 'CONVENIO' || a.tipo === 'ASESOR_EXTERNO')
  }
  return asesoresItems.value
})

/** Si cambia el canal y el agente ya no aplica, lo limpiamos */
watch(() => filters.value.canal, () => {
  if (!filters.value.agenteId) return
  const stillValid = agentesVisibles.value.some(a => a.id === filters.value.agenteId)
  if (!stillValid) filters.value.agenteId = null
})

/* CRUD */
async function loadItems() {
  loading.value = true
  errorMsg.value = null
  try {
    const sort = Array.isArray(sortBy.value) && sortBy.value[0] ? sortBy.value[0] : { key: 'id', order: 'desc' }

    // Si filtran por “CONVENIO”, intentamos mandar un hint al backend (si no lo soporta, lo ignorará)
    const canalParam = filters.value.canal === 'CONVENIO' ? undefined : (filters.value.canal as any) || undefined
    const agenteTipoParam = filters.value.canal === 'CONVENIO' ? 'CONVENIO' : undefined

    const res = await listDateos({
      page: page.value,
      perPage: itemsPerPage.value,
      placa: filters.value.placa || undefined,
      telefono: filters.value.telefono || undefined,
      canal: canalParam,
      agenteId: filters.value.agenteId || undefined,
      agenteTipo: agenteTipoParam,   // ← opcional para tu API; si no existe, lo ignoras en backend
      resultado: (filters.value.resultado as any) || undefined,
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
      sortBy: sort.key,
      order: sort.order,
    })

    let data = res.data as Dateo[]

    // Post-filtro en cliente por si tu API no soporta agenteTipo
    if (filters.value.canal === 'CONVENIO') {
      data = data.filter(r => esConvenioRow(r))
    }

    rows.value = data
    totalItems.value = Number(res.total || data.length || 0)
  } catch (e: any) {
    rows.value = []
    totalItems.value = 0
    errorMsg.value = e?.message || 'No fue posible cargar los dateos'
  } finally {
    loading.value = false
  }
}
function reload() { page.value = 1; loadItems() }
function resetFilters() {
  filters.value = { placa: '', telefono: '', canal: '', agenteId: null, resultado: '', desde: '', hasta: '' }
  reload()
}

/* Acciones */
function irCrear() { router.push({ name: 'ComercialDateosNuevo' }) }
function verDetalle(id: number) { router.push({ name: 'ComercialDateoDetalle', params: { id } }) }

async function marcarResultado(id: number, resultado: ResultadoDateo) {
  try {
    await updateDateo(id, { resultado })
    loadItems()
  } catch {
    errorMsg.value = 'No se pudo actualizar el resultado'
  }
}

const dlgTurno = ref<{ visible: boolean; id: number | null; turnoId: number | null; loading: boolean }>({
  visible: false, id: null, turnoId: null, loading: false,
})
function openVincularTurno(id: number) {
  dlgTurno.value = { visible: true, id, turnoId: null, loading: false }
}
async function confirmVincular() {
  if (!dlgTurno.value.id) return
  dlgTurno.value.loading = true
  try {
    await updateDateo(dlgTurno.value.id, { consumido_turno_id: dlgTurno.value.turnoId || null })
    dlgTurno.value.visible = false
    loadItems()
  } catch {
    errorMsg.value = 'No se pudo vincular el turno'
  } finally {
    dlgTurno.value.loading = false
  }
}

const dlgEliminar = ref<{ visible: boolean; id: number | null; loading: boolean }>({
  visible: false, id: null, loading: false,
})
function confirmEliminar(id: number) {
  dlgEliminar.value = { visible: true, id, loading: false }
}
async function doEliminar() {
  if (!dlgEliminar.value.id) return
  dlgEliminar.value.loading = true
  try {
    await deleteDateo(dlgEliminar.value.id)
    dlgEliminar.value.visible = false
    loadItems()
  } catch {
    errorMsg.value = 'No se pudo eliminar el dateo'
  } finally {
    dlgEliminar.value.loading = false
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
