<!-- src/views/Dateos.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">🗒️ Dateos</div>

        <div class="d-flex gap-2 flex-wrap">
          <v-text-field
            v-model="filters.placa"
            label="Placa"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 130px"
          />
          <v-text-field
            v-model="filters.telefono"
            label="Teléfono cliente"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 160px"
          />

          <v-select
            v-model="filters.canal"
            :items="canalItems"
            label="Canal"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 160px"
          />

          <!-- 🔹 Nuevo: filtro de tipo de asesor -->
          <v-select
            v-model="filters.tipoAgente"
            :items="tipoAgenteItems"
            label="Tipo asesor"
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
                  <v-chip
                    size="small"
                    class="agent-type-chip"
                    :class="{
                      'agent-type--comercial': /COMERCIAL/i.test(item?.raw?.tipo),
                      'agent-type--convenio': /CONVENIO/i.test(item?.raw?.tipo),
                      'agent-type--tele': /TELE/i.test(item?.raw?.tipo),
                    }"
                  >
                    {{ mapTipoCorto(item?.raw?.tipo) }}
                  </v-chip>
                </template>
              </v-list-item>
            </template>

            <!-- selected -->
            <template #selection="{ item }">
              <div class="d-flex align-center gap-1">
                <span>{{ safe(item?.raw?.nombre) }}</span>
                <v-chip
                  size="small"
                  class="agent-type-chip"
                  :class="{
                    'agent-type--comercial': /COMERCIAL/i.test(item?.raw?.tipo),
                    'agent-type--convenio': /CONVENIO/i.test(item?.raw?.tipo),
                    'agent-type--tele': /TELE/i.test(item?.raw?.tipo),
                  }"
                >
                  {{ mapTipoCorto(item?.raw?.tipo) }}
                </v-chip>
              </div>
            </template>
          </v-autocomplete>

          <!-- Convenio -->
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

          <v-text-field
            v-model="filters.desde"
            type="date"
            label="Desde"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 150px"
          />
          <v-text-field
            v-model="filters.hasta"
            type="date"
            label="Hasta"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 150px"
          />

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
        <!-- Foto (simple, sin tooltips) -->
        <template #item.imagen_url="{ item }">
          <div class="d-flex items-center">
            <v-avatar
              v-if="item.imagen_url"
              size="42"
              class="evidence-thumb"
              @click="openViewer(item.imagen_url)"
            >
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
              aria-label="Sin evidencia"
              :title="'Sin evidencia'"
            />
          </div>
        </template>

        <!-- Canal fijo: ASESOR -->
        <template #item.canal>
          <v-chip size="small" variant="flat">ASESOR</v-chip>
        </template>

        <!-- Agente con chip ancho/legible -->
        <template #item.agente="{ item }">
          <div class="d-flex align-center gap-1">
            <span>{{ safe(item.agente?.nombre) }}</span>
            <v-chip
              v-if="item.agente?.tipo"
              size="small"
              class="agent-type-chip"
              :class="{
                'agent-type--comercial': /COMERCIAL/i.test(item.agente.tipo),
                'agent-type--convenio': /CONVENIO/i.test(item.agente.tipo),
                'agent-type--tele': /TELE/i.test(item.agente.tipo),
              }"
            >
              {{ mapTipoCorto(item.agente.tipo) }}
            </v-chip>
          </div>
        </template>

        <!-- Convenio -->
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

        <!-- Estado (resultado del dateo) -->
        <template #item.resultado="{ item }">
          <v-chip :color="chipColorResultado(item.resultado)" size="small" variant="flat">
            {{ textoResultado(item.resultado) }}
          </v-chip>
        </template>

        <!-- Turno: centrado + chips -->
        <template #item.turnoInfo="{ item }">
          <div v-if="item.turnoInfo" class="d-flex align-center justify-center" style="gap:6px">
            <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-600">
              {{ (item.turnoInfo.fecha && formatDateOnly(item.turnoInfo.fecha)) || '—' }}
            </v-chip>
            <v-chip size="x-small" color="indigo" variant="tonal" class="font-weight-600">
              G: {{ item.turnoInfo.numeroGlobal ?? '—' }}
            </v-chip>
            <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-600">
              S: {{ item.turnoInfo.numeroServicio ?? '—' }}
            </v-chip>
            <v-chip
              v-if="item.turnoInfo.servicioCodigo"
              size="x-small"
              variant="tonal"
              class="font-weight-600"
            >
              {{ item.turnoInfo.servicioCodigo }}
            </v-chip>
            <v-chip
              size="x-small"
              :color="chipColorEstadoTurno(item.turnoInfo.estado || item.resultado)"
              variant="elevated"
              prepend-icon="mdi-progress-clock"
              class="font-weight-600"
            >
              {{ textoEstadoTurno(item.turnoInfo.estado || item.resultado) }}
            </v-chip>
          </div>
          <span v-else class="text-medium-emphasis d-flex justify-center">—</span>
        </template>

        <!-- Acciones (con tooltips) -->
        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-tooltip text="Ver detalle del dateo">
              <template #activator="{ props }">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-eye"
                  v-bind="props"
                  @click="verDetalle(item.id)"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Marcar EN PROCESO">
              <template #activator="{ props }">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-progress-clock"
                  color="info"
                  v-bind="props"
                  @click="marcarResultado(item.id, 'EN_PROCESO')"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Marcar EXITOSO">
              <template #activator="{ props }">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-clipboard-check"
                  color="success"
                  v-bind="props"
                  @click="marcarResultado(item.id, 'EXITOSO')"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Marcar NO EXITOSO">
              <template #activator="{ props }">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-clipboard-remove"
                  color="error"
                  v-bind="props"
                  @click="marcarResultado(item.id, 'NO_EXITOSO')"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Marcar PENDIENTE">
              <template #activator="{ props }">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-clipboard-text-clock"
                  v-bind="props"
                  @click="marcarResultado(item.id, 'PENDIENTE')"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Eliminar dateo">
              <template #activator="{ props }">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-delete"
                  color="error"
                  v-bind="props"
                  @click="confirmEliminar(item.id)"
                />
              </template>
            </v-tooltip>
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
          <v-btn
            v-if="viewer.url"
            variant="text"
            :href="viewer.url"
            target="_blank"
            prepend-icon="mdi-open-in-new"
          >
            Abrir en pestaña
          </v-btn>
          <v-btn color="primary" @click="viewer.visible = false">Cerrar</v-btn>
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
  tipoAgente: '' | 'COMERCIAL' | 'CONVENIO'
  agenteId: number | null
  convenioId: number | null
  resultado: ResultadoDateo | ''
  desde: string
  hasta: string
}>({
  placa: '',
  telefono: '',
  canal: 'ASESOR',
  tipoAgente: '',
  agenteId: null,
  convenioId: null,
  resultado: '',
  desde: '',
  hasta: '',
})

const canalItems = [{ title: 'Asesor', value: 'ASESOR' as const }]

/* 🔹 Items para el filtro de tipo de asesor */
const tipoAgenteItems = [
  { title: 'Todos', value: '' },
  { title: 'Comercial', value: 'COMERCIAL' },
  { title: 'Convenio', value: 'CONVENIO' },
]

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
  { title: 'Teléfono cliente', key: 'telefono', sortable: true },
  { title: 'Creado', key: 'created_at', sortable: true },
  { title: 'Estado', key: 'resultado', sortable: true },
  { title: 'Turno', key: 'turnoInfo', sortable: false, align: 'center' as const },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
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
function openViewer(url: string) {
  viewer.value = { visible: true, url }
}

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

/* Catálogo convenios */
const conveniosItems = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)
async function loadConvenios() {
  conveniosLoading.value = true
  try {
    conveniosItems.value = await listConveniosLight()
  } finally {
    conveniosLoading.value = false
  }
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
  return val === null || val === undefined || val === '' ? '' : String(val)
}

/* 🔹 Agentes visibles según el tipo seleccionado (comercial / convenio) */
const agentesVisibles = computed(() => {
  const tipo = filters.value.tipoAgente
  if (!tipo) return asesoresItems.value

  return asesoresItems.value.filter((a) => {
    const u = String(a.tipo || '').toUpperCase()
    if (tipo === 'COMERCIAL') return u.includes('COMERCIAL')
    if (tipo === 'CONVENIO') return u.includes('CONVENIO')
    return true
  })
})

/* Cuando cambias el tipo de asesor, limpio el agente seleccionado */
watch(
  () => filters.value.tipoAgente,
  () => {
    filters.value.agenteId = null
  }
)

/* Texto/Color chips */
function chipColorResultado(r?: string) {
  if (r === 'EXITOSO') return 'success'
  if (r === 'NO_EXITOSO') return 'error'
  if (r === 'EN_PROCESO') return 'info'
  return 'warning'
}
function textoResultado(r?: string) {
  if (r === 'EXITOSO') return 'Exitoso'
  if (r === 'NO_EXITOSO') return 'No exitoso'
  if (r === 'EN_PROCESO') return 'En proceso'
  return 'Pendiente'
}
function chipColorEstadoTurno(e?: string) {
  const v = String(e || '').toLowerCase()
  if (v.includes('proceso')) return 'info'
  if (v.includes('final')) return 'success'
  if (v.includes('cancel')) return 'error'
  return 'warning'
}
function textoEstadoTurno(e?: string) {
  const v = String(e || '').toUpperCase()
  if (v === 'EN_PROCESO') return 'En proceso'
  if (v === 'FINALIZADO') return 'Finalizado'
  if (v === 'CANCELADO') return 'Cancelado'
  if (v === 'ACTIVO') return 'Activo'
  return 'Pendiente'
}
function formatDateOnly(iso: string) {
  const p = iso.split('T')[0] || iso
  const [y, m, d] = p.split('-')
  return `${d}/${m}/${y}`
}

/* CRUD */
async function loadItems() {
  loading.value = true
  errorMsg.value = null
  try {
    const sort =
      Array.isArray(sortBy.value) && sortBy.value[0]
        ? sortBy.value[0]
        : { key: 'id', order: 'desc' as const }
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

function reload() {
  page.value = 1
  loadItems()
}
function resetFilters() {
  filters.value = {
    placa: '',
    telefono: '',
    canal: 'ASESOR',
    tipoAgente: '',
    agenteId: null,
    convenioId: null,
    resultado: '',
    desde: '',
    hasta: '',
  }
  reload()
}

/* Acciones */
function irCrear() {
  router.push({ name: 'ComercialDateosNuevo' })
}
function verDetalle(id: number) {
  router.push({ name: 'ComercialDateoDetalle', params: { id } })
}

async function marcarResultado(id: number, resultado: ResultadoDateo) {
  try {
    await updateDateo(id, { resultado })
    loadItems()
  } catch {
    errorMsg.value = 'No se pudo actualizar el estado'
  }
}

/* Eliminar */
const dlgEliminar = ref<{ visible: boolean; id: number | null; loading: boolean }>({
  visible: false,
  id: null,
  loading: false,
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
loadConvenios()
loadItems()
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.text-h5 { font-weight: bold; }
.evidence-thumb { cursor: zoom-in; }

/* Chip del tipo de agente: más alto, ancho mínimo y sin recortar texto */
.agent-type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 12px;
  min-width: 92px;       /* asegura que 'Comercial' entre completo */
  font-size: 12.6px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  overflow: visible;
  border-radius: 9999px;
}

/* Colores por tipo (opcional) */
.agent-type--comercial { background: #E3F2FD; color: #0D47A1; }
.agent-type--convenio  { background: #E8F5E9; color: #1B5E20; }
.agent-type--tele      { background: #FFF3E0; color: #E65100; }
</style>
