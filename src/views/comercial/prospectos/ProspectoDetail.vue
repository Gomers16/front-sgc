<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">👤 Detalle del Prospecto</div>
        <v-btn color="primary" prepend-icon="mdi-arrow-left" @click="goBack">Volver</v-btn>
      </v-card-title>

      <v-divider />

      <!-- Loading -->
      <v-card-text v-if="loading" class="py-12 text-center">
        <v-progress-circular indeterminate size="48" color="primary" />
        <div class="mt-4 text-subtitle-1">Cargando datos del prospecto...</div>
      </v-card-text>

      <!-- Contenido -->
      <v-card-text v-else-if="prospecto">
        <!-- Datos principales -->
        <v-row>
          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Nombre:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.nombre || '—' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Teléfono:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.telefono || '—' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Placa:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.placa || '—' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Creado por:</v-list-item-title>
                <v-list-item-subtitle>
                  <template v-if="prospecto.creador">
                    {{ prospecto.creador.nombre }}
                    <span v-if="prospecto.creador.fuente" class="text-caption text-medium-emphasis">
                      · {{ prospecto.creador.fuente }}
                    </span>
                  </template>
                  <template v-else>—</template>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">Origen:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.origen || '—' }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">Fecha creación:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(prospecto.created_at || prospecto.createdAt) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">Última actualización:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(prospecto.updated_at || prospecto.updatedAt) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <!-- Documentos -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card outlined class="pa-4">
              <div class="text-h6 mb-2">📄 SOAT</div>
              <v-chip :color="chipColor(soat.estado)" variant="flat" size="small">
                {{ chipText(soat.estado) }}
              </v-chip>
              <div class="mt-2 text-caption">
                Vencimiento: {{ soat.vencimiento || formatDate(prospecto.soat_vencimiento) || '—' }}
              </div>
              <div class="text-caption">
                Días restantes: <strong>{{ soat.dias_restantes ?? prospecto.dias_soat_restantes ?? '—' }}</strong>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card outlined class="pa-4">
              <div class="text-h6 mb-2">🧾 RTM</div>
              <v-chip :color="chipColor(rtm.estado)" variant="flat" size="small">
                {{ chipText(rtm.estado) }}
              </v-chip>
              <div class="mt-2 text-caption">
                Vencimiento: {{ rtm.vencimiento || formatDate(prospecto.tecno_vencimiento) || '—' }}
              </div>
              <div class="text-caption">
                Días restantes: <strong>{{ rtm.dias_restantes ?? prospecto.dias_tecno_restantes ?? '—' }}</strong>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="12" md="6">
            <v-card outlined class="pa-4">
              <div class="text-h6 mb-2">🛠️ Preventiva</div>
              <v-chip :color="chipColor(preventiva.estado)" variant="flat" size="small">
                {{ chipText(preventiva.estado) }}
              </v-chip>
              <div class="mt-2 text-caption">
                Vencimiento: {{ preventiva.vencimiento || '—' }}
              </div>
              <div class="text-caption">
                Días restantes: <strong>{{ preventiva.dias_restantes ?? '—' }}</strong>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card outlined class="pa-4">
              <div class="text-h6 mb-2">🔍 Peritaje</div>
              <v-chip :color="peritaje.estado === 'registrado' ? 'success' : 'grey-darken-1'" variant="flat" size="small">
                {{ peritaje.estado === 'registrado' ? 'Registrado' : 'Sin datos' }}
              </v-chip>
              <div class="mt-2 text-caption">
                Último / Próximo: {{ peritaje.fecha || '—' }}
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <!-- Observaciones -->
        <v-card outlined class="pa-4">
          <div class="text-h6 mb-2">📝 Observaciones</div>
          <div>{{ prospecto.observaciones || 'Sin observaciones registradas.' }}</div>
        </v-card>

        <v-divider class="my-4" />

        <!-- Asesor asignado -->
        <v-card outlined class="pa-4">
          <div class="text-h6 mb-2">👥 Asesor asignado</div>

          <template v-if="prospecto.asignacion_activa">
            <div class="mb-1">
              <strong>{{ prospecto.asignacion_activa.asesor?.nombre || '—' }}</strong>
              <span v-if="prospecto.asignacion_activa.asesor?.tipo" class="text-caption text-medium-emphasis">
                · {{ prettyTipo(prospecto.asignacion_activa.asesor?.tipo) }}
              </span>
            </div>
            <div class="text-caption text-medium-emphasis">
              Asignado el: {{ formatDate(prospecto.asignacion_activa.fecha_asignacion) }}
            </div>
          </template>

          <div v-else class="text-medium-emphasis">Sin asesor asignado.</div>
        </v-card>
      </v-card-text>

      <v-card-text v-else>
        <v-alert type="error" variant="tonal">❌ No se encontró información para este prospecto.</v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProspectoById, formatDate, type ProspectoDetail } from '@/services/prospectosService'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const prospecto = ref<ProspectoDetail | null>(null)

/* Chips helpers */
const badge = {
  vigente:   { text: 'Vigente',  color: 'success' },
  vencido:   { text: 'Vencido',  color: 'error' },
  sin_datos: { text: 'Sin datos', color: 'grey-darken-1' },
} as const
const chipColor = (e: keyof typeof badge) => badge[e]?.color || 'grey-darken-1'
const chipText  = (e: keyof typeof badge) => badge[e]?.text  || '—'

function prettyTipo(t?: string | null) {
  if (!t) return ''
  const map: Record<string, string> = {
    ASESOR_COMERCIAL: 'Asesor comercial',
    ASESOR_CONVENIO:  'Asesor convenio',
    TELEMERCADEO:     'Telemercadeo',
    SISTEMA:          'Sistema',
    USUARIO:          'Usuario',
  }
  return map[t] ?? t
}

/* Fallbacks si no llega resumenVigencias */
const soat = computed(() => {
  const rv = prospecto.value?.resumenVigencias?.soat
  if (rv) return rv
  const estado: 'vigente'|'vencido'|'sin_datos' =
    prospecto.value?.soat_vigente == null ? 'sin_datos' : (prospecto.value?.soat_vigente ? 'vigente' : 'vencido')
  return { estado, vencimiento: prospecto.value?.soat_vencimiento ?? null, dias_restantes: prospecto.value?.dias_soat_restantes ?? null }
})
const rtm = computed(() => {
  const rv = prospecto.value?.resumenVigencias?.rtm
  if (rv) return rv
  const estado: 'vigente'|'vencido'|'sin_datos' =
    prospecto.value?.tecno_vigente == null ? 'sin_datos' : (prospecto.value?.tecno_vigente ? 'vigente' : 'vencido')
  return { estado, vencimiento: prospecto.value?.tecno_vencimiento ?? null, dias_restantes: prospecto.value?.dias_tecno_restantes ?? null }
})
const preventiva = computed(() =>
  prospecto.value?.resumenVigencias?.preventiva ?? { estado: 'sin_datos', vencimiento: null, dias_restantes: null }
)
const peritaje = computed(() =>
  prospecto.value?.resumenVigencias?.peritaje ?? { estado: 'sin_datos', fecha: null }
)

async function fetchProspecto() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    prospecto.value = await getProspectoById(id)
  } catch (err) {
    console.error('❌ Error cargando prospecto:', err)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'ComercialProspectos' }).catch(() => {})
}

onMounted(fetchProspecto)
</script>

<style scoped>
.text-h5 { font-weight: bold; }
</style>
