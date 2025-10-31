<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="yellow-darken-3">
            <v-icon>mdi-receipt</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Facturación / Subir ticket</div>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap:10px">
          <!-- Loader OCR -->
          <v-progress-circular
            v-if="ocr.status==='running'"
            indeterminate
            color="info"
            :size="28"
            :width="3"
            aria-label="Procesando OCR"
          />
          <!-- Estado -->
          <v-chip v-else :color="estadoColor" variant="tonal" class="font-weight-bold">
            {{ estado }}
          </v-chip>

          <v-btn prepend-icon="mdi-plus" @click="resetAll" color="primary" variant="flat">Nueva carga</v-btn>
          <v-btn prepend-icon="mdi-history" variant="tonal" @click="$router.push({ path: '/facturacion/historico' })">
            Histórico
          </v-btn>
          <v-btn prepend-icon="mdi-help-circle-outline" variant="text" @click="dialogAyuda=true">
            Ayuda
          </v-btn>
        </div>
      </v-card-title>
    </v-card>

    <v-row>
      <!-- IZQUIERDA: Evidencia -->
      <v-col cols="12" md="6">
        <v-card elevation="8" class="rounded-xl mb-4">
          <v-card-title class="py-4">
            <v-icon class="mr-2">mdi-image-plus</v-icon>
            Evidencia (ticket)
          </v-card-title>
          <v-divider />
          <v-card-text>
            <!-- Dropzone -->
            <div
              class="dropzone rounded-lg mb-4"
              :class="{ 'dropzone--active': dragging }"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
              @click="selectFile"
            >
              <div class="text-center">
                <div class="text-subtitle-1 font-weight-bold">Suelta el ticket o pega (Ctrl+V)</div>
                <div class="text-medium-emphasis">JPG o PNG (hasta 8 MB)</div>
                <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="onFileChange" />
              </div>
            </div>

            <!-- Preview -->
            <v-expand-transition>
              <div v-if="previewUrl" class="preview-wrapper">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center" style="gap:8px">
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-magnify-minus" @click="zoomOut">Zoom -</v-btn>
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-magnify-plus" @click="zoomIn">Zoom +</v-btn>
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-rotate-right" @click="rotateRight">Rotar 90°</v-btn>
                    <v-btn size="small" variant="text" @click="fitWidth">Ajustar a ancho</v-btn>
                  </div>

                  <div class="d-flex align-center" style="gap:10px">
                    <template v-if="ocr.status==='running'">
                      <v-progress-circular indeterminate color="info" :size="22" :width="2" />
                    </template>
                    <v-chip v-else-if="ocr.status==='done'" size="small" color="success" variant="tonal">OCR listo</v-chip>
                    <v-chip v-else size="small" color="grey" variant="tonal">OCR pendiente</v-chip>

                    <v-btn
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-reload"
                      :disabled="!previewBlob || ocr.status==='running'"
                      @click="retryOCR"
                    >Reintentar OCR</v-btn>
                  </div>
                </div>

                <div class="preview-canvas">
                  <img :src="previewUrl" :style="imgStyle" alt="Ticket" />
                </div>
              </div>
            </v-expand-transition>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- DERECHA: Turno asociado -->
      <v-col cols="12" md="6">
        <v-card elevation="8" class="rounded-xl mb-4">
          <v-card-title class="py-4 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-clipboard-text</v-icon>
              Turno asociado
            </div>

            <!-- Chips de Global / Servicio y código -->
            <div class="d-flex align-center flex-wrap" style="gap:8px">
              <v-chip size="small" v-if="turnoCard.numeroGlobal" color="primary" variant="elevated" prepend-icon="mdi-counter">
                Global: {{ turnoCard.numeroGlobal }}
              </v-chip>
              <v-chip size="small" v-if="turnoCard.numeroServicio" color="deep-purple" variant="elevated" prepend-icon="mdi-counter">
                {{ turnoCard.servicioCodigo || 'SERV' }}: {{ turnoCard.numeroServicio }}
              </v-chip>
              <v-chip size="small" v-if="turnoCard.servicioCodigo" color="indigo" variant="tonal">
                {{ turnoCard.servicioCodigo }}
              </v-chip>
            </div>
          </v-card-title>

          <v-divider/>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="label">Turno</div>
                <div class="value">#{{ turnoCard.numero ?? '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Placa</div>
                <div class="value">{{ turnoCard.placa || '—' }}</div>
              </v-col>

              <v-col cols="6">
                <div class="label">Servicio</div>
                <div class="value">{{ turnoCard.servicioNombre || '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Ingreso</div>
                <div class="value">{{ turnoCard.horaIngreso || '—' }}</div>
              </v-col>

              <v-col cols="6">
                <div class="label">Fecha</div>
                <div class="value">{{ turnoCard.fecha || '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Estado</div>
                <div class="value">
                  <v-chip size="small" :color="turnoCard.estadoColor" variant="tonal">{{ turnoCard.estado || '—' }}</v-chip>
                </div>
              </v-col>

              <v-col cols="6">
                <div class="label">Sede</div>
                <div class="value">{{ turnoCard.sede || '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Funcionario</div>
                <div class="value">{{ turnoCard.funcionario || '—' }}</div>
              </v-col>

              <v-col cols="12">
                <div class="label">Tipo de vehículo</div>
                <div class="value">{{ turnoCard.tipoVehiculo || '—' }}</div>
              </v-col>
            </v-row>

            <!-- Captación / Dateo -->
            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-2">Captación / Dateo</div>



            <!-- Asesor Comercial -->
            <div class="capt-line" v-if="turnoCard.agenteComercialNombre">
              <v-chip size="small" color="secondary" variant="tonal">Asesor comercial</v-chip>
              <span class="text-medium-emphasis">{{ turnoCard.agenteComercialNombre }}</span>
            </div>

            <!-- Asesor Convenio -->
            <div class="capt-line" v-if="turnoCard.asesorConvenioNombre">
              <v-chip size="small" color="teal" variant="tonal">Asesor convenio</v-chip>
              <span class="text-medium-emphasis">{{ turnoCard.asesorConvenioNombre }}</span>
            </div>

            <!-- Convenio -->
            <div class="capt-line" v-if="turnoCard.convenioNombre">
              <v-chip size="small" color="blue-grey" variant="tonal">Convenio</v-chip>
              <span class="text-medium-emphasis">{{ turnoCard.convenioNombre }}</span>
            </div>

            <v-alert type="info" variant="tonal" class="mt-4">
              Esta facturación quedará asociada al turno mostrado. (Sin prellenar campos).
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Formulario derecha (datos detectados) -->
        <v-card elevation="8" class="rounded-xl">
          <v-card-text>
            <div class="section-title">Datos detectados automáticamente</div>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.placa" label="Placa" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="totalDisplay"
                  label="Total (COP)"
                  prefix="$"
                  clearable
                  @focus="onTotalFocus"
                  @blur="onTotalBlur"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.fecha" type="date" label="Fecha del pago" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="hora12"
                  label="Hora del pago"
                  placeholder="hh:mm:ss AM/PM"
                  clearable
                  @blur="onHora12Blur"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.vendedor" label="Vendedor" clearable />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.nit" label="NIT" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.pin" label="PIN" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.marca" label="Marca" clearable />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.prefijo" label="Prefijo (FV/FE)" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.consecutivo" label="Consecutivo (número)" />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <v-row>
              <v-col cols="12" md="4">
                <v-text-field v-model="subtotalDisplay" label="Subtotal" prefix="$"
                              @focus="subtotalFocus" @blur="subtotalBlur" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="ivaDisplay" label="IVA" prefix="$"
                              @focus="ivaFocus" @blur="ivaBlur" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="totalFacturaDisplay" label="Total factura" prefix="$"
                              @focus="totalFacturaFocus" @blur="totalFacturaBlur" />
              </v-col>
            </v-row>

            <v-divider class="my-6" />

            <div class="d-flex align-center justify-end" style="gap:10px">
              <v-btn variant="text" @click="resetAll">Limpiar</v-btn>
              <v-btn color="primary" :disabled="!requeridosOk" @click="openConfirm">
                Confirmar facturación
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Ayuda -->
    <v-dialog v-model="dialogAyuda" max-width="720">
      <v-card>
        <v-card-title>Ayuda rápida</v-card-title>
        <v-card-text>
          <ul class="mt-2">
            <li>Arrastra la imagen o pega con <b>Ctrl+V</b>.</li>
            <li>Si la foto está torcida, pulsa <b>Rotar 90°</b> y luego <b>Reintentar OCR</b>.</li>
            <li>El sistema detecta datos clave: <i>Placa</i>, <i>Total</i>, <i>Fecha</i> y <i>Hora</i>, además de NIT/PIN/Marca.</li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogAyuda=false">Entendido</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL CONFIRMACIÓN -->
    <v-dialog v-model="dialogConfirm" max-width="780">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-shield-check</v-icon>
          Confirmar facturación
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div class="text-body-2 mb-3">
            Revisa los datos. Al confirmar se guardará la facturación asociada al turno mostrado y se procesará la comisión automática si aplica.
          </div>

          <v-row>
            <v-col cols="12" md="6">
              <div class="section-title">Ticket</div>
              <div class="label">Placa</div>
              <div class="value mb-2">{{ form.placa || '—' }}</div>

              <div class="label">Fecha y hora de pago</div>
              <div class="value mb-2">{{ form.fecha || '—' }} • {{ hora12 || '—' }}</div>

              <div class="label">Total</div>
              <div class="value mb-2">{{ totalFacturaDisplay || totalDisplay || '—' }}</div>

              <div class="label">Vendedor</div>
              <div class="value mb-2">{{ form.vendedor || '—' }}</div>

              <div class="label">Prefijo / Consecutivo</div>
              <div class="value mb-2">{{ form.prefijo || '—' }} {{ form.consecutivo || '' }}</div>

              <div class="label">NIT / PIN / Marca</div>
              <div class="value">{{ form.nit || '—' }} / {{ form.pin || '—' }} / {{ form.marca || '—' }}</div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="section-title">Turno asociado</div>
              <div class="label">Turno / Servicio</div>
              <div class="value mb-2">#{{ turnoCard.numero ?? '—' }} • {{ turnoCard.servicioNombre || '—' }}</div>

              <div class="label">Placa (turno)</div>
              <div class="value mb-2">{{ turnoCard.placa || '—' }}</div>

              <div class="label">Sede / Funcionario</div>
              <div class="value mb-2">{{ turnoCard.sede || '—' }} • {{ turnoCard.funcionario || '—' }}</div>

              <div class="label">Canal</div>
              <div class="value mb-2">
                <v-chip v-if="turnoCard.captacionCanal" :color="canalChipColor(turnoCard.captacionCanal)" size="small" variant="tonal">
                  {{ humanCanal(turnoCard.captacionCanal) }}
                </v-chip>
                <span v-else>—</span>
              </div>

              <div class="label">Asesores / Convenio</div>
              <div class="value">
                <div class="capt-line" v-if="turnoCard.agenteComercialNombre">
                  <v-chip size="x-small" color="secondary" variant="tonal">Comercial</v-chip>
                  <span class="text-medium-emphasis">{{ turnoCard.agenteComercialNombre }}</span>
                </div>
                <div class="capt-line" v-if="turnoCard.asesorConvenioNombre">
                  <v-chip size="x-small" color="teal" variant="tonal">Convenio</v-chip>
                  <span class="text-medium-emphasis">{{ turnoCard.asesorConvenioNombre }}</span>
                </div>
                <div class="capt-line" v-if="turnoCard.convenioNombre">
                  <v-chip size="x-small" color="blue-grey" variant="tonal">Convenio</v-chip>
                  <span class="text-medium-emphasis">{{ turnoCard.convenioNombre }}</span>
                </div>
                <div v-if="!turnoCard.agenteComercialNombre && !turnoCard.asesorConvenioNombre && !turnoCard.convenioNombre">—</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogConfirm=false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" :disabled="saving" @click="confirmarYGuardar">
            Confirmar y guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL RESULTADO / DETALLE GUARDADO -->
    <v-dialog v-model="dialogResult" max-width="680">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="success">mdi-check-decagram</v-icon>
          Facturación registrada
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div class="mb-2">
            Se guardó la facturación correctamente.
          </div>
          <v-alert type="success" variant="tonal" class="mb-4" v-if="result?.folio || result?.id || result?.data?.id">
            <div class="d-flex flex-column">
              <span v-if="result?.folio"><b>Folio:</b> {{ result.folio }}</span>
              <span v-if="result?.id"><b>ID:</b> {{ result.id }}</span>
              <span v-if="result?.data?.id"><b>ID:</b> {{ result.data.id }}</span>
              <span v-if="result?.estado"><b>Estado:</b> {{ result.estado }}</span>
            </div>
          </v-alert>

          <div class="text-body-2">
            <b>Placa:</b> {{ form.placa || '—' }} •
            <b>Fecha:</b> {{ form.fecha || '—' }} •
            <b>Hora:</b> {{ hora12 || '—' }} •
            <b>Total:</b> {{ totalFacturaDisplay || totalDisplay || '—' }}
          </div>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="closeResult">Cerrar</v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-open-in-new" v-if="result?.id || result?.data?.id" @click="goToDetalle(result?.id || result?.data?.id)">
            Ver detalle
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>
<script setup lang="ts">
/**
 * Facturación / Subir ticket — BLOQUE SCRIPT (actualizado para evitar 409 por duplicado)
 * Reglas clave del flujo:
 *  - Se crea el ticket **una sola vez** (al subir la imagen) y se guarda su id en `currentTicketId`.
 *  - Si ya existe un ticket para el `turno_id`, NO se crea otro: se reutiliza ese ticket.
 *  - Reintentos de OCR / confirmación usan `PATCH` + `POST /confirmar` sobre el mismo id. Nunca vuelven a hacer POST con el archivo.
 */

import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import { FacturacionService } from '@/services/facturacion_service'

/* ===================== Router / Query ===================== */
const route = useRoute()
const router = useRouter()

/* ===================== Estado UI ===================== */
const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const previewBlob = ref<File | null>(null)
const imageRotation = ref(0)
const imageScale = ref(1)
const dialogAyuda = ref(false)
const snack = reactive({ show: false, text: '' })

/* ====== Diálogos y guardado ====== */
const dialogConfirm = ref(false)
const dialogResult = ref(false)
const saving = ref(false)
const result = ref<any>(null)

/* ====== Ticket actual (id en backend) ====== */
const currentTicketId = ref<number | null>(null)

/* ===================== OCR (cliente y backend) ===================== */
type OCRStatus = 'idle' | 'running' | 'done'
const ocr = reactive({
  status: 'idle' as OCRStatus,
  progress: 0,
  text: '',
})

/* ===================== Formulario ===================== */
const form = reactive({
  placa: '',
  total: 0,
  fecha: '',   // YYYY-MM-DD
  hora: '',    // HH:mm:ss (24h, interno)
  vendedor: '',
  prefijo: '',
  consecutivo: '',
  nit: '',
  pin: '',
  marca: '',
  // Totales explícitos
  subtotal: 0,
  iva: 0,
  totalFactura: 0,
})
const totalDisplay = ref('')
const subtotalDisplay = ref('')
const ivaDisplay = ref('')
const totalFacturaDisplay = ref('')

/* ===== Hora en 12h para UI ===== */
const hora12 = ref('') // ej: "05:03:14 PM"
function to12h(hhmmss: string) {
  if (!hhmmss) return ''
  let [hh='00', mm='00', ss='00'] = hhmmss.split(':')
  let h = Number(hh)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12; if (h === 0) h = 12
  return `${String(h).padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'0')} ${ampm}`
}
function to24hFrom12(s: string) {
  if (!s) return ''
  const clean = s.trim().replace(/\./g, ':').toUpperCase()
  const m = clean.match(/^(\d{1,2}):?(\d{2})(?::?(\d{2}))?\s*(AM|PM)$/i)
  if (!m) return ''
  let h = Number(m[1]); const mm = m[2]; const ss = m[3] || '00'; const ap = (m[4] || 'AM').toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2,'0')}:${mm}:${ss}`
}
function onHora12Blur() {
  const h24 = to24hFrom12(hora12.value)
  if (h24) {
    form.hora = h24
    hora12.value = to12h(h24)
  } else {
    form.hora = ''
    hora12.value = ''
  }
}

/* ===================== Estado visual ===================== */
const requeridosOk = computed(() =>
  !!form.placa && (form.total > 0 || form.totalFactura > 0) && !!form.fecha && !!form.hora
)
const estado = computed(() => {
  if (ocr.status === 'running') return 'Procesando'
  if (ocr.status === 'done' && requeridosOk.value) return 'OCR listo'
  if (ocr.status === 'done') return 'OCR listo (completa los faltantes)'
  return 'Borrador'
})
const estadoColor = computed(() => {
  switch (estado.value) {
    case 'Procesando': return 'info'
    case 'OCR listo':
    case 'OCR listo (completa los faltantes)': return 'success'
    default: return 'grey'
  }
})

/* ===================== Controles de imagen ===================== */
function selectFile() { fileInput.value?.click() }
function zoomIn() { imageScale.value = Math.min(imageScale.value + 0.1, 3) }
function zoomOut() { imageScale.value = Math.max(imageScale.value - 0.1, 0.4) }
function rotateRight() { imageRotation.value = (imageRotation.value + 90) % 360 }
function fitWidth() { imageScale.value = 1 }

const imgStyle = computed(() => ({
  transform: `rotate(${imageRotation.value}deg) scale(${imageScale.value})`,
  transformOrigin: 'center center',
  maxWidth: '100%',
}))

/* ===================== Archivo ===================== */
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
  input.value = ''
}
function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}
function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        handleFile(file)
        e.preventDefault()
        break
      }
    }
  }
}

/* ===================== Formateo COP ===================== */
function onTotalFocus() { totalDisplay.value = form.total ? String(form.total) : '' }
function onTotalBlur() {
  const n = parseCOPToNumber(totalDisplay.value)
  form.total = n
  totalDisplay.value = n ? formatCOP(n) : ''
}
const subtotalFocus = () => { subtotalDisplay.value = form.subtotal ? String(form.subtotal) : '' }
const subtotalBlur = () => { form.subtotal = parseCOPToNumber(subtotalDisplay.value); subtotalDisplay.value = fmt(form.subtotal) }
const ivaFocus = () => { ivaDisplay.value = form.iva ? String(form.iva) : '' }
const ivaBlur = () => { form.iva = parseCOPToNumber(ivaDisplay.value); ivaDisplay.value = fmt(form.iva) }
const totalFacturaFocus = () => { totalFacturaDisplay.value = form.totalFactura ? String(form.totalFactura) : '' }
const totalFacturaBlur = () => { form.totalFactura = parseCOPToNumber(totalFacturaDisplay.value); totalFacturaDisplay.value = fmt(form.totalFactura) }

function formatCOP(n?: number | null) {
  return typeof n === 'number'
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
    : ''
}
const fmt = (n: number) => (n ? formatCOP(n) : '')
function parseCOPToNumber(s: string) {
  if (!s) return 0
  const clean = s.replace(/[^\d]/g, '')
  return Number(clean || 0)
}

/* ===================== Utilidades fecha ===================== */
function splitISO(iso: string) {
  const [fecha, horaRaw = ''] = iso.split('T')
  return { fecha, hora: normalizeHora(horaRaw) }
}
function normalizeFecha(s: string): string {
  const [d, m, yRaw] = s.replace(/-/g, '/').split('/')
  const yyyy = (yRaw?.length === 2) ? `20${yRaw}` : yRaw
  if (!d || !m || !yyyy) return ''
  return `${yyyy}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}
function normalizeHora(h: string): string {
  const t = h.replace(/\./g, ':').trim()
  const ampm = /(AM|PM)$/i.test(t)
  let [hh, mm = '00', ss = '00'] = t.replace(/\s?(AM|PM)$/i, '').split(':')
  let H = Number(hh)
  if (Number.isNaN(H)) return ''
  if (ampm) {
    const isPM = /PM$/i.test(t)
    if (isPM && H < 12) H += 12
    if (!isPM && H === 12) H = 0
  }
  return `${String(H).padStart(2, '0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
}
function toLocalDateAndTime(fecha: string, hora: string) {
  return { fecha: normalizeFecha(fecha), hora: normalizeHora(hora) }
}

/* ===================== Parser fallback local ===================== */
function pullNumber(s?: string | null) {
  if (!s) return 0
  return Number(String(s).replace(/[^\d]/g, '')) || 0
}
function parseTicket(txt: string) {
  const cleanLines = txt
    .replace(/\r/g, '')
    .replace(/[·•]/g, '.')
    .replace(/[“”]/g, '"')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const asOne = cleanLines.join(' ').replace(/\s{2,}/g, ' ')

  // PLACA
  let m = asOne.match(/PLACA[:\s]*([A-Z0-9]{5,7})/i)
  if (m) {
    form.placa = m[1].toUpperCase()
    syncPlacaWithTurno()
  }

  // NIT
  m = asOne.match(/\bNIT[:\s]*([0-9\.\- ]{7,})/i)
  if (m) form.nit = m[1].replace(/\s+/g, '').replace(/[^\d\-\.]/g, '')

  // PIN
  m = asOne.match(/\bPIN[:\s]*([A-Z0-9\- ]{4,})/i)
  if (m) form.pin = m[1].trim()

  // MARCA
  m = asOne.match(/\bMARCA[:\s]*([A-Z0-9 ]{2,})/i)
  if (m) form.marca = m[1].trim().replace(/\s{2,}/g, ' ')

  // VENDEDOR / VEN
  m = asOne.match(/\bVEN(?:DEDOR)?[:\s]*([A-ZÁÉÍÓÚÑ ]{2,})/i)
  if (m) form.vendedor = m[1].trim()

  // PREFIJO + CONSECUTIVO
  m = asOne.match(/\b(FV|FE)[\s\-:]*[A-Z]*\s*[-:]?\s*(\d{2,6})\b/i)
  if (m) {
    form.prefijo = m[1].toUpperCase()
    form.consecutivo = m[2]
  }

  // FECHA y HORA
  const mFechaHora = asOne.match(/FECHA[:\s]*([\d\/\-]{6,10}).{0,20}HORA[:\s]*([0-9:\. ]+[AP]?M?)/i)
  const mFecha = mFechaHora ? null : asOne.match(/FECHA[:\s]*([\d\/\-]{6,10})/i)
  const mHora  = mFechaHora ? null : asOne.match(/HORA[:\s]*([0-9:\. ]+[AP]?M?)/i)

  if (mFechaHora) {
    const { fecha, hora } = toLocalDateAndTime(mFechaHora[1], mFechaHora[2])
    if (fecha) form.fecha = fecha
    if (hora) { form.hora = hora; hora12.value = to12h(hora) }
  } else {
    if (mFecha) form.fecha = normalizeFecha(mFecha[1])
    if (mHora)  { form.hora  = normalizeHora(mHora[1]); hora12.value = form.hora ? to12h(form.hora) : '' }
  }

  // SUBTOTAL / IVA / TOTAL
  const mSub = asOne.match(/\bSUB\s*TOTAL[:\s]*\$?\s*([\d\.,]+)/i) || asOne.match(/\bSUBTOTAL[:\s]*\$?\s*([\d\.,]+)/i)
  if (mSub) {
    form.subtotal = pullNumber(mSub[1])
    subtotalDisplay.value = fmt(form.subtotal)
  }
  const mIva = asOne.match(/\bIVA(?:\s*\(\d+%?\))?[:\s]*\$?\s*([\d\.,]+)/i)
  if (mIva) {
    form.iva = pullNumber(mIva[1])
    ivaDisplay.value = fmt(form.iva)
  }
  const mTotFac = asOne.match(/\bTOTAL\s*FACTURA[:\s]*\$?\s*([\d\.,]+)/i)
  const mTotGen = asOne.match(/\bTOTAL[:\s]*\$?\s*([\d\.,]+)/i)
  const totalVal = mTotFac ? pullNumber(mTotFac[1]) : (mTotGen ? pullNumber(mTotGen[1]) : 0)
  if (totalVal) {
    form.totalFactura = totalVal
    form.total = totalVal
    totalDisplay.value = fmt(totalVal)
    totalFacturaDisplay.value = fmt(totalVal)
  }
}

/* ===================== Helpers desde OCR backend ===================== */
function splitISOField(v?: string) {
  if (!v) return { fecha: '', hora: '' }
  const [f, hRaw] = v.split('T')
  return { fecha: f, hora: normalizeHora(hRaw || '') }
}
function fillFromCampos(c?: any) {
  if (!c) return
  const setIf = (val: any, setter: (v:any)=>void) => { if (val !== undefined && val !== null && val !== '') setter(val) }

  setIf(c.placa,        (v)=> { form.placa = String(v).toUpperCase(); syncPlacaWithTurno() })
  setIf(c.nit,          (v)=> form.nit = String(v))
  setIf(c.pin,          (v)=> form.pin = String(v))
  setIf(c.marca,        (v)=> form.marca = String(v))
  setIf(c.vendedor,     (v)=> form.vendedor = String(v))
  setIf(c.prefijo,      (v)=> form.prefijo = String(v))
  setIf(c.consecutivo,  (v)=> form.consecutivo = String(v))

  if (c.fechaHora) {
    const { fecha, hora } = splitISOField(String(c.fechaHora))
    if (fecha) form.fecha = fecha
    if (hora) { form.hora = hora; hora12.value = to12h(hora) }
  } else {
    setIf(c.fecha, (v)=> form.fecha = String(v))
    if (c.hora !== undefined) {
      const h24 = normalizeHora(String(c.hora)) || to24hFrom12(String(c.hora))
      form.hora = h24
      hora12.value = h24 ? to12h(h24) : ''
    }
  }

  const sub = Number(c.subtotal || 0)
  const iva = Number(c.iva || 0)
  const tf  = Number(c.totalFactura || 0)
  const tt  = Number(c.total || 0)
  const tFinal = tf || tt
  if (sub) { form.subtotal = sub; subtotalDisplay.value = fmt(sub) }
  if (iva) { form.iva = iva; ivaDisplay.value = fmt(iva) }
  if (tFinal) {
    form.totalFactura = tFinal
    form.total = tFinal
    totalFacturaDisplay.value = fmt(tFinal)
    totalDisplay.value = fmt(tFinal)
  }
}

/* ===================== Turno asociado (tarjeta) ===================== */
type Canal =

  | 'ASESOR_COMERCIAL'
  | 'ASESOR'
  | 'TELEMERCADEO'
  | 'TELE'
  | 'REDES'
  | 'CONVENIO'
  | 'REFERIDO'
  | string

type Card = {
  numero?: number | null
  numeroGlobal?: number | null
  numeroServicio?: number | null
  placa?: string | null
  servicioCodigo?: string | null
  servicioNombre?: string | null
  tipoVehiculo?: string | null
  horaIngreso?: string | null
  fecha?: string | null
  estado?: string | null
  estadoColor?: string
  sede?: string | null
  funcionario?: string | null
  captacionCanal?: Canal | null
  agenteComercialNombre?: string | null
  asesorConvenioNombre?: string | null
  convenioNombre?: string | null
}
const turnoCard = reactive<Card>({})

/* === IDs crudos del turno para snapshots/asincronía === */
const turnoMeta = reactive<{
  servicioId: number | null
  sedeId: number | null
  dateoId: number | null
  agenteId: number | null
}>({
  servicioId: null,
  sedeId: null,
  dateoId: null,
  agenteId: null,
})

function mapClaseToTipo(clase?: { id?: number; codigo?: string; nombre?: string } | null): string | null {
  if (!clase) return null
  const code = String(clase.codigo || '').toUpperCase()
  const name = String(clase.nombre || '').toUpperCase()
  if (code.includes('MOTO') || name.includes('MOTO')) return 'Motocicleta'
  if (code.includes('LIV_TAXI') || name.includes('TAXI')) return 'Liviano Taxi'
  if (code.includes('LIV_PUBLICO') || name.includes('PÚBLIC') || name.includes('PUBLIC')) return 'Liviano Público'
  if (code.includes('LIV_PART') || name.includes('PARTIC') || name.includes('LIVIANO')) return 'Liviano Particular'
  return null
}
function humanCanal(c?: Canal | null) {
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
function canalChipColor(c?: Canal | null) {
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
function hydrateTurnoCard(turno: any) {
  turnoCard.numeroGlobal =
    turno.turnoNumeroGlobal ?? turno.numeroGlobal ?? turno.global ?? turno.consecutivoGlobal ?? null
  turnoCard.numeroServicio =
    turno.turnoNumeroServicio ?? turno.numeroServicio ?? turno.consecutivoServicio ?? null
  turnoCard.numero = turno.turnoNumero ?? turno.numero ?? turno.id ?? null
  turnoCard.placa = (turno.placa ?? turno.vehiculo?.placa ?? '').toUpperCase() || null
  const servCodigo =
    turno.servicio?.codigoServicio ?? turno.servicioCodigo ?? turno.servicio?.codigo ?? null
  const servNombre =
    turno.servicio?.nombreServicio ?? turno.servicioNombre ?? turno.servicio?.nombre ?? null
  turnoCard.servicioCodigo = servCodigo
  turnoCard.servicioNombre = servNombre
  turnoCard.tipoVehiculo = turno.tipoVehiculo ?? mapClaseToTipo(turno.vehiculo?.clase ?? null) ?? null
  const horaIng = turno.horaIngreso ?? turno.ingresoHora ?? null
  turnoCard.horaIngreso = horaIng ? to12h(normalizeHora(String(horaIng))) : null
  if (turno.fecha) {
    const f = String(turno.fecha)
    turnoCard.fecha = f.includes('T') ? splitISO(f).fecha : f
  } else if (turno.createdAt) {
    const f = String(turno.createdAt)
    turnoCard.fecha = f.includes('T') ? splitISO(f).fecha : f
  } else {
    turnoCard.fecha = null
  }
  const est = (turno.estado || '').toString().toLowerCase()
  turnoCard.estado = est ? est.charAt(0).toUpperCase() + est.slice(1) : null
  turnoCard.estadoColor =
    est === 'activo' ? 'success'
    : est === 'cancelado' ? 'error'
    : est === 'finalizado' ? 'blue-grey'
    : 'grey'
  turnoCard.sede = turno.sede?.nombre ?? turno.sedeNombre ?? null
  turnoCard.funcionario = (turno.usuario?.nombres && turno.usuario?.apellidos)
    ? `${turno.usuario.nombres} ${turno.usuario.apellidos}`
    : (turno.funcionario?.nombres && turno.funcionario?.apellidos)
      ? `${turno.funcionario.nombres} ${turno.funcionario.apellidos}`
      : turno.funcionarioNombre ?? null

  const dateo =
    turno.captacionDateo ??
    turno.captacion ??
    turno.dateo ?? null

  turnoCard.captacionCanal = (dateo?.canal ?? turno.canalAtribucion ?? null) as Canal | null
  turnoCard.agenteComercialNombre =
    turno.agenteCaptacion?.nombre ?? dateo?.agente?.nombre ?? turno.asesorComercial?.nombre ?? null
  turnoCard.asesorConvenioNombre =
    dateo?.asesorConvenio?.nombre ?? turno.asesorConvenio?.nombre ?? turno.agenteConvenio?.nombre ?? null
  turnoCard.convenioNombre =
    dateo?.convenio?.nombre ?? turno.convenio?.nombre ?? turno.convenioNombre ?? null

  if (form.placa) syncPlacaWithTurno()

  // === IDs crudos para sincronía con backend ===
  turnoMeta.servicioId = (turno.servicio?.id ?? turno.servicio_id ?? null) as number | null
  turnoMeta.sedeId     = (turno.sede?.id     ?? turno.sede_id     ?? null) as number | null
  const _dateo = turno.captacionDateo ?? turno.dateo ?? null
  turnoMeta.dateoId    = (_dateo?.id ?? turno.dateo_id ?? null) as number | null
  turnoMeta.agenteId   = (turno.agenteCaptacion?.id ?? turno.agente_id ?? null) as number | null
}

/* ===================== Sincronización de PLACA ===================== */
const RGX_CAR   = /^[A-Z]{3}\d{3}$/
const RGX_MOTO  = /^[A-Z]{3}\d{2}[A-Z]$/
const toLetter: Record<string,string> = { '0':'O','1':'I','2':'Z','3':'E','4':'A','5':'S','6':'G','7':'T','8':'B','9':'P' }
const toDigit:  Record<string,string> = { 'O':'0','I':'1','Z':'2','E':'3','A':'4','S':'5','G':'6','T':'7','B':'8','P':'9' }
function normalizePlate(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}
function inferTipoByPattern(p: string): 'carro'|'moto'|'desconocido' {
  if (RGX_CAR.test(p)) return 'carro'
  if (RGX_MOTO.test(p)) return 'moto'
  return 'desconocido'
}
function correctByExpected(ocr: string, expected: 'carro'|'moto'|'desconocido'): string {
  let s = normalizePlate(ocr)
  if (expected === 'carro') {
    if (s.length >= 6) {
      const head = s.slice(0,3).replace(/\d/g, ch => toLetter[ch] ?? ch)
      const tail = s.slice(3,6).replace(/[A-Z]/g, ch => toDigit[ch] ?? ch)
      s = head + tail
    }
  } else if (expected === 'moto') {
    if (s.length >= 6) {
      const l1 = s.slice(0,3).replace(/\d/g, ch => toLetter[ch] ?? ch)
      const d2 = s.slice(3,5).replace(/[A-Z]/g, ch => toDigit[ch] ?? ch)

      const l3 = (toLetter[s[5]] ?? s[5] ?? '')
      s = l1 + d2 + l3
    }
  }
  return s
}
function hamming(a: string, b: string) {
  if (a.length !== b.length) return 99
  let k = 0
  for (let i=0;i<a.length;i++) if (a[i] !== b[i]) k++
  return k
}
function syncPlacaWithTurno() {
  if (!form.placa) return
  const turnPlate = (turnoCard.placa || '').toUpperCase()
  const fromOcr   = normalizePlate(form.placa)

  if (!turnPlate) {
    const tipoGuess = inferTipoByPattern(fromOcr)
    const corrected = correctByExpected(fromOcr, tipoGuess)
    if (corrected !== fromOcr) {
      form.placa = corrected
      snack.text = `Se ajustó la placa detectada a ${corrected} por formato.`
      snack.show = true
    }
    return
  }

  const expectedTipo = inferTipoByPattern(turnPlate)
  const corrected = correctByExpected(fromOcr, expectedTipo)

  if (corrected.length === turnPlate.length && hamming(corrected, turnPlate) <= 1) {
    if (form.placa !== turnPlate) {
      form.placa = turnPlate
      snack.text = `Placa ajustada automáticamente a la del turno: ${turnPlate}`
      snack.show = true
    }
    return
  }

  if (form.placa !== turnPlate) {
    form.placa = turnPlate
    snack.text = `Se priorizó la placa del turno (${turnPlate}).`
    snack.show = true
  }
}

/* ===================== ID del turno desde query ===================== */
function getTurnoIdFromQuery(): number | null {
  const q = route.query
  const keys = ['turnoId', 'turno', 'id', 'turnold']
  for (const k of keys) {
    const v = (q as any)[k]
    if (Array.isArray(v)) {
      const n = Number(v[0])
      if (!Number.isNaN(n)) return n
    } else if (v != null) {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return null
}

/* ===================== Utilidades de backend (evita duplicados) ===================== */
async function findExistingTicketByTurno(turnoId: number) {
  try {
    const resp = await FacturacionService.list({ turno_id: turnoId, page: 1, limit: 1 })
    return resp.data?.[0] || null
  } catch {
    return null
  }
}

async function ensureTicketForTurnoWithFile(file: File) {
  const turnoId = getTurnoIdFromQuery()
  if (!turnoId) return null

  // 1) ¿Ya hay ticket para este turno? → úsalo
  const existing = await findExistingTicketByTurno(turnoId)
  if (existing) {
    currentTicketId.value = existing.id
    return existing
  }

  // 2) Crear una sola vez (sin repetir POST). Rotación como metadato + IDs de snapshot.
  const created = await FacturacionService.createFromFile({
    file,
    turno_id: turnoId,
    dateo_id: turnoMeta.dateoId ?? undefined,
    sede_id: turnoMeta.sedeId ?? undefined,
    servicio_id: turnoMeta.servicioId ?? undefined,
    image_rotation: imageRotation.value || 0,
  })
  currentTicketId.value = created.id
  return created
}

/* ===================== OCR y manejo de archivo ===================== */
async function getRotatedBlob(file: File, deg: number): Promise<Blob> {
  if (!deg) return file
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await new Promise((r) => (img.onload = () => r(null)))
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const w = img.width
  const h = img.height
  const rad = (deg % 360) * Math.PI / 180
  const swap = (deg % 180) !== 0
  canvas.width = swap ? h : w
  canvas.height = swap ? w : h
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -w / 2, -h / 2)
  return await new Promise((res) => canvas.toBlob((b) => res(b!), file.type || 'image/jpeg'))
}

async function handleFile(file: File) {
  previewBlob.value = file
  previewUrl.value = URL.createObjectURL(file)
  imageRotation.value = 0
  imageScale.value = 1

  // OCR cliente inmediato (para prellenar campos de UI)
  await startLocalOCR(file)

  // Crear/asegurar ticket en backend (solo una vez) y lanzar OCR backend
  try {
    const createdOrExisting = await ensureTicketForTurnoWithFile(file)
    if (createdOrExisting?.id) {
      // Si el usuario rotó, informamos al backend antes del reocr
      if (imageRotation.value) {
        await FacturacionService.update(createdOrExisting.id, { image_rotation: imageRotation.value })
      }
      await FacturacionService.reocr(createdOrExisting.id)
      snack.text = '✅ OCR del servidor ejecutado'
      snack.show = true
    }
  } catch (err: any) {
    console.error('Error creando/asegurando ticket:', err)
    snack.text = `❌ No se pudo crear el ticket: ${err?.message || 'Error'}`
    snack.show = true
  }
}

async function startLocalOCR(file: File) {
  ocr.status = 'running'
  ocr.progress = 10
  ocr.text = ''
  try {
    const blob = await getRotatedBlob(file, imageRotation.value)
    const fd = new FormData()
    fd.append('archivo', blob, (file as any).name || 'ticket.jpg')

    const resp = await fetch('/api/ocr/parse-ticket', { method: 'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const json = await resp.json() as { ok:boolean; text?:string; message?:string; campos?:any }
    if (!json?.ok || (!json.text && !json.campos)) throw new Error(json?.message || 'OCR vacío')

    ocr.status = 'done'
    ocr.progress = 100
    if (json.campos) fillFromCampos(json.campos)
    else if (json.text) parseTicket(json.text)
    if (form.placa) syncPlacaWithTurno()
    snack.text = '✅ OCR completado'
    snack.show = true
  } catch (err) {
    console.error('❌ OCR local error:', err)
    ocr.status = 'idle'
    snack.text = '❌ Error al procesar OCR local'
    snack.show = true
  }
}

async function retryOCR() {
  if (!previewBlob.value) return
  // Actualiza rotación en backend y re-OCR server si ya existe
  if (currentTicketId.value) {
    try {
      await FacturacionService.update(currentTicketId.value, { image_rotation: imageRotation.value })
      await FacturacionService.reocr(currentTicketId.value)
      snack.text = '🔄 Reintento de OCR en servidor'
      snack.show = true
    } catch (e) {
      console.error('reocr server error', e)
    }
  }
  // Reprocesa local para UI
  await startLocalOCR(previewBlob.value)
}

/* ===================== Reset ===================== */
function resetAll() {
  previewUrl.value = null
  previewBlob.value = null
  imageRotation.value = 0
  imageScale.value = 1
  ocr.status = 'idle'
  ocr.progress = 0
  ocr.text = ''
  currentTicketId.value = null

  form.placa = ''
  form.total = 0
  form.fecha = ''
  form.hora = ''
  form.vendedor = ''
  form.prefijo = ''
  form.consecutivo = ''
  form.nit = ''
  form.pin = ''
  form.marca = ''
  form.subtotal = 0
  form.iva = 0
  form.totalFactura = 0

  totalDisplay.value = ''
  subtotalDisplay.value = ''
  ivaDisplay.value = ''
  totalFacturaDisplay.value = ''
  hora12.value = ''
}

/* ===================== Confirmación y Guardado (sin re-POST de archivo) ===================== */
function openConfirm() {
  if (!requeridosOk.value) {
    snack.text = 'Completa placa, total, fecha y hora antes de confirmar.'
    snack.show = true
    return
  }
  dialogConfirm.value = true
}

async function confirmarYGuardar() {
  if (saving.value) return
  saving.value = true
  try {
    // Asegura que exista un ticket en backend (si el usuario pegó imagen pero no se creó aún)
    if (!currentTicketId.value && previewBlob.value) {
      const ensured = await ensureTicketForTurnoWithFile(previewBlob.value)
      if (ensured?.id) currentTicketId.value = ensured.id
    }
    const id = currentTicketId.value
    if (!id) throw new Error('No hay ticket creado para este turno')

    // Componer fecha_pago en ISO completo (America/Bogota = -05:00)
    const fechaPagoISO = form.fecha && form.hora
      ? `${form.fecha}T${form.hora}-05:00`
      : null

    // 1) PATCH con campos finales (+ IDs por si el ticket se creó sin alguno)
    await FacturacionService.update(id, {
      placa: String(form.placa || '').toUpperCase(),
      fecha_pago: fechaPagoISO, // ISO completo
      // Campos de totales:
      total: form.totalFactura || form.total || 0,
      subtotal: form.subtotal || null,
      iva: form.iva || null,
      total_factura: form.totalFactura || null,
      // Datos extra:
      vendedor_text: form.vendedor || null,
      prefijo: form.prefijo || null,
      consecutivo: form.consecutivo || null,
      nit: form.nit || null,
      pin: form.pin || null,
      marca: form.marca || null,
      image_rotation: imageRotation.value || 0,
      // IDs de asociación/snapshot
      turno_id: getTurnoIdFromQuery(),
      dateo_id: turnoMeta.dateoId,
      sede_id: turnoMeta.sedeId,
      servicio_id: turnoMeta.servicioId,
    })

    // 2) Confirmar
    const confirmed = await FacturacionService.confirmar(id)
    result.value = confirmed || { ok: true }
    dialogConfirm.value = false
    dialogResult.value = true
    snack.text = '✅ Facturación guardada y confirmada'
    snack.show = true
  } catch (err: any) {
    console.error('confirmarYGuardar error:', err)
    snack.text = `❌ No se pudo guardar: ${err?.message || 'Error desconocido'}`
    snack.show = true
  } finally {
    saving.value = false
  }
}

function closeResult() { dialogResult.value = false }
function goToDetalle(id: number | string) {
  router.push({ path: '/facturacion/historico', query: { focus: String(id) } })
}

/* ===================== Carga del turno ===================== */
async function fetchTurnoAndHydrate() {
  const id = getTurnoIdFromQuery()
  if (!id) return
  try {
    const t = await TurnosDelDiaService.fetchTurnoById(id)
    hydrateTurnoCard(t as any)
  } catch (e) {
    console.error('No se pudo cargar el turno asociado:', e)
  }
}

/* ===================== Listeners globales ===================== */
onMounted(async () => {
  window.addEventListener('paste', onPaste)
  await fetchTurnoAndHydrate()

  // Si ya existe ticket para el turno (entraron por "revisión"):
  const turnoId = getTurnoIdFromQuery()
  if (turnoId) {
    const existing = await findExistingTicketByTurno(turnoId)
    if (existing) currentTicketId.value = existing.id
  }

  if (form.placa) syncPlacaWithTurno()
})
onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
})
</script>
<style scoped>
/* ===== Cards & layout ===== */
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
  color: #6b7280; /* text-gray-500 */
  text-transform: uppercase;
  letter-spacing: .04em;
}

.value {
  font-weight: 600;
}

/* ===== Dropzone & preview ===== */
.dropzone {
  border: 2px dashed rgba(0,0,0,.25);
  padding: 22px;
  cursor: pointer;
  background: #fffceb;
  transition: 0.3s;
  border-radius: 12px;
}

.dropzone--active {
  background: #fff4c0;
  border-color: #e3b505;
}

.preview-wrapper .preview-canvas {
  width: 100%;
  max-height: 60vh;
  overflow: auto;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 8px;
  text-align: center;
}

.preview-canvas img {
  max-width: 100%;
  transition: transform .2s ease;
}

/* ===== Captación chips / lines ===== */
.capt-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

/* ===== Small helpers ===== */
.text-medium-emphasis {
  color: rgba(0,0,0,.6);
}

.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }

/* Make dialog content breathe a bit more on desktop */
:deep(.v-dialog .v-card) {
  border-radius: 16px;
}
</style>
