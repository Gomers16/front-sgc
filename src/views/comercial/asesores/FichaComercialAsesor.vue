<template>
  <v-container class="py-6">
    <v-card elevation="10" class="rounded-2xl">
      <!-- Header -->
      <v-card-title class="d-flex justify-space-between align-center flex-wrap py-5">
        <div class="d-flex align-center">
          <v-avatar class="mr-4" size="46" color="primary">
            <v-icon>mdi-account-tie</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Ficha comercial</div>
            <div class="text-medium-emphasis">
              <template v-if="asesor">
                {{ asesor.nombre }} • {{ humanTipo(asesor.tipo) }}
              </template>
              <template v-else>Cargando…</template>
            </div>
          </div>
        </div>

        <!-- Filtros de periodo -->
        <div class="d-flex align-center flex-wrap gap-2">
          <v-text-field
            v-model="filtros.desde"
            type="date"
            label="Desde"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
          />
          <v-text-field
            v-model="filtros.hasta"
            type="date"
            label="Hasta"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
          />

          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="tonal" prepend-icon="mdi-calendar-range">
                Rangos rápidos
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="setUltimosNDias(7)">
                <v-list-item-title>Últimos 7 días</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setUltimosNDias(30)">
                <v-list-item-title>Últimos 30 días</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setUltimosNDias(90)">
                <v-list-item-title>Últimos 90 días</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setEsteMes()">
                <v-list-item-title>Este mes</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn color="primary" :loading="loading" @click="reload">Aplicar</v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetRango">Últimos 30 días</v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <!-- Mensajes -->
      <v-card-text class="py-5">
        <v-expand-transition>
          <v-alert v-if="globalError" type="error" variant="tonal" class="mb-5">
            {{ globalError }}
          </v-alert>
        </v-expand-transition>

        <!-- Datos + KPIs -->
        <v-row class="mb-6">
          <v-col cols="12" md="6" lg="5">
            <v-card variant="outlined" rounded="lg">
              <v-card-title class="text-subtitle-1 font-weight-bold">
                Datos del asesor
              </v-card-title>
              <v-card-text class="pt-1">
                <template v-if="asesor && !loading">
                  <div class="mb-1"><strong>Nombre:</strong> {{ asesor.nombre ?? '—' }}</div>
                  <div class="mb-1"><strong>Tipo:</strong> {{ humanTipo(asesor?.tipo) }}</div>
                  <div class="mb-1">
                    <strong>Correo:</strong> {{ asesor.email || asesor.correo || '—' }}
                  </div>
                  <div class="mb-1"><strong>Teléfono:</strong> {{ asesor.telefono ?? '—' }}</div>
                  <div class="mb-1"><strong>Documento:</strong> {{ docFull(asesor) }}</div>
                  <div class="mb-1">
                    <strong>Estado:</strong>
                    <v-chip size="small" :color="asesor?.activo ? 'success' : 'error'" variant="flat">
                      {{ asesor?.activo ? 'Activo' : 'Inactivo' }}
                    </v-chip>
                  </div>
                </template>
                <template v-else>
                  <v-skeleton-loader type="text@6" />
                </template>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- KPIs + Metas -->
          <v-col cols="12" md="6" lg="7">
            <!-- KPIs fila 1 -->
            <v-row>
              <v-col cols="12" sm="6" lg="3">
                <div class="kpi-card">
                  <div class="kpi-title">Prospectos</div>
                  <div class="kpi-value">{{ kpi.prospectos }}</div>
                  <div class="kpi-sub">en el rango</div>
                </div>
              </v-col>

              <!-- KPI Convenios: oculto para asesores convenio -->
              <v-col cols="12" sm="6" lg="3" v-if="!esAsesorConvenio">
                <div class="kpi-card">
                  <div class="kpi-title">Convenios</div>
                  <div class="kpi-value">{{ kpi.convenios }}</div>
                  <div class="kpi-sub">asignados</div>
                </div>
              </v-col>

              <v-col cols="12" sm="6" lg="3">
                <div class="kpi-card">
                  <div class="kpi-title">Dateos exitosos</div>
                  <div class="kpi-value text-success">{{ kpi.dateosExitosos }}</div>
                  <div class="kpi-sub">en el rango</div>
                </div>
              </v-col>

              <v-col cols="12" sm="6" lg="3">
                <div class="kpi-card">
                  <div class="kpi-title">Generado por dateos</div>
                  <div class="kpi-value">
                    {{ money(kpi.montoGenerado) }}
                  </div>
                  <div class="kpi-sub">
                    {{ esAsesorConvenio ? 'comisión total (dateo + placa)' : 'comisión del asesor' }}
                  </div>
                </div>
              </v-col>
            </v-row>

            <!-- KPIs fila 2 + Metas -->
            <v-row class="mt-1">
              <v-col cols="12" sm="6" :lg="esAsesorComercial ? 4 : 6">
                <div class="kpi-card">
                  <div class="kpi-title">Pagos registrados</div>
                  <div class="kpi-value">{{ money(kpi.pagosRegistrados) }}</div>
                  <div class="kpi-sub">COP</div>
                </div>
              </v-col>

              <v-col cols="12" sm="6" :lg="esAsesorComercial ? 4 : 6">
                <div class="kpi-card">
                  <div class="kpi-title">Saldo estimado</div>
                  <div class="kpi-value" :class="saldoEstimado < 0 ? 'text-error' : ''">
                    {{ money(saldoEstimado) }}
                  </div>
                  <div class="kpi-sub">comisiones - pagos</div>
                </div>
              </v-col>

              <!-- Metas mensuales: SOLO si es asesor comercial -->
              <v-col cols="12" sm="12" lg="4" v-if="esAsesorComercial">
                <v-card variant="outlined" rounded="lg" class="h-100 d-flex flex-column">
                  <v-card-title
                    class="text-subtitle-2 font-weight-bold d-flex justify-space-between align-center"
                  >
                    Metas mensuales
                    <v-btn
                      size="x-small"
                      variant="tonal"
                      prepend-icon="mdi-target"
                      @click="metasDialogVisible = true"
                    >
                      Ver metas
                    </v-btn>
                  </v-card-title>
                  <v-card-text class="pt-1 text-body-2">
                    <template v-if="metaResumen">
                      <div class="mb-1">
                        <strong>Mes:</strong>
                        {{ metaResumen.mesLabel }}
                      </div>
                      <div class="mb-1">
                        <strong>Meta RTM:</strong>
                        {{ money(metaResumen.metaDinero) }}
                      </div>
                      <div class="mb-1">
                        <strong>Avance:</strong>
                        {{ metaResumen.avance.toFixed(1) }}%
                      </div>
                      <div class="mb-1">
                        <strong>Faltante:</strong>
                        {{ money(metaResumen.faltante) }}
                      </div>
                      <div class="mb-1">
                        <strong>Comisión estimada:</strong>
                        {{ money(metaResumen.comisionEstimada) }}
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-medium-emphasis">
                        Sin configuración de meta RTM para este asesor.
                      </span>
                    </template>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="12" lg="12" class="mt-2">
                <v-alert type="info" variant="tonal" class="h-100 d-flex align-center">
                  Periodo: <strong class="ml-1">{{ rangoLegible }}</strong>
                </v-alert>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Tabs -->
        <v-tabs v-model="tab" align-tabs="start" class="mb-2">
          <v-tab value="prospectos" prepend-icon="mdi-account-search">Prospectos</v-tab>

          <!-- Ocultar pestaña Convenios si es asesor convenio -->
          <v-tab v-if="!esAsesorConvenio" value="convenios" prepend-icon="mdi-handshake">
            Convenios
          </v-tab>

          <v-tab value="dateos" prepend-icon="mdi-clipboard-check-multiple">Dateos</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Prospectos -->
          <v-window-item value="prospectos">
            <div class="d-flex justify-space-between align-center mb-2">
              <div class="text-medium-emphasis">
                <template v-if="verTodosProspectos">
                  <strong>{{ totalProspectosTodos }}</strong> prospecto(s) del asesor (todos).
                </template>
                <template v-else>
                  <strong>{{ totalProspectosEnRango }}</strong> prospecto(s) del asesor en el rango.
                </template>
              </div>
              <v-switch
                v-model="verTodosProspectos"
                color="primary"
                inset
                label="Ver todos los prospectos"
                hide-details
              />
            </div>

            <v-data-table
              :items="prospectosVisibles"
              :headers="headersProspectos"
              :loading="loading"
              class="elevation-1"
              item-key="id"
              :no-data-text="'Sin prospectos para los filtros'"
            >
              <template #loading>
                <v-skeleton-loader type="table-row@6" />
              </template>

              <!-- SOAT -->
              <template #item.soat="{ item }">
                <div class="doc-cell">
                  <v-chip :color="docColor(item.soat_vigente)" size="small" variant="flat" label>
                    {{ docText(item.soat_vigente) }}
                  </v-chip>
                  <span class="doc-date">{{ formatFechaDoc(item.soat_vencimiento) }}</span>
                </div>
              </template>

              <!-- RTM -->
              <template #item.tecno="{ item }">
                <div class="doc-cell">
                  <v-chip :color="docColor(item.tecno_vigente)" size="small" variant="flat" label>
                    {{ docText(item.tecno_vigente) }}
                  </v-chip>
                  <span class="doc-date">{{ formatFechaDoc(item.tecno_vencimiento) }}</span>
                </div>
              </template>

              <!-- Preventiva -->
              <template #item.preventiva="{ item }">
                <div class="doc-cell">
                  <v-chip :color="docColor(item.preventiva_vigente)" size="small" variant="flat" label>
                    {{ docText(item.preventiva_vigente) }}
                  </v-chip>
                  <span class="doc-date">{{ formatFechaDoc(item.preventiva_vencimiento) }}</span>
                </div>
              </template>

              <!-- Peritaje -->
              <template #item.peritaje="{ item }">
                <div class="doc-cell">
                  <v-chip
                    :color="item.peritaje_ultima_fecha ? 'success' : 'grey-darken-1'"
                    size="small"
                    variant="flat"
                    label
                  >
                    {{ item.peritaje_ultima_fecha ? 'Registrado' : 'Sin datos' }}
                  </v-chip>
                  <span class="doc-date">{{ formatFechaDoc(item.peritaje_ultima_fecha) }}</span>
                </div>
              </template>

              <!-- Acciones -->
              <template #item.acciones="{ item }">
                <div class="d-flex gap-1">
                  <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-eye"
                    @click="verProspecto(item.id)"
                  />
                </div>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Convenios: oculto si es asesor convenio -->
          <v-window-item value="convenios" v-if="!esAsesorConvenio">
            <v-data-table
              :items="convenios"
              :headers="headersConvenios"
              :loading="loading"
              class="elevation-1"
              item-key="id"
              :no-data-text="'Sin convenios asignados'"
            >
              <template #loading>
                <v-skeleton-loader type="table-row@6" />
              </template>
              <template #item.vigencia="{ item }">
                {{ vigenciaText(item) }}
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Dateos -->
          <v-window-item value="dateos">
            <div class="d-flex justify-space-between align-center mb-2">
              <div class="text-medium-emphasis">
                <strong>{{ totalDateosFiltrados }}</strong> dateo(s) ·
                Exitosos: <strong>{{ totalExitosos }}</strong> ·
                {{ esAsesorConvenio ? 'Monto total (comisión convenio):' : 'Monto total (comisión asesor):' }}
                <strong>{{ money(totalComisionAsesor) }}</strong>
              </div>
              <div class="d-flex align-center" style="gap:8px">
                <v-switch
                  v-model="verTodosDateos"
                  color="primary"
                  inset
                  label="Ver todos los dateos"
                  hide-details
                />
                <v-switch
                  v-model="filtrosDateo.soloExitosos"
                  color="success"
                  inset
                  label="Solo exitosos"
                  hide-details
                />
                <v-btn
                  size="small"
                  variant="tonal"
                  prepend-icon="mdi-download"
                  @click="exportCsv(false)"
                >
                  Exportar CSV
                </v-btn>
                <v-btn
                  size="small"
                  color="success"
                  prepend-icon="mdi-download"
                  @click="exportCsv(true)"
                >
                  CSV (solo exitosos)
                </v-btn>
              </div>
            </div>

            <v-data-table
              :items="dateosFiltrados"
              :headers="headersDateos"
              :loading="loading"
              class="elevation-1"
              item-key="id"
              :no-data-text="'Sin dateos para los filtros'"
            >
              <template #loading>
                <v-skeleton-loader type="table-row@6" />
              </template>

              <!-- Foto -->
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

              <!-- Convenio -->
              <template #item.convenio="{ item }">
                <v-chip v-if="item.convenio?.nombre" size="small" variant="flat">
                  {{ item.convenio.nombre }}
                </v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </template>

              <!-- Estado -->
              <template #item.resultado="{ item }">
                <v-chip :color="chipColorResultado(item.resultado)" size="small" variant="flat">
                  {{ textoResultado(item.resultado) }}
                </v-chip>
              </template>

              <!-- Turno -->
              <template #item.turnoInfo="{ item }">
                <div
                  v-if="item.turnoInfo"
                  class="d-flex align-center justify-center"
                  style="gap:6px"
                >
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

              <!-- Comisión (dinámica según rol) -->
              <template #item.comisionAsesor="{ item }">
                {{ money(getComisionPorRolParaDateo(item.id)) }}
              </template>

              <!-- Fecha creado -->
              <template #item.created_at="{ item }">
                {{ item.created_at_fmt || fmtDate(item.created_at) }}
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
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

    <!-- Diálogo de metas: SOLO si es asesor comercial -->
    <v-dialog v-if="esAsesorComercial" v-model="metasDialogVisible" max-width="820">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <div>
            Metas mensuales RTM
            <div class="text-caption text-medium-emphasis">
              {{ asesor?.nombre || 'Asesor' }}
            </div>
          </div>
          <div class="d-flex align-center" style="gap:8px">
            <v-text-field
              v-model="metaMes"
              type="month"
              label="Mes"
              density="comfortable"
              variant="outlined"
              hide-details
              style="max-width: 160px"
            />
            <v-btn color="primary" size="small" :loading="metasLoading" @click="loadMetasAsesor">
              Actualizar
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersMetas"
            :items="metasRows"
            :loading="metasLoading"
            density="comfortable"
            item-key="asesor_id"
            :no-data-text="'Sin metas configuradas para este mes'"
          >
            <template #item.asesor="{ item }">
              {{ item.asesor_nombre || asesor?.nombre || '—' }}
            </template>

            <template #item.rtm_motos="{ item }">
              {{ item.rtm_motos || 0 }}
            </template>

            <template #item.rtm_vehiculos="{ item }">
              {{ item.rtm_vehiculos || 0 }}
            </template>

            <template #item.total_rtm="{ item }">
              {{ calcTotalRtm(item) }}
            </template>

            <template #item.meta_rtm="{ item }">
              <span v-if="getMetaDinero(item) > 0">
                {{ money(getMetaDinero(item)) }}
              </span>
              <span v-else>—</span>
            </template>

            <template #item.avance="{ item }">
              <span v-if="getMetaDinero(item) > 0">
                {{ calcAvance(item).toFixed(1) }}%
              </span>
              <span v-else>—</span>
            </template>

            <template #item.faltante="{ item }">
              <span v-if="getMetaDinero(item) > 0">
                {{ money(calcFaltante(item)) }}
              </span>
              <span v-else>—</span>
            </template>

            <template #item.porcentaje_comision_meta="{ item }">
              {{ (item.porcentaje_comision_meta ?? item.porcentaje_comision ?? 0) }}%
            </template>

            <template #item.comision_estimada="{ item }">
              {{ money(calcComisionMeta(item)) }}
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="metasDialogVisible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '@/services/http'
import { listDateos, type Dateo, formatDateTime } from '@/services/dateosService'
import {
  listComisiones,
  type ComisionListItem,
  listMetasMensuales,
  type MetaMensualRow,
} from '@/services/comisionesService'
import {
  listProspectos,
  type ProspectoDetail,
  formatDate as formatFechaDocBase,
} from '@/services/prospectosService'

/* ===== Tipos locales ===== */
type Asesor = {
  id: number
  nombre: string
  tipo?: string | null
  email?: string | null
  correo?: string | null
  telefono?: string | null
  doc_tipo?: string | null
  doc_numero?: string | null
  documento?: string | null
  activo?: boolean | 0 | 1
}

type Convenio = {
  id: number
  nombre: string
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
}

/* ===== Router / Route ===== */
const router = useRouter()
const route = useRoute()
const asesorId = Number(route.params.id)
const API = '/api'

/* ===== Estado principal ===== */
const asesor = ref<Asesor | null>(null)
const prospectos = ref<ProspectoDetail[]>([])
const convenios = ref<Convenio[]>([])
const dateos = ref<Dateo[]>([])
const comisiones = ref<ComisionListItem[]>([])
const pagos = ref<{ id: number; valor: number; fecha?: string }[]>([])

const loading = ref(false)
const globalError = ref<string | null>(null)
const tab = ref<'prospectos' | 'convenios' | 'dateos'>('prospectos')

/* ===== Filtros de fecha ===== */
const filtros = ref<{ desde: string; hasta: string }>({ desde: '', hasta: '' })

function toInputDate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
function setUltimosNDias(n: number) {
  const hoy = new Date()
  const desde = new Date()
  desde.setDate(hoy.getDate() - n)
  filtros.value.desde = toInputDate(desde)
  filtros.value.hasta = toInputDate(hoy)
}
function setUltimos30() {
  setUltimosNDias(30)
}
function setEsteMes() {
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  filtros.value.desde = toInputDate(desde)
  filtros.value.hasta = toInputDate(hasta)
}
function resetRango() {
  setUltimos30()
  reload()
}
setUltimos30()

const rangoLegible = computed(() => {
  const f = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString()
  return `${f(filtros.value.desde)} → ${f(filtros.value.hasta)}`
})

/* ===== Headers de tablas ===== */
const headersProspectos = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Teléfono', key: 'telefono', sortable: true },
  { title: 'Placa', key: 'placa', sortable: true },
  { title: 'SOAT', key: 'soat', sortable: false },
  { title: 'RTM', key: 'tecno', sortable: false },
  { title: 'Preventiva', key: 'preventiva', sortable: false },
  { title: 'Peritaje', key: 'peritaje', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
] as const

const headersConvenios = [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'nombre' },
  { title: 'Vigencia', key: 'vigencia' },
] as const

/* ✨ Encabezados de dateos: el título de la columna de comisión cambia según rol */
const headersDateos = computed(() => {
  const tituloComision = esAsesorConvenio.value ? 'Comisión convenio' : 'Comisión asesor'
  return [
    { title: 'ID', key: 'id' },
    { title: 'Foto', key: 'imagen_url' },
    { title: 'Placa', key: 'placa' },
    { title: 'Teléfono', key: 'telefono' },
    { title: 'Convenio', key: 'convenio' },
    { title: 'Estado', key: 'resultado' },
    { title: 'Turno', key: 'turnoInfo', align: 'center' as const },
    { title: tituloComision, key: 'comisionAsesor', align: 'end' as const },
    { title: 'Creado', key: 'created_at' },
  ] as const
})

/* ===== Headers metas (dialogo) ===== */
const headersMetas = [
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

/* ===== Helpers UI/negocio ===== */
function humanTipo(t?: string | null) {
  const v = String(t || '').toUpperCase()
  if (v === 'ASESOR_COMERCIAL') return 'Asesor comercial'
  if (v === 'ASESOR_CONVENIO') return 'Asesor convenio'
  if (v === 'ASESOR_TELEMERCADEO') return 'Asesor telemercadeo'
  return t || '—'
}
function docFull(a?: Asesor | null) {
  if (!a) return '—'
  const tipo = a.doc_tipo || (a as any).tipo_documento || (a as any).tipoDoc || ''
  const num =
    a.doc_numero ||
    (a as any).numero_documento ||
    (a as any).numDocumento ||
    a.documento ||
    (a as any).cedula ||
    ''
  if (tipo || num) return `${tipo} ${num}`.trim()
  return '—'
}
function vigenciaText(c: Convenio) {
  const f = (s?: string | null) => (!s ? '—' : new Date(s as string).toLocaleDateString())
  return `${f(c.vigencia_desde)} – ${f(c.vigencia_hasta)}`
}
function normalizeCreatedAt(obj: any) {
  return (
    obj?.created_at ||
    obj?.createdAt ||
    obj?.fecha ||
    obj?.fecha_creacion ||
    obj?.creado ||
    obj?.created ||
    null
  )
}
function fmtDate(d?: string) {
  if (!d) return '—'
  return formatDateTime(d)
}
function money(n?: number | null) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0)
}
function isExitoso(d: any) {
  const r = String(d.resultado || '').toUpperCase()
  return (
    !!d.exitoso ||
    !!d.consumido_exitoso ||
    ['EXITOSO', 'COMPLETADO', 'ATENDIDO', 'CONVERTIDO'].includes(r)
  )
}

/* Prospectos: helpers de vigencias */
function docColor(v?: boolean | null) {
  if (v === true) return 'success'
  if (v === false) return 'error'
  return 'grey-darken-1'
}
function docText(v?: boolean | null) {
  if (v === true) return 'Vigente'
  if (v === false) return 'Vencido'
  return 'Sin datos'
}
function formatFechaDoc(d?: string | null) {
  return formatFechaDocBase(d || undefined)
}

/* Texto/Color chips dateos */
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

/* ===== Visor de imagen ===== */
const viewer = ref<{ visible: boolean; url: string | null }>({ visible: false, url: null })
function openViewer(url: string) {
  viewer.value = { visible: true, url }
}

/* ===== Mapear comisiones a dateo ===== */
const comisionesPorDateo = computed(() => {
  const map = new Map<number, ComisionListItem[]>()
  for (const c of comisiones.value) {
    const dateoId =
      (c as any).dateo_id ?? (c as any).captacionDateoId ?? (c as any).captacion_dateo_id ?? null
    if (!dateoId) continue
    const key = Number(dateoId)
    if (!map.has(key)) map.set(key, [] as ComisionListItem[])
    map.get(key)!.push(c)
  }
  return map
})

/**
 * 🎯 Comisión dinámica según rol del asesor CON DESGLOSE:
 *  - Asesor comercial:
 *      • CON convenio → solo monto_asesor_comercial (dateo)
 *      • SIN convenio → monto_asesor_comercial + monto_convenio_placa
 *  - Asesor convenio:
 *      • Cuando otros usan su convenio → solo monto_convenio_placa
 *      • Cuando él mismo datea su convenio → monto_asesor_comercial + monto_convenio_placa
 */
function getComisionPorRolParaDateo(dateoId: number): number {
  const arr = comisionesPorDateo.value.get(Number(dateoId)) || []

  // 🟢 ASESOR CONVENIO
  if (esAsesorConvenio.value) {
    return arr.reduce((sum, c: any) => {
      const desg = c.desglose || {}
      const tieneDesg =
        desg && (desg.monto_asesor_comercial != null || desg.monto_convenio_placa != null)

      if (tieneDesg) {
        const montoAsesor = Number(desg.monto_asesor_comercial || 0)
        const montoConvenio = Number(desg.monto_convenio_placa || 0)

        const esConvenioDelAsesor =
          desg.asesor_secundario?.id === asesorId || c.convenio?.id === asesorId

        const esAsesorQueDateo = c.asesor?.id === asesorId

        let total = 0

        // Cuando otros usan su convenio → solo la parte de convenio
        if (esConvenioDelAsesor) total += montoConvenio

        // Cuando él mismo datea → además se suma la parte de asesor
        if (esAsesorQueDateo) total += montoAsesor

        return sum + total
      }

      // 🧩 Fallback para comisiones antiguas sin desglose
      const baseDateo = Number(c.valor_unitario || 0)
      const basePlaca = Number(c.valor_cliente || 0)

      const esConvenioDelAsesorAntiguo = c.convenio?.id === asesorId
      const esAsesorQueDateoAntiguo = c.asesor?.id === asesorId

      let total = 0
      if (esConvenioDelAsesorAntiguo) total += basePlaca
      if (esAsesorQueDateoAntiguo) total += baseDateo

      return sum + total
    }, 0)
  }

  // 🟠 ASESOR COMERCIAL / TELEMERCADEO
  return arr.reduce((sum, c: any) => {
    const desg = c.desglose || {}
    const tieneDesg =
      desg && (desg.monto_asesor_comercial != null || desg.monto_convenio_placa != null)

    if (tieneDesg) {
      const montoAsesor = Number(desg.monto_asesor_comercial || 0)
      const montoConvenio = Number(desg.monto_convenio_placa || 0)

      // Detectar si hay convenio asociado (por desglose o por relación convenio)
      const hayConvenio = !!desg.asesor_secundario || !!desg.convenio || !!c.convenio

      if (hayConvenio) {
        // 💼 Comercial usando convenio → SOLO dateo
        return sum + montoAsesor
      }

      // 💼 Comercial SIN convenio → se lleva dateo + placa
      return sum + montoAsesor + montoConvenio
    }

    // 🧩 Fallback para comisiones antiguas sin desglose
    const baseDateo = Number(c.valor_unitario || 0)
    const basePlaca = Number(c.valor_cliente || 0)
    const hayConvenioAntiguo = !!c.convenio

    if (hayConvenioAntiguo) {
      // Comercial usando convenio → solo la parte de asesor
      return sum + baseDateo
    }

    // Comercial sin convenio → todo para él
    return sum + baseDateo + basePlaca
  }, 0)
}

/**
 * Cálculo del KPI "Generado por dateos"
 * Usamos SIEMPRE la misma lógica de getComisionPorRolParaDateo
 */
async function calcularMontoGenerado(exitosos: any[]) {
  return exitosos.reduce(
    (acc: number, d: any) => acc + getComisionPorRolParaDateo(d.id),
    0,
  )
}

/* ===== Prospectos: ver todos / solo en rango ===== */
const verTodosProspectos = ref(false)

const prospectosEnRango = computed(() => {
  const desde = new Date(filtros.value.desde + 'T00:00:00')
  const hasta = new Date(filtros.value.hasta + 'T23:59:59')
  return prospectos.value.filter((p: any) => {
    const created = p.created_at || p.createdAt || p.asignacion_activa?.fecha_asignacion || null
    if (!created) return true
    const t = new Date(created)
    return t >= desde && t <= hasta
  })
})

const prospectosVisibles = computed(() =>
  verTodosProspectos.value ? prospectos.value : prospectosEnRango.value,
)

const totalProspectosEnRango = computed(() => prospectosEnRango.value.length)
const totalProspectosTodos = computed(() => prospectos.value.length)

/* ===== Filtros Dateos (solo exitosos / ver todos) ===== */
const filtrosDateo = ref<{ soloExitosos: boolean }>({ soloExitosos: false })
const verTodosDateos = ref(false)

const dateosFiltrados = computed(() => {
  const desde = new Date(filtros.value.desde + 'T00:00:00')
  const hasta = new Date(filtros.value.hasta + 'T23:59:59')
  return dateos.value.filter((d: any) => {
    const tRaw = normalizeCreatedAt(d)
    const t = tRaw ? new Date(tRaw) : null
    const enRango = t ? t >= desde && t <= hasta : true
    const pasaRango = verTodosDateos.value ? true : enRango
    const pasaExito = filtrosDateo.value.soloExitosos ? isExitoso(d) : true
    d.created_at = tRaw || d.created_at
    return pasaRango && pasaExito
  })
})

const totalDateosFiltrados = computed(() => dateosFiltrados.value.length)
const totalExitosos = computed(() => dateosFiltrados.value.filter((d) => isExitoso(d)).length)
/* Para KPIs: también mostramos el monto dinámico según rol */
const totalComisionAsesor = computed(() =>
  dateosFiltrados.value
    .filter((d) => isExitoso(d))
    .reduce((acc: number, d: any) => acc + getComisionPorRolParaDateo(d.id), 0),
)

/* ===== KPIs ===== */
const kpi = ref({
  prospectos: 0,
  convenios: 0,
  dateosExitosos: 0,
  montoGenerado: 0, // dinámico por rol
  pagosRegistrados: 0,
})
const saldoEstimado = computed(() => kpi.value.montoGenerado - kpi.value.pagosRegistrados)

/* ===== Detectar tipo de asesor ===== */
function normalizeTipoAgente(t?: string | null) {
  return (t ?? '').toString().toUpperCase().trim()
}
const esAsesorComercial = computed(() => {
  const t = normalizeTipoAgente(asesor.value?.tipo)
  return t.includes('COMERCIAL')
})
const esAsesorConvenio = computed(() => {
  const t = normalizeTipoAgente(asesor.value?.tipo)
  return t.includes('CONVENIO')
})

/* ===== METAS mensuales RTM (solo comerciales) ===== */
function getCurrentMes() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const metasRows = ref<MetaMensualRow[]>([])
const metasLoading = ref(false)
const metasDialogVisible = ref(false)
const metaMes = ref(getCurrentMes())

/* Valores referencias RTM (editables si backend retorna otros) */
const valorRtmMoto = ref(126100)
const valorRtmVehiculo = ref(208738)

function calcTotalRtm(item: MetaMensualRow) {
  return (item.rtm_motos || 0) + (item.rtm_vehiculos || 0)
}
function getMetaDinero(item: MetaMensualRow): number {
  const raw =
    item.meta_global_rtm ?? item.meta_rtm ?? (item as any).meta_mensual ?? item.meta_mensual ?? 0
  return Number(raw) || 0
}
function getTotalFacturacion(item: MetaMensualRow) {
  const backend: any =
    (item as any).total_facturacion_global ?? (item as any).totalFacturacionGlobal ?? null
  if (backend != null && !Number.isNaN(Number(backend))) return Number(backend)

  const totalRtmMotos = item.rtm_motos ?? item.total_rtm_motos ?? 0
  const totalRtmVehiculos = item.rtm_vehiculos ?? item.total_rtm_vehiculos ?? 0
  return totalRtmMotos * valorRtmMoto.value + totalRtmVehiculos * valorRtmVehiculo.value
}
function calcAvance(item: MetaMensualRow) {
  const meta = getMetaDinero(item)
  if (!meta || meta <= 0) return 0
  const total = getTotalFacturacion(item)
  return (total / meta) * 100
}
function calcFaltante(item: MetaMensualRow) {
  const meta = getMetaDinero(item)
  if (!meta || meta <= 0) return 0
  const total = getTotalFacturacion(item)
  const diff = meta - total
  return diff > 0 ? diff : 0
}
function calcComisionMeta(item: MetaMensualRow) {
  const meta = getMetaDinero(item)
  const pct = item.porcentaje_comision_meta ?? (item as any).porcentaje_comision ?? 0
  if (!meta || meta <= 0 || !pct) return 0
  const total = getTotalFacturacion(item)
  if (total < meta) return 0
  return (total * pct) / 100
}

/* resumen card */
const metaResumen = computed(() => {
  const row = metasRows.value[0]
  if (!row) return null
  const metaDinero = getMetaDinero(row)
  if (!metaDinero || metaDinero <= 0) return null
  return {
    mesLabel: metaMes.value,
    metaDinero,
    avance: calcAvance(row),
    faltante: calcFaltante(row),
    comisionEstimada: calcComisionMeta(row),
  }
})

async function loadMetasAsesor() {
  metasLoading.value = true
  try {
    const res = await listMetasMensuales({ mes: metaMes.value, asesorId })
    metasRows.value = res.data

    const row = metasRows.value[0]
    if (row) {
      if (typeof row.valor_rtm_moto === 'number' && row.valor_rtm_moto > 0) {
        valorRtmMoto.value = row.valor_rtm_moto
      }
      if (typeof row.valor_rtm_vehiculo === 'number' && row.valor_rtm_vehiculo > 0) {
        valorRtmVehiculo.value = row.valor_rtm_vehiculo
      }
    }
  } finally {
    metasLoading.value = false
  }
}

/* ===== API helpers ===== */
function normalizeAsesor(raw: any): Asesor | null {
  if (!raw) return null
  const nombre =
    raw.nombre ||
    [raw.nombres, raw.apellidos].filter(Boolean).join(' ') ||
    raw.fullname ||
    raw.displayName ||
    '—'
  const email = raw.email || raw.correo || raw.email_personal || raw?.user?.email || null
  const telefono = raw.telefono || raw.celular || raw.cel || raw.phone || null

  const doc_tipo = raw.doc_tipo || raw.tipo_documento || raw.tipoDoc || null
  const doc_numero =
    raw.doc_numero ||
    raw.numero_documento ||
    raw.numDocumento ||
    raw.documento ||
    raw.cedula ||
    null

  const activo =
    typeof raw.activo !== 'undefined'
      ? !!raw.activo
      : String(raw.estado || '').toUpperCase() === 'ACTIVO'
      ? true
      : undefined

  return {
    id: Number(raw.id),
    nombre,
    tipo: raw.tipo || raw.rol || raw.cargo || null,
    email,
    correo: raw.correo || null,
    telefono,
    doc_tipo,
    doc_numero,
    documento: raw.documento || null,
    activo: (activo as any) ?? true,
  }
}

async function fetchAsesor(id: number) {
  try {
    const r = await get<any>(`${API}/agentes-captacion/${id}`)
    const a = r?.data ?? r
    if (a) return normalizeAsesor(a)
  } catch {}
  try {
    const r2 = await get<any>(`${API}/usuarios/${id}`)
    const a2 = r2?.data ?? r2
    if (a2) return normalizeAsesor(a2)
  } catch {}
  return null
}

async function fetchProspectos(id: number) {
  const res = await listProspectos({
    page: 1,
    perPage: 500,
    asesorId: id,
    sortBy: 'updated_at',
    order: 'desc',
  })
  return res.data.map((p) => {
    const created = p.created_at || p.createdAt || p.asignacion_activa?.fecha_asignacion || null
    return { ...p, created_at: created } as ProspectoDetail
  })
}

async function fetchConvenios(id: number) {
  try {
    const r = await get<any>(`${API}/agentes-captacion/${id}/convenios`)
    const arr = r?.data ?? r
    if (Array.isArray(arr)) return arr
  } catch (e) {
    console.error('Error al cargar convenios del asesor', e)
  }
  return []
}

/* ==== CORREGIDO: unir dateos del asesor-convenio (agente + convenios) ==== */

async function fetchDateosUnionAsesorYConvenio(opts: {
  asesor: Asesor | null
  convenios: Convenio[]
}) {
  const a = opts.asesor
  if (!a) return [] as Dateo[]

  const fetchByAgente = () =>
    listDateos({
      page: 1,
      perPage: 500,
      canal: 'ASESOR',
      agenteId: a.id,
      sortBy: 'id',
      order: 'desc',
    }).then((r) => (r.data as Dateo[]) || [])

  const fetchByConvenio = (convenioId: number) =>
    listDateos({
      page: 1,
      perPage: 500,
      canal: 'ASESOR',
      convenioId,
      sortBy: 'id',
      order: 'desc',
    }).then((r) => (r.data as Dateo[]) || [])

  const esConvenioLocal = normalizeTipoAgente(a.tipo).includes('CONVENIO')

  if (!esConvenioLocal) {
    return await fetchByAgente()
  }

  // 🚀 Asesor convenio: buscar en AMBOS roles
  const calls: Promise<Dateo[]>[] = []

  // 1️⃣ Como AGENTE (usando asesor_convenio_id)
  calls.push(fetchByAgente())

  // 2️⃣ Como CONVENIO - buscar el convenio directamente por nombre
  try {
    // Buscar en la tabla convenios por nombre del asesor
    const resConvenio = await get<any>(`${API}/convenios?nombre=${encodeURIComponent(a.nombre)}`)
    const convenioData = resConvenio?.data ?? resConvenio
    const convenioMatch = Array.isArray(convenioData)
      ? convenioData.find(
          (c: any) => c.nombre?.toLowerCase().trim() === a.nombre.toLowerCase().trim(),
        )
      : convenioData?.nombre?.toLowerCase().trim() === a.nombre.toLowerCase().trim()
      ? convenioData
      : null

    if (convenioMatch) {
      console.log('🎯 Convenio encontrado por nombre:', convenioMatch)
      calls.push(fetchByConvenio(Number(convenioMatch.id)))
    } else {
      console.warn('⚠️ No se encontró convenio con el nombre:', a.nombre)
    }
  } catch (e) {
    console.error('❌ Error buscando convenio por nombre:', e)
  }

  const results = await Promise.all(calls)

  // 🧪 DEBUG: Ver qué trae cada llamada
  console.log('🔍 Dateos como AGENTE:', results[0])
  console.log('🔍 Dateos como CONVENIO:', results[1] || [])
  console.log('🔍 ID del asesor convenio:', a.id)

  // Unir sin duplicados por id
  const map = new Map<number, Dateo>()
  for (const arr of results) {
    if (!Array.isArray(arr)) continue
    for (const it of arr) {
      map.set((it as any).id, it)
    }
  }

  const final = Array.from(map.values()).sort((a: any, b: any) => Number(b.id) - Number(a.id))
  console.log('🔍 Dateos UNIDOS (final):', final)

  return final
}
/* ===== Comisiones (comercial vs convenio) - CORREGIDO ===== */
async function fetchComisiones(id: number) {
  const esConvenioLocal =
    asesor.value && normalizeTipoAgente(asesor.value.tipo).includes('CONVENIO')

  if (!esConvenioLocal) {
    // Asesor comercial / telemercadeo: solo traer por asesorId
    const res = await listComisiones({ asesorId: id, perPage: 500 })
    return res.data as ComisionListItem[]
  }

  // 🚀 Asesor convenio: traer comisiones por AMBOS roles

  // 1️⃣ Por asesorId (cuando datea directamente)
  const porAsesor = await listComisiones({ asesorId: id, perPage: 500 }).then(
    (r) => r.data as ComisionListItem[],
  )

  // 2️⃣ Por convenioId (cuando otros lo usan como convenio)
  // 🔥 BUSCAR el ID real del convenio por nombre
  let porConvenio: ComisionListItem[] = []

  try {
    // Buscar el convenio que tenga el mismo nombre que el asesor
    const resConvenio = await get<any>(
      `${API}/convenios?nombre=${encodeURIComponent(asesor.value!.nombre)}`,
    )
    const convenioData = resConvenio?.data ?? resConvenio
    const convenioMatch = Array.isArray(convenioData)
      ? convenioData.find(
          (c: any) =>
            c.nombre?.toLowerCase().trim() === asesor.value!.nombre.toLowerCase().trim(),
        )
      : convenioData?.nombre?.toLowerCase().trim() === asesor.value!.nombre.toLowerCase().trim()
      ? convenioData
      : null

    if (convenioMatch) {
      console.log('🎯 Convenio encontrado para comisiones:', convenioMatch)
      const resComisiones = await listComisiones({
        convenioId: Number(convenioMatch.id),
        perPage: 500,
      })
      porConvenio = resComisiones.data as ComisionListItem[]
      console.log('💰 Comisiones como convenio:', porConvenio)
    } else {
      console.warn('⚠️ No se encontró convenio para buscar comisiones')
    }
  } catch (e) {
    console.error('❌ Error buscando comisiones por convenio:', e)
  }

  // Unir sin duplicados por id
  const map = new Map<number, ComisionListItem>()
  for (const c of [...porAsesor, ...porConvenio]) {
    if (!c || c.id == null) continue
    map.set(Number(c.id), c)
  }

  const final = Array.from(map.values())
  console.log('💰 Total comisiones unidas:', final.length)

  return final
}

async function fetchPagos(_id: number) {
  // TODO: backend de pagos por asesor
  return []
}

/* ===== Carga principal ===== */
async function loadAll() {
  loading.value = true
  globalError.value = null
  try {
    // 1) Traer asesor primero (necesitamos su tipo)
    const a = await fetchAsesor(asesorId)
    asesor.value = a

    // 2) Cargar convenios tanto para COMERCIAL como para CONVENIO
    //    (aunque a los convenios no se les muestre la pestaña, sí se usan
    //     para unir los dateos donde aparecen como convenio)
    let c: Convenio[] = []
    if (asesor.value && (esAsesorComercial.value || esAsesorConvenio.value)) {
      c = await fetchConvenios(asesorId)
    }
    convenios.value = Array.isArray(c) ? c : []

    // 3) Dateos: comercial → por agente; convenio → unión (agente + convenios)
    const d = await fetchDateosUnionAsesorYConvenio({
      asesor: asesor.value,
      convenios: convenios.value,
    })
    dateos.value = Array.isArray(d) ? d : []

    // 4) Prospectos, Pagos, Comisiones
    const [p, pg, cm] = await Promise.all([
      fetchProspectos(asesorId),
      fetchPagos(asesorId),
      fetchComisiones(asesorId),
    ])
    prospectos.value = Array.isArray(p) ? p : []
    pagos.value = Array.isArray(pg) ? pg : []
    comisiones.value = Array.isArray(cm) ? cm : []

    // 5) Metas solo si es comercial
    if (asesor.value && esAsesorComercial.value) {
      await loadMetasAsesor()
    } else {
      metasRows.value = []
    }

    // 6) KPIs base (con dateos ya unificados)
    const desde = new Date(filtros.value.desde + 'T00:00:00')
    const hasta = new Date(filtros.value.hasta + 'T23:59:59')

    const dateosEnRango = dateos.value.filter((x: any) => {
      const tRaw = normalizeCreatedAt(x)
      const t = tRaw ? new Date(tRaw) : null
      return t ? t >= desde && t <= hasta : true
    })
    const exitosos = dateosEnRango.filter((x) => isExitoso(x))

    // 🆕 Usar la lógica centralizada
    const montoGenerado = await calcularMontoGenerado(exitosos)
    const pagosTotal = pagos.value.reduce((acc, it) => acc + (Number(it.valor) || 0), 0)

    kpi.value = {
      prospectos: prospectosEnRango.value.length,
      convenios: convenios.value.length,
      dateosExitosos: exitosos.length,
      montoGenerado,
      pagosRegistrados: pagosTotal,
    }
  } catch (e: any) {
    globalError.value = e?.message || 'No fue posible cargar la ficha comercial'
  } finally {
    loading.value = false
  }
}

function reload() {
  loadAll()
}

/* Recalcular cuando se carguen/varíen convenios en asesores de tipo convenio */
watch(
  () => convenios.value.map((c) => c.id).join(','), // dependemos de ids de convenios asignados
  async () => {
    if (asesor.value && esAsesorConvenio.value) {
      const d = await fetchDateosUnionAsesorYConvenio({
        asesor: asesor.value,
        convenios: convenios.value,
      })
      dateos.value = Array.isArray(d) ? d : []

      const desde = filtros.value.desde
      const hasta = filtros.value.hasta

      const desdeD = new Date(desde + 'T00:00:00')
      const hastaD = new Date(hasta + 'T23:59:59')
      const dEnRango = dateos.value.filter((x: any) => {
        const tRaw = normalizeCreatedAt(x)
        const t = tRaw ? new Date(tRaw) : null
        return t ? t >= desdeD && t <= hastaD : true
      })
      const exitosos = dEnRango.filter((x) => isExitoso(x))

      // 🔁 Igual que en loadAll: usar la lógica centralizada
      kpi.value.montoGenerado = exitosos.reduce(
        (acc: number, it: any) => acc + getComisionPorRolParaDateo(it.id),
        0,
      )
      // El resto (prospectos/pagos) ya está cargado
    }
  },
)

onMounted(() => {
  loadAll()
})

/* ===== Navegación extra ===== */
function verProspecto(id: number) {
  router.push({ name: 'ComercialProspectoDetalle', params: { id } }).catch(() => {})
}

/* ===== Exportar CSV (dateos) ===== */
function getMontoDateo(d: Dateo) {
  return getComisionPorRolParaDateo((d as any).id)
}

function exportCsv(soloExitosos: boolean) {
  const baseRows = soloExitosos
    ? dateosFiltrados.value.filter((d) => isExitoso(d))
    : dateosFiltrados.value

  const rows = baseRows.map((d: any) => ({
    id: d.id,
    placa: d.placa ?? '',
    telefono: d.telefono ?? '',
    convenio: d.convenio?.nombre ?? '',
    exitoso: isExitoso(d) ? 'SI' : 'NO',
    monto_comision: getMontoDateo(d),
    fecha: fmtDate(d.created_at),
  }))

  const headers = ['id', 'placa', 'telefono', 'convenio', 'exitoso', 'monto_comision', 'fecha']
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvEscape((r as any)[h])).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const tag = soloExitosos ? 'exitosos' : 'todos'
  a.download = `dateos_${asesor?.value?.id ?? 'asesor'}_${tag}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function csvEscape(val: unknown) {
  const s = String(val ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
</script>
<style scoped>
.kpi-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 14px 16px;
  height: 100%;
  background: rgb(var(--v-theme-surface));
}

.kpi-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

.kpi-value {
  font-weight: 800;
  font-size: 1.4rem;
  line-height: 1.2;
  margin: 6px 0;
}

.kpi-sub {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.45);
}

.gap-2 {
  gap: 8px;
}

.evidence-thumb {
  cursor: zoom-in;
}

.doc-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.doc-date {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

/* Ensancha columnas de documentos en la tabla de prospectos */
:deep(th[data-key='soat']),
:deep(td[data-key='soat']),
:deep(th[data-key='tecno']),
:deep(td[data-key='tecno']),
:deep(th[data-key='preventiva']),
:deep(td[data-key='preventiva']),
:deep(th[data-key='peritaje']),
:deep(td[data-key='peritaje']) {
  min-width: 132px;
}

/* Ajustes de densidad en tablas */
:deep(table.v-table) {
  font-size: 0.92rem;
}

:deep(.v-data-table-footer) {
  padding-inline: 8px !important;
}

/* Botones pequeños dentro de tarjetas/dialogs */
:deep(.v-card .v-btn.v-btn--size-small) {
  letter-spacing: 0.2px;
}

/* Soporte para cards de KPIs en pantallas muy pequeñas */
@media (max-width: 360px) {
  .kpi-value {
    font-size: 1.2rem;
  }
  .kpi-title {
    font-size: 0.85rem;
  }
}
</style>

