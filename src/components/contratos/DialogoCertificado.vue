<template>
  <v-dialog
    :model-value="open"
    @update:model-value="emit('update:open', $event)"
    max-width="640px"
  >
    <v-card>
      <v-card-title class="text-h6">
        {{ entidadNombre ? entidadNombre : 'Entidad' }} — Certificado ({{ (tipo || '').toUpperCase() }})
      </v-card-title>

      <v-card-text>
        <v-alert v-if="loading" type="info" variant="tonal" class="mb-3">
          Cargando información del certificado...
        </v-alert>

        <div v-else>
          <v-alert v-if="hasFile" type="success" variant="tonal" class="mb-3">
            <div class="d-flex flex-wrap align-center ga-2">
              <div><strong>Actual:</strong> {{ fileName || 'Archivo cargado' }}</div>
            </div>
          </v-alert>

          <v-file-input
            :model-value="file"
            @update:model-value="(v)=>emit('update:file', normalizeFile(v))"
            label="Seleccionar archivo (PDF/JPG/PNG/WEBP)"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-paperclip"
            show-size
            class="mb-1"
          />

          <div v-if="!hasFile && file" class="text-caption text-medium-emphasis mb-1">
            Archivo seleccionado: <strong>{{ file.name }}</strong> — listo para <em>Subir</em>.
          </div>

          <div class="text-caption text-medium-emphasis">
            Permitidos: PDF, JPG, PNG, WEBP (máx {{ maxUploadMb }} MB)
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="grey-darken-1" @click="emit('cerrar')">Cerrar</v-btn>

        <v-btn v-if="hasFile" variant="tonal" prepend-icon="mdi-download" @click="emit('descargar')">
          Descargar
        </v-btn>
        <v-btn v-if="hasFile" variant="tonal" color="error" prepend-icon="mdi-delete" @click="emit('eliminar')">
          Eliminar
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-upload"
          :disabled="!file || loading"
          @click="emit('subir')"
        >
          {{ hasFile ? 'Reemplazar' : 'Subir' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { isRef } from 'vue'

defineProps<{
  open: boolean
  loading: boolean
  tipo: string | null
  entidadNombre: string
  hasFile: boolean        // == certTieneArchivoPersistido
  fileName: string | null // puedes pasar getArchivoNombre(meta)
  file: File | null
  maxUploadMb: number
}>()

const emit = defineEmits<{
  (e:'update:open', v:boolean): void
  (e:'update:file', v: File | null): void
  (e:'subir'): void
  (e:'eliminar'): void
  (e:'descargar'): void
  (e:'cerrar'): void
}>()

function normalizeFile(v: unknown): File | null {
  if (!v) return null
  if (v instanceof File) return v
  if (Array.isArray(v)) return (v[0] as File) ?? null
  if (isRef(v) && v.value instanceof File) return v.value
  return null
}
</script>
