<!-- src/views/comercial/descuentos/Descuentos.vue -->
 <template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <v-icon icon="mdi-tag-multiple" class="mr-2"></v-icon>
          Gestión de Descuentos
        </div>
        <v-btn color="primary" @click="abrirDialogCrear">
          <v-icon left>mdi-plus</v-icon>
          Nuevo Descuento
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Filtros -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
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
          <template v-slot:item.valorCarro="{ item }">
            <span class="font-weight-bold">{{ formatearMoneda(item.valorCarro) }}</span>
          </template>

          <template v-slot:item.valorMoto="{ item }">
            <span class="font-weight-bold">{{ formatearMoneda(item.valorMoto) }}</span>
          </template>

          <template v-slot:item.activo="{ item }">
            <v-chip :color="item.activo ? 'success' : 'error'" size="small">
              {{ item.activo ? 'Activo' : 'Inactivo' }}
            </v-chip>
          </template>

          <template v-slot:item.acciones="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="abrirDialogEditar(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmarEliminar(item)"
            ></v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog Crear/Editar -->
    <v-dialog v-model="dialog" max-width="700px" persistent>
      <v-card>
        <v-card-title class="bg-primary">
          <span class="text-white">{{ esEdicion ? 'Editar Descuento' : 'Nuevo Descuento' }}</span>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="formulario" v-model="formularioValido">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="descuentoForm.codigo"
                  label="Código *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required, rules.maxLength(50)]"
                  :disabled="esEdicion"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="descuentoForm.nombre"
                  label="Nombre *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required, rules.maxLength(100)]"
                ></v-text-field>
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
                ></v-text-field>
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
                ></v-text-field>
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

              <v-col cols="12">
                <v-switch
                  v-model="descuentoForm.activo"
                  label="Activo"
                  color="success"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cerrarDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="guardar" :loading="guardando">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Eliminación -->
    <v-dialog v-model="dialogEliminar" max-width="500px">
      <v-card>
        <v-card-title class="bg-error">
          <span class="text-white">Confirmar Eliminación</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <p>¿Está seguro que desea desactivar el descuento <strong>{{ descuentoAEliminar?.nombre }}</strong>?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogEliminar = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" @click="eliminar" :loading="eliminando">
            Eliminar
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

// Tipos auxiliares
type ValidationRule = (v: string | number | null) => boolean | string

interface RulesObject {
  required: ValidationRule
  maxLength: (max: number) => ValidationRule
  minValue: (min: number) => ValidationRule
}

// Estados
const cargando = ref(false)
const guardando = ref(false)
const eliminando = ref(false)
const dialog = ref(false)
const dialogEliminar = ref(false)
const formularioValido = ref(false)
const busqueda = ref('')
const filtroActivo = ref('todos')
const descuentos = ref<Descuento[]>([])
const esEdicion = ref(false)

// Formulario
const formulario = ref<VForm | null>(null)
const descuentoForm = ref<Descuento>({
  codigo: '',
  nombre: '',
  valorCarro: 0,
  valorMoto: 0,
  descripcion: null,
  activo: true,
})

const descuentoAEliminar = ref<Descuento | null>(null)

// Snackbar
const snackbar = ref({
  visible: false,
  mensaje: '',
  color: 'success',
})

// Headers de la tabla
const headers = [
  { title: 'Código', key: 'codigo', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Valor Carro', key: 'valorCarro', sortable: true },
  { title: 'Valor Moto', key: 'valorMoto', sortable: true },
  { title: 'Descripción', key: 'descripcion', sortable: false },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'center' as const },
] as const

// Items de filtro
const estadoItems = [
  { title: 'Todos', value: 'todos' },
  { title: 'Activos', value: 'activo' },
  { title: 'Inactivos', value: 'inactivo' },
]

// Reglas de validación
const rules: RulesObject = {
  required: (v: string | number | null) => !!v || 'Este campo es requerido',
  maxLength: (max: number) => (v: string | number | null) => 
    !v || String(v).length <= max || `Máximo ${max} caracteres`,
  minValue: (min: number) => (v: string | number | null) => 
    Number(v) >= min || `El valor mínimo es ${min}`,
}

// Computed
const descuentosFiltrados = computed(() => {
  if (filtroActivo.value === 'todos') return descuentos.value
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
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al cargar descuentos'
    mostrarSnackbar(mensaje, 'error')
  } finally {
    cargando.value = false
  }
}

const abrirDialogCrear = () => {
  esEdicion.value = false
  descuentoForm.value = {
    codigo: '',
    nombre: '',
    valorCarro: 0,
    valorMoto: 0,
    descripcion: null,
    activo: true,
  }
  dialog.value = true
}

const abrirDialogEditar = (item: Descuento) => {
  esEdicion.value = true
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
    let response

    if (esEdicion.value && descuentoForm.value.id) {
      response = await descuentosService.update(descuentoForm.value.id, descuentoForm.value)
    } else {
      response = await descuentosService.create(descuentoForm.value)
    }

    if (response.success) {
      mostrarSnackbar(response.message || 'Descuento guardado exitosamente', 'success')
      cerrarDialog()
      await cargarDescuentos()
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al guardar el descuento'
    mostrarSnackbar(mensaje, 'error')
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = (item: Descuento) => {
  descuentoAEliminar.value = item
  dialogEliminar.value = true
}

const eliminar = async () => {
  if (!descuentoAEliminar.value?.id) return

  try {
    eliminando.value = true
    const response = await descuentosService.delete(descuentoAEliminar.value.id)

    if (response.success) {
      mostrarSnackbar(response.message || 'Descuento desactivado exitosamente', 'success')
      dialogEliminar.value = false
      await cargarDescuentos()
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al eliminar el descuento'
    mostrarSnackbar(mensaje, 'error')
  } finally {
    eliminando.value = false
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
  snackbar.value = {
    visible: true,
    mensaje,
    color,
  }
}

// Lifecycle
onMounted(() => {
  cargarDescuentos()
})
</script>

<style scoped>
.v-card-title {
  font-size: 1.25rem;
  font-weight: 500;
}
</style>