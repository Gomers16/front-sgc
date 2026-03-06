<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">💸 Comisiones</div>
        <div class="d-flex gap-2 flex-wrap">
          <v-text-field
            v-model="filters.mes"
            label="Mes"
            type="month"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 170px"
          />
          <v-select
            v-model="filters.estado"
            :items="estadoItems"
            item-title="label"
            item-value="value"
            label="Estado"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
            clearable
          />
          <v-autocomplete
            v-model="filters.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :loading="asesoresLoading"
            style="min-width: 240px"
          />
          <v-btn color="primary" :loading="loading || metaLoading" @click="reload">
            Aplicar filtros
          </v-btn>
          <v-btn variant="text" :disabled="loading || metaLoading" @click="resetFilters">
            Limpiar
          </v-btn>
        </div>
      </v-card-title>

      <!-- Pestañas -->
      <v-tabs v-model="activeTab" density="comfortable" class="px-4">
        <v-tab value="detalle">Detalle comisiones</v-tab>
        <v-tab value="metas">Metas mensuales</v-tab>
      </v-tabs>

      <v-divider />

      <!-- ====== TAB DETALLE ====== -->
      <template v-if="activeTab === 'detalle'">
        <v-card-text class="pt-5">
          <div class="d-flex flex-wrap gap-3">
            <v-chip variant="tonal" size="large">
              Total página: <strong class="ms-1">{{ formatCOP(totalPagina) }}</strong>
            </v-chip>
            <v-chip variant="tonal" size="large" color="warning" v-if="pendientesPagina > 0">
              Pendientes: <strong class="ms-1">{{ pendientesPagina }}</strong>
            </v-chip>
            <v-chip variant="tonal" size="large" color="success" v-if="pagadasPagina > 0">
              Pagadas: <strong class="ms-1">{{ pagadasPagina }}</strong>
            </v-chip>
          </div>
        </v-card-text>

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
          <template #item.estado="{ item }">
            <v-chip :color="estadoColor(item.estado)" size="small" variant="flat">
              {{ item.estado }}
            </v-chip>
          </template>

          <template #item.tipo_cliente="{ item }">
            <v-chip size="x-small" :color="tipoClienteColor(item.turno)" variant="tonal">
              {{ tipoClienteLabel(item.turno) }}
            </v-chip>
          </template>

          <template #item.turno="{ item }">
            <div class="d-flex flex-column">
              <span>
                Turno global:
                #{{ item.turno?.numero_global || item.turno?.numero || item.turno?.id }}
              </span>
              <span class="text-caption text-medium-emphasis">
                Turno servicio:
                <span v-if="item.turno?.numero_servicio">
                  {{ item.turno?.servicio?.codigo || 'SERV' }}
                  #{{ item.turno?.numero_servicio }}
                </span>
                <span v-else>{{ item.turno?.servicio?.codigo || 'SERV' }}</span>
                · {{ item.turno?.placa || '—' }} ·
                {{ item.turno?.servicio?.nombre || item.turno?.servicio?.codigo || '—' }}
              </span>
            </div>
          </template>

          <!-- Columna Descuento -->
          <template #item.descuento="{ item }">
            <template v-if="item.descuento">
              <v-chip
                size="x-small"
                color="orange-darken-2"
                variant="tonal"
                prepend-icon="mdi-tag-check"
              >
                {{ item.descuento.nombre }}
              </v-chip>
              <div class="text-caption text-medium-emphasis mt-1">
                <v-icon size="12" class="mr-1">
                  {{ item.descuento_origen === 'dateo' ? 'mdi-calendar-check' : 'mdi-cash-register' }}
                </v-icon>
                {{ item.descuento_origen === 'dateo' ? 'Pre-marcado dateo' : 'Aplicado en caja' }}
              </div>
            </template>
            <span v-else class="text-medium-emphasis text-caption">—</span>
          </template>

          <template #item.valor_unitario="{ item }">{{ formatCOP(item.valor_unitario) }}</template>
          <template #item.valor_cliente="{ item }">{{ formatCOP(item.valor_cliente ?? 0) }}</template>
          <template #item.valor_total="{ item }">{{ formatCOP(item.valor_total) }}</template>
          <template #item.asesor="{ item }">{{ item.asesor?.nombre || '—' }}</template>
          <template #item.convenio="{ item }">{{ item.convenio?.nombre || '—' }}</template>
          <template #item.generado_at="{ item }">{{ formatDateTime(item.generado_at) }}</template>

          <template #item.acciones="{ item }">
            <div class="d-flex gap-1">
              <v-btn size="small" variant="text" icon="mdi-eye" @click="verDetalle(item)" />
              <v-btn
                v-if="item.estado === 'PENDIENTE'"
                size="small" variant="text" color="warning"
                @click="confirmAprobar(item.id)" icon="mdi-check-decagram"
              />
              <v-btn
                v-if="item.estado === 'APROBADA'"
                size="small" variant="text" color="success"
                @click="confirmPagar(item.id)" icon="mdi-cash-multiple"
              />
              <v-btn
                v-if="item.estado === 'PENDIENTE' || item.estado === 'APROBADA'"
                size="small" variant="text" color="error"
                @click="confirmAnular(item.id)" icon="mdi-cancel"
              />
            </div>
          </template>
        </v-data-table-server>
      </template>

      <!-- ====== TAB METAS MENSUALES ====== -->
      <template v-else>
        <v-card-text class="pt-5">
          <div class="mb-4 text-subtitle-1 font-weight-medium">
            Metas mensuales de RTM por asesor
          </div>
          <v-row dense class="mb-2">
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="valorRtmMoto"
                label="Valor RTM Motos" prefix="$"
                variant="outlined" density="comfortable" type="number" hide-details
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="valorRtmVehiculo"
                label="Valor RTM Vehículos" prefix="$"
                variant="outlined" density="comfortable" type="number" hide-details
              />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <div class="text-caption text-medium-emphasis">
                Estos valores se usan para estimar la facturación RTM y la comisión de la meta mensual.
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-data-table
          class="px-4 pb-4"
          :headers="metaHeaders"
          :items="metaRows"
          :loading="metaLoading"
          item-key="asesor_id"
        >
          <template #item.asesor="{ item }">{{ item.asesor_nombre }}</template>
          <template #item.rtm_motos="{ item }">{{ item.rtm_motos || 0 }}</template>
          <template #item.rtm_vehiculos="{ item }">{{ item.rtm_vehiculos || 0 }}</template>
          <template #item.total_rtm="{ item }">{{ calcTotalRtm(item) }}</template>
          <template #item.meta_rtm="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ formatCOP(getMetaDinero(item)) }}</span>
            <span v-else>—</span>
          </template>
          <template #item.avance="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ calcAvance(item).toFixed(1) }}%</span>
            <span v-else>—</span>
          </template>
          <template #item.faltante="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ formatCOP(calcFaltante(item)) }}</span>
            <span v-else>—</span>
          </template>
          <template #item.porcentaje_comision_meta="{ item }">
            {{ (item.porcentaje_comision_meta ?? 0) }}%
          </template>
          <template #item.comision_estimada="{ item }">
            {{ formatCOP(calcComisionMeta(item)) }}
          </template>
        </v-data-table>
      </template>
    </v-card>

    <!-- Diálogo confirmación -->
    <v-dialog v-model="dialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">{{ dialog.title }}</v-card-title>
        <v-card-text>{{ dialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.visible = false">Cancelar</v-btn>
          <v-btn :color="dialog.color" @click="dialog.onConfirm">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🧾 Modal de detalle -->
    <v-dialog v-model="detailDialog.visible" max-width="760" scrollable>
      <v-card v-if="detailDialog.item">
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          <span>Detalle comisión #{{ detailDialog.item.id }}</span>
          <v-chip :color="estadoColor(detailDialog.item.estado)" size="small" variant="flat">
            {{ detailDialog.item.estado }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-card-text class="pt-4">
          <!-- 🆕 Skeleton mientras se carga el detalle completo -->
          <v-skeleton-loader v-if="detailDialog.loading" type="card, card" />

          <template v-else>
            <!-- SECCIÓN DE RECURRENCIA — 3 ESTADOS -->
            <v-card
              v-if="detailDialog.item.turno"
              class="mb-4"
              variant="tonal"
              :color="tipoClienteColor(detailDialog.item.turno)"
            >
              <v-card-title class="d-flex align-center gap-2 text-subtitle-1">
                <v-icon>{{ tipoClienteIcono(detailDialog.item.turno) }}</v-icon>
                {{ tipoClienteLabel(detailDialog.item.turno) }}
              </v-card-title>
              <v-card-text>
                <!-- RECURRENTE -->
                <template v-if="detailDialog.item.turno.es_recurrente && !detailDialog.item.turno.es_recuperacion">
                  <v-row dense>
                    <v-col cols="12" md="4">
                      <div class="text-body-2">
                        <strong>Última visita:</strong><br />
                        {{ formatDateTime(detailDialog.item.turno.fecha_ultima_visita) }}
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-body-2">
                        <strong>Meses transcurridos:</strong><br />
                        {{ detailDialog.item.turno.meses_desde_ultima_visita || '—' }} meses
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-body-2">
                        <strong>Turno anterior:</strong><br />
                        #{{ detailDialog.item.turno.ultimo_turno_id || '—' }}
                      </div>
                    </v-col>
                    <v-col cols="12" class="mt-2">
                      <v-divider />
                      <div class="text-caption text-medium-emphasis mt-2">
                        🔄 <strong>Dateo recurrente:</strong>
                        El cliente vino hace {{ detailDialog.item.turno.meses_desde_ultima_visita }} meses
                        (dentro del umbral). Se aplicó valor reducido de dateo recurrente.
                      </div>
                    </v-col>
                  </v-row>
                </template>

                <!-- RECUPERACIÓN -->
                <template v-else-if="detailDialog.item.turno.es_recuperacion">
                  <v-row dense>
                    <v-col cols="12" md="4">
                      <div class="text-body-2">
                        <strong>Última visita:</strong><br />
                        {{ formatDateTime(detailDialog.item.turno.fecha_ultima_visita) }}
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-body-2">
                        <strong>Meses transcurridos:</strong><br />
                        {{ detailDialog.item.turno.meses_desde_ultima_visita || '—' }} meses
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-body-2">
                        <strong>Turno anterior:</strong><br />
                        #{{ detailDialog.item.turno.ultimo_turno_id || '—' }}
                      </div>
                    </v-col>
                    <v-col cols="12" class="mt-2">
                      <v-divider />
                      <div class="text-caption text-medium-emphasis mt-2">
                        💛 <strong>Dateo recuperación:</strong>
                        El cliente regresó después de {{ detailDialog.item.turno.meses_desde_ultima_visita }} meses
                        (superó el umbral). Se aplicó valor intermedio de dateo recuperación.
                      </div>
                    </v-col>
                  </v-row>
                </template>

                <!-- NUEVO -->
                <template v-else>
                  <div class="text-caption">
                    ✨ <strong>Cliente nuevo:</strong>
                    Primera visita registrada. Se aplica comisión estándar completa de dateo.
                  </div>
                </template>
              </v-card-text>
            </v-card>

            <!-- 🆕 SECCIÓN DESCUENTO INFORMATIVO CON TRAZABILIDAD COMPLETA -->
            <v-card
              v-if="detailDialog.item.descuento"
              class="mb-4"
              variant="tonal"
              color="orange-darken-2"
            >
              <v-card-title class="d-flex align-center gap-2 text-subtitle-1">
                <v-icon>mdi-tag-check</v-icon>
                Descuento informativo aplicado
                <v-chip
                  size="x-small"
                  class="ms-2"
                  :color="detailDialog.item.descuento_origen === 'dateo' ? 'blue' : 'purple'"
                  variant="flat"
                >
                  <v-icon start size="12">
                    {{ detailDialog.item.descuento_origen === 'dateo' ? 'mdi-calendar-check' : 'mdi-cash-register' }}
                  </v-icon>
                  {{ detailDialog.item.descuento_origen === 'dateo' ? 'Pre-marcado en el dateo' : 'Aplicado en caja' }}
                </v-chip>
              </v-card-title>
              <v-card-text>
                <v-row dense>
                  <v-col cols="12" md="4">
                    <div class="text-body-2">
                      <strong>Descuento:</strong>
                      {{ detailDialog.item.descuento.nombre }}
                      <span class="text-caption text-medium-emphasis ms-1">
                        ({{ detailDialog.item.descuento.codigo }})
                      </span>
                    </div>
                  </v-col>

                  <!-- 🆕 Fecha aplicación -->
                  <v-col cols="12" md="4" v-if="detailDialog.item.descuento_aplicado_at">
                    <div class="text-body-2">
                      <strong>Aplicado el:</strong><br />
                      {{ formatDateTime(detailDialog.item.descuento_aplicado_at) }}
                    </div>
                  </v-col>

                  <!-- 🆕 Cajero que confirmó el ticket -->
                  <v-col cols="12" md="4" v-if="detailDialog.item.descuento_aplicado_por">
                    <div class="text-body-2">
                      <strong>Confirmado por (cajero):</strong><br />
                      <span class="font-weight-medium">{{ detailDialog.item.descuento_aplicado_por.nombre }}</span>
                    </div>
                  </v-col>

                  <!-- 🆕 Autorizador (solo origen caja) -->
                  <v-col
                    cols="12" md="4"
                    v-if="detailDialog.item.descuento_origen === 'caja' && detailDialog.item.descuento_autorizado_por"
                  >
                    <div class="text-body-2">
                      <strong>Autorizado por:</strong><br />
                      <span class="font-weight-medium">{{ detailDialog.item.descuento_autorizado_por.nombre }}</span>
                    </div>
                  </v-col>

                  <v-col cols="12" class="mt-2">
                    <v-divider class="mb-2" />
                    <div class="text-caption text-medium-emphasis">
                      <strong>🏷️ Efecto:</strong>
                      La comisión de este dateo se calculó con el valor básico de recurrencia
                      en lugar del valor nuevo directo.
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- INFORMACIÓN GENERAL -->
            <v-row dense>
              <v-col cols="12" md="6">
                <strong>Generado:</strong>
                <div>{{ formatDateTime(detailDialog.item.generado_at) }}</div>
              </v-col>
              <v-col cols="12" md="6">
                <strong>Asesor:</strong>
                <div>{{ detailDialog.item.asesor?.nombre || '—' }}</div>
                <div class="text-caption text-medium-emphasis">
                  Comisión asesor (dateo):
                  <strong>{{ formatCOP(detailDialog.item.valor_unitario) }}</strong>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <strong>Convenio:</strong>
                <div>{{ detailDialog.item.convenio?.nombre || '—' }}</div>
                <div
                  v-if="detailDialog.item.valor_cliente && detailDialog.item.valor_cliente > 0"
                  class="text-caption text-medium-emphasis"
                >
                  Comisión convenio (incentivo):
                  <strong>{{ formatCOP(detailDialog.item.valor_cliente) }}</strong>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <strong>Turno global:</strong>
                <div>
                  #{{ detailDialog.item.turno?.numero_global
                    || detailDialog.item.turno?.numero
                    || detailDialog.item.turno?.id
                    || '—' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Fecha turno: {{ formatDateTime(detailDialog.item.turno?.fecha) }}
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <strong>Turno servicio:</strong>
                <div>
                  <span v-if="detailDialog.item.turno?.numero_servicio">
                    {{ detailDialog.item.turno?.servicio?.codigo || 'SERV' }}
                    #{{ detailDialog.item.turno?.numero_servicio }}
                  </span>
                  <span v-else>{{ detailDialog.item.turno?.servicio?.codigo || 'SERV' }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ detailDialog.item.turno?.placa || '—' }} ·
                  {{ detailDialog.item.turno?.servicio?.nombre || detailDialog.item.turno?.servicio?.codigo || '—' }}
                </div>
              </v-col>

              <v-col cols="12" class="mt-2"><v-divider /></v-col>

              <v-col cols="12" md="4">
                <strong>Cantidad:</strong>
                <div>{{ detailDialog.item.cantidad }}</div>
              </v-col>
              <v-col cols="12" md="4">
                <strong>Valor dateo (asesor):</strong>
                <div>{{ formatCOP(detailDialog.item.valor_unitario) }}</div>
              </v-col>
              <v-col cols="12" md="4">
                <strong>Incentivo (convenio):</strong>
                <div>{{ formatCOP(detailDialog.item.valor_cliente ?? 0) }}</div>
              </v-col>

              <v-col cols="12" class="mt-2"><v-divider /></v-col>

              <v-col cols="12" class="text-right">
                <strong>Total comisión:</strong>
                <div class="text-h6">{{ formatCOP(detailDialog.item.valor_total) }}</div>
              </v-col>
            </v-row>
          </template>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  listComisiones,
  getComision,
  aprobarComision,
  pagarComision,
  anularComision,
  listAgentesCaptacion,
  formatCOP,
  listMetasMensuales,
  type ComisionListItem,
  type ComisionDetail,
  type ComisionEstado,
  type MetaMensualRow,
  type TurnoLight,
} from '@/services/comisionesService'

interface MetaMensualResumen extends MetaMensualRow {
  meta_global_rtm?: number | null
  porcentaje_comision?: number | null
}

/* ── Estado general ── */
const activeTab = ref<'detalle' | 'metas'>('detalle')

const filters = ref<{ mes: string; asesorId: number | null; estado: ComisionEstado | '' }>({
  mes: '',
  asesorId: null,
  estado: '',
})

/* ── Tabla detalle ── */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Tipo cliente', key: 'tipo_cliente', sortable: false },
  { title: 'Turno', key: 'turno', sortable: false },
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Convenio', key: 'convenio', sortable: false },
  { title: 'Descuento', key: 'descuento', sortable: false },
  { title: 'Valor dateo (asesor)', key: 'valor_unitario', sortable: true },
  { title: 'Incentivo (convenio)', key: 'valor_cliente', sortable: false },
  { title: 'Valor total', key: 'valor_total', sortable: true },
  { title: 'Generado', key: 'generado_at', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const rows = ref<ComisionListItem[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([{ key: 'id', order: 'desc' }])
const loading = ref(false)

/* ── Tabla metas ── */
const metaHeaders = [
  { title: 'Asesor', key: 'asesor' },
  { title: 'RTM Motos', key: 'rtm_motos' },
  { title: 'RTM Vehículos', key: 'rtm_vehiculos' },
  { title: 'Total RTM', key: 'total_rtm' },
  { title: 'Meta facturación RTM', key: 'meta_rtm' },
  { title: '% Avance', key: 'avance' },
  { title: 'Faltante ($)', key: 'faltante' },
  { title: '% Comisión Meta', key: 'porcentaje_comision_meta' },
  { title: 'Comisión estimada', key: 'comision_estimada' },
]

const metaRows = ref<MetaMensualRow[]>([])
const metaLoading = ref(false)
const valorRtmMoto = ref(126100)
const valorRtmVehiculo = ref(208738)

/* ── Catálogos ── */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)

const estadoItems = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Aprobada', value: 'APROBADA' },
  { label: 'Pagada', value: 'PAGADA' },
  { label: 'Anulada', value: 'ANULADA' },
]

/* ── Helpers ── */
function normalizeTipo(value?: string | null) {
  return (value ?? '').toString().toUpperCase().trim()
}

function tipoClienteLabel(turno?: TurnoLight | null): string {
  if (!turno) return '—'
  if (turno.es_recuperacion) return '💛 Recuperación'
  if (turno.es_recurrente) return '🔄 Recurrente'
  return '🆕 Nuevo'
}

function tipoClienteColor(turno?: TurnoLight | null): string {
  if (!turno) return 'grey'
  if (turno.es_recuperacion) return 'amber-darken-2'
  if (turno.es_recurrente) return 'warning'
  return 'success'
}

function tipoClienteIcono(turno?: TurnoLight | null): string {
  if (!turno) return 'mdi-help-circle'
  if (turno.es_recuperacion) return 'mdi-account-reactivate'
  if (turno.es_recurrente) return 'mdi-account-clock'
  return 'mdi-account-star'
}

const totalPagina = computed(() =>
  rows.value.reduce((acc, r) => acc + (r.valor_total || 0), 0),
)
const pendientesPagina = computed(() => rows.value.filter((r) => r.estado === 'PENDIENTE').length)
const pagadasPagina = computed(() => rows.value.filter((r) => r.estado === 'PAGADA').length)

function estadoColor(e: ComisionEstado) {
  switch (e) {
    case 'PENDIENTE': return 'warning'
    case 'APROBADA':  return 'info'
    case 'PAGADA':    return 'success'
    case 'ANULADA':   return 'error'
    default:          return undefined
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(d)
}

/* ── Carga de datos ── */
async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

async function loadItems() {
  loading.value = true
  try {
    const sort =
      Array.isArray(sortBy.value) && sortBy.value[0]
        ? sortBy.value[0]
        : { key: 'id', order: 'desc' as const }

    const res = await listComisiones({
      page: page.value,
      perPage: itemsPerPage.value,
      mes: filters.value.mes || undefined,
      asesorId: filters.value.asesorId || undefined,
      estado: filters.value.estado || undefined,
      sortBy: sort.key,
      order: sort.order,
    })
    rows.value = res.data
    totalItems.value = res.total
  } catch {
    rows.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

function getDefaultMes() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

async function loadMetas() {
  metaLoading.value = true
  try {
    let mes = filters.value.mes
    if (!mes) {
      mes = getDefaultMes()
      filters.value.mes = mes
    }
    const res = await listMetasMensuales({ mes, asesorId: filters.value.asesorId || undefined })
    let data = res.data as MetaMensualRow[]
    data = data.filter((r) => !normalizeTipo(r.asesor_tipo).includes('CONVENIO'))
    metaRows.value = data

    const rowMoto = metaRows.value.find((r) => r.valor_rtm_moto && r.valor_rtm_moto > 0)
    if (rowMoto && typeof rowMoto.valor_rtm_moto === 'number') valorRtmMoto.value = rowMoto.valor_rtm_moto
    const rowVehiculo = metaRows.value.find((r) => r.valor_rtm_vehiculo && r.valor_rtm_vehiculo > 0)
    if (rowVehiculo && typeof rowVehiculo.valor_rtm_vehiculo === 'number') valorRtmVehiculo.value = rowVehiculo.valor_rtm_vehiculo
  } catch {
    metaRows.value = []
  } finally {
    metaLoading.value = false
  }
}

function calcTotalRtm(item: MetaMensualRow): number {
  return (item.rtm_motos || 0) + (item.rtm_vehiculos || 0)
}

function getMetaDinero(item: MetaMensualRow): number {
  const ext = item as MetaMensualResumen
  const raw = ext.meta_global_rtm ?? item.meta_rtm ?? item.meta_mensual ?? 0
  return Number(raw) || 0
}

function getTotalFacturacion(item: MetaMensualRow): number {
  const backend = item.total_facturacion_global ?? null
  if (backend != null && !Number.isNaN(backend)) return backend
  return (item.rtm_motos || 0) * valorRtmMoto.value + (item.rtm_vehiculos || 0) * valorRtmVehiculo.value
}

function calcAvance(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  if (!metaDinero) return 0
  return (getTotalFacturacion(item) / metaDinero) * 100
}

function calcFaltante(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  if (!metaDinero) return 0
  const diff = metaDinero - getTotalFacturacion(item)
  return diff > 0 ? diff : 0
}

function calcComisionMeta(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  const porcentaje = item.porcentaje_comision_meta ?? (item as MetaMensualResumen).porcentaje_comision ?? 0
  if (!metaDinero || !porcentaje) return 0
  const totalFacturacion = getTotalFacturacion(item)
  if (totalFacturacion < metaDinero) return 0
  return (totalFacturacion * porcentaje) / 100
}

/* ── Acciones ── */
function reload() {
  if (activeTab.value === 'detalle') { page.value = 1; loadItems() }
  else loadMetas()
}

function resetFilters() {
  filters.value = { mes: '', asesorId: null, estado: '' }
  reload()
}

const dialog = ref<{
  visible: boolean; title: string; message: string; color: string; onConfirm: () => void
}>({ visible: false, title: '', message: '', color: 'primary', onConfirm: () => {} })

function openConfirm(title: string, message: string, color: string, onConfirm: () => void) {
  dialog.value = { visible: true, title, message, color, onConfirm }
}

function confirmAprobar(id: number) {
  openConfirm('Aprobar comisión', '¿Confirmas aprobar esta comisión?', 'info', async () => {
    dialog.value.visible = false; await aprobarComision(id); loadItems()
  })
}
function confirmPagar(id: number) {
  openConfirm('Pagar comisión', '¿Confirmas registrar el pago?', 'success', async () => {
    dialog.value.visible = false; await pagarComision(id); loadItems()
  })
}
function confirmAnular(id: number) {
  openConfirm('Anular comisión', '¿Seguro que deseas anularla?', 'error', async () => {
    dialog.value.visible = false; await anularComision(id); loadItems()
  })
}

// 🆕 CAMBIO 1: tipo ComisionDetail + flag loading
const detailDialog = ref<{ visible: boolean; item: ComisionDetail | null; loading: boolean }>({
  visible: false,
  item: null,
  loading: false,
})

// 🆕 CAMBIO 2: llama getComision para traer trazabilidad completa (cajero + autorizador)
async function verDetalle(item: ComisionListItem) {
  detailDialog.value = { visible: true, item: item as ComisionDetail, loading: true }
  try {
    const full = await getComision(item.id)
    detailDialog.value.item = full
  } finally {
    detailDialog.value.loading = false
  }
}

watch(activeTab, (val) => {
  if (val === 'metas' && metaRows.value.length === 0) loadMetas()
})

/* Init */
loadAsesores()
loadItems()
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
