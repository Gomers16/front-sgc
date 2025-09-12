<template>
  <v-container class="py-8">
    <!-- ======= FORM ======= -->
    <v-card class="mb-8 rounded-lg elevation-4">
      <v-card-title class="text-h5 text-center py-4 bg-blue-grey-lighten-5">
        <v-icon left class="mr-2">mdi-account-group</v-icon>
        Formulario de Gestión de Usuarios
      </v-card-title>

      <v-card-text class="pt-6">
        <!-- evita submit por Enter -->
        <v-form @submit.prevent="onSubmit" @keydown.enter.prevent class="form" style="color: black">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                label="Nombres"
                v-model="nombres"
                :error-messages="nombresError"
                required
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Apellidos"
                v-model="apellidos"
                :error-messages="apellidosError"
                required
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Correo"
                v-model="correo"
                :error-messages="correoError"
                type="email"
                required
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Contraseña"
                v-model="password"
                :error-messages="passwordError"
                type="password"
                :required="!isEditing"
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Celular Personal"
                v-model="celularPersonal"
                :error-messages="celularPersonalError"
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Celular Corporativo"
                v-model="celularCorporativo"
                :error-messages="celularCorporativoError"
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Dirección"
                v-model="direccion"
                :error-messages="direccionError"
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                label="Rol"
                v-model="rolId"
                :items="roles"
                item-title="nombre"
                item-value="id"
                :error-messages="rolIdError"
                required
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                label="Empresa (Razón Social)"
                v-model="razonSocialId"
                :items="razonesSociales"
                item-title="nombre"
                item-value="id"
                :error-messages="razonSocialIdError"
                required
                outlined
                clearable
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                label="Estado"
                v-model="estado"
                :items="['activo', 'inactivo']"
                :error-messages="estadoError"
                required
                outlined
                density="comfortable"
                :disabled="isProcessing"
              />
            </v-col>
          </v-row>

          <v-divider class="my-6" />

          <div class="d-flex justify-end">
            <v-btn
              v-if="isEditing"
              color="secondary"
              @click="resetFormAndState"
              class="mr-4 rounded-pill elevation-2"
              size="large"
              :disabled="isProcessing"
            >
              <v-icon left>mdi-cancel</v-icon>
              Cancelar Edición
            </v-btn>

            <v-btn
              v-else
              color="blue-grey-lighten-2"
              variant="flat"
              @click="resetFormAndState"
              class="mr-4 rounded-pill elevation-2"
              size="large"
              :disabled="isProcessing"
            >
              <v-icon left>mdi-eraser</v-icon>
              Limpiar Formulario
            </v-btn>

            <v-btn
              color="primary"
              type="submit"
              class="rounded-pill elevation-2"
              size="large"
              :loading="isProcessing || inFlight.create || inFlight.update"
              :disabled="isProcessing || inFlight.create || inFlight.update"
            >
              <v-icon left>{{ isEditing ? 'mdi-content-save' : 'mdi-plus-circle' }}</v-icon>
              {{ isEditing ? 'Actualizar Usuario' : 'Crear Usuario' }}
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- ======= LISTA ======= -->
    <v-card class="rounded-lg elevation-4">
      <v-card-title class="text-h6 py-4 bg-blue-grey-lighten-5">
        <v-icon left class="mr-2">mdi-format-list-bulleted</v-icon>
        Lista de Usuarios
      </v-card-title>

      <v-row align="center" class="px-6 pb-4 pt-4">
        <v-col cols="12" sm="6" md="4" lg="3">
          <v-text-field
            v-model="search"
            label="Buscar usuario"
            prepend-inner-icon="mdi-magnify"
            outlined
            dense
            hide-details
            clearable
            density="comfortable"
            :disabled="isProcessing"
          />
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="3">
          <v-select
            label="Filtrar por Estado"
            v-model="statusFilter"
            :items="['Todos', 'activo', 'inactivo']"
            outlined
            dense
            hide-details
            density="comfortable"
            :disabled="isProcessing"
          />
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="6" class="d-flex justify-end">
          <v-btn-toggle
            v-model="sortBy[0].order"
            mandatory
            variant="elevated"
            color="primary"
            class="rounded-pill"
            :disabled="isProcessing"
          >
            <v-btn value="asc" class="pa-2">
              <v-icon>mdi-sort-ascending</v-icon>
            </v-btn>
            <v-btn value="desc" class="pa-2">
              <v-icon>mdi-sort-descending</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-data-table
        :headers="headers"
        :items="numberedUsers"
        item-value="id"
        v-model:sort-by="sortBy"
        class="elevation-0"
        :loading="isProcessing && (inFlight.create || inFlight.update || inFlight.delete || inFlight.disable)"
      >
        <template #item.rol.nombre="{ item }">{{ item.rol?.nombre || 'N/A' }}</template>
        <template #item.razonSocial.nombre="{ item }">{{ item.razonSocial?.nombre || 'N/A' }}</template>

        <template #item.estado="{ item }">
          <v-chip :color="item.estado === 'activo' ? 'green' : 'red'" label small>
            {{ item.estado }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex">
            <v-btn
              icon
              @click="promptEditUser(item)"
              class="mr-1"
              variant="text"
              color="primary"
              :disabled="isProcessing"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn
              v-if="item.estado === 'activo'"
              icon
              @click="promptDisableUser(item.id)"
              variant="text"
              color="warning"
              :disabled="isProcessing"
            >
              <v-icon>mdi-account-off</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ======= FEEDBACK ======= -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" bottom right>
      {{ snackbar.message }}
      <template #actions>
        <v-btn text @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <ConfirmDialog
      v-model="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      :confirm-text="confirmDialogConfirmText"
      :confirm-color="confirmDialogConfirmColor"
      :loading="isProcessing"
      @confirm="handleConfirmAction"
      @cancel="handleCancelAction"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useForm, useField } from 'vee-validate'
import {
  crearUsuario,
  obtenerUsuarios,
  actualizarUsuario,
  eliminarUsuario,
  obtenerRoles,
  obtenerRazonesSociales,
} from '../../services/userService'
import ConfirmDialog from '../../components/UI/ConfirmarDialogo.vue'

/* =========================
 * VALIDACIÓN
 * ========================= */
const required = (value: any) => (value !== null && value !== undefined && value !== '') || 'Este campo es obligatorio.'
const minLength = (value: string, length: number) => (value && value.length >= length) || `Debe tener al menos ${length} caracteres.`
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Debe ser un correo electrónico válido.'
const optionalNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return true
  return !isNaN(Number(value)) || 'Debe ser un número válido.'
}

/* Helper: normaliza arreglos */
function toArray<T = any>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[]
  const d = (v as any)?.data
  if (Array.isArray(d)) return d as T[]
  return []
}

/* =========================
 * UI LOCKS (anti-cola)
 * ========================= */
const isProcessing = ref(false)
const inFlight = ref<{ [k: string]: boolean }>({
  create: false,
  update: false,
  delete: false,
  disable: false,
})

/* =========================
 * ESTADO UI
 * ========================= */
const isEditing = ref(false)
const editingUserId = ref<number | null>(null)
const userToDisableId = ref<number | null>(null)
const userToConfirmEditId = ref<number | null>(null)

/* =========================
 * FORM
 * ========================= */
const { handleSubmit, resetForm, setValues } = useForm()

const { value: nombres, errorMessage: nombresError } = useField('nombres', [required, (val: string) => minLength(val, 2)])
const { value: apellidos, errorMessage: apellidosError } = useField('apellidos', [required, (val: string) => minLength(val, 2)])
const { value: correo, errorMessage: correoError } = useField('correo', [required, isEmail])
const { value: password, errorMessage: passwordError } = useField('password', (value: string) => {
  if (!isEditing.value) {
    if (!value) return 'La contraseña es obligatoria.'
    if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  } else {
    if (value && value.length < 6) return 'La contraseña debe tener al menos 6 caracteres si se proporciona.'
  }
  return true
})

const { value: rolId, errorMessage: rolIdError } = useField<number | null>('rolId', [required], { initialValue: null })
const { value: razonSocialId, errorMessage: razonSocialIdError } = useField<number | null>('razonSocialId', [required], { initialValue: null })
const { value: estado, errorMessage: estadoError } = useField('estado', [required], { initialValue: 'activo' })

const { value: celularPersonal, errorMessage: celularPersonalError } = useField<string | null>('celularPersonal', [optionalNumber], { initialValue: '' })
const { value: celularCorporativo, errorMessage: celularCorporativoError } = useField<string | null>('celularCorporativo', [optionalNumber], { initialValue: '' })
const { value: direccion, errorMessage: direccionError } = useField('direccion', undefined, { initialValue: '' })

/* =========================
 * SELECTS
 * ========================= */
const roles = ref<any[]>([])
const razonesSociales = ref<any[]>([])

/* =========================
 * FEEDBACK
 * ========================= */
const snackbar = ref({ show: false, message: '', color: 'success' })
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogConfirmText = ref('')
const confirmDialogConfirmColor = ref('')
const currentAction = ref('')
const userToDeleteId = ref<number | null>(null)

/* =========================
 * TABLA
 * ========================= */
const usuarios = ref<any[]>([])
const search = ref('')
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([{ key: 'id', order: 'asc' }])
const statusFilter = ref('Todos')

/* ← CAMBIO: encabezados con "Consecutivo" */
const headers = [
  { title: 'Consecutivo', key: 'consecutivo', sortable: false },
  { title: 'Nombres', key: 'nombres', sortable: true },
  { title: 'Apellidos', key: 'apellidos', sortable: true },
  { title: 'Correo', key: 'correo', sortable: true },
  { title: 'Rol', key: 'rol.nombre', sortable: true },
  { title: 'Empresa', key: 'razonSocial.nombre', sortable: true },
  { title: 'Cel. Personal', key: 'celularPersonal', sortable: true },
  { title: 'Cel. Corporativo', key: 'celularCorporativo', sortable: true },
  { title: 'Dirección', key: 'direccion', sortable: true },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

/* =========================
 * API
 * ========================= */
async function fetchRoles() {
  try {
    const resp = await obtenerRoles()
    roles.value = toArray(resp)
  } catch (error: unknown) {
    console.error('Error al obtener los roles:', error)
    roles.value = []
    showSnackbar(`Error al cargar los roles: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

async function fetchRazonesSociales() {
  try {
    const resp = await obtenerRazonesSociales()
    razonesSociales.value = toArray(resp)
  } catch (error: unknown) {
    console.error('Error al obtener las razones sociales:', error)
    razonesSociales.value = []
    showSnackbar(`Error al cargar las empresas: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

async function cargarUsuarios() {
  try {
    const resp = await obtenerUsuarios()
    usuarios.value = toArray(resp)
  } catch (err) {
    usuarios.value = []
    showSnackbar('Error al cargar usuarios. Consulta la consola para más detalles.', 'error')
    console.error('Error al cargar usuarios:', err)
  }
}

/* =========================
 * ACCIONES
 * ========================= */
function promptEditUser(user: any) {
  if (isProcessing.value) return
  userToConfirmEditId.value = user.id
  confirmDialogTitle.value = 'Confirmar Edición'
  confirmDialogMessage.value = `¿Estás seguro de que quieres editar a ${user.nombres} ${user.apellidos}?`
  confirmDialogConfirmText.value = 'Editar'
  confirmDialogConfirmColor.value = 'primary'
  currentAction.value = 'confirmEdit'
  showConfirmDialog.value = true
}

function executeEditUser(user: any) {
  isEditing.value = true
  editingUserId.value = user.id
  setValues({
    nombres: user.nombres,
    apellidos: user.apellidos,
    correo: user.correo,
    celularPersonal: user.celularPersonal,
    celularCorporativo: user.celularCorporativo,
    direccion: user.direccion,
    rolId: user.rolId,
    razonSocialId: user.razonSocialId,
    estado: user.estado,
  })
  password.value = ''
  nextTick(() => window.scrollTo(0, 0))
}

const onSubmit = handleSubmit(async () => {
  if (isProcessing.value) return
  nextTick(() => window.scrollTo(0, 0))

  if (isEditing.value && !editingUserId.value) {
    showSnackbar('Error: ID de usuario para editar no encontrado.', 'error')
    return
  }

  if (isEditing.value) {
    confirmDialogTitle.value = 'Confirmar Actualización'
    confirmDialogMessage.value = '¿Estás seguro de que quieres actualizar este usuario?'
    confirmDialogConfirmText.value = 'Actualizar'
    confirmDialogConfirmColor.value = 'primary'
    currentAction.value = 'update'
  } else {
    confirmDialogTitle.value = 'Confirmar Creación'
    confirmDialogMessage.value = '¿Estás seguro de que quieres crear este usuario?'
    confirmDialogConfirmText.value = 'Crear'
    confirmDialogConfirmColor.value = 'success'
    currentAction.value = 'create'
  }
  showConfirmDialog.value = true
})

async function handleConfirmAction() {
  if (isProcessing.value) return
  snackbar.value.show = false

  // cierra el diálogo primero para evitar doble confirmación
  showConfirmDialog.value = false

  try {
    isProcessing.value = true

    if (currentAction.value === 'confirmEdit') {
      const user = usuarios.value.find((u) => u.id === userToConfirmEditId.value)
      if (user) executeEditUser(user)
      else showSnackbar('Error: Usuario no encontrado para editar.', 'error')

    } else if (currentAction.value === 'create') {
      if (inFlight.value.create) return
      inFlight.value.create = true

      const userData: any = {
        nombres: nombres.value,
        apellidos: apellidos.value,
        correo: correo.value,
        celularPersonal: celularPersonal.value,
        celularCorporativo: celularCorporativo.value,
        direccion: direccion.value,
        rolId: rolId.value,
        razonSocialId: razonSocialId.value,
        estado: estado.value,
      }
      if (password.value) userData.password = password.value

      // Si tu service soporta headers, puedes activar idempotencia:
      // await crearUsuario(userData, { headers: { 'X-Idempotency-Key': makeIdemKey() } })
      await crearUsuario(userData)

      showSnackbar('Usuario creado exitosamente.', 'success')
      await cargarUsuarios()
      resetFormAndState()

    } else if (currentAction.value === 'update') {
      if (inFlight.value.update) return
      inFlight.value.update = true

      const userData: any = {
        nombres: nombres.value,
        apellidos: apellidos.value,
        correo: correo.value,
        celularPersonal: celularPersonal.value,
        celularCorporativo: celularCorporativo.value,
        direccion: direccion.value,
        rolId: rolId.value,
        razonSocialId: razonSocialId.value,
        estado: estado.value,
      }
      if (password.value) userData.password = password.value

      await actualizarUsuario(editingUserId.value!, userData)
      showSnackbar('Usuario actualizado correctamente.', 'success')
      await cargarUsuarios()
      resetFormAndState()

    } else if (currentAction.value === 'delete') {
      if (inFlight.value.delete) return
      inFlight.value.delete = true

      if (userToDeleteId.value !== null) {
        await eliminarUsuario(userToDeleteId.value)
        showSnackbar('Usuario eliminado correctamente.', 'success')
        await cargarUsuarios()
        resetFormAndState()
      }

    } else if (currentAction.value === 'disable') {
      if (inFlight.value.disable) return
      inFlight.value.disable = true

      if (userToDisableId.value !== null) {
        await actualizarUsuario(userToDisableId.value, { estado: 'inactivo' })
        showSnackbar('Usuario deshabilitado exitosamente.', 'success')
        await cargarUsuarios()
        resetFormAndState()
      }
    }
  } catch (err: any) {
    console.error('ERROR en handleConfirmAction:', err)
    const status = err?.response?.status
    const data = err?.response?.data

    if (status === 409) {
      showSnackbar('Ese correo ya está registrado. No se creó ningún usuario.', 'error')
    } else if (status === 422 && data?.errors) {
      const backendErrors = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
      showSnackbar(`Error de validación: ${backendErrors}`, 'error')
    } else {
      const msg = data?.message || err?.message || 'Error desconocido al procesar la operación.'
      showSnackbar(msg, 'error')
    }
  } finally {
    isProcessing.value = false
    inFlight.value.create = false
    inFlight.value.update = false
    inFlight.value.delete = false
    inFlight.value.disable = false
    currentAction.value = ''
  }
}

function promptDisableUser(id: number) {
  if (isProcessing.value) return
  userToDisableId.value = id
  confirmDialogTitle.value = 'Confirmar Deshabilitación'
  confirmDialogMessage.value = '¿Estás seguro de que quieres deshabilitar este usuario? No podrá iniciar sesión.'
  confirmDialogConfirmText.value = 'Deshabilitar'
  confirmDialogConfirmColor.value = 'warning'
  currentAction.value = 'disable'
  showConfirmDialog.value = true
}

function showSnackbar(message: string, color: string) {
  snackbar.value = { show: true, message, color }
}

function resetFormAndState() {
  nextTick(() => window.scrollTo(0, 0))
  resetForm({
    values: {
      nombres: '',
      apellidos: '',
      correo: '',
      password: '',
      celularPersonal: '',
      celularCorporativo: '',
      direccion: '',
      rolId: null,
      razonSocialId: null,
      estado: 'activo',
    },
  })
  isEditing.value = false
  editingUserId.value = null
  userToDeleteId.value = null
  userToDisableId.value = null
  userToConfirmEditId.value = null
}

const setSortOrder = (order: 'asc' | 'desc') => {
  sortBy.value = [{ key: 'id', order }]
}

onMounted(async () => {
  await fetchRoles()
  await fetchRazonesSociales()
  await cargarUsuarios()
  setSortOrder('asc')
  resetFormAndState()
})

/* Filtro y búsqueda */
const filteredUsers = computed(() => {
  let items = Array.isArray(usuarios.value) ? usuarios.value : []

  if (search.value) {
    const searchTerm = search.value.toLowerCase().trim()
    items = items.filter((u) =>
      [
        u.id,
        u.nombres,
        u.apellidos,
        u.correo,
        u?.rol?.nombre,
        u?.razonSocial?.nombre,
        u.celularPersonal,
        u.celularCorporativo,
        u.direccion,
        u.estado,
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .some((text) => text.includes(searchTerm))
    )
  }

  if (statusFilter.value !== 'Todos') {
    items = items.filter((u) => u.estado === statusFilter.value)
  }

  return items
})

/* ← NUEVO: agrega campo consecutivo según posición actual */
const numberedUsers = computed(() =>
  filteredUsers.value.map((u, idx) => ({ ...u, consecutivo: idx + 1 }))
)

function handleDeleteUser(id: number) {
  if (isProcessing.value) return
  userToDeleteId.value = id
  confirmDialogTitle.value = 'Confirmar Eliminación'
  confirmDialogMessage.value = '¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.'
  confirmDialogConfirmText.value = 'Eliminar'
  confirmDialogConfirmColor.value = 'error'
  currentAction.value = 'delete'
  showConfirmDialog.value = true
}

function handleCancelAction() {
  userToDeleteId.value = null
  userToDisableId.value = null
  userToConfirmEditId.value = null
  currentAction.value = ''
  showConfirmDialog.value = false
}

/* Si tu service soporta headers para idempotencia:
function makeIdemKey() {
  return (crypto as any)?.randomUUID?.() || `${Date.now()}-${Math.random()}`
}
*/
</script>

<style scoped>
.v-container { max-width: 1200px; }

.form { padding: 16px; border-radius: 8px; }

.v-card-title {
  font-weight: bold;
  color: #3f51b5;
  border-bottom: 1px solid #e0e0e0;
}

.v-text-field,
.v-select,
.v-file-input { margin-bottom: 16px; }

.v-btn { font-weight: 500; letter-spacing: 0.02em; }

.v-btn.primary { background-color: #1976D2 !important; color: white !important; }
.v-btn.secondary { background-color: #607D8B !important; color: white !important; }

.v-btn-toggle .v-btn { min-width: 44px; border-radius: 22px !important; }

.v-data-table { font-size: 0.9rem; }
.v-data-table th { font-weight: bold !important; background-color: #f5f5f5; color: #424242 !important; }
.v-data-table tbody tr:nth-of-type(odd) { background-color: #f9f9f9; }
.v-data-table tbody tr:hover { background-color: #e3f2fd !important; }
.v-data-table tbody td { padding: 12px 16px; }

.v-chip { font-weight: bold; text-transform: capitalize; }
</style>
