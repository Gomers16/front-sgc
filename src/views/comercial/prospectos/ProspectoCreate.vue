<!-- src/views/comercial/prospectos/ProspectoCreate.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">➕ Nuevo prospecto</div>
        <v-btn color="primary" prepend-icon="mdi-arrow-left" @click="volver">Volver</v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.nombre" label="Nombre *" variant="outlined" density="comfortable" :rules="[rReq]" hide-details="auto" clearable />
            </v-col>

            <v-col cols="12" md="3">
              <v-text-field v-model="form.telefono" label="Teléfono *" variant="outlined" density="comfortable" :rules="[rReq, rTel]" hide-details="auto" clearable @update:model-value="onTelefonoInput" />
            </v-col>

            <v-col cols="12" md="3">
              <v-text-field v-model="form.placa" label="Placa *" variant="outlined" density="comfortable" :rules="[rReq]" hide-details="auto" clearable @update:model-value="onPlacaInput" />
            </v-col>

            <v-col cols="12" md="12">
              <v-textarea v-model="form.observaciones" label="Observaciones" variant="outlined" density="comfortable" auto-grow rows="2" hide-details="auto" />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Documentos -->
          <div class="text-subtitle-1 font-weight-medium mb-2">Documentos</div>

          <!-- SOAT / RTM -->
          <v-row>
            <v-col cols="12" md="6">
              <div class="d-flex align-center gap-2">
                <v-switch v-model="form.soat_vigente" color="primary" hide-details />
                <span>SOAT vigente</span>
              </div>
              <v-text-field v-model="form.soat_vencimiento" type="date" label="Vencimiento SOAT" variant="outlined" density="comfortable" hide-details="auto" />
            </v-col>

            <v-col cols="12" md="6">
              <div class="d-flex align-center gap-2">
                <v-switch v-model="form.tecno_vigente" color="primary" hide-details />
                <span>Tecnomecánica vigente</span>
              </div>
              <v-text-field v-model="form.tecno_vencimiento" type="date" label="Vencimiento RTM" variant="outlined" density="comfortable" hide-details="auto" />
            </v-col>
          </v-row>

          <!-- Preventiva / Peritaje -->
          <v-row>
            <v-col cols="12" md="6">
              <div class="d-flex align-center gap-2">
                <v-switch v-model="form.preventiva_vigente" color="primary" hide-details />
                <span>Preventiva vigente</span>
              </div>
              <v-text-field v-model="form.preventiva_vencimiento" type="date" label="Vencimiento Preventiva" variant="outlined" density="comfortable" hide-details="auto" />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="form.peritaje_ultima_fecha" type="date" label="Fecha de peritaje" variant="outlined" density="comfortable" hide-details="auto" />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="d-flex gap-2">
            <v-btn color="primary" :loading="loading" :disabled="!canSubmit || loading" @click="showConfirmDialog = true" prepend-icon="mdi-content-save">Guardar</v-btn>
            <v-btn variant="text" @click="volver">Cancelar</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Modal de confirmación ANTES de crear -->
    <v-dialog v-model="showConfirmDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-6">
          <v-icon color="warning" size="60">mdi-help-circle</v-icon>
        </v-card-title>
        <v-card-text class="text-center">
          <div class="text-h5 font-weight-bold mb-2">¿Estás seguro?</div>
          <div class="text-body-1 text-medium-emphasis">
            ¿Deseas crear este prospecto con los datos ingresados?
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-6 gap-2">
          <v-btn
            variant="text"
            @click="showConfirmDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loading"
            @click="confirmCreate"
          >
            Sí, crear prospecto
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de confirmación -->
    <v-dialog v-model="showSuccessDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-6">
          <v-icon color="success" size="60">mdi-check-circle</v-icon>
        </v-card-title>
        <v-card-text class="text-center">
          <div class="text-h5 font-weight-bold mb-2">¡Prospecto creado exitosamente!</div>
          <div class="text-body-1 text-medium-emphasis">
            El prospecto ha sido registrado correctamente en el sistema.
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-6">
          <v-btn
            color="primary"
            variant="elevated"
            size="large"
            @click="handleConfirmSuccess"
          >
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para errores -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createProspecto, asignarAsesor } from '@/services/prospectosService'

const router = useRouter()
const route = useRoute()
const fromAsesor = ref<string | null>(null)

type Nullable<T> = T | null

interface ProspectoCreateForm {
  nombre: string
  telefono: string
  placa: string
  observaciones: string
  soat_vigente: boolean
  soat_vencimiento: string
  tecno_vigente: boolean
  tecno_vencimiento: string
  preventiva_vigente: boolean
  preventiva_vencimiento: string
  peritaje_ultima_fecha: string
}

interface CreateProspectoPayload {
  nombre: string
  telefono: Nullable<string>
  placa: string
  convenioId: null
  origen: 'OTRO'
  observaciones: Nullable<string>
  soatVigente: boolean
  soatVencimiento: Nullable<string>
  tecnoVigente: boolean
  tecnoVencimiento: Nullable<string>
  preventivaVigente: boolean
  preventivaVencimiento: Nullable<string>
  peritajeUltimaFecha: Nullable<string>
  creado_por: Nullable<number>
  asesor_agente_id: Nullable<number>
}

interface ProspectoCreadoMin {
  id: number
  asignacion_activa?: unknown
}

function isProspectoCreadoMin(v: unknown): v is ProspectoCreadoMin {
  return typeof v === 'object' && v !== null && typeof (v as { id?: unknown }).id === 'number'
}

const form = ref<ProspectoCreateForm>({
  nombre: '',
  telefono: '',
  placa: '',
  observaciones: '',
  soat_vigente: false,
  soat_vencimiento: '',
  tecno_vigente: false,
  tecno_vencimiento: '',
  preventiva_vigente: false,
  preventiva_vencimiento: '',
  peritaje_ultima_fecha: '',
})

const loading = ref<boolean>(false)
const showConfirmDialog = ref<boolean>(false)
const showSuccessDialog = ref<boolean>(false)
const snackbar = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({ show: false, text: '', color: 'success' })

type RuleFn = (v: unknown) => true | string
const rReq: RuleFn = (v) => (!!v && String(v).trim().length > 0) || 'Requerido'
const rTel: RuleFn = (v) => (!v || /^\d{7,15}$/.test(String(v))) || 'Solo dígitos (7-15)'

function onPlacaInput(val?: string): void {
  form.value.placa = (val || '').toUpperCase().replace(/[\s-]+/g, '')
}
function onTelefonoInput(val?: string): void {
  form.value.telefono = (val || '').replace(/\D+/g, '')
}

function getUserIdFromSession(): number | null {
  try {
    const raw = sessionStorage.getItem('user')
    if (!raw) return null
    const u = JSON.parse(raw) as { id?: unknown }
    return typeof u?.id === 'number' ? u.id : null
  } catch {
    return null
  }
}
function getAgenteIdFromSession(): number | null {
  try {
    const raw = sessionStorage.getItem('user')
    if (!raw) return null
    const u = JSON.parse(raw) as { agenteId?: unknown }
    return typeof u?.agenteId === 'number' ? u.agenteId : null
  } catch {
    return null
  }
}
function getToken(): string | null {
  try {
    return sessionStorage.getItem('token') || localStorage.getItem('token')
  } catch {
    return null
  }
}

/** Builder robusto para evitar 404 por doble /api */
function apiUrl(path: string): string | null {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (!base) return null
  const p = path.startsWith('/') ? path : `/${path}`
  const baseHasApi = /\/api\/?$/.test(base)
  const pathHasApi = /^\/api(\/|$)/.test(p)
  let finalPath = p
  if (baseHasApi && pathHasApi) finalPath = p.replace(/^\/api/, '')
  if (!baseHasApi && !pathHasApi) finalPath = `/api${p}`
  return `${base}${finalPath}`
}

/** Intenta leer el agente del usuario desde la API (si existe el endpoint); si no, sesión */
async function fetchMiAgenteId(): Promise<number | null> {
  const url = apiUrl('/agentes-captacion/me')
  const token = getToken()
  if (!url || !token) return getAgenteIdFromSession()

  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) return getAgenteIdFromSession()
    const data = (await r.json()) as { id?: unknown }
    return typeof data?.id === 'number' ? data.id : getAgenteIdFromSession()
  } catch {
    return getAgenteIdFromSession()
  }
}

const canSubmit = computed<boolean>(() => !!form.value.nombre?.trim() && !!form.value.telefono?.trim() && !!form.value.placa?.trim())

/* ===== Confirmar creación ===== */
async function confirmCreate(): Promise<void> {
  showConfirmDialog.value = false
  await submit()
}

async function submit(): Promise<void> {
  if (!canSubmit.value) {
    snackbar.value = { show: true, color: 'error', text: 'Completa los campos obligatorios.' }
    return
  }

  loading.value = true
  try {
    const creadorId = getUserIdFromSession()

    const payload: CreateProspectoPayload = {
      nombre: form.value.nombre.trim(),
      telefono: form.value.telefono || null,
      placa: (form.value.placa || '').toUpperCase().replace(/[\s-]+/g, ''),
      convenioId: null,
      origen: 'OTRO',
      observaciones: form.value.observaciones || null,

      soatVigente: !!form.value.soat_vigente,
      soatVencimiento: form.value.soat_vencimiento || null,
      tecnoVigente: !!form.value.tecno_vigente,
      tecnoVencimiento: form.value.tecno_vencimiento || null,

      preventivaVigente: !!form.value.preventiva_vigente,
      preventivaVencimiento: form.value.preventiva_vencimiento || null,
      peritajeUltimaFecha: form.value.peritaje_ultima_fecha || null,

      creado_por: creadorId,
      asesor_agente_id: null, // No asignar automáticamente
    }

    const createdRaw = await createProspecto(payload)
    if (!isProspectoCreadoMin(createdRaw)) throw new Error('Respuesta inesperada del servidor')

    // Mostrar modal de éxito
    showSuccessDialog.value = true
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error creando prospecto'
    snackbar.value = { show: true, color: 'error', text: msg }
  } finally {
    loading.value = false
  }
}

/* ===== Confirmar y redirigir ===== */
function handleConfirmSuccess() {
  showSuccessDialog.value = false

  if (fromAsesor.value) {
    router.push({
      name: 'FichaComercialAsesor',
      params: { id: fromAsesor.value }
    })
  } else {
    router.push({ name: 'ComercialProspectos' })
  }
}

function volver(): void {
  router.push({ name: 'ComercialProspectos' }).catch(() => {})
}

onMounted(() => {
  fromAsesor.value = route.query.fromAsesor as string || null
})
</script>

<style scoped>
.gap-2 { gap: 8px; }
.text-h5 { font-weight: bold; }
</style>
