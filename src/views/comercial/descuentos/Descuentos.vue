<!-- src/views/comercial/descuentos/Descuentos.vue -->
<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-tag-multiple" class="mr-2" color="primary"></v-icon>
          <span>Gestión de Descuentos</span>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <!-- Filtro estado -->
        <v-row class="mb-4 mt-1">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="busqueda"
              prepend-inner-icon="mdi-magnify"
              label="Buscar descuento"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtroActivo"
              :items="estadoItems"
              label="Estado"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
          </v-col>
        </v-row>

        <!-- Tabla -->
        <v-data-table
          :headers="headers"
          :items="descuentosFiltrados"
          :loading="cargando"
          :search="busqueda"
          class="elevation-1"
          items-per-page-text="Elementos por página"
          no-data-text="No hay descuentos registrados"
        >
          <!-- Código -->
          <template v-slot:item.codigo="{ item }">
            <v-chip color="primary" size="small" variant="tonal">
              {{ item.codigo }}
            </v-chip>
          </template>

          <!-- Valor Carro -->
          <template v-slot:item.valorCarro="{ item }">
            <div class="d-flex align-center ga-1">
              <v-icon size="16" color="blue-darken-2">mdi-car</v-icon>
              <span class="font-weight-bold text-blue-darken-2">
                {{ formatearMoneda(item.valorCarro) }}
              </span>
            </div>
          </template>

          <!-- Valor Moto -->
          <template v-slot:item.valorMoto="{ item }">
            <div class="d-flex align-center ga-1">
              <v-icon size="16" color="orange-darken-2">mdi-motorbike</v-icon>
              <span class="font-weight-bold text-orange-darken-2">
                {{ formatearMoneda(item.valorMoto) }}
              </span>
            </div>
          </template>

          <!-- Estado -->
          <template v-slot:item.activo="{ item }">
            <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="tonal">
              <v-icon start size="12">{{ item.activo ? 'mdi-check-circle' : 'mdi-cancel' }}</v-icon>
              {{ item.activo ? 'Activo' : 'Inactivo' }}
            </v-chip>
          </template>

          <!-- Acciones -->
          <template v-slot:item.acciones="{ item }">
            <v-tooltip text="Editar descuento" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="abrirDialogEditar(item)"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip :text="item.activo ? 'Desactivar' : 'Activar'" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  :icon="item.activo ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off'"
                  size="small"
                  variant="text"
                  :color="item.activo ? 'success' : 'error'"
                  @click="confirmarToggle(item)"
                ></v-btn>
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog Editar -->
    <v-dialog v-model="dialog" max-width="650px" persistent>
      <v-card>
        <v-card-title class="bg-primary pa-4 d-flex align-center">
          <v-icon class="mr-2" color="white">mdi-pencil</v-icon>
          <span class="text-white">Editar Descuento</span>
        </v-card-title>

        <v-card-text class="pt-5">
          <v-form ref="formulario" v-model="formularioValido">

            <!-- Info código (solo lectura) -->
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">
              <strong>Código:</strong> {{ descuentoForm.codigo }}
              — Este descuento tiene condiciones específicas del sistema.
            </v-alert>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="descuentoForm.nombre"
                  label="Nombre *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required, rules.maxLength(100)]"
                ></v-text-field>
              </v-col>

              <!-- Valores por tipo vehículo -->
              <v-col cols="12">
                <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center">
                  <v-icon class="mr-1" size="18">mdi-currency-usd</v-icon>
                  Valores por tipo de vehículo
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="descuentoForm.valorCarro"
                  label="Valor Carro *"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  prefix="$"
                  :rules="[rules.required, rules.minValue(0)]"
                  prepend-inner-icon="mdi-car"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="blue-darken-2" size="20">mdi-car</v-icon>
                  </template>
                </v-text-field>
                <div class="text-caption text-medium-emphasis ml-1 mt-n2 mb-2">
                  Actual: <strong>{{ formatearMoneda(descuentoFormOriginal?.valorCarro ?? 0) }}</strong>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="descuentoForm.valorMoto"
                  label="Valor Moto *"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  prefix="$"
                  :rules="[rules.required, rules.minValue(0)]"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="orange-darken-2" size="20">mdi-motorbike</v-icon>
                  </template>
                </v-text-field>
                <div class="text-caption text-medium-emphasis ml-1 mt-n2 mb-2">
                  Actual: <strong>{{ formatearMoneda(descuentoFormOriginal?.valorMoto ?? 0) }}</strong>
                </div>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="descuentoForm.descripcion"
                  label="Descripción"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  :rules="[rules.maxLength(500)]"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cerrarDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="guardar" :loading="guardando">
            Guardar cambios
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Activar/Desactivar -->
    <v-dialog v-model="dialogToggle" max-width="450px">
      <v-card>
        <v-card-title :class="descuentoAToggle?.activo ? 'bg-error' : 'bg-success'" class="pa-4">
          <span class="text-white">
            {{ descuentoAToggle?.activo ? 'Desactivar descuento' : 'Activar descuento' }}
          </span>
        </v-card-title>
        <v-card-text class="pt-4">
          <p>
            ¿Está seguro que desea
            <strong>{{ descuentoAToggle?.activo ? 'desactivar' : 'activar' }}</strong>
            el descuento <strong>{{ descuentoAToggle?.nombre }}</strong>?
          </p>
          <p v-if="descuentoAToggle?.activo" class="text-caption text-medium-emphasis mt-2">
            Al desactivarlo, este descuento no podrá ser aplicado en nuevas operaciones.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogToggle = false">Cancelar</v-btn>
          <v-btn
            :color="descuentoAToggle?.activo ? 'error' : 'success'"
            variant="flat"
            @click="toggleEstado"
            :loading="toggling"
          >
            {{ descuentoAToggle?.activo ? 'Desactivar' : 'Activar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" :timeout="3000">
      {{ snackbar.mensaje }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { VForm } from 'vuetify/components'
import descuentosService, { type Descuento } from '@/services/descuentosService'

type ValidationRule = (v: string | number | null) => boolean | string

interface RulesObject {
  required: ValidationRule
  maxLength: (max: number) => ValidationRule
  minValue: (min: number) => ValidationRule
}

// Estados
const cargando = ref(false)
const guardando = ref(false)
const toggling = ref(false)
const dialog = ref(false)
const dialogToggle = ref(false)
const formularioValido = ref(false)
const busqueda = ref('')
const filtroActivo = ref('todos')
const descuentos = ref<Descuento[]>([])

// Formulario edición
const formulario = ref<VForm | null>(null)
const descuentoForm = ref<Descuento>({
  codigo: '',
  nombre: '',
  valorCarro: 0,
  valorMoto: 0,
  descripcion: null,
  activo: true,
})
const descuentoFormOriginal = ref<Descuento | null>(null)
const descuentoAToggle = ref<Descuento | null>(null)

// Snackbar
const snackbar = ref({ visible: false, mensaje: '', color: 'success' })

// Headers
const headers = [
  { title: 'Código', key: 'codigo', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: '🚗 Valor Carro', key: 'valorCarro', sortable: true },
  { title: '🏍️ Valor Moto', key: 'valorMoto', sortable: true },
  { title: 'Descripción', key: 'descripcion', sortable: false },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'center' as const },
] as const

const estadoItems = [
  { title: 'Todos', value: 'todos' },
  { title: 'Activos', value: 'activo' },
  { title: 'Inactivos', value: 'inactivo' },
]

const rules: RulesObject = {
  required: (v) => !!v || v === 0 || 'Este campo es requerido',
  maxLength: (max) => (v) => !v || String(v).length <= max || `Máximo ${max} caracteres`,
  minValue: (min) => (v) => Number(v) >= min || `El valor mínimo es ${min}`,
}

// Computed
const descuentosFiltrados = computed(() => {
  if (filtroActivo.value === 'activo') return descuentos.value.filter((d) => d.activo)
  if (filtroActivo.value === 'inactivo') return descuentos.value.filter((d) => !d.activo)
  return descuentos.value
})

// Métodos
const cargarDescuentos = async () => {
  try {
    cargando.value = true
    const response = await descuentosService.getAll()
    if (response.success && Array.isArray(response.data)) {
      descuentos.value = response.data
    }
  } catch {
    mostrarSnackbar('Error al cargar descuentos', 'error')
  } finally {
    cargando.value = false
  }
}

const abrirDialogEditar = (item: Descuento) => {
  descuentoFormOriginal.value = { ...item }
  descuentoForm.value = { ...item }
  dialog.value = true
}

const cerrarDialog = () => {
  dialog.value = false
  formulario.value?.reset()
}

const guardar = async () => {
  const validationResult = await formulario.value?.validate()
  if (!validationResult?.valid) return

  try {
    guardando.value = true
    const response = await descuentosService.update(descuentoForm.value.id!, {
      nombre: descuentoForm.value.nombre,
      valorCarro: descuentoForm.value.valorCarro,
      valorMoto: descuentoForm.value.valorMoto,
      descripcion: descuentoForm.value.descripcion,
    })

    if (response.success) {
      mostrarSnackbar('Descuento actualizado exitosamente', 'success')
      cerrarDialog()
      await cargarDescuentos()
    }
  } catch {
    mostrarSnackbar('Error al guardar el descuento', 'error')
  } finally {
    guardando.value = false
  }
}

const confirmarToggle = (item: Descuento) => {
  descuentoAToggle.value = item
  dialogToggle.value = true
}

const toggleEstado = async () => {
  if (!descuentoAToggle.value?.id) return

  try {
    toggling.value = true
    const response = await descuentosService.update(descuentoAToggle.value.id, {
      activo: !descuentoAToggle.value.activo,
    })

    if (response.success) {
      const estado = descuentoAToggle.value.activo ? 'desactivado' : 'activado'
      mostrarSnackbar(`Descuento ${estado} exitosamente`, 'success')
      dialogToggle.value = false
      await cargarDescuentos()
    }
  } catch {
    mostrarSnackbar('Error al cambiar el estado del descuento', 'error')
  } finally {
    toggling.value = false
  }
}

const formatearMoneda = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}

const mostrarSnackbar = (mensaje: string, color: string) => {
  snackbar.value = { visible: true, mensaje, color }
}

onMounted(() => {
  cargarDescuentos()
})
</script>