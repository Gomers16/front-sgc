<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">🗒️ Dateos</div>
        <div class="d-flex gap-2 flex-wrap">
          <v-text-field v-model="filters.placa" label="Placa" variant="outlined" density="comfortable" hide-details clearable style="min-width: 130px" />
          <v-text-field v-model="filters.telefono" label="Teléfono" variant="outlined" density="comfortable" hide-details clearable style="min-width: 160px" />

          <!-- Canal fijo ASESOR -->
          <v-select
            v-model="filters.canal"
            :items="canalItems"
            label="Canal"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 160px"
          />

          <v-autocomplete
            v-model="filters.agenteId"
            :items="agentesVisibles"
            item-title="nombre"
            item-value="id"
            label="Agente"
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
                  <v-chip size="x-small" variant="flat">{{ mapTipoCorto(item?.raw?.tipo) }}</v-chip>
                </template>
              </v-list-item>
            </template>
            <!-- selected -->
            <template #selection="{ item }">
              <div class="d-flex align-center gap-1">
                <span>{{ safe(item?.raw?.nombre) }}</span>
                <v-chip size="x-small" variant="flat">{{ mapTipoCorto(item?.raw?.tipo) }}</v-chip>
              </div>
            </template>
          </v-autocomplete>

          <!-- ✅ Filtro de Convenio -->
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
            style="min-width: 240px"
          />

          <v-select
            v-model="filters.resultado"
            :items="resultadoItems"
            label="Estado"
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
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mx-6 mb-3" density="comfortable">
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
        <!-- Foto -->
        <template #item.imagen_url="{ item }">
          <div class="d-flex items-center">
            <v-avatar v-if="item.imagen_url" size="42" class="evidence-thumb" @click="openViewer(item.imagen_url)">
              <v-img :src="item.imagen_url" alt="evidencia" cover />
            </v-avatar>
            <v-btn
              v-else
              icon="mdi-image-off"
              variant="text"
              size="small"
              class="text-medium-emphasis"
              :disabled="true"
              :ripple="false"
            />
          </div>
        </template>

        <!-- Canal fijo: ASESOR -->
        <template #item.canal>
          <v-chip size="small" variant="flat">ASESOR</v-chip>
        </template>

        <!-- Agente con tipo corto -->
        <template #item.agente="{ item }">
          <div class="d-flex align-center gap-1">
            <span>{{ safe(item.agente?.nombre) }}</span>
            <v-chip v-if="item.agente?.tipo" size="x-small" variant="flat">
              {{ mapTipoCorto(item.agente.tipo) }}
            </v-chip>
          </div>
        </template>

        <!-- ✅ Convenio -->
        <template #item.convenio="{ item }">
          <v-chip v-if="item.convenio?.nombre" size="small" variant="flat">
            {{ item.convenio.nombre }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Creado -->
        <template #item.created_at="{ item }">
          {{ item.created_at_fmt || formatDateTime(item.created_at) }}
        </template>

        <!-- Estado -->
        <template #item.resultado="{ item }">
          <v-chip
            :color="item.resultado === 'EXITOSO' ? 'success'
                    : item.resultado === 'NO_EXITOSO' ? 'error'
                    : item.resultado === 'EN_PROCESO' ? 'info'
                    : 'warning'"
            size="small"
            variant="flat"
          >
            {{
              item.resultado === 'EN_PROCESO' ? 'En proceso'
              : item.resultado === 'NO_EXITOSO' ? 'No exitoso'
              : item.resultado === 'PENDIENTE' ? 'Pendiente'
              : 'Exitoso'
            }}
          </v-chip>
        </template>

        <!-- Turno -->
        <template #item.consumido_turno_id="{ item }">
          <span class="text-medium-emphasis">{{ safe(item.consumido_turno_id) }}</span>
        </template>

        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="verDetalle(item.id)" />
            <v-btn size="small" variant="text" icon="mdi-progress-clock" color="info" @click="marcarResultado(item.id, 'EN_PROCESO')" />
            <v-btn size="small" variant="text" icon="mdi-clipboard-check" color="success" @click="marcarResultado(item.id, 'EXITOSO')" />
            <v-btn size="small" variant="text" icon="mdi-clipboard-remove" color="error" @click="marcarResultado(item.id, 'NO_EXITOSO')" />
            <v-btn size="small" variant="text" icon="mdi-clipboard-text-clock" @click="marcarResultado(item.id, 'PENDIENTE')" />
            <v-btn size="small" variant="text" icon="mdi-link-variant" @click="openVincularTurno(item.id)" />
            <v-btn size="small" variant="text" icon="mdi-delete" color="error" @click="confirmEliminar(item.id)" />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Visor de imagen -->
    <v-dialog v-model="viewer.visible" max-width="720">
      <v-card>
        <v-card-title class="text-h6">Evidencia</v-card-title>
        <v-card-text>
          <v-img v-if="viewer.url" :src="viewer.url" class="rounded" height="420" cover />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn v-if="viewer.url" variant="text" :href="viewer.url" target="_blank" prepend-icon="mdi-open-in-new">
            Abrir en pestaña
          </v-btn>
          <v-btn color="primary" @click="viewer.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  listDateos,
  updateDateo,
  deleteDateo,
  listAgentesCaptacion,
  listConveniosLight,
  formatDateTime,
  type Dateo,
  type ResultadoDateo,
} from '@/services/dateosService'

const router = useRouter()

/* Filtros */
const filters = ref<{
  placa: string
  telefono: string
  canal: 'ASESOR'
  agenteId: number | null
  convenioId: number | null
  resultado: ResultadoDateo | ''
  desde: string
  hasta: string
}>({
  placa: '',
  telefono: '',
  canal: 'ASESOR',
  agenteId: null,
  convenioId: null,
  resultado: '',
  desde: '',
  hasta: '',
})

const canalItems = [{ title: 'Asesor', value: 'ASESOR' as const }]

const resultadoItems: { title: string; value: ResultadoDateo }[] = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'En proceso', value: 'EN_PROCESO' },
  { title: 'Exitoso', value: 'EXITOSO' },
  { title: 'No exitoso', value: 'NO_EXITOSO' },
]

/* Tabla */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Foto', key: 'imagen_url', sortable: false },
  { title: 'Canal', key: 'canal', sortable: false },
  { title: 'Agente', key: 'agente', sortable: false },
  { title: 'Convenio', key: 'convenio', sortable: false },
  { title: 'Placa', key: 'placa', sortable: true },
  { title: 'Teléfono', key: 'telefono', sortable: true },
  { title: 'Creado', key: 'created_at', sortable: true },
  { title: 'Estado', key: 'resultado', sortable: true },
  { title: 'Turno', key: 'consumido_turno_id', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' },
]

const rows = ref<Dateo[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'id', order: 'desc' }])
const loading = ref(false)
const errorMsg = ref<string | null>(null)

/* Visor de imagen */
const viewer = ref<{ visible: boolean; url: string | null }>({ visible: false, url: null })
function openViewer(url: string) { viewer.value = { visible: true, url } }

/* Catálogo asesores */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)
async function loadAsesores() {
  asesoresLoading.value = true
  try { asesoresItems.value = await listAgentesCaptacion() }
  finally { asesoresLoading.value = false }
}

/* Catálogo convenios */
const conveniosItems = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)
async function loadConvenios() {
  conveniosLoading.value = true
  try { conveniosItems.value = await listConveniosLight() }
  finally { conveniosLoading.value = false }
}

/* Helpers */
function mapTipoCorto(t?: string) {
  const u = String(t || '').toUpperCase()
  if (u.includes('CONVENIO')) return 'Convenio'
  if (u.includes('COMERCIAL')) return 'Comercial'
  if (u.includes('TELE')) return 'Tele'
  return ''
}
function safe(val?: string | number | null) {
  return (val === null || val === undefined || val === '') ? '' : String(val)
}
const agentesVisibles = computed(() => asesoresItems.value)

/* CRUD */
async function loadItems() {
  loading.value = true
  errorMsg.value = null
  try {
    const sort = Array.isArray(sortBy.value) && sortBy.value[0] ? sortBy.value[0] : { key: 'id', order: 'desc' as const }
    const res = await listDateos({
      page: page.value,
      perPage: itemsPerPage.value,
      placa: filters.value.placa || undefined,
      telefono: filters.value.telefono || undefined,
      canal: 'ASESOR',
      agenteId: filters.value.agenteId || undefined,
      convenioId: filters.value.convenioId || undefined,
      resultado: (filters.value.resultado as ResultadoDateo) || undefined,
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
      sortBy: sort.key,
      order: sort.order,
    })
    rows.value = res.data as Dateo[]
    totalItems.value = Number(res.total || rows.value.length || 0)
  } catch (e) {
    rows.value = []
    totalItems.value = 0
    errorMsg.value = e instanceof Error ? e.message : 'No fue posible cargar los dateos'
  } finally {
    loading.value = false
  }
}

function reload() { page.value = 1; loadItems() }
function resetFilters() {
  filters.value = { placa: '', telefono: '', canal: 'ASESOR', agenteId: null, convenioId: null, resultado: '', desde: '', hasta: '' }
  reload()
}

/* Acciones */
function irCrear() { router.push({ name: 'ComercialDateosNuevo' }) }
function verDetalle(id: number) { router.push({ name: 'ComercialDateoDetalle', params: { id } }) }

async function marcarResultado(id: number, resultado: ResultadoDateo) {
  try { await updateDateo(id, { resultado }); loadItems() }
  catch { errorMsg.value = 'No se pudo actualizar el estado' }
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
function confirmEliminar(id: number) { dlgEliminar.value = { visible: true, id, loading: false } }
async function doEliminar() {
  if (!dlgEliminar.value.id) return
  dlgEliminar.value.loading = true
  try { await deleteDateo(dlgEliminar.value.id); dlgEliminar.value.visible = false; loadItems() }
  catch { errorMsg.value = 'No se pudo eliminar el dateo' }
  finally { dlgEliminar.value.loading = false }
}

/* Init */
loadAsesores()
loadConvenios()
loadItems()
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.text-h5 { font-weight: bold; }
.evidence-thumb { cursor: zoom-in; }
</style>
