<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="d-flex flex-column align-center text-center py-6">
        <div class="text-h5 font-weight-bold">🔎 Búsqueda unificada</div>
        <div class="text-body-2 text-medium-emphasis">
          Ingresa <strong>placa</strong> o <strong>teléfono</strong> para consultar vehículo/cliente, dateo, captación sugerida y asesor.
        </div>
      </v-card-title>

      <v-divider />

      <!-- Barra de búsqueda -->
      <v-card-text class="pt-6">
        <v-row align="center" justify="center" class="g-4">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.placa"
              label="Placa"
              placeholder="ABC123"
              prepend-inner-icon="mdi-car-info"
              variant="outlined"
              density="comfortable"
              clearable
              @keydown.enter="handleBuscar"
              :readonly="loading"
            />
          </v-col>

          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.telefono"
              label="Teléfono"
              placeholder="3001234567"
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              density="comfortable"
              clearable
              @keydown.enter="handleBuscar"
              :readonly="loading"
            />
          </v-col>

          <v-col cols="12" sm="4" class="d-flex gap-3">
            <v-btn
              color="primary"
              size="large"
              class="flex-grow-1"
              :loading="loading"
              @click="handleBuscar"
            >
              Buscar
            </v-btn>
            <v-btn variant="text" size="large" @click="handleLimpiar" :disabled="loading">
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-expand-transition>
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mx-6 mb-4"
          density="comfortable"
        >
          {{ errorMsg }}
        </v-alert>
      </v-expand-transition>

      <!-- Resultados -->
      <v-card-text v-if="hasResults" class="pb-6">
        <v-row class="g-4">
          <!-- Vehículo -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-lg">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-car</v-icon>
                Vehículo
                <v-chip v-if="respuesta?.vehiculo?.placa" size="small" class="ms-2" variant="tonal">
                  {{ respuesta?.vehiculo?.placa }}
                </v-chip>
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div v-if="respuesta?.vehiculo">
                  <div class="text-body-2">
                    <strong>Clase:</strong>
                    {{ respuesta.vehiculo?.clase?.nombre || '—' }}
                  </div>
                  <div class="text-body-2">
                    <strong>Marca/Línea/Modelo:</strong>
                    {{ resumenVehiculo }}
                  </div>
                </div>
                <div v-else class="text-medium-emphasis">
                  No se encontró vehículo.
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Cliente -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-lg">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-account</v-icon>
                Cliente
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div v-if="respuesta?.cliente">
                  <div class="text-body-2"><strong>Nombre:</strong> {{ respuesta.cliente?.nombre }}</div>
                  <div class="text-body-2">
                    <strong>Documento:</strong>
                    {{ respuesta.cliente?.doc_tipo || '—' }} {{ respuesta.cliente?.doc_numero || '' }}
                  </div>
                  <div class="text-body-2"><strong>Teléfono:</strong> {{ respuesta.cliente?.telefono || '—' }}</div>
                </div>
                <div v-else class="text-medium-emphasis">
                  No se encontró cliente.
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Dateo reciente -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-lg">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-clipboard-text-search</v-icon>
                Dateo reciente
                <v-chip
                  v-if="respuesta?.dateoReciente?.canal"
                  class="ms-2"
                  size="x-small"
                  variant="tonal"
                >
                  {{ respuesta?.dateoReciente?.canal }}
                </v-chip>
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div v-if="respuesta?.dateoReciente">
                  <div class="text-body-2">
                    <strong>Agente:</strong>
                    {{ respuesta.dateoReciente?.agente?.nombre || '—' }}
                    <span v-if="respuesta.dateoReciente?.agente">
                      ({{ respuesta.dateoReciente?.agente?.tipo }})
                    </span>
                  </div>
                  <div class="text-body-2">
                    <strong>Creado:</strong> {{ formatDate(respuesta?.dateoReciente?.created_at) }}
                  </div>
                  <div class="text-body-2">
                    <strong>Obs.:</strong> {{ respuesta.dateoReciente?.observacion || '—' }}
                  </div>
                </div>
                <div v-else class="text-medium-emphasis">
                  No hay dateo vigente.
                </div>
              </v-card-text>

              <v-card-actions class="px-4 pb-4 pt-0">
                <v-spacer />
                <v-btn
                  v-if="respuesta?.dateoReciente"
                  color="primary"
                  @click="crearTurnoConDateo"
                >
                  Crear turno con este dateo
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Captación y reserva -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-lg">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-account-tie</v-icon>
                Captación y reserva
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div class="mb-3">
                  <div class="text-subtitle-2 mb-1">Reserva</div>
                  <div class="text-body-2">
                    <strong>Vigente:</strong> {{ boolLabel(respuesta?.reserva?.vigente) }}
                    <span v-if="respuesta?.reserva?.bloqueaHasta">
                      · hasta {{ formatDate(respuesta?.reserva?.bloqueaHasta) }}
                    </span>
                  </div>
                </div>

                <div>
                  <div class="text-subtitle-2 mb-1">Captación sugerida</div>
                  <div class="text-body-2" v-if="respuesta?.captacionSugerida">
                    <strong>Canal:</strong> {{ respuesta.captacionSugerida?.canal }} ·
                    <strong>Agente:</strong> {{ respuesta.captacionSugerida?.agente?.nombre || '—' }}
                  </div>
                  <div class="text-medium-emphasis" v-else>Sin sugerencia.</div>
                </div>
              </v-card-text>

              <v-card-actions class="px-4 pb-4 pt-0 d-flex flex-wrap gap-2">
                <v-btn variant="tonal" @click="irCrearDateo">
                  Crear dateo manual
                </v-btn>
                <v-btn variant="tonal" @click="irCrearProspecto">
                  Crear prospecto
                </v-btn>
                <v-btn
                  v-if="puedeAutoDateo"
                  color="primary"
                  @click="dispararAutoDateo"
                  :loading="autoDateoLoading"
                >
                  Auto-dateo por convenio
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Asesor -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-lg">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-account-tie-outline</v-icon>
                Asesor
                <v-chip
                  v-if="respuesta?.captacionSugerida?.agente?.tipo"
                  class="ms-2"
                  size="x-small"
                  variant="tonal"
                >
                  {{ respuesta?.captacionSugerida?.agente?.tipo }}
                </v-chip>
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div v-if="respuesta?.captacionSugerida?.agente">
                  <div class="text-body-2">
                    <strong>Nombre:</strong> {{ respuesta.captacionSugerida!.agente!.nombre }}
                  </div>

                  <div class="text-body-2" v-if="asesorResumen">
                    <strong>Convenios:</strong>
                    <v-chip size="x-small" class="ms-1" variant="tonal" title="Vigentes / Asignaciones">
                      {{ asesorResumen.convenios.vigentes }} / {{ asesorResumen.convenios.asignaciones }}
                    </v-chip>
                  </div>

                  <div class="text-body-2" v-if="asesorResumen">
                    <strong>Prospectos:</strong>
                    <v-chip size="x-small" class="ms-1" variant="tonal" title="Hoy">
                      Hoy: {{ asesorResumen.prospectos.hoy }}
                    </v-chip>
                    <v-chip size="x-small" class="ms-1" variant="tonal" title="Mes actual">
                      Mes: {{ asesorResumen.prospectos.mes }}
                    </v-chip>
                    <v-chip size="x-small" class="ms-1" variant="tonal" title="Total">
                      Total: {{ asesorResumen.prospectos.total }}
                    </v-chip>
                  </div>

                  <div v-if="loadingAsesor" class="text-medium-emphasis mt-2">
                    Cargando resumen del asesor…
                  </div>
                </div>
                <div v-else class="text-medium-emphasis">Sin asesor sugerido.</div>
              </v-card-text>

              <!-- Acciones: abrir modales -->
              <v-card-actions class="px-4 pb-4 pt-0 d-flex flex-wrap gap-2">
                <v-tooltip text="Ver convenios del asesor" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-eye"
                      variant="text"
                      @click="abrirConveniosModal"
                      :disabled="!respuesta?.captacionSugerida?.agente?.id"
                    />
                  </template>
                </v-tooltip>

                <v-tooltip text="Ver prospectos creados por el asesor" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-eye-outline"
                      variant="text"
                      @click="abrirProspectosModal"
                      :disabled="!respuesta?.captacionSugerida?.agente?.id"
                    />
                  </template>
                </v-tooltip>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- CTA pie -->
      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn
          :disabled="!respuesta?.vehiculo && !respuesta?.cliente"
          color="primary"
          @click="irCrearTurno"
        >
          Crear turno
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>

  <!-- =======================
       MODAL: CONVENIOS ASESOR
       ======================= -->
  <v-dialog v-model="dlgConvenios" max-width="900">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-subtitle-1">
          Convenios del asesor
          <strong v-if="asesorNombre">({{ asesorNombre }})</strong>
        </span>
        <v-btn icon="mdi-close" variant="text" @click="dlgConvenios = false" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-alert
          v-if="errorConvenios"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ errorConvenios }}
        </v-alert>

        <div v-if="loadingConvenios" class="text-medium-emphasis">Cargando convenios…</div>

        <template v-else>
          <div v-if="(asesorConvenios?.length || 0) === 0" class="text-medium-emphasis">
            Sin convenios asignados.
          </div>

          <v-table v-else density="comfortable">
            <thead>
              <tr>
                <th class="text-left">Convenio</th>
                <th class="text-left">Tipo</th>
                <th class="text-left">Contacto</th>
                <th class="text-left">Vigencia</th>
                <th class="text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in asesorConvenios" :key="c.id">
                <td>{{ c.nombre }}</td>
                <td>{{ c.tipo }}</td>
                <td>
                  <div>{{ c.telefono || c.whatsapp || '—' }}</div>
                  <div class="text-medium-emphasis">{{ c.email || '—' }}</div>
                </td>
                <td>
                  <span v-if="c.asignacion?.fecha_asignacion">
                    {{ formatDate(c.asignacion.fecha_asignacion) }}
                  </span>
                  <span v-else>—</span>
                  <span v-if="c.asignacion?.fecha_fin"> → {{ formatDate(c.asignacion.fecha_fin) }}</span>
                </td>
                <td>
                  <v-chip size="x-small" :color="c.asignacion?.activo ? 'success' : 'default'" variant="tonal">
                    {{ c.asignacion?.activo ? 'Vigente' : 'Inactivo' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="dlgConvenios = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- =========================
       MODAL: PROSPECTOS ASESOR
       ========================= -->
  <v-dialog v-model="dlgProspectos" max-width="1000">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-subtitle-1">
          Prospectos creados por el asesor
          <strong v-if="asesorNombre">({{ asesorNombre }})</strong>
        </span>
        <v-btn icon="mdi-close" variant="text" @click="dlgProspectos = false" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-alert
          v-if="errorProspectos"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ errorProspectos }}
        </v-alert>

        <div v-if="loadingProspectos" class="text-medium-emphasis">Cargando prospectos…</div>

        <template v-else>
          <div v-if="(prospectosAsesor?.length || 0) === 0" class="text-medium-emphasis">
            Sin prospectos creados por este asesor.
          </div>

          <v-table v-else density="comfortable">
            <thead>
              <tr>
                <th class="text-left">Nombre</th>
                <th class="text-left">Placa</th>
                <th class="text-left">Teléfono</th>
                <th class="text-left">Origen</th>
                <th class="text-left">Creado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in prospectosAsesor" :key="p.id">
                <td>{{ p.nombre || '—' }}</td>
                <td>{{ p.placa || '—' }}</td>
                <td>{{ p.telefono || '—' }}</td>
                <td>{{ p.origen || '—' }}</td>
                <td>{{ formatDate(p.created_at) }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="dlgProspectos = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  buscar,
  crearDateoAutoPorConvenio,
  getAsesorResumen,
  getConveniosByAsesor,
  getProspectosByCreador,
  type BusquedaResponse,
  type AsesorResumen,
  type ConvenioAsignado,
  type ProspectoLight,
} from '@/services/buscarService'

const router = useRouter()

const form = ref<{ placa: string; telefono: string }>({ placa: '', telefono: '' })
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const respuesta = ref<BusquedaResponse | null>(null)
const autoDateoLoading = ref(false)

const asesorResumen = ref<AsesorResumen | null>(null)
const asesorConvenios = ref<ConvenioAsignado[] | null>(null)
const loadingAsesor = ref(false)

/* --- Modals --- */
const dlgConvenios = ref(false)
const dlgProspectos = ref(false)

const loadingConvenios = ref(false)
const loadingProspectos = ref(false)
const errorConvenios = ref<string | null>(null)
const errorProspectos = ref<string | null>(null)
const prospectosAsesor = ref<ProspectoLight[] | null>(null)

const asesorNombre = computed(() => respuesta.value?.captacionSugerida?.agente?.nombre || '')

/** helpers */
function formatDate(d?: string) {
  if (!d) return '—'
  try {
    const date = new Date(d)
    return date.toLocaleString()
  } catch {
    return d
  }
}
function boolLabel(v?: boolean) {
  return v ? 'Sí' : 'No'
}

const hasResults = computed(() => !!respuesta.value)

const resumenVehiculo = computed(() => {
  const v = respuesta.value?.vehiculo
  if (!v) return '—'
  const mlm = [v.marca, v.linea, v.modelo].filter(Boolean).join(' / ')
  return mlm || '—'
})

/** Mostrar botón de auto-dateo si hay sugerencia y hay algún dato de entrada */
const puedeAutoDateo = computed(() =>
  (!!respuesta.value?.captacionSugerida) && (!!form.value.placa || !!form.value.telefono)
)

/** Utilidad de navegación defensiva */
function safePush(toByName: { name: string; params?: any; query?: any }, fallbackPath: string) {
  const r = router.resolve(toByName)
  if (r.matched.length) return router.push(toByName)
  return router.push(fallbackPath)
}

/** Acciones UI */
async function handleBuscar() {
  errorMsg.value = null
  loading.value = true
  respuesta.value = null
  asesorResumen.value = null
  asesorConvenios.value = null
  prospectosAsesor.value = null
  try {
    if (!form.value.placa && !form.value.telefono) {
      throw new Error('Ingresa placa o teléfono para buscar.')
    }
    const data = await buscar({
      placa: form.value.placa || undefined,
      telefono: form.value.telefono || undefined,
    })
    respuesta.value = data
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'Error realizando la búsqueda'
  } finally {
    loading.value = false
  }
}

function handleLimpiar() {
  form.value.placa = ''
  form.value.telefono = ''
  respuesta.value = null
  asesorResumen.value = null
  asesorConvenios.value = null
  prospectosAsesor.value = null
  errorMsg.value = null
}

/** Navegación: usar nombres REALES del router */
function irCrearTurno() {
  safePush({ name: 'CrearTurno' }, '/rtm/crear-turno')
}
function irCrearDateo() {
  safePush({ name: 'ComercialDateosNuevo' }, '/comercial/dateos/nuevo')
}
function irCrearProspecto() {
  safePush({ name: 'ComercialProspectoNuevo' }, '/comercial/prospectos/nuevo')
}
function crearTurnoConDateo() {
  const id = respuesta.value?.dateoReciente?.id
  safePush({ name: 'CrearTurno', query: { dateoId: id } }, '/rtm/crear-turno')
}

/** Abrir modales + cargar data puntual */
async function abrirConveniosModal() {
  const asesorId = respuesta.value?.captacionSugerida?.agente?.id
  if (!asesorId) return
  dlgConvenios.value = true
  loadingConvenios.value = true
  errorConvenios.value = null
  try {
    asesorConvenios.value = await getConveniosByAsesor(asesorId, true)
  } catch (e: any) {
    errorConvenios.value = e?.response?.data?.message || e?.message || 'No fue posible cargar los convenios.'
  } finally {
    loadingConvenios.value = false
  }
}

async function abrirProspectosModal() {
  const asesorId = respuesta.value?.captacionSugerida?.agente?.id
  if (!asesorId) return
  dlgProspectos.value = true
  loadingProspectos.value = true
  errorProspectos.value = null
  try {
    // Solo los creados por el asesor
    prospectosAsesor.value = await getProspectosByCreador(asesorId)
  } catch (e: any) {
    errorProspectos.value = e?.response?.data?.message || e?.message || 'No fue posible cargar los prospectos.'
  } finally {
    loadingProspectos.value = false
  }
}

/** Carga de resumen del asesor cuando exista agente sugerido */
watch(
  () => respuesta.value?.captacionSugerida?.agente?.id,
  async (asesorId) => {
    asesorResumen.value = null
    asesorConvenios.value = null
    prospectosAsesor.value = null
    if (!asesorId) return
    try {
      loadingAsesor.value = true
      asesorResumen.value = await getAsesorResumen(asesorId)
      // Pre-cargamos una vista rápida de convenios vigentes (no abre modal todavía)
      asesorConvenios.value = await getConveniosByAsesor(asesorId, true)
      // Prospectos se cargan al abrir el modal (para evitar llamada extra si no lo abre)
    } finally {
      loadingAsesor.value = false
    }
  }
)
</script>

<style scoped>
.g-4 { gap: 16px; }
.gap-3 { gap: 12px; }
</style>
