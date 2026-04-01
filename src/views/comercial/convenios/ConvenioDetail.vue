<template>
  <v-container class="py-6">
    <v-btn variant="text" class="mb-4" prepend-icon="mdi-arrow-left" @click="volver">
      Volver a convenios
    </v-btn>

    <v-skeleton-loader v-if="loading" type="card, card, card" />

    <template v-else-if="convenio">
      <v-row>
        <!-- ═══════════════════════════════════════════════════
             COLUMNA IZQUIERDA
        ════════════════════════════════════════════════════ -->
        <v-col cols="12" md="7">

          <!-- ── Ficha principal ── -->
          <v-card elevation="3" class="rounded-xl mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-5 pt-5 pb-2">
              <div>
                <div class="text-h6 font-weight-bold">{{ convenio.nombre }}</div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Convenio #{{ convenio.id }}
                  <span v-if="convenio.codigo"> · {{ convenio.codigo }}</span>
                </div>
              </div>
              <div class="d-flex gap-2 align-center">
                <!-- Estado detallado -->
                <v-chip
                  v-if="convenio.estado"
                  :color="chipEstado(convenio.estado).color"
                  variant="flat"
                  size="small"
                >
                  {{ convenio.estado }}
                </v-chip>
                <!-- Activo / Inactivo -->
                <v-chip
                  :color="convenio.activo ? 'success' : 'error'"
                  variant="flat"
                  size="small"
                >
                  {{ convenio.activo ? 'Activo' : 'Inactivo' }}
                </v-chip>
              </div>
            </v-card-title>

            <v-divider class="mx-5" />

            <v-card-text class="px-5 py-4">
              <v-row dense>
                <!-- Tipo -->
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1">Tipo</div>
                  <div class="text-body-2 font-weight-medium">
                    <v-icon size="16" class="mr-1">mdi-tag-outline</v-icon>
                    {{ convenio.tipo || '—' }}
                  </div>
                </v-col>

                <!-- Establecimiento -->
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1">Establecimiento</div>
                  <div class="text-body-2">{{ convenio.establecimiento || '—' }}</div>
                </v-col>

                <!-- Documento -->
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1">Documento</div>
                  <div class="text-body-2">
                    <span v-if="convenio.docTipo || convenio.docNumero">
                      <strong>{{ convenio.docTipo }}</strong> {{ convenio.docNumero }}
                    </span>
                    <span v-else>—</span>
                  </div>
                </v-col>

                <!-- Fecha de apertura -->
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1">Fecha de apertura</div>
                  <div class="text-body-2">
                    <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
                    {{ formatDate(convenio.fechaApertura) }}
                  </div>
                </v-col>

                <!-- Dirección -->
                <v-col cols="12">
                  <div class="text-caption text-medium-emphasis mb-1">Dirección</div>
                  <div class="text-body-2">{{ convenio.direccion || '—' }}</div>
                </v-col>

                <!-- Notas -->
                <v-col cols="12" v-if="convenio.notas">
                  <div class="text-caption text-medium-emphasis mb-1">Notas</div>
                  <div class="text-body-2 text-pre-wrap">{{ convenio.notas }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- ── Contacto ── -->
          <v-card elevation="3" class="rounded-xl mb-4">
            <v-card-title class="px-5 pt-4 pb-2 text-subtitle-1 font-weight-bold">
              <v-icon size="20" class="mr-2">mdi-phone-outline</v-icon>
              Contacto
            </v-card-title>
            <v-divider class="mx-5" />
            <v-card-text class="px-5 py-4">
              <v-row dense>
                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis mb-1">Teléfono</div>
                  <div class="text-body-2">{{ convenio.telefono || '—' }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis mb-1">WhatsApp / Corporativo</div>
                  <div class="text-body-2">{{ convenio.whatsapp || '—' }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis mb-1">Email</div>
                  <div class="text-body-2">{{ convenio.email || '—' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- ── Método de pago ── -->
          <v-card elevation="3" class="rounded-xl mb-4">
            <v-card-title class="px-5 pt-4 pb-2 text-subtitle-1 font-weight-bold">
              <v-icon size="20" class="mr-2">mdi-credit-card-outline</v-icon>
              Método de pago
            </v-card-title>
            <v-divider class="mx-5" />
            <v-card-text class="px-5 py-4">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1">Método</div>
                  <div class="text-body-2">
                    <v-chip
                      v-if="convenio.metodoPago"
                      :color="chipMetodoPago(convenio.metodoPago).color"
                      variant="tonal"
                      size="small"
                    >
                      <v-icon start size="14">{{ chipMetodoPago(convenio.metodoPago).icon }}</v-icon>
                      {{ convenio.metodoPago }}
                    </v-chip>
                    <span v-else class="text-medium-emphasis">No especificado</span>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  v-if="convenio.metodoPago && convenio.metodoPago !== 'EFECTIVO'"
                >
                  <div class="text-caption text-medium-emphasis mb-1">Número / Cuenta</div>
                  <div class="text-body-2">{{ convenio.numeroMetodoPago || '—' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- ── Ruta y gestión (NUEVOS CAMPOS) ── -->
          <v-card elevation="3" class="rounded-xl mb-4">
            <v-card-title class="px-5 pt-4 pb-2 text-subtitle-1 font-weight-bold">
              <v-icon size="20" class="mr-2">mdi-map-marker-path</v-icon>
              Ruta y gestión
            </v-card-title>
            <v-divider class="mx-5" />
            <v-card-text class="px-5 py-4">
              <v-row dense>
                <!-- Ruta -->
                <v-col cols="12" sm="3">
                  <div class="text-caption text-medium-emphasis mb-1">Ruta</div>
                  <div class="text-body-2">
                    <v-chip v-if="convenio.ruta" color="primary" variant="tonal" size="small">
                      {{ convenio.ruta }}
                    </v-chip>
                    <span v-else class="text-medium-emphasis">—</span>
                  </div>
                </v-col>

                <!-- Sub-ruta -->
                <v-col cols="12" sm="3">
                  <div class="text-caption text-medium-emphasis mb-1">Sub-ruta</div>
                  <div class="text-body-2">
                    <v-chip v-if="convenio.subRuta" color="secondary" variant="tonal" size="small">
                      {{ convenio.subRuta }}
                    </v-chip>
                    <span v-else class="text-medium-emphasis">—</span>
                  </div>
                </v-col>

                <!-- Periodicidad -->
                <v-col cols="12" sm="3">
                  <div class="text-caption text-medium-emphasis mb-1">Periodicidad</div>
                  <div class="text-body-2">
                    <v-chip
                      v-if="convenio.periodicidad"
                      :color="chipPeriodicidad(convenio.periodicidad).color"
                      variant="tonal"
                      size="small"
                    >
                      <v-icon start size="14">{{ chipPeriodicidad(convenio.periodicidad).icon }}</v-icon>
                      {{ convenio.periodicidad }}
                    </v-chip>
                    <span v-else class="text-medium-emphasis">—</span>
                  </div>
                </v-col>

                <!-- Reporta -->
                <v-col cols="12" sm="3">
                  <div class="text-caption text-medium-emphasis mb-1">Reporta</div>
                  <div class="text-body-2">{{ convenio.reporta || '—' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

        </v-col>

        <!-- ═══════════════════════════════════════════════════
             COLUMNA DERECHA
        ════════════════════════════════════════════════════ -->
        <v-col cols="12" md="5">

          <!-- ── Asesor activo ── -->
          <v-card elevation="3" class="rounded-xl mb-4">
            <v-card-title class="px-5 pt-4 pb-2 text-subtitle-1 font-weight-bold">
              <v-icon size="20" class="mr-2">mdi-account-tie</v-icon>
              Asesor activo
            </v-card-title>
            <v-divider class="mx-5" />
            <v-card-text class="px-5 py-4">
              <div v-if="asesor?.asesor" class="d-flex align-center gap-3">
                <v-avatar color="primary" size="44">
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
                <div>
                  <div class="text-body-1 font-weight-bold">{{ asesor.asesor.nombre }}</div>
                  <div class="text-caption text-medium-emphasis">{{ asesor.asesor.tipo }}</div>
                  <div class="text-caption text-medium-emphasis">
                    Desde: {{ formatDate(asesor.desde ?? asesor.asignado_at) }}
                  </div>
                </div>
              </div>
              <div v-else class="text-medium-emphasis text-body-2">
                Sin asesor asignado.
              </div>
            </v-card-text>
            <v-card-actions class="px-5 pb-4 pt-0 gap-2">
              <v-btn
                variant="tonal"
                color="primary"
                prepend-icon="mdi-account-plus"
                size="small"
                @click="openAsignar"
              >
                Asignar
              </v-btn>
              <v-btn
                variant="tonal"
                color="error"
                prepend-icon="mdi-account-remove"
                size="small"
                :disabled="!asesor?.asesor"
                @click="openRetirar"
              >
                Retirar
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- ── Crear dateo automático ── -->
          <v-card elevation="3" class="rounded-xl mb-4">
            <v-card-title class="px-5 pt-4 pb-2 text-subtitle-1 font-weight-bold">
              <v-icon size="20" class="mr-2">mdi-car-clock</v-icon>
              Crear dateo automático
            </v-card-title>
            <v-divider class="mx-5" />
            <v-card-text class="px-5 py-4">
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    v-model="autoDateo.placa"
                    label="Placa (opcional)"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mb-3"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="autoDateo.telefono"
                    label="Teléfono (opcional)"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions class="px-5 pb-4 pt-0">
              <v-btn
                color="primary"
                variant="elevated"
                :loading="autoDateo.loading"
                prepend-icon="mdi-plus-circle-outline"
                @click="dispararAutoDateo"
                block
              >
                Crear dateo
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- ── Vigencia ── -->
          <v-card
            elevation="3"
            class="rounded-xl mb-4"
            v-if="convenio.vigencia_desde || convenio.vigencia_hasta"
          >
            <v-card-title class="px-5 pt-4 pb-2 text-subtitle-1 font-weight-bold">
              <v-icon size="20" class="mr-2">mdi-calendar-range</v-icon>
              Vigencia
            </v-card-title>
            <v-divider class="mx-5" />
            <v-card-text class="px-5 py-4">
              <div class="text-body-2">
                <strong>Desde:</strong> {{ formatDate(convenio.vigencia_desde) }}
              </div>
              <div class="text-body-2 mt-1">
                <strong>Hasta:</strong> {{ formatDate(convenio.vigencia_hasta) }}
              </div>
            </v-card-text>
          </v-card>

        </v-col>
      </v-row>
    </template>

    <!-- Sin datos -->
    <v-alert
      v-else-if="!loading"
      type="error"
      variant="tonal"
      class="mt-4"
      title="Convenio no encontrado"
      text="No se pudo cargar la información del convenio solicitado."
    />

    <!-- ══════════════════════════════════════
         DIÁLOGO: Asignar asesor
    ═══════════════════════════════════════ -->
    <v-dialog v-model="dlgAsignar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6 px-6 pt-5">Asignar asesor</v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <v-autocomplete
            v-model="dlgAsignar.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor"
            :loading="asesoresLoading"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-3">
          <v-spacer />
          <v-btn variant="text" @click="dlgAsignar.visible = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="dlgAsignar.loading" @click="confirmAsignar">
            Asignar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════════
         DIÁLOGO: Retirar asesor
    ═══════════════════════════════════════ -->
    <v-dialog v-model="dlgRetirar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6 px-6 pt-5">Retirar asesor</v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <v-text-field
            v-model="dlgRetirar.motivo"
            label="Motivo (opcional)"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-3">
          <v-spacer />
          <v-btn variant="text" @click="dlgRetirar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgRetirar.loading" @click="confirmRetirar">
            Retirar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getConvenio,
  getAsesorActivo,
  listAgentesCaptacion,
  asignarAsesorConvenio,
  retirarAsesorConvenio,
  crearDateoAutoPorConvenio,
  formatDate,
  type Convenio,
  type AsesorActivoResp,
} from '@/services/conveniosService'

/* ─── Route ─── */
const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

/* ─── Estado principal ─── */
const loading = ref(true)
const convenio = ref<Convenio | null>(null)
const asesor = ref<AsesorActivoResp | null>(null)

async function load() {
  loading.value = true
  try {
    [convenio.value, asesor.value] = await Promise.all([
      getConvenio(id),
      getAsesorActivo(id),
    ])
  } finally {
    loading.value = false
  }
}

/* ─── Helpers de chips ─── */
function chipEstado(estado: string) {
  const map: Record<string, { color: string }> = {
    ACTIVO: { color: 'success' },
    INACTIVO: { color: 'error' },
    PROSPECTO: { color: 'warning' },
  }
  return map[estado] ?? { color: 'default' }
}

function chipMetodoPago(metodo: string) {
  const map: Record<string, { color: string; icon: string }> = {
    EFECTIVO: { color: 'success', icon: 'mdi-cash' },
    TRANSFERENCIA: { color: 'info', icon: 'mdi-bank-transfer' },
    TARJETA: { color: 'primary', icon: 'mdi-credit-card' },
    CHEQUE: { color: 'warning', icon: 'mdi-checkbook' },
  }
  return map[metodo] ?? { color: 'default', icon: 'mdi-currency-usd' }
}

function chipPeriodicidad(periodicidad: string) {
  const map: Record<string, { color: string; icon: string }> = {
    DIARIA: { color: 'error', icon: 'mdi-calendar-today' },
    SEMANAL: { color: 'warning', icon: 'mdi-calendar-week' },
    QUINCENAL: { color: 'info', icon: 'mdi-calendar-multiselect' },
    MENSUAL: { color: 'success', icon: 'mdi-calendar-month' },
  }
  return map[periodicidad] ?? { color: 'default', icon: 'mdi-calendar' }
}

/* ─── Auto-dateo ─── */
const autoDateo = ref({ placa: '', telefono: '', loading: false })

async function dispararAutoDateo() {
  autoDateo.value.loading = true
  try {
    await crearDateoAutoPorConvenio({
      convenio_id: id,
      placa: autoDateo.value.placa || undefined,
      telefono: autoDateo.value.telefono || undefined,
    })
    autoDateo.value.placa = ''
    autoDateo.value.telefono = ''
  } finally {
    autoDateo.value.loading = false
  }
}

/* ─── Asesores (catálogo) ─── */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)

async function loadAsesores() {
  if (asesoresItems.value.length) return
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

/* ─── Diálogo Asignar ─── */
const dlgAsignar = ref<{ visible: boolean; asesorId: number | null; loading: boolean }>({
  visible: false,
  asesorId: null,
  loading: false,
})

function openAsignar() {
  dlgAsignar.value = { visible: true, asesorId: null, loading: false }
  loadAsesores()
}

async function confirmAsignar() {
  if (!dlgAsignar.value.asesorId) return
  dlgAsignar.value.loading = true
  try {
    await asignarAsesorConvenio(id, { asesor_id: dlgAsignar.value.asesorId })
    asesor.value = await getAsesorActivo(id)
    dlgAsignar.value.visible = false
  } finally {
    dlgAsignar.value.loading = false
  }
}

/* ─── Diálogo Retirar ─── */
const dlgRetirar = ref<{ visible: boolean; motivo: string; loading: boolean }>({
  visible: false,
  motivo: '',
  loading: false,
})

function openRetirar() {
  dlgRetirar.value = { visible: true, motivo: '', loading: false }
}

async function confirmRetirar() {
  dlgRetirar.value.loading = true
  try {
    await retirarAsesorConvenio(id, { motivo: dlgRetirar.value.motivo || undefined })
    asesor.value = await getAsesorActivo(id)
    dlgRetirar.value.visible = false
  } finally {
    dlgRetirar.value.loading = false
  }
}

/* ─── Navegación ─── */
function volver() {
  router.push({ name: 'comercial.convenios.list' })
}

/* ─── Init ─── */
onMounted(load)
</script>

<style scoped>
.text-pre-wrap {
  white-space: pre-wrap;
}
</style>
