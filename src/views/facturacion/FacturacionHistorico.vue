<!-- src/views/facturacion/FacturacionHistorico.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-history</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Facturación / Historial</div>
            <div class="text-medium-emphasis">Listado de tickets y detalle</div>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap:10px">
          <v-btn prepend-icon="mdi-reload" :loading="loading" @click="refresh">Actualizar</v-btn>
        </div>
      </v-card-title>
    </v-card>

    <!-- TABLA -->
    <v-card elevation="8" class="rounded-xl">
      <v-data-table-server
        :headers="headers"
        :items="rows"
        :items-length="total"
        :loading="loading"
        :items-per-page="pagination.itemsPerPage"
        :page="pagination.page"
        item-key="id"
        hover
        @update:options="onUpdateOptions"
      >
        <template #item.estado="{ item }">
          <v-chip :color="estadoColor(item.estado)" size="small" variant="tonal" class="font-weight-bold">
            {{ item.estado }}
          </v-chip>
        </template>

        <template #item.fecha_pago="{ item }">
          <span v-if="firstFecha(item)">{{ asDate(firstFecha(item)) }}</span>
          <span v-else>—</span>
        </template>

        <template #item.total="{ item }">
          {{ fmtCOP(pickTotal(item)) }}
        </template>

        <template #item.servicioNombre="{ item }">
          {{ getServicioNombre(item) }}
        </template>

        <template #item.sedeNombre="{ item }">
          {{ getSedeNombre(item) }}
        </template>

        <template #item.vendedor_text="{ item }">
          {{ item?.vendedor_text ?? '—' }}
        </template>

        <template #item.acciones="{ item }">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click.stop="openDetailById(item.id)">
            Ver
          </v-btn>
        </template>

        <template #body.append>
          <tr>
            <td :colspan="headers.length">
              <div class="d-flex align-center justify-space-between flex-wrap py-3">
                <div class="text-medium-emphasis">
                  Mostrando {{ rows.length }} de {{ total }} registros
                </div>
                <div class="d-flex align-center" style="gap:10px">
                  <v-select
                    v-model="pagination.itemsPerPage"
                    :items="[10,20,50,100]"
                    density="compact"
                    style="max-width:120px"
                    label="Por página"
                    @update:model-value="refresh"
                  />
                  <v-pagination
                    v-model="pagination.page"
                    :length="pages"
                    :total-visible="7"
                    @update:model-value="refresh"
                  />
                </div>
              </div>
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- DIALOG DETALLE CON IMAGEN -->
    <v-dialog v-model="dialog.open" max-width="1200">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-shield-check</v-icon>
            Detalle del ticket
            <span v-if="dialog.item?.id" class="ml-2 text-medium-emphasis">#{{ dialog.item.id }}</span>
          </div>
          <div class="d-flex align-center" style="gap:8px">
            <v-chip
              v-if="dialog.item?.estado"
              :color="estadoColor(dialog.item.estado)"
              size="small"
              variant="tonal"
            >
              {{ dialog.item.estado }}
            </v-chip>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div class="text-body-2 mb-4">
            Resumen de la facturación confirmada / registrada.
          </div>

          <v-row>
            <!-- COLUMNA IZQUIERDA: IMAGEN DEL TICKET -->
            <v-col cols="12" md="5">
              <div class="section-title mb-3">
                <v-icon class="mr-2">mdi-image</v-icon>
                Evidencia (Ticket)
              </div>

              <!-- Preview de imagen -->
              <div v-if="imageBlobUrl || dialog.item?.filePath || dialog.item?.file_path" class="image-preview-wrapper">
                <!-- Controles de zoom -->
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center" style="gap:6px">
                    <v-btn size="x-small" variant="text" icon="mdi-magnify-minus" @click="zoomOut" />
                    <v-btn size="x-small" variant="text" icon="mdi-magnify-plus" @click="zoomIn" />
                    <v-btn size="x-small" variant="text" @click="resetZoom">
                      {{ Math.round(imageScale * 100) }}%
                    </v-btn>
                  </div>
                  <v-btn
                    v-if="imageBlobUrl"
                    size="x-small"
                    variant="text"
                    prepend-icon="mdi-download"
                    tag="a"
                    :href="imageBlobUrl"
                    download="ticket.jpg"
                  >
                    Descargar
                  </v-btn>
                </div>

                <!-- Canvas para la imagen -->
                <div class="preview-canvas">
                  <img
                    v-if="imageBlobUrl"
                    :src="imageBlobUrl"
                    :style="imgStyle"
                    alt="Ticket"
                    @error="onImageError"
                  />
                  <div v-else-if="!imageError" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" />
                    <div class="text-caption mt-2">Cargando imagen...</div>
                  </div>
                </div>

                <div v-if="imageError" class="text-center mt-2 text-error">
                  <v-icon>mdi-alert-circle</v-icon>
                  No se pudo cargar la imagen
                </div>
              </div>

              <!-- No hay imagen -->
              <v-alert v-else type="info" variant="tonal" class="text-center">
                <v-icon size="48" class="mb-2">mdi-image-off</v-icon>
                <div>No hay imagen disponible para este ticket</div>
              </v-alert>
            </v-col>

            <!-- COLUMNA DERECHA: DATOS -->
            <v-col cols="12" md="7">
              <v-row>
                <!-- Datos del Ticket -->
                <v-col cols="12" md="6">
                  <div class="section-title">Ticket</div>

                  <div class="label">Placa</div>
                  <div class="value mb-2">{{ dialog.item?.placa || '—' }}</div>

                  <div class="label">Fecha y hora de pago</div>
                  <div class="value mb-2">
                    <span v-if="fechaPagoIso">
                      {{ asDate(fechaPagoIso) }} • {{ asTime(fechaPagoIso) }}
                    </span>
                    <span v-else>—</span>
                  </div>

                  <div class="label">Total</div>
                  <div class="value mb-2">
                    {{ fmtCOP(pickTotal(dialog.item)) }}
                  </div>

                  <div class="label">Vendedor</div>
                  <div class="value mb-2">{{ dialog.item?.vendedorText || dialog.item?.vendedor_text || '—' }}</div>

                  <div class="label">Prefijo / Consecutivo</div>
                  <div class="value mb-2">
                    {{ dialog.item?.prefijo || '—' }}
                    <span v-if="dialog.item?.consecutivo"> {{ dialog.item.consecutivo }}</span>
                  </div>

                  <div class="label">NIT / PIN / Marca</div>
                  <div class="value">
                    {{ dialog.item?.nit || '—' }} /
                    {{ dialog.item?.pin || '—' }} /
                    {{ dialog.item?.marca || '—' }}
                  </div>
                </v-col>

                <!-- Turno asociado -->
                <v-col cols="12" md="6">
                  <div class="section-title">Turno asociado</div>

                  <div class="label">Turno / Servicio</div>
                  <div class="value mb-2">
                    #{{ dialog.item?.turno?.turnoNumero ?? dialog.item?.turnoGlobal ?? '—' }}
                    •
                    {{ getServicioNombre(dialog.item) }}
                  </div>

                  <div class="label">Placa (turno)</div>
                  <div class="value mb-2">{{ dialog.item?.placaTurno || dialog.item?.turno?.placa || '—' }}</div>

                  <div class="label">Sede / Funcionario</div>
                  <div class="value mb-2">
                    {{ getSedeNombre(dialog.item) }} • {{ dialog.item?.funcionarioNombre || '—' }}
                  </div>

                  <div class="label">Canal</div>
                  <div class="value mb-2">
                    <v-chip
                      v-if="dialog.item?.canalAtribucion"
                      :color="canalChipColor(dialog.item?.canalAtribucion)"
                      size="small"
                      variant="tonal"
                    >
                      {{ humanCanal(dialog.item?.canalAtribucion) }}
                    </v-chip>
                    <span v-else>—</span>
                  </div>

                  <div class="label">Asesores / Convenio</div>
                  <div class="value">
                    <div class="capt-line" v-if="dialog.item?.dateo?.agente?.nombre">
                      <v-chip size="x-small" color="secondary" variant="tonal">Comercial</v-chip>
                      <span class="text-medium-emphasis">{{ dialog.item?.dateo?.agente?.nombre }}</span>
                    </div>
                    <div class="capt-line" v-if="dialog.item?.dateo?.asesorConvenio?.nombre">
                      <v-chip size="x-small" color="teal" variant="tonal">Convenio</v-chip>
                      <span class="text-medium-emphasis">{{ dialog.item?.dateo?.asesorConvenio?.nombre }}</span>
                    </div>
                    <div class="capt-line" v-if="dialog.item?.dateo?.convenio?.nombre">
                      <v-chip size="x-small" color="blue-grey" variant="tonal">Convenio</v-chip>
                      <span class="text-medium-emphasis">{{ dialog.item?.dateo?.convenio?.nombre }}</span>
                    </div>
                    <div
                      v-if="!dialog.item?.dateo?.agente && !dialog.item?.dateo?.asesorConvenio && !dialog.item?.dateo?.convenio"
                    >
                      —
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FacturacionService, type FacturacionTicket, type Paginated } from '@/services/facturacion_service'

const route = useRoute()
const router = useRouter()

/* ===== Tabla (server) ===== */
const loading = ref(false)
const rows = ref<FacturacionTicket[]>([])
const total = ref(0)
const pagination = ref({
  page: 1,
  itemsPerPage: 20,
  sortBy: [] as Array<{ key: string; order?: 'asc'|'desc' }>
})
const pages = computed(() => Math.max(1, Math.ceil(total.value / pagination.value.itemsPerPage)))

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Estado', key: 'estado', width: 140 },
  { title: 'Placa', key: 'placa', width: 120 },
  { title: 'Fecha pago', key: 'fecha_pago', width: 160 },
  { title: 'Total factura', key: 'total', width: 140 },
  { title: 'Servicio', key: 'servicioNombre', width: 240 },
  { title: 'Sede', key: 'sedeNombre', width: 200 },
  { title: 'Vendedor', key: 'vendedor_text', width: 220 },
  { title: 'Acciones', key: 'acciones', width: 120 },
]

async function fetchList() {
  loading.value = true
  try {
    const resp = await FacturacionService.list({
      page: pagination.value.page,
      limit: pagination.value.itemsPerPage,
    }) as unknown as Paginated<FacturacionTicket>
    rows.value = resp.data || []
    total.value = resp.meta?.total ?? rows.value.length
  } catch (e) {
    snack.text = '❌ Error cargando histórico'
    snack.show = true
  } finally {
    loading.value = false
  }
}
function refresh() { fetchList() }
function onUpdateOptions(opts: { page?: number; itemsPerPage?: number; sortBy?: Array<{ key: string; order?: 'asc'|'desc' }>}) {
  if (typeof opts.page === 'number') pagination.value.page = opts.page
  if (typeof opts.itemsPerPage === 'number') pagination.value.itemsPerPage = opts.itemsPerPage
  if (opts.sortBy) pagination.value.sortBy = opts.sortBy
  refresh()
}

/* ===== Fecha pago fallback chain ===== */
function firstFecha(it: any): string | null {
  return (
    it?.fecha_pago ||
    it?.fechaPago ||
    it?.confirmado_at ||
    it?.confirmadoAt ||
    it?.created_at ||
    it?.createdAt ||
    null
  )
}

/* ===== Detalle ===== */
const dialog = reactive<{ open: boolean; item: any | null }>({ open: false, item: null })

const fechaPagoIso = computed(() => {
  const i = dialog.item
  return i?.fechaPago || i?.fecha_pago || i?.confirmadoAt || i?.confirmado_at || i?.createdAt || i?.created_at || null
})

/* ===== Controles de imagen ===== */
const imageScale = ref(1)
const imageError = ref(false)
const imageBlobUrl = ref<string | null>(null)

const imgStyle = computed(() => {
  const rotation = dialog.item?.imageRotation ?? dialog.item?.image_rotation ?? 0
  return {
    transform: `rotate(${rotation}deg) scale(${imageScale.value})`,
    transformOrigin: 'center center',
    maxWidth: '100%',
    transition: 'transform 0.2s ease',
  }
})

function zoomIn() {
  imageScale.value = Math.min(imageScale.value + 0.2, 3)
}

function zoomOut() {
  imageScale.value = Math.max(imageScale.value - 0.2, 0.5)
}

function resetZoom() {
  imageScale.value = 1
}

function onImageError() {
  imageError.value = true
}

async function loadImageBlob(ticketId: number) {
  try {
    // Intentar obtener el token de diferentes fuentes
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token')

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`/api/facturacion/tickets/${ticketId}/imagen`, {
      headers,
      credentials: 'include' // Incluir cookies si las hay
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const blob = await response.blob()

    // Liberar URL anterior si existe
    if (imageBlobUrl.value) {
      URL.revokeObjectURL(imageBlobUrl.value)
    }

    imageBlobUrl.value = URL.createObjectURL(blob)
    imageError.value = false
  } catch (err) {
    console.error('Error cargando imagen:', err)
    imageError.value = true
    imageBlobUrl.value = null
  }
}

function closeDialog() {
  dialog.open = false
  // Limpiar blob URL
  if (imageBlobUrl.value) {
    URL.revokeObjectURL(imageBlobUrl.value)
    imageBlobUrl.value = null
  }
  // Reset zoom y error al cerrar
  setTimeout(() => {
    imageScale.value = 1
    imageError.value = false
  }, 300)
}

async function openDetailById(id: number | string) {
  try {
    const full = await FacturacionService.getById(id)
    dialog.item = full as any
    dialog.open = true
    imageError.value = false
    imageScale.value = 1

    // Cargar imagen si existe
    if (full.id) {
      await loadImageBlob(Number(full.id))
    }
  } catch (e) {
    snack.text = '❌ No se pudo cargar el detalle'
    snack.show = true
  }
}

/* Deep link ?focus=ID */
async function openFocusIfAny() {
  const focus = route.query?.focus
  const n = Number(Array.isArray(focus) ? focus[0] : focus)
  if (!Number.isFinite(n) || !n) return
  await openDetailById(n)
  const q = { ...route.query }; delete (q as any).focus
  router.replace({ query: q })
}

/* ===== Helpers UI ===== */
function fmtCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)
}
function asDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const yyyy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
  return `${yyyy}-${mm}-${dd}`
}
function asTime(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0'), ss = String(d.getSeconds()).padStart(2,'0')
  return `${hh}:${mm}:${ss}`
}
function estadoColor(s?: string | null) {
  switch ((s || '').toUpperCase()) {
    case 'BORRADOR': return 'grey'
    case 'OCR_LISTO': return 'info'
    case 'LISTA_CONFIRMAR': return 'warning'
    case 'CONFIRMADA': return 'success'
    case 'REVERTIDA': return 'error'
    default: return 'grey'
  }
}
function humanCanal(c?: string | null) {
  const v = String(c || '').toUpperCase()
  if (!v) return ''
  const map: Record<string,string> = {
    'ASESOR_COMERCIAL': 'Asesor comercial',
    'ASESOR': 'Asesor comercial',
    'TELEMERCADEO': 'Call Center',
    'TELE': 'Call Center',
    'REDES': 'Redes',
    'CONVENIO': 'Convenio',
    'REFERIDO': 'Referido',
  }
  return map[v] || v.charAt(0) + v.slice(1).toLowerCase()
}
function canalChipColor(c?: string | null) {
  const v = String(c || '').toUpperCase()
  switch (v) {
    case 'ASESOR_COMERCIAL':
    case 'ASESOR': return 'purple'
    case 'TELEMERCADEO':
    case 'TELE': return 'indigo'
    case 'REDES': return 'cyan'
    case 'CONVENIO': return 'blue-grey'
    case 'REFERIDO': return 'green'
    default: return 'grey'
  }
}

function pickTotal(it: any) {
  const a = it?.totalFactura
  if (a != null) return a
  const b = it?.total_factura
  if (b != null) return b
  const c = it?.total
  return c != null ? c : 0
}

function getServicioNombre(it: any) {
  return it?.servicio_nombre
      ?? it?.servicioNombre
      ?? it?.servicio?.nombreServicio
      ?? '—'
}
function getSedeNombre(it: any) {
  return it?.sede_nombre
      ?? it?.sedeNombre
      ?? it?.sede?.nombre
      ?? '—'
}

/* ===== Snack ===== */
const snack = reactive({ show: false, text: '' })

/* ===== Lifecycle ===== */
onMounted(async () => {
  await fetchList()
  await openFocusIfAny()
})

onBeforeUnmount(() => {
  // Limpiar blob URL al desmontar
  if (imageBlobUrl.value) {
    URL.revokeObjectURL(imageBlobUrl.value)
  }
})
</script>

<style scoped>
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.05);
  border-radius: 16px;
}

.section-title {
  font-weight: 700;
  margin-bottom: 10px;
  font-size: 0.95rem;
  letter-spacing: .3px;
}

.label {
  font-size: .75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.value {
  font-weight: 600;
}

.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }

.capt-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

/* ===== Preview de imagen ===== */
.image-preview-wrapper {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  background: #fafafa;
}

.preview-canvas {
  width: 100%;
  max-height: 500px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.preview-canvas img {
  max-width: 100%;
  display: block;
  margin: 0 auto;
  border-radius: 6px;
}

/* Scrollbar personalizado para el canvas */
.preview-canvas::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.preview-canvas::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.preview-canvas::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.preview-canvas::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
