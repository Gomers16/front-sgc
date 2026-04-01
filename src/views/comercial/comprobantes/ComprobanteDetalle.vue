<template>
  <v-container class="py-6">

    <!-- ── CABECERA ── -->
    <div class="d-flex align-center gap-3 mb-5">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :to="{ name: 'ComercialComprobantes' }"
      />
      <div>
        <div class="text-h5 font-weight-bold d-flex align-center gap-2">
          🧾 Comprobante
          <v-chip color="primary" variant="flat" size="small" class="ms-1">
            #{{ comprobante?.numero ?? id }}
          </v-chip>
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          Generado el {{ formatDate(comprobante?.created_at) }}
        </div>
      </div>
      <v-spacer />
      <v-btn
        prepend-icon="mdi-printer"
        variant="outlined"
        color="primary"
        :disabled="!comprobante"
        @click="imprimir"
      >
        Imprimir
      </v-btn>
    </div>

    <v-skeleton-loader v-if="loading" type="card, card" />

    <template v-else-if="comprobante">
      <v-row>
        <!-- ── COLUMNA IZQUIERDA: info + detalle ── -->
        <v-col cols="12" md="7">

          <!-- Info del beneficiario -->
          <v-card class="rounded-xl mb-4" elevation="3">
            <div
              class="pa-4 rounded-t-xl d-flex justify-space-between align-start"
              style="background: linear-gradient(135deg, #1565C0, #1976D2);"
            >
              <div class="text-white">
                <div class="text-caption opacity-75 text-uppercase tracking-wider">
                  {{ comprobante.beneficiario_tipo === 'CONVENIO' ? 'Pago a convenio' : 'Pago a asesor' }}
                </div>
                <div class="text-h6 font-weight-bold mt-1">
                  {{ comprobante.beneficiario_nombre }}
                </div>
                <div v-if="comprobante.medio_pago" class="text-caption opacity-85 mt-1">
                  💳 {{ comprobante.medio_pago }}
                </div>
                <div v-if="comprobante.telefono" class="text-caption opacity-85">
                  📞 {{ comprobante.telefono }}
                </div>
              </div>
              <v-chip
                :color="comprobante.beneficiario_tipo === 'CONVENIO' ? 'white' : 'teal-lighten-3'"
                size="small"
                variant="flat"
                class="text-primary font-weight-bold"
              >
                {{ comprobante.beneficiario_tipo }}
              </v-chip>
            </div>

            <v-card-text class="pt-4">
              <v-row dense>
                <v-col cols="6" sm="3" class="text-center">
                  <div class="text-caption text-medium-emphasis">🏍️ Motos</div>
                  <div class="text-h6 font-weight-bold">{{ comprobante.total_motos }}</div>
                </v-col>
                <v-col cols="6" sm="3" class="text-center">
                  <div class="text-caption text-medium-emphasis">🚗 Vehículos</div>
                  <div class="text-h6 font-weight-bold">{{ comprobante.total_vehiculos }}</div>
                </v-col>
                <v-col cols="6" sm="3" class="text-center">
                  <div class="text-caption text-medium-emphasis">Dateo</div>
                  <div class="font-weight-bold">{{ formatCOP(comprobante.total_dateo) }}</div>
                </v-col>
                <v-col cols="6" sm="3" class="text-center">
                  <div class="text-caption text-medium-emphasis">Incentivo</div>
                  <div class="font-weight-bold">{{ formatCOP(comprobante.total_incentivo) }}</div>
                </v-col>
              </v-row>

              <v-divider class="my-3" />

              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-bold text-body-1">TOTAL A PAGAR</span>
                <span class="text-h5 font-weight-bold text-success">
                  {{ formatCOP(comprobante.total_general) }}
                </span>
              </div>
            </v-card-text>
          </v-card>

          <!-- Info adicional -->
          <v-card class="rounded-xl mb-4" elevation="2">
            <v-card-title class="text-subtitle-1 font-weight-medium pa-4 pb-2">
              Información del comprobante
            </v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Período</div>
                  <div class="text-body-2">
                    <template v-if="comprobante.periodo_desde || comprobante.periodo_hasta">
                      {{ comprobante.periodo_desde || '—' }} → {{ comprobante.periodo_hasta || '—' }}
                    </template>
                    <template v-else>Sin período definido</template>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Fecha de generación</div>
                  <div class="text-body-2">{{ formatDate(comprobante.created_at) }}</div>
                </v-col>
                <v-col v-if="comprobante.filtro_estado" cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Estado filtrado</div>
                  <div class="text-body-2">{{ comprobante.filtro_estado }}</div>
                </v-col>
                <v-col v-if="comprobante.filtro_tipo_vehiculo" cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Tipo vehículo filtrado</div>
                  <div class="text-body-2">{{ comprobante.filtro_tipo_vehiculo }}</div>
                </v-col>
                <v-col v-if="comprobante.notas" cols="12">
                  <div class="text-caption text-medium-emphasis">Notas</div>
                  <div class="text-body-2">{{ comprobante.notas }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Placas incluidas -->
          <v-card v-if="placas.length > 0" class="rounded-xl" elevation="2">
            <v-card-title class="text-subtitle-1 font-weight-medium pa-4 pb-2">
              Placas incluidas ({{ placas.length }})
            </v-card-title>
            <v-card-text class="pt-0">
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="placa in placas"
                  :key="placa"
                  size="small"
                  variant="tonal"
                  color="primary"
                >
                  {{ placa }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

        </v-col>

        <!-- ── COLUMNA DERECHA: evidencia ── -->
        <v-col cols="12" md="5">
          <v-card class="rounded-xl" elevation="3">
            <v-card-title class="text-subtitle-1 font-weight-medium pa-4 pb-2 d-flex align-center gap-2">
              <v-icon color="orange">mdi-paperclip</v-icon>
              Evidencia de pago
            </v-card-title>
            <v-divider />

            <v-card-text class="pa-4">

              <!-- Si tiene evidencia -->
              <template v-if="comprobante.evidencia_url">
                <div class="text-center mb-3">
                  <v-chip color="success" variant="tonal" size="small" prepend-icon="mdi-check-circle">
                    Evidencia adjunta
                  </v-chip>
                </div>

                <!-- Preview de imagen -->
                <div
                  class="rounded-lg overflow-hidden mb-3"
                  style="background:#f5f5f5; min-height:200px; display:flex; align-items:center; justify-content:center;"
                >
                  <v-img
                    :src="evidenciaFullUrl"
                    max-height="400"
                    contain
                    @click="verImagenCompleta = true"
                    style="cursor: zoom-in;"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center pa-8">
                        <v-progress-circular indeterminate color="primary" />
                      </div>
                    </template>
                    <template #error>
                      <div class="d-flex flex-column align-center justify-center pa-8 text-medium-emphasis">
                        <v-icon size="48" class="mb-2">mdi-image-broken</v-icon>
                        <span class="text-caption">No se pudo cargar la imagen</span>
                      </div>
                    </template>
                  </v-img>
                </div>

                <div class="d-flex gap-2">
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-magnify-plus"
                    @click="verImagenCompleta = true"
                    class="flex-1-1"
                  >
                    Ver completa
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    color="error"
                    size="small"
                    icon="mdi-delete"
                    :loading="eliminandoEvidencia"
                    @click="confirmarEliminarEvidencia"
                  />
                </div>

                <v-divider class="my-4" />
                <div class="text-caption text-medium-emphasis text-center">
                  ¿Deseas reemplazar la evidencia?
                </div>
              </template>

              <!-- Si NO tiene evidencia -->
              <template v-else>
                <div class="text-center py-4 mb-3">
                  <v-icon size="56" color="grey-lighten-1" class="mb-2">mdi-paperclip-off</v-icon>
                  <div class="text-body-2 text-medium-emphasis">Sin evidencia adjunta</div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Sube una foto o captura del comprobante de transferencia
                  </div>
                </div>
              </template>

              <!-- Upload -->
              <div
                class="upload-zone rounded-lg pa-4 text-center"
                :class="{ 'upload-zone--drag': isDragging, 'upload-zone--uploading': uploading }"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="onDrop"
                @click="fileInput?.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="d-none"
                  @change="onFileChange"
                />
                <v-progress-circular
                  v-if="uploading"
                  indeterminate
                  color="primary"
                  size="32"
                  class="mb-2"
                />
                <template v-else>
                  <v-icon size="32" color="primary" class="mb-2">mdi-cloud-upload</v-icon>
                  <div class="text-body-2 font-weight-medium">
                    {{ comprobante.evidencia_url ? 'Reemplazar evidencia' : 'Subir evidencia' }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Arrastra una imagen o haz click aquí
                  </div>
                </template>
              </div>

              <!-- Error upload -->
              <v-alert
                v-if="uploadError"
                type="error"
                variant="tonal"
                density="compact"
                class="mt-3"
                closable
                @click:close="uploadError = ''"
              >
                {{ uploadError }}
              </v-alert>

            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- No encontrado -->
    <template v-else-if="!loading">
      <v-card class="rounded-xl text-center pa-10" elevation="2">
        <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-file-document-off</v-icon>
        <div class="text-h6 text-medium-emphasis">Comprobante no encontrado</div>
        <v-btn class="mt-4" :to="{ name: 'ComercialComprobantes' }">Volver al listado</v-btn>
      </v-card>
    </template>

    <!-- ── Lightbox imagen completa ── -->
    <v-dialog v-model="verImagenCompleta" max-width="900">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center py-3 px-4">
          <span>Evidencia — Comprobante #{{ comprobante?.numero }}</span>
          <v-btn icon="mdi-close" variant="text" @click="verImagenCompleta = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-img :src="evidenciaFullUrl" contain max-height="75vh" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ── Confirmar eliminar evidencia ── -->
    <v-dialog v-model="dialogEliminar" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Eliminar evidencia</v-card-title>
        <v-card-text>¿Confirmas eliminar la evidencia de este comprobante?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogEliminar = false">Cancelar</v-btn>
          <v-btn color="error" :loading="eliminandoEvidencia" @click="doEliminarEvidencia">
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
  getComprobante,
  subirEvidencia,
  eliminarEvidencia,
  uploadImagen,
  formatCOP,
  formatDate,
  type ComprobantePago,
} from '@/services/comprobantesService'

const props = defineProps<{ id: string | number }>()

/* ── Estado ── */
const loading = ref(true)
const comprobante = ref<ComprobantePago | null>(null)
const verImagenCompleta = ref(false)
const dialogEliminar = ref(false)
const eliminandoEvidencia = ref(false)
const uploading = ref(false)
const uploadError = ref('')
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

/* ── Computed ── */
const placas = computed(() => {
  if (!comprobante.value?.placas_snapshot) return []
  return comprobante.value.placas_snapshot
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
})

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : ''

const evidenciaFullUrl = computed(() => {
  const url = comprobante.value?.evidencia_url ?? ''
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
})

/* ── Carga ── */
async function cargar() {
  loading.value = true
  try {
    comprobante.value = await getComprobante(Number(props.id))
  } catch {
    comprobante.value = null
  } finally {
    loading.value = false
  }
}

/* ── Upload evidencia ── */
async function processFile(file: File) {
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Solo se permiten imágenes'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'La imagen no puede superar 10 MB'
    return
  }

  uploading.value = true
  uploadError.value = ''
  try {
    // 1. Subir imagen al servidor
    const url = await uploadImagen(file)
    // 2. Asociar URL al comprobante
    comprobante.value = await subirEvidencia(Number(props.id), url)
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : 'Error al subir la imagen'
  } finally {
    uploading.value = false
    isDragging.value = false
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

/* ── Eliminar evidencia ── */
function confirmarEliminarEvidencia() {
  dialogEliminar.value = true
}

async function doEliminarEvidencia() {
  eliminandoEvidencia.value = true
  try {
    comprobante.value = await eliminarEvidencia(Number(props.id))
    dialogEliminar.value = false
  } finally {
    eliminandoEvidencia.value = false
  }
}

/* ── Imprimir ── */
function imprimir() {
  if (!comprobante.value) return
  const c = comprobante.value
  const periodo = (c.periodo_desde || c.periodo_hasta)
    ? `${c.periodo_desde || '—'} → ${c.periodo_hasta || '—'}`
    : 'Sin período'

  const formatCOPLocal = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante N° ${c.numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:11px; color:#1a1a1a; padding:24px; }
    .header { border-bottom:3px solid #1565C0; padding-bottom:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-end; }
    .title { font-size:18px; font-weight:bold; color:#1565C0; }
    .num { font-size:13px; font-weight:bold; color:#1565C0; margin-top:2px; }
    .meta { font-size:9.5px; color:#666; text-align:right; line-height:1.6; }
    .recipient { background:linear-gradient(135deg,#1565C0,#1976D2); color:white; border-radius:6px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-start; }
    .recipient-name { font-size:16px; font-weight:bold; margin:2px 0 4px; }
    .recipient-label { font-size:9px; opacity:.75; text-transform:uppercase; }
    .recipient-info { font-size:10px; opacity:.85; margin-top:2px; }
    .badge { background:rgba(255,255,255,.2); border-radius:4px; padding:2px 8px; font-size:10px; font-weight:bold; }
    .summary { display:flex; gap:0; margin-bottom:16px; border:1px solid #90CAF9; border-radius:6px; overflow:hidden; }
    .s-item { flex:1; padding:8px 12px; text-align:center; background:#E3F2FD; border-right:1px solid #90CAF9; }
    .s-item:last-child { border-right:none; background:#E8F5E9; }
    .s-label { font-size:9px; color:#555; margin-bottom:2px; text-transform:uppercase; }
    .s-value { font-size:15px; font-weight:bold; color:#1565C0; }
    .s-item:last-child .s-value { color:#1B5E20; font-size:17px; }
    .info-box { border:1px solid #ddd; border-radius:6px; padding:10px 14px; margin-bottom:16px; }
    .info-title { font-size:10px; font-weight:bold; color:#555; text-transform:uppercase; margin-bottom:6px; }
    .info-row { display:flex; gap:24px; flex-wrap:wrap; }
    .info-item .label { font-size:9px; color:#888; }
    .info-item .value { font-size:11px; }
    .placas { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
    .placa-chip { background:#E3F2FD; color:#1565C0; border:1px solid #90CAF9; border-radius:4px; padding:2px 8px; font-size:10px; font-weight:bold; }
    .footer { margin-top:20px; text-align:center; font-size:9px; color:#bbb; border-top:1px solid #eee; padding-top:8px; }
    @media print { body { padding:12px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">COMPROBANTE DE PAGO DE COMISIONES</div>
      <div class="num">N° ${c.numero}</div>
    </div>
    <div class="meta">
      Generado: ${formatDate(c.created_at)}<br>
      Período: ${periodo}
    </div>
  </div>

  <div class="recipient">
    <div>
      <div class="recipient-label">${c.beneficiario_tipo === 'CONVENIO' ? 'Pago a convenio' : 'Pago a asesor'}</div>
      <div class="recipient-name">${c.beneficiario_nombre}</div>
      ${c.medio_pago ? `<div class="recipient-info">💳 ${c.medio_pago}</div>` : ''}
      ${c.telefono ? `<div class="recipient-info">📞 ${c.telefono}</div>` : ''}
    </div>
    <div class="badge">${c.beneficiario_tipo}</div>
  </div>

  <div class="summary">
    <div class="s-item">
      <div class="s-label">🏍️ Motos</div>
      <div class="s-value">${c.total_motos}</div>
    </div>
    <div class="s-item">
      <div class="s-label">🚗 Vehículos</div>
      <div class="s-value">${c.total_vehiculos}</div>
    </div>
    <div class="s-item">
      <div class="s-label">Dateo asesores</div>
      <div class="s-value">${formatCOPLocal(c.total_dateo)}</div>
    </div>
    <div class="s-item">
      <div class="s-label">Incentivos</div>
      <div class="s-value">${formatCOPLocal(c.total_incentivo)}</div>
    </div>
    <div class="s-item">
      <div class="s-label">TOTAL A PAGAR</div>
      <div class="s-value">${formatCOPLocal(c.total_general)}</div>
    </div>
  </div>

  ${placas.value.length > 0 ? `
  <div class="info-box">
    <div class="info-title">Placas incluidas (${placas.value.length})</div>
    <div class="placas">
      ${placas.value.map(p => `<span class="placa-chip">${p}</span>`).join('')}
    </div>
  </div>` : ''}

  ${c.notas ? `
  <div class="info-box">
    <div class="info-title">Notas</div>
    <div>${c.notas}</div>
  </div>` : ''}

  <div class="footer">
    Comprobante N° ${c.numero} · Sistema de Comisiones · ${formatDate(c.created_at)}
  </div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
}

onMounted(cargar)
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #90CAF9;
  cursor: pointer;
  transition: all 0.2s;
  background: #F8FBFF;
}
.upload-zone:hover {
  border-color: #1565C0;
  background: #E3F2FD;
}
.upload-zone--drag {
  border-color: #1565C0;
  background: #E3F2FD;
  transform: scale(1.01);
}
.upload-zone--uploading {
  cursor: wait;
  opacity: 0.7;
}
</style>
