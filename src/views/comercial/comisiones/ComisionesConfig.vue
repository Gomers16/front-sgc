<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">
          ⚙️ Configuración de comisiones
        </div>
      </v-card-title>

      <v-card-subtitle class="px-6">
        Define los valores estándar de comisión por <strong>placa</strong> y por
        <strong>dateo</strong>, según el tipo de vehículo y opcionalmente por
        <strong>asesor o convenio</strong>. También puedes configurar las
        <strong>metas mensuales de RTM</strong> (en cantidad) y los valores
        unitarios de RTM (en dinero).
      </v-card-subtitle>

      <v-divider class="my-3" />

      <!-- Toggle secciones -->
      <v-card-text class="pt-0 pb-0">
        <v-row class="mb-2">
          <v-col cols="12">
            <v-btn-toggle
              v-model="activeSection"
              mandatory
              rounded="xl"
              divided
            >
              <v-btn value="REGLAS" size="small">
                Reglas de comisión
              </v-btn>
              <v-btn value="METAS" size="small">
                Metas mensuales
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- ===================== SECCIÓN REGLAS DE COMISIÓN ===================== -->
      <v-card-text v-if="activeSection === 'REGLAS'" class="pt-4">
        <v-row class="mb-2" dense>
          <!-- Alcance -->
          <v-col cols="12" md="3">
            <div class="mb-1 text-subtitle-2 text-medium-emphasis">
              Alcance
            </div>
            <v-btn-toggle
              v-model="scope"
              mandatory
              rounded="xl"
              divided
            >
              <v-btn value="GLOBAL" size="small">
                Global
              </v-btn>
              <v-btn value="ASESOR" size="small">
                Por asesor / convenio
              </v-btn>
            </v-btn-toggle>
          </v-col>

          <!-- Tipo asesor -->
          <v-col cols="12" md="3">
            <v-select
              v-if="scope === 'ASESOR'"
              v-model="tipoAsesor"
              :items="tipoAsesorItems"
              item-title="label"
              item-value="value"
              label="Tipo de asesor"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>

          <!-- Asesor / Convenio -->
          <v-col cols="12" md="3">
            <v-autocomplete
              v-if="scope === 'ASESOR'"
              v-model="form.asesorId"
              :items="asesoresFiltrados"
              item-title="nombre"
              item-value="id"
              label="Asesor"
              density="comfortable"
              variant="outlined"
              :loading="asesoresLoading"
              hide-details
              clearable
            />
          </v-col>

          <!-- Tipo de vehículo -->
          <v-col cols="12" md="3">
            <v-select
              v-model="form.tipoVehiculo"
              :items="tipoVehiculoItems"
              item-title="label"
              item-value="value"
              label="Tipo de vehículo"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
        </v-row>

        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.valorPlaca"
              label="Comisión por placa"
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              prefix="$"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.valorDateo"
              label="Comisión por dateo (asesor / convenio)"
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              prefix="$"
            />
          </v-col>

          <v-col cols="12" md="4" class="d-flex align-end justify-end gap-2">
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="!canSubmit"
              @click="submitForm"
            >
              {{ form.id ? 'Actualizar regla' : 'Guardar regla' }}
            </v-btn>

            <v-btn
              variant="text"
              :disabled="saving && !form.id"
              @click="resetForm"
            >
              Limpiar
            </v-btn>
          </v-col>
        </v-row>

        <v-row v-if="formPreview" class="mt-3" dense>
          <v-col cols="12">
            <v-chip variant="tonal" size="small" class="mr-2">
              Alcance:
              <strong class="ms-1">{{ formPreview.alcance }}</strong>
            </v-chip>
            <v-chip
              v-if="scope === 'ASESOR' && formPreview.asesorNombre"
              variant="tonal"
              size="small"
              class="mr-2"
            >
              Asesor / Convenio:
              <strong class="ms-1">{{ formPreview.asesorNombre }}</strong>
            </v-chip>
            <v-chip variant="tonal" size="small" class="mr-2">
              Tipo vehículo:
              <strong class="ms-1">{{ formPreview.tipoVehiculoLabel }}</strong>
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text
        v-if="activeSection === 'REGLAS'"
        class="pt-4"
      >
        <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
          <div class="text-subtitle-1 font-weight-medium">
            Reglas configuradas
          </div>
          <div class="text-caption text-medium-emphasis">
            Total reglas:
            <strong>{{ configs.length }}</strong>
          </div>
        </div>

        <v-data-table
          :headers="headers"
          :items="configs"
          :loading="loading"
          item-key="id"
          density="comfortable"
        >
          <template #item.alcance="{ item }">
            <v-chip
              size="small"
              :color="item.asesor_id ? 'info' : 'primary'"
              variant="tonal"
            >
              {{ item.asesor_id ? 'Por asesor / convenio' : 'Global' }}
            </v-chip>
          </template>

          <template #item.asesor="{ item }">
            <span v-if="item.asesor_id">
              {{ findAsesorNombre(item.asesor_id) || `#${item.asesor_id}` }}
            </span>
            <span v-else class="text-medium-emphasis">— Todos —</span>
          </template>

          <template #item.tipo_vehiculo="{ item }">
            {{ tipoVehiculoLabel(item.tipo_vehiculo) }}
          </template>

          <template #item.valor_placa="{ item }">
            {{ formatCOP(item.valor_placa) }}
          </template>

          <template #item.valor_dateo="{ item }">
            {{ formatCOP(item.valor_dateo) }}
          </template>

          <template #item.fecha_calculo="{ item }">
            {{ formatDateTime(item.fecha_calculo) }}
          </template>

          <template #item.acciones="{ item }">
            <div class="d-flex gap-1">
              <v-btn
                size="small"
                variant="text"
                icon="mdi-pencil"
                @click="editConfig(item)"
              />
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-delete"
                @click="confirmDelete(item)"
              />
            </div>
          </template>

          <template #no-data>
            <div class="text-center py-6 text-medium-emphasis">
              No hay reglas configuradas todavía.
            </div>
          </template>
        </v-data-table>
      </v-card-text>

      <!-- ===================== SECCIÓN METAS MENSUALES ===================== -->
      <v-card-text
        v-else
        class="pt-4"
      >
        <!-- Form metas -->
        <v-row class="mb-2" dense>
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="metaForm.asesorId"
              :items="asesoresComerciales"
              item-title="nombre"
              item-value="id"
              label="Asesor comercial"
              density="comfortable"
              variant="outlined"
              :loading="asesoresLoading"
              hide-details
              clearable
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="metaForm.metaMensual"
              label="Meta mensual RTM (cantidad)"
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="metaForm.porcentajeExtra"
              label="% de comisión extra sobre facturación"
              type="number"
              min="0"
              max="100"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              suffix="%"
            />
          </v-col>
        </v-row>

        <!-- Tipo de meta + valores RTM -->
        <v-row dense class="mt-1">
          <v-col cols="12" md="4">
            <v-select
              v-model="metaForm.tipoVehiculo"
              :items="metaTipoVehiculoItems"
              item-title="label"
              item-value="value"
              label="Tipo de meta"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="metaForm.valorRtmMoto"
              label="Valor RTM moto"
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              prefix="$"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="metaForm.valorRtmVehiculo"
              label="Valor RTM vehículo"
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              prefix="$"
            />
          </v-col>
        </v-row>

        <v-row dense class="mt-2">
          <v-col cols="12" class="d-flex justify-end gap-2">
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="!canSubmitMeta"
              @click="submitMeta"
            >
              {{ metaForm.id ? 'Actualizar meta' : 'Guardar meta' }}
            </v-btn>
            <v-btn
              variant="text"
              :disabled="saving && !metaForm.id"
              @click="resetMetaForm"
            >
              Limpiar
            </v-btn>
          </v-col>
        </v-row>

        <!-- Tabla metas -->
        <div class="d-flex justify-space-between align-center mb-3 mt-4 flex-wrap gap-2">
          <div class="text-subtitle-1 font-weight-medium">
            Metas mensuales configuradas
          </div>
          <div class="text-caption text-medium-emphasis">
            Total metas:
            <strong>{{ metas.length }}</strong>
          </div>
        </div>

        <v-data-table
          :headers="metaHeaders"
          :items="metas"
          :loading="metasLoading"
          item-key="id"
          density="comfortable"
        >
          <template #item.asesor="{ item }">
            {{ findAsesorNombre(item.asesor_id) || `#${item.asesor_id}` }}
          </template>

          <template #item.tipo_vehiculo="{ item }">
            <span v-if="item.tipo_vehiculo === 'MOTO'">Solo motos</span>
            <span v-else-if="item.tipo_vehiculo === 'VEHICULO'">Solo vehículos</span>
            <span v-else>Global</span>
          </template>

          <template #item.meta_mensual="{ item }">
            {{ item.meta_mensual ?? 0 }} RTM
          </template>

          <template #item.valor_rtm_moto="{ item }">
            {{ item.valor_rtm_moto ? formatCOP(item.valor_rtm_moto) : '—' }}
          </template>

          <template #item.valor_rtm_vehiculo="{ item }">
            {{ item.valor_rtm_vehiculo ? formatCOP(item.valor_rtm_vehiculo) : '—' }}
          </template>

          <template #item.porcentaje_extra="{ item }">
            {{ (item.porcentaje_extra ?? 0) + '%' }}
          </template>

          <template #item.fecha_actualizacion="{ item }">
            {{ formatDateTime(item.fecha_actualizacion) }}
          </template>

          <template #item.acciones="{ item }">
            <div class="d-flex gap-1">
              <v-btn
                size="small"
                variant="text"
                icon="mdi-pencil"
                @click="editMeta(item)"
              />
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-delete"
                @click="confirmDeleteMeta(item)"
              />
            </div>
          </template>

          <template #no-data>
            <div class="text-center py-6 text-medium-emphasis">
              No hay metas mensuales configuradas todavía.
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Diálogo eliminar regla comisión -->
    <v-dialog v-model="deleteDialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">
          Eliminar regla de comisión
        </v-card-title>
        <v-card-text>
          ¿Seguro que deseas eliminar esta regla?
          <div v-if="deleteDialog.item" class="mt-3 text-body-2">
            <div>
              <strong>Alcance:</strong>
              {{ deleteDialog.item.asesor_id ? 'Por asesor / convenio' : 'Global' }}
            </div>
            <div>
              <strong>Tipo vehículo:</strong>
              {{ tipoVehiculoLabel(deleteDialog.item.tipo_vehiculo) }}
            </div>
            <div>
              <strong>Placa:</strong>
              {{ formatCOP(deleteDialog.item.valor_placa) }}
            </div>
            <div>
              <strong>Dateo:</strong>
              {{ formatCOP(deleteDialog.item.valor_dateo) }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="doDelete"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo eliminar meta mensual -->
    <v-dialog v-model="metaDeleteDialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">
          Eliminar meta mensual
        </v-card-title>
        <v-card-text>
          ¿Seguro que deseas eliminar esta meta mensual?
          <div v-if="metaDeleteDialog.item" class="mt-3 text-body-2">
            <div>
              <strong>Asesor:</strong>
              {{ findAsesorNombre(metaDeleteDialog.item.asesor_id) || ('#' + metaDeleteDialog.item.asesor_id) }}
            </div>
            <div>
              <strong>Tipo meta:</strong>
              <span v-if="metaDeleteDialog.item.tipo_vehiculo === 'MOTO'">Solo motos</span>
              <span v-else-if="metaDeleteDialog.item.tipo_vehiculo === 'VEHICULO'">Solo vehículos</span>
              <span v-else>Global</span>
            </div>
            <div>
              <strong>Meta mensual:</strong>
              {{ (metaDeleteDialog.item.meta_mensual ?? 0) + ' RTM' }}
            </div>
            <div>
              <strong>Valor RTM moto:</strong>
              {{ metaDeleteDialog.item.valor_rtm_moto ? formatCOP(metaDeleteDialog.item.valor_rtm_moto) : '—' }}
            </div>
            <div>
              <strong>Valor RTM vehículo:</strong>
              {{ metaDeleteDialog.item.valor_rtm_vehiculo ? formatCOP(metaDeleteDialog.item.valor_rtm_vehiculo) : '—' }}
            </div>
            <div>
              <strong>% extra:</strong>
              {{ (metaDeleteDialog.item.porcentaje_extra ?? 0) + '%' }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="metaDeleteDialog.visible = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="doDeleteMeta"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  listConfigsComision,
  upsertConfigComision,
  updateConfigComision,
  deleteConfigComision,
  listAgentesCaptacion,
  formatCOP,
  listMetasMensuales,
  upsertMetaMensual,
  updateMetaMensual,
  deleteMetaMensual,
  type ComisionConfig,
  type ComisionConfigPayload,
  type TipoVehiculoComision,
  type AgenteLight,
} from '@/services/comisionesService'

type Scope = 'GLOBAL' | 'ASESOR'
type Section = 'REGLAS' | 'METAS'

/** Metas mensuales (por asesor, opción global o por tipo de vehículo) */
type MetaMensualConfig = {
  id: number
  asesor_id: number
  tipo_vehiculo: TipoVehiculoComision | null
  meta_mensual: number
  porcentaje_extra: number
  valor_rtm_moto?: number | null
  valor_rtm_vehiculo?: number | null
  fecha_actualizacion?: string | null
}

type MetaMensualPayload = {
  asesor_id: number
  tipo_vehiculo: TipoVehiculoComision | null
  meta_mensual: number
  porcentaje_extra: number
  valor_rtm_moto?: number
  valor_rtm_vehiculo?: number
}

const DEFAULT_RTM_MOTO = 126100
const DEFAULT_RTM_VEHICULO = 208738

/* ===== Estado general ===== */
const activeSection = ref<Section>('REGLAS')

const configs = ref<ComisionConfig[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const asesores = ref<AgenteLight[]>([])
const asesoresLoading = ref(false)

/* Metas mensuales */
const metas = ref<MetaMensualConfig[]>([])
const metasLoading = ref(false)

/* ===== Formulario reglas ===== */
const scope = ref<Scope>('GLOBAL')

const form = ref<{
  id: number | null
  asesorId: number | null
  tipoVehiculo: TipoVehiculoComision | '' // '' mientras no selecciona
  valorPlaca: string
  valorDateo: string
}>({
  id: null,
  asesorId: null,
  tipoVehiculo: '',
  valorPlaca: '',
  valorDateo: '',
})

/** filtro de tipo de asesor (para separar comerciales vs convenios) */
const tipoAsesor = ref<'' | 'COMERCIAL' | 'CONVENIO'>('')

const tipoAsesorItems = [
  { label: 'Todos', value: '' },
  { label: 'Comercial', value: 'COMERCIAL' },
  { label: 'Convenio', value: 'CONVENIO' },
]

const tipoVehiculoItems = [
  { label: 'Moto', value: 'MOTO' as TipoVehiculoComision },
  { label: 'Vehículo', value: 'VEHICULO' as TipoVehiculoComision },
]

const headers = [
  { title: 'Alcance', key: 'alcance', sortable: false },
  { title: 'Asesor / Convenio', key: 'asesor', sortable: false },
  { title: 'Tipo vehículo', key: 'tipo_vehiculo', sortable: false },
  { title: 'Comisión placa', key: 'valor_placa', sortable: true },
  { title: 'Comisión dateo', key: 'valor_dateo', sortable: true },
  { title: 'Actualizado', key: 'fecha_calculo', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

/* Tabla metas mensuales */
const metaHeaders = [
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Tipo meta', key: 'tipo_vehiculo', sortable: false },
  { title: 'Meta RTM (unid.)', key: 'meta_mensual', sortable: true },
  { title: 'RTM moto', key: 'valor_rtm_moto', sortable: false },
  { title: 'RTM vehículo', key: 'valor_rtm_vehiculo', sortable: false },
  { title: '% extra', key: 'porcentaje_extra', sortable: true },
  { title: 'Actualizado', key: 'fecha_actualizacion', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const metaTipoVehiculoItems = [
  { label: 'Global (motos + vehículos)', value: '' },
  { label: 'Solo motos', value: 'MOTO' as TipoVehiculoComision },
  { label: 'Solo vehículos', value: 'VEHICULO' as TipoVehiculoComision },
]

/* ===== Helpers ===== */

function normalizeTipo(value?: string | null) {
  return (value ?? '').toString().toUpperCase().trim()
}

function tipoVehiculoLabel(v?: string | null) {
  if (v === 'MOTO') return 'Moto'
  if (v === 'VEHICULO') return 'Vehículo'
  return '—'
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/** Lista de asesores filtrada por tipo (Comercial / Convenio) para REGLAS */
const asesoresFiltrados = computed(() => {
  if (!tipoAsesor.value) return asesores.value

  const target = tipoAsesor.value
  return asesores.value.filter((a) => {
    const t = normalizeTipo(a.tipo)
    if (target === 'CONVENIO') {
      // cualquier tipo que contenga "CONVENIO"
      return t.includes('CONVENIO')
    }
    // COMERCIAL: todo lo que NO sea convenio
    if (!t) return true
    return !t.includes('CONVENIO')
  })
})

/** Solo asesores comerciales para METAS mensuales */
const asesoresComerciales = computed(() =>
  asesores.value.filter((a) => {
    const t = normalizeTipo(a.tipo)
    // comercial = todo lo que NO sea convenio
    if (!t) return true
    return !t.includes('CONVENIO')
  }),
)

function findAsesorNombre(id: number | null | undefined) {
  if (!id) return ''
  const a = asesores.value.find((x) => x.id === id)
  if (!a) return ''

  const t = normalizeTipo(a.tipo)
  let sufijo = ''
  if (t.includes('CONVENIO')) sufijo = ' (Convenio)'
  else if (t) sufijo = ' (Comercial)'

  return `${a.nombre}${sufijo}`
}

/* Preview pequeña de lo que se está configurando (reglas) */
const formPreview = computed(() => {
  if (!form.value.tipoVehiculo && !form.value.valorPlaca && !form.value.valorDateo) return null
  return {
    alcance: scope.value === 'GLOBAL' ? 'Global' : 'Por asesor / convenio',
    asesorNombre: scope.value === 'ASESOR' ? findAsesorNombre(form.value.asesorId) : null,
    tipoVehiculoLabel: tipoVehiculoLabel(form.value.tipoVehiculo),
  }
})

const canSubmit = computed(() => {
  if (!form.value.tipoVehiculo) return false
  const placa = Number(form.value.valorPlaca || 0)
  const dateo = Number(form.value.valorDateo || 0)
  if (Number.isNaN(placa) || placa < 0) return false
  if (Number.isNaN(dateo) || dateo < 0) return false
  if (scope.value === 'ASESOR' && !form.value.asesorId) return false
  return true
})

/* ===== Formulario metas mensuales ===== */
const metaForm = ref<{
  id: number | null
  asesorId: number | null
  tipoVehiculo: '' | TipoVehiculoComision
  metaMensual: string
  porcentajeExtra: string
  valorRtmMoto: string
  valorRtmVehiculo: string
}>({
  id: null,
  asesorId: null,
  tipoVehiculo: '',
  metaMensual: '',
  porcentajeExtra: '',
  valorRtmMoto: String(DEFAULT_RTM_MOTO),
  valorRtmVehiculo: String(DEFAULT_RTM_VEHICULO),
})

const canSubmitMeta = computed(() => {
  if (!metaForm.value.asesorId) return false
  const meta = Number(metaForm.value.metaMensual || 0)
  const pct = Number(metaForm.value.porcentajeExtra || 0)
  const moto = Number(metaForm.value.valorRtmMoto || 0)
  const carro = Number(metaForm.value.valorRtmVehiculo || 0)
  if (Number.isNaN(meta) || meta < 0) return false
  if (Number.isNaN(pct) || pct < 0) return false
  if (Number.isNaN(moto) || moto < 0) return false
  if (Number.isNaN(carro) || carro < 0) return false
  return true
})

/* ===== Carga de datos ===== */

async function loadConfigs() {
  loading.value = true
  try {
    configs.value = await listConfigsComision()
  } finally {
    loading.value = false
  }
}

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesores.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

async function loadMetas() {
  metasLoading.value = true
  try {
    // En la vista de CONFIG no mandamos mes/asesor → backend usa /comisiones/metas (config)
    const rows = await listMetasMensuales()
    metas.value = rows as MetaMensualConfig[]
  } finally {
    metasLoading.value = false
  }
}

/* ===== CRUD Reglas ===== */

function resetForm() {
  form.value = {
    id: null,
    asesorId: null,
    tipoVehiculo: '',
    valorPlaca: '',
    valorDateo: '',
  }
  scope.value = 'GLOBAL'
  tipoAsesor.value = ''
}

function editConfig(cfg: ComisionConfig) {
  form.value.id = cfg.id
  form.value.asesorId = cfg.asesor_id
  form.value.tipoVehiculo = (cfg.tipo_vehiculo || '') as TipoVehiculoComision | ''
  form.value.valorPlaca = String(cfg.valor_placa ?? '')
  form.value.valorDateo = String(cfg.valor_dateo ?? '')
  scope.value = cfg.asesor_id ? 'ASESOR' : 'GLOBAL'

  if (cfg.asesor_id) {
    // al editar, intentamos adivinar tipo para que el filtro coincida
    const a = asesores.value.find((x) => x.id === cfg.asesor_id)
    const t = normalizeTipo(a?.tipo)
    if (t.includes('CONVENIO')) tipoAsesor.value = 'CONVENIO'
    else tipoAsesor.value = 'COMERCIAL'
  } else {
    tipoAsesor.value = ''
  }
}

async function submitForm() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const payload: ComisionConfigPayload = {
      tipo_vehiculo: form.value.tipoVehiculo as TipoVehiculoComision,
      valor_placa: Number(form.value.valorPlaca || 0),
      valor_dateo: Number(form.value.valorDateo || 0),
      asesor_id: scope.value === 'ASESOR' ? form.value.asesorId ?? null : null,
    }

    if (form.value.id) {
      await updateConfigComision(form.value.id, payload)
    } else {
      await upsertConfigComision(payload)
    }

    await loadConfigs()
    resetForm()
  } finally {
    saving.value = false
  }
}

/* ===== Eliminar Reglas ===== */
const deleteDialog = ref<{ visible: boolean; item: ComisionConfig | null }>({
  visible: false,
  item: null,
})

function confirmDelete(item: ComisionConfig) {
  deleteDialog.value = {
    visible: true,
    item,
  }
}

async function doDelete() {
  const item = deleteDialog.value.item
  if (!item) return
  deleting.value = true
  try {
    await deleteConfigComision(item.id)
    await loadConfigs()
    deleteDialog.value.visible = false
    deleteDialog.value.item = null
  } finally {
    deleting.value = false
  }
}

/* ===== CRUD Metas Mensuales ===== */

function resetMetaForm() {
  metaForm.value = {
    id: null,
    asesorId: null,
    tipoVehiculo: '',
    metaMensual: '',
    porcentajeExtra: '',
    valorRtmMoto: String(DEFAULT_RTM_MOTO),
    valorRtmVehiculo: String(DEFAULT_RTM_VEHICULO),
  }
}

function editMeta(meta: MetaMensualConfig) {
  metaForm.value.id = meta.id
  metaForm.value.asesorId = meta.asesor_id
  metaForm.value.tipoVehiculo = (meta.tipo_vehiculo || '') as '' | TipoVehiculoComision
  metaForm.value.metaMensual = String(meta.meta_mensual ?? '')
  metaForm.value.porcentajeExtra = String(meta.porcentaje_extra ?? '')
  metaForm.value.valorRtmMoto = String(
    meta.valor_rtm_moto != null ? meta.valor_rtm_moto : DEFAULT_RTM_MOTO,
  )
  metaForm.value.valorRtmVehiculo = String(
    meta.valor_rtm_vehiculo != null ? meta.valor_rtm_vehiculo : DEFAULT_RTM_VEHICULO,
  )
}

async function submitMeta() {
  if (!canSubmitMeta.value) return
  saving.value = true
  try {
    const payload: MetaMensualPayload = {
      asesor_id: metaForm.value.asesorId!,
      tipo_vehiculo:
        metaForm.value.tipoVehiculo === ''
          ? null
          : (metaForm.value.tipoVehiculo as TipoVehiculoComision),
      meta_mensual: Number(metaForm.value.metaMensual || 0),
      porcentaje_extra: Number(metaForm.value.porcentajeExtra || 0),
      valor_rtm_moto: Number(metaForm.value.valorRtmMoto || 0),
      valor_rtm_vehiculo: Number(metaForm.value.valorRtmVehiculo || 0),
    }

    if (metaForm.value.id) {
      await updateMetaMensual(metaForm.value.id, payload)
    } else {
      await upsertMetaMensual(payload)
    }

    await loadMetas()
    resetMetaForm()
  } finally {
    saving.value = false
  }
}

/* Eliminar metas */
const metaDeleteDialog = ref<{ visible: boolean; item: MetaMensualConfig | null }>({
  visible: false,
  item: null,
})

function confirmDeleteMeta(item: MetaMensualConfig) {
  metaDeleteDialog.value = {
    visible: true,
    item,
  }
}

async function doDeleteMeta() {
  const item = metaDeleteDialog.value.item
  if (!item) return
  deleting.value = true
  try {
    await deleteMetaMensual(item.id)
    await loadMetas()
    metaDeleteDialog.value.visible = false
    metaDeleteDialog.value.item = null
  } finally {
    deleting.value = false
  }
}

/* Init */
onMounted(() => {
  loadConfigs()
  loadAsesores()
  loadMetas()
})
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
</style>
