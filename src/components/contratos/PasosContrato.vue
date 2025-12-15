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

            <v-btn
              v-if="!paso.completado && (index === 0 || pasos[index - 1]?.completado)"
              icon="mdi-check"
              color="primary"
              variant="tonal"
              size="small"
              @click.stop="emit('abrirModalPaso', paso)"
            />

            <v-btn
              v-else-if="paso.completado"
              icon="mdi-pencil-outline"
              color="warning"
              variant="tonal"
              size="small"
              @click.stop="emit('abrirModalPaso', paso)"
            />
          </div>
        </v-timeline-item>
      </v-timeline>

      <v-alert v-if="loading" type="info" variant="tonal" class="mt-4">
        Cargando pasos...
      </v-alert>
    </v-card>
  </v-col>

  <!-- MODAL -->
  <v-dialog
    :model-value="modalPaso.mostrar"
    @update:model-value="v => !v && emit('cerrarModalPaso')"
    max-width="600px"
  >
    <v-card>
      <v-card-title class="text-h6">
        {{ modalPaso.paso?.completado ? 'Editar paso' : 'Completar paso' }}:
        {{ modalPaso.paso?.nombre }}
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="isEditing && modalPaso.paso?.archivoUrl"
          type="success"
          variant="tonal"
          class="mb-3"
        >
          <div class="d-flex ga-2 align-center">
            <strong>Archivo actual:</strong>
            {{ modalPaso.paso.nombreArchivo || modalPaso.paso.archivoUrl.split('/').pop() }}
            <v-btn size="x-small" variant="tonal" @click="emit('verArchivoPaso')">Ver</v-btn>
            <v-btn size="x-small" variant="tonal" @click="emit('descargarArchivoPaso')">Descargar</v-btn>
            <v-btn size="x-small" color="error" variant="tonal" @click="emit('eliminarArchivoPaso')">Eliminar</v-btn>
          </div>
        </v-alert>

        <v-form @submit.prevent="confirmarPaso">
          <v-textarea
            v-model="localForm.observacion"
            label="Observación"
            variant="outlined"
            rows="3"
            class="mb-4"
            :disabled="modalPaso.loading"
          />

          <v-file-input
            v-model="localForm.archivo"
            label="Archivo adjunto (opcional)"
            variant="outlined"
            density="compact"
            show-size
            prepend-icon="mdi-paperclip"
            :disabled="modalPaso.loading"
            @update:model-value="emit('onFilePasoChange', localForm.archivo)"
          />

          <div v-if="localForm.archivo" class="text-caption mt-1">
            Seleccionado: <strong>{{ localForm.archivo.name }}</strong>
          </div>

          <div class="text-caption text-medium-emphasis mt-1">
            Permitidos: PDF, DOC, DOCX, JPG, PNG (máx {{ maxUploadMb }} MB)
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('cerrarModalPaso')">Cancelar</v-btn>
        <v-btn
          :loading="modalPaso.loading"
          :disabled="modalPaso.loading"
          :color="modalPaso.paso?.completado ? 'warning' : 'primary'"
          @click="confirmarPaso"
        >
          {{ modalPaso.paso?.completado ? 'Guardar Cambios' : 'Marcar como Completado' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { reactive, watch } from 'vue'

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

const props = defineProps<{
  pasos: Paso[]
  loading: boolean
  isEditing: boolean
  modalPaso: {
    mostrar: boolean
    paso: Paso | null
    form: {
      observacion: string
      archivo: File | null
    }
    loading: boolean
  }
  maxUploadMb: number
}>()

const emit = defineEmits<{
  (e: 'abrirModalPaso', paso: Paso): void
  (e: 'cerrarModalPaso'): void
  (e: 'completarPasoConfirmado', payload: { observacion: string; archivo: File | null }): void
  (e: 'onFilePasoChange', file: File | null): void
  (e: 'verArchivoPaso'): void
  (e: 'descargarArchivoPaso'): void
  (e: 'eliminarArchivoPaso'): void
}>()

/* ---------------------------
   FORM LOCAL (NO MUTAR PROP)
---------------------------- */
const localForm = reactive<{
  observacion: string
  archivo: File | null
}>({
  observacion: '',
  archivo: null
})

/* ----------------------------------
   SINCRONIZAR CUANDO ABRE EL MODAL
----------------------------------- */
watch(
  () => props.modalPaso.mostrar,
  (mostrar) => {
    if (mostrar) {
      localForm.observacion = props.modalPaso.form.observacion || ''
      localForm.archivo = props.modalPaso.form.archivo || null
    }
  }
)

/* ---------------------------
   CONFIRMAR PASO
---------------------------- */
const confirmarPaso = () => {
  emit('completarPasoConfirmado', {
    observacion: localForm.observacion,
    archivo: localForm.archivo
  })
}
</script>
