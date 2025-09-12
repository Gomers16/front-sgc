<template>
  <v-col cols="12" md="6">
    <h3 class="text-h6 mb-4">Pasos del Contrato</h3>

    <v-card class="pa-4">
      <v-timeline side="end" density="compact">
        <v-timeline-item
          v-for="(paso, index) in pasos"
          :key="paso.id ? `p-${paso.id}` : `n-${paso.nombre}-${paso.orden ?? index}`"
          :dot-color="paso.completado ? 'success' : 'grey'"
          size="small"
        >
          <div class="d-flex align-center justify-space-between w-100">
            <span class="font-weight-medium">{{ paso.nombre }}</span>

            <!-- Habilitado si:
                 - el paso NO está completado y es el primero, o
                 - el paso NO está completado y el anterior ya está completado -->
            <v-btn
              v-if="!paso.completado && (index === 0 || pasos[index - 1]?.completado)"
              icon="mdi-check"
              color="primary"
              variant="tonal"
              size="small"
              @click.stop="emit('abrirModalPaso', paso)"
              :aria-label="`Completar paso: ${paso.nombre}`"
            />

            <!-- Si ya está completado, permite editar -->
            <v-btn
              v-else-if="paso.completado"
              icon="mdi-pencil-outline"
              color="warning"
              variant="tonal"
              size="small"
              @click.stop="emit('abrirModalPaso', paso)"
              :aria-label="`Editar paso: ${paso.nombre}`"
            />
          </div>
        </v-timeline-item>
      </v-timeline>

      <v-alert v-if="loading" type="info" variant="tonal" class="mt-4">
        Cargando pasos...
      </v-alert>
    </v-card>
  </v-col>

  <!-- Modal Paso -->
  <v-dialog
    :model-value="modalPaso.mostrar"
    @update:model-value="(v) => { if (!v) emit('cerrarModalPaso') }"
    max-width="600px"
  >
    <v-card>
      <v-card-title class="text-h6">
        {{ modalPaso.paso?.completado ? 'Editar paso' : 'Completar paso' }}:
        {{ modalPaso.paso?.nombre }}
      </v-card-title>

      <v-card-text>
        <!-- Archivo actual (modo edición) -->
        <v-alert
          v-if="isEditing && modalPaso.paso?.archivoUrl"
          type="success"
          variant="tonal"
          class="mb-3"
        >
          <div class="d-flex flex-wrap align-center ga-2">
            <div>
              <strong>Archivo actual:</strong>
              {{ modalPaso.paso?.nombreArchivo || modalPaso.paso?.archivoUrl?.split('/').pop() }}
            </div>
            <v-btn size="x-small" variant="tonal" prepend-icon="mdi-eye" @click="emit('verArchivoPaso')">Ver</v-btn>
            <v-btn size="x-small" variant="tonal" prepend-icon="mdi-download" @click="emit('descargarArchivoPaso')">Descargar</v-btn>
            <v-btn size="x-small" color="error" variant="tonal" prepend-icon="mdi-delete" @click="emit('eliminarArchivoPaso')">Eliminar</v-btn>
          </div>
        </v-alert>

        <v-form @submit.prevent="emit('completarPasoConfirmado')">
          <v-textarea
            v-model="modalPaso.form.observacion"
            label="Observación"
            variant="outlined"
            rows="3"
            class="mb-4"
            :disabled="modalPaso.loading"
          />

          <v-file-input
            v-model="modalPaso.form.archivo"
            :multiple="false"
            label="Archivo adjunto (opcional — reemplaza el actual)"
            variant="outlined"
            density="compact"
            show-size
            prepend-icon="mdi-paperclip"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            :disabled="modalPaso.loading"
            @update:model-value="() => emit('onFilePasoChange')"
          />
          <!-- Recordatorio del archivo seleccionado (si lo hay) -->
          <div
            v-if="modalPaso.form.archivo"
            class="text-caption text-medium-emphasis mt-1"
          >
            Seleccionado: <strong>{{ modalPaso.form.archivo.name }}</strong>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Permitidos: PDF, DOC, DOCX, JPG, PNG (máx {{ maxUploadMb }} MB)
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey-darken-1" variant="text" @click="emit('cerrarModalPaso')">Cancelar</v-btn>
        <v-btn
          :color="modalPaso.paso?.completado ? 'warning' : 'primary'"
          variant="flat"
          :loading="modalPaso.loading"
          :disabled="modalPaso.loading"
          @click="emit('completarPasoConfirmado')"
        >
          {{ modalPaso.paso?.completado ? 'Guardar Cambios' : 'Marcar como Completado' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
type Paso = {
  id?: number
  nombre: string
  completado: boolean
  observacion?: string
  nombreArchivo?: string
  fechaCompletado?: string
  archivoUrl?: string
  archivoFile?: File | null
  fase: 'inicio' | 'desarrollo' | 'fin'
  orden?: number
}

defineProps<{
  pasos: Paso[]
  loading: boolean
  isEditing: boolean
  modalPaso: {
    mostrar: boolean
    paso: Paso | null
    form: { observacion: string; archivo: File | null }
    loading: boolean
  }
  maxUploadMb: number
}>()

const emit = defineEmits<{
  (e: 'abrirModalPaso', paso: Paso): void
  (e: 'cerrarModalPaso'): void
  (e: 'completarPasoConfirmado'): void
  (e: 'onFilePasoChange'): void
  (e: 'verArchivoPaso'): void
  (e: 'descargarArchivoPaso'): void
  (e: 'eliminarArchivoPaso'): void
}>()
</script>
