<!-- src/views/comercial/FichaComercialAsesor.vue -->
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
              <v-btn v-bind="props" variant="tonal" prepend-icon="mdi-calendar-range">Rangos rápidos</v-btn>
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
              <v-card-title class="text-subtitle-1 font-weight-bold">Datos del asesor</v-card-title>
              <v-card-text class="pt-1">
                <template v-if="asesor && !loading">
                  <div class="mb-1"><strong>Nombre:</strong> {{ asesor.nombre ?? '—' }}</div>
                  <div class="mb-1"><strong>Tipo:</strong> {{ humanTipo(asesor?.tipo) }}</div>
                  <div class="mb-1"><strong>Correo:</strong> {{ asesor.email || asesor.correo || '—' }}</div>
                  <div class="mb-1"><strong>Teléfono:</strong> {{ asesor.telefono ?? '—' }}</div>
                  <div class="mb-1"><strong>Documento:</strong> {{ docFull(asesor) }}</div>
                  <div class="mb-1"><strong>Estado:</strong>
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

          <!-- KPIs -->
          <v-col cols="12" md="6" lg="7">
            <v-row>
              <v-col cols="12" sm="6" lg="3">
                <div class="kpi-card">
                  <div class="kpi-title">Prospectos</div>
                  <div class="kpi-value">{{ kpi.prospectos }}</div>
                  <div class="kpi-sub">en el rango</div>
                </div>
              </v-col>
              <v-col cols="12" sm="6" lg="3">
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
                  <div class="kpi-value">{{ money(kpi.montoGenerado) }}</div>
                  <div class="kpi-sub">COP</div>
                </div>
              </v-col>
            </v-row>

            <v-row class="mt-1">
              <v-col cols="12" sm="6" lg="4">
                <div class="kpi-card">
                  <div class="kpi-title">Pagos registrados</div>
                  <div class="kpi-value">{{ money(kpi.pagosRegistrados) }}</div>
                  <div class="kpi-sub">COP</div>
                </div>
              </v-col>
              <v-col cols="12" sm="6" lg="4">
                <div class="kpi-card">
                  <div class="kpi-title">Saldo estimado</div>
                  <div class="kpi-value" :class="saldoEstimado < 0 ? 'text-error' : ''">
                    {{ money(saldoEstimado) }}
                  </div>
                  <div class="kpi-sub">monto - pagos</div>
                </div>
              </v-col>
              <v-col cols="12" sm="12" lg="4">
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
          <v-tab value="convenios" prepend-icon="mdi-handshake">Convenios</v-tab>
          <v-tab value="dateos" prepend-icon="mdi-clipboard-check-multiple">Dateos</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Prospectos -->
          <v-window-item value="prospectos">
            <v-data-table
              :items="prospectos"
              :headers="headersProspectos"
              :loading="loading"
              class="elevation-1"
              item-key="id"
              :no-data-text="'Sin prospectos en el rango'"
            >
              <template #loading>
                <v-skeleton-loader type="table-row@6" />
              </template>
              <template #item.created_at="{ item }">
                {{ fmtDate(item.created_at) }}
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Convenios -->
          <v-window-item value="convenios">
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
                Monto total: <strong>{{ money(totalMonto) }}</strong>
              </div>
              <div class="d-flex align-center" style="gap:8px">
                <v-switch
                  v-model="filtrosDateo.soloExitosos"
                  color="success"
                  inset
                  label="Solo exitosos"
                  hide-details
                />
                <v-btn size="small" variant="tonal" prepend-icon="mdi-download" @click="exportCsv(false)">Exportar CSV</v-btn>
                <v-btn size="small" color="success" prepend-icon="mdi-download" @click="exportCsv(true)">CSV (solo exitosos)</v-btn>
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

              <template #item.exitoso="{ item }">
                <v-chip size="small" :color="isExitoso(item) ? 'success' : 'error'" variant="flat">
                  {{ isExitoso(item) ? 'Sí' : 'No' }}
                </v-chip>
              </template>

              <template #item.monto="{ item }">
                {{ money(getMontoDateo(item)) }}
              </template>

              <template #item.created_at="{ item }">
                {{ fmtDate(item.created_at) }}
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '@/services/http'

/* ===== Tipos ===== */
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
type Prospecto = { id: number; nombre?: string | null; placa?: string | null; telefono?: string | null; observaciones?: string | null; created_at?: string }
type Convenio = { id: number; nombre: string; vigencia_desde?: string | null; vigencia_hasta?: string | null }
type Dateo = {
  id: number
  placa?: string | null
  telefono?: string | null
  canal?: string | null
  resultado?: string | null
  exitoso?: boolean | null
  consumido_exitoso?: boolean | null
  bonificacion?: number | null
  comision?: number | null
  monto?: number | null
  valor?: number | null
  asesor_id?: number | null
  agente_id?: number | null
  creado_por?: number | null
  creadoPor?: number | null
  user_id?: number | null
  created_at?: string
}

/* ===== Constantes y estado base ===== */
const API = '/api'
const route = useRoute()
const asesorId = Number(route.params.id)

const asesor = ref<Asesor | null>(null)
const prospectos = ref<Prospecto[]>([])
const convenios = ref<Convenio[]>([])
const dateos = ref<Dateo[]>([])
const pagos = ref<{ id:number; valor:number; fecha?:string }[]>([])

const loading = ref(false)
const globalError = ref<string | null>(null)
const tab = ref<'prospectos' | 'convenios' | 'dateos'>('prospectos')

/* ===== Rango de fechas ===== */
const filtros = ref<{ desde: string; hasta: string }>({ desde: '', hasta: '' })
function toInputDate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0, 10)
}
function setUltimosNDias(n: number) {
  const hoy = new Date()
  const desde = new Date()
  desde.setDate(hoy.getDate() - n)
  filtros.value.desde = toInputDate(desde)
  filtros.value.hasta = toInputDate(hoy)
}
function setUltimos30() { setUltimosNDias(30) }
function setEsteMes() {
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  filtros.value.desde = toInputDate(desde)
  filtros.value.hasta = toInputDate(hasta)
}
function resetRango() { setUltimos30(); reload() }
setUltimos30()

const rangoLegible = computed(() => {
  const f = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString()
  return `${f(filtros.value.desde)} → ${f(filtros.value.hasta)}`
})

/* ===== Headers de tablas ===== */
const headersProspectos = [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'nombre' },
  { title: 'Placa', key: 'placa' },
  { title: 'Teléfono', key: 'telefono' },
  { title: 'Creado', key: 'created_at' },
] as const

const headersConvenios = [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'nombre' },
  { title: 'Vigencia', key: 'vigencia' },
] as const

const headersDateos = [
  { title: 'ID', key: 'id' },
  { title: 'Canal', key: 'canal' },
  { title: 'Placa', key: 'placa' },
  { title: 'Teléfono', key: 'telefono' },
  { title: 'Exitoso', key: 'exitoso' },
  { title: 'Monto', key: 'monto', align: 'end' },
  { title: 'Fecha', key: 'created_at' },
] as const

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
  // Soporte a múltiples convenciones
  const tipo = a.doc_tipo || (a as any).tipo_documento || (a as any).tipoDoc || ''
  const num  = a.doc_numero || (a as any).numero_documento || (a as any).numDocumento || a.documento || (a as any).cedula || ''
  if (tipo || num) return `${tipo} ${num}`.trim()
  return '—'
}
function vigenciaText(c: Convenio) {
  const f = (s?: string | null) => (!s ? '—' : new Date(s as string).toLocaleDateString())
  return `${f(c.vigencia_desde)} – ${f(c.vigencia_hasta)}`
}
function normalizeCreatedAt(obj: any) {
  return obj?.created_at || obj?.createdAt || obj?.fecha || obj?.fecha_creacion || obj?.creado || obj?.created || null
}
function fmtDate(d?: string) {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString()
}
function money(n?: number | null) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)
}
function isExitoso(d: Dateo) {
  const r = String(d.resultado || '').toUpperCase()
  return !!(d.exitoso || d.consumido_exitoso || r === 'EXITOSO' || r === 'COMPLETADO' || r === 'ATENDIDO' || r === 'CONVERTIDO')
}
function getMontoDateo(d: Dateo) {
  const candidates = [d.monto, d.bonificacion, d.comision, d.valor]
  const n = candidates.find((x) => typeof x === 'number' && !Number.isNaN(x as number))
  return (n as number | undefined) ?? 0
}
function isFromAsesor(d: Dateo, id: number) {
  const candidates = [d.asesor_id, d.agente_id, d.creado_por, d.creadoPor, d.user_id]
  return candidates.some(v => Number(v) === Number(id))
}

/* ===== Filtros Dateos (solo exitosos) y listas derivadas ===== */
const filtrosDateo = ref<{ soloExitosos: boolean }>({ soloExitosos: false })

/* Solo dateos DEL ASESOR + rango + (opcional) exitosos */
const dateosFiltrados = computed(() => {
  const desde = new Date(filtros.value.desde + 'T00:00:00')
  const hasta = new Date(filtros.value.hasta + 'T23:59:59')
  return dateos.value.filter((d) => {
    const pertenece = isFromAsesor(d, asesorId)
    if (!pertenece) return false
    const tRaw = normalizeCreatedAt(d)
    const t = tRaw ? new Date(tRaw) : null
    const enRango = t ? t >= desde && t <= hasta : true
    const porExito = filtrosDateo.value.soloExitosos ? isExitoso(d) : true
    // Normaliza created_at para la tabla
    d.created_at = tRaw || d.created_at
    return enRango && porExito
  })
})

/* KPIs y totales dinámicos (en base a dateos del asesor) */
const kpi = ref({
  prospectos: 0,
  convenios: 0,
  dateosExitosos: 0,
  montoGenerado: 0,
  pagosRegistrados: 0,
})
const saldoEstimado = computed(() => (kpi.value.montoGenerado - kpi.value.pagosRegistrados))
const totalDateosFiltrados = computed(() => dateosFiltrados.value.length)
const totalExitosos = computed(() => dateosFiltrados.value.filter(isExitoso).length)
const totalMonto = computed(() => dateosFiltrados.value.reduce((acc, it) => acc + (getMontoDateo(it) || 0), 0))

/* ===== API helpers (usa tus rutas reales) ===== */
function rangoParams() {
  return { desde: filtros.value.desde, hasta: filtros.value.hasta, perPage: 500 }
}

function normalizeAsesor(raw: any): Asesor {
  if (!raw) return null as any
  const nombre =
    raw.nombre ||
    [raw.nombres, raw.apellidos].filter(Boolean).join(' ') ||
    raw.fullname ||
    raw.displayName ||
    '—'
  const email = raw.email || raw.correo || raw.email_personal || raw?.user?.email || null
  const telefono = raw.telefono || raw.celular || raw.cel || raw.phone || null

  // documento
  const doc_tipo = raw.doc_tipo || raw.tipo_documento || raw.tipoDoc || null
  const doc_numero =
    raw.doc_numero || raw.numero_documento || raw.numDocumento || raw.documento || raw.cedula || null

  const activo =
    typeof raw.activo !== 'undefined'
      ? !!raw.activo
      : (String(raw.estado || '').toUpperCase() === 'ACTIVO' ? true : undefined)

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
  // 1) Tu ruta real
  try {
    const r = await get<any>(`${API}/agentes-captacion/${id}`)
    const a = r?.data ?? r
    if (a) return normalizeAsesor(a)
  } catch {}
  // 2) Fallback a usuarios/:id por si allí está el correo/documento
  try {
    const r2 = await get<any>(`${API}/usuarios/${id}`)
    const a2 = r2?.data ?? r2
    if (a2) return normalizeAsesor(a2)
  } catch {}
  return null
}

async function fetchProspectos(id: number) {
  try {
    const r = await get<any>(`${API}/agentes-captacion/${id}/prospectos`, { params: rangoParams() })
    const arr = r?.data ?? r
    if (Array.isArray(arr)) {
      return arr.map((p: any) => ({ ...p, created_at: normalizeCreatedAt(p) }))
    }
  } catch {}
  // Fallback: por creadoPor
  const r3 = await get<any>(`${API}/prospectos`, { params: { ...rangoParams(), creadoPor: id } })
  const arr3 = r3?.data ?? r3
  return Array.isArray(arr3) ? arr3.map((p: any) => ({ ...p, created_at: normalizeCreatedAt(p) })) : []
}

async function fetchConvenios(id: number) {
  try {
    const r = await get<any>(`${API}/agentes-captacion/${id}/convenios`, { params: { perPage: 500 } })
    const arr = r?.data ?? r
    if (Array.isArray(arr)) return arr
  } catch {}
  return []
}

async function fetchDateos(id: number) {
  // ÚNICO index real en tus rutas
  const params = { ...rangoParams(), asesor_id: id, agente_id: id, creadoPor: id, user_id: id }
  try {
    const r = await get<any>(`${API}/captacion-dateos`, { params })
    const arr = r?.data ?? r
    if (Array.isArray(arr)) {
      // Asegura autoría + normaliza fecha para "Creado"
      return arr
        .filter((d: any) => isFromAsesor(d, id))
        .map((d: any) => ({ ...d, created_at: normalizeCreatedAt(d) }))
    }
  } catch {}
  return []
}

async function fetchPagos(_id: number) {
  // No hay ruta en tu backend ahora mismo
  return []
}

/* ===== Carga principal ===== */
async function loadAll() {
  loading.value = true
  globalError.value = null
  try {
    const [a, p, c, d, pg] = await Promise.all([
      fetchAsesor(asesorId),
      fetchProspectos(asesorId),
      fetchConvenios(asesorId),
      fetchDateos(asesorId),
      fetchPagos(asesorId),
    ])

    asesor.value = a || null
    prospectos.value = Array.isArray(p) ? p : []
    convenios.value = Array.isArray(c) ? c : []
    dateos.value = Array.isArray(d) ? d : []
    pagos.value = Array.isArray(pg) ? pg : []

    // KPIs (con base en dateos del asesor y rango)
    const desde = new Date(filtros.value.desde + 'T00:00:00')
    const hasta = new Date(filtros.value.hasta + 'T23:59:59')

    const dateosEnRango = dateos.value.filter((x) => {
      const tRaw = normalizeCreatedAt(x)
      const t = tRaw ? new Date(tRaw) : null
      return t ? t >= desde && t <= hasta : true
    })
    const exitosos = dateosEnRango.filter(isExitoso)
    const monto = exitosos.reduce((acc, it) => acc + (getMontoDateo(it) || 0), 0)
    const pagosTotal = pagos.value.reduce((acc, it) => acc + (Number(it.valor) || 0), 0)

    kpi.value = {
      prospectos: prospectos.value.length,
      convenios: convenios.value.length,
      dateosExitosos: exitosos.length,
      montoGenerado: monto,
      pagosRegistrados: pagosTotal,
    }
  } catch (e: any) {
    globalError.value = e?.message || 'No fue posible cargar la ficha comercial'
  } finally {
    loading.value = false
  }
}

function reload() { loadAll() }
onMounted(loadAll)

/* ===== Exportar CSV ===== */
function exportCsv(soloExitosos: boolean) {
  const rows = (soloExitosos ? dateosFiltrados.value.filter(isExitoso) : dateosFiltrados.value).map(d => ({
    id: d.id,
    canal: d.canal ?? '',
    placa: d.placa ?? '',
    telefono: d.telefono ?? '',
    exitoso: isExitoso(d) ? 'SI' : 'NO',
    monto: getMontoDateo(d),
    fecha: fmtDate(d.created_at),
  }))

  const headers = ['id','canal','placa','telefono','exitoso','monto','fecha']
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => csvEscape((r as any)[h])).join(',')),
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
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 14px 16px;
  height: 100%;
  background: rgb(var(--v-theme-surface));
}
.kpi-title { font-weight: 600; font-size: 0.9rem; color: rgba(0,0,0,0.6); }
.kpi-value { font-weight: 800; font-size: 1.4rem; line-height: 1.2; margin: 6px 0; }
.kpi-sub { font-size: .8rem; color: rgba(0,0,0,0.45); }
.gap-2 { gap: 8px; }
</style>
