<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-5">
        <div class="text-h5 font-weight-bold">🤝 Convenios</div>

        <div class="d-flex gap-2 flex-wrap">
          <v-text-field
            v-model="filters.texto"
            label="Buscar por nombre"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 280px"
          />

          <v-select
            v-model="filters.activo"
            :items="estadoItems"
            item-title="label"
            item-value="value"
            label="Estado"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            style="min-width: 160px"
          />

          <v-btn color="primary" :loading="loading" @click="reload">Aplicar</v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetFilters">Limpiar</v-btn>
        </div>
      </v-card-title>

      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        :sort-by="sortBy"
        @update:options="loadItems"
        item-value="id"
      >
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="flat">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <template #item.contacto="{ item }">
          <div class="d-flex flex-column">
            <span v-if="item.telefono"><strong>Tel:</strong> {{ item.telefono }}</span>
            <span v-else-if="item.whatsapp"><strong>Corporativo:</strong> {{ item.whatsapp }}</span>
            <span v-else-if="item.email"><strong>Email:</strong> {{ item.email }}</span>
            <span v-else class="text-medium-emphasis">—</span>
          </div>
        </template>

        <template #item.establecimiento="{ item }">
          <span v-if="item.establecimiento">{{ item.establecimiento }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.metodoPago="{ item }">
          <div class="d-flex flex-column">
            <span v-if="item.metodoPago">
              <strong>{{ item.metodoPago }}</strong>
            </span>
            <span v-if="item.metodoPago && item.metodoPago !== 'EFECTIVO' && item.numeroMetodoPago" class="text-caption text-medium-emphasis">
              {{ item.numeroMetodoPago }}
            </span>
            <span v-if="!item.metodoPago" class="text-medium-emphasis">—</span>
          </div>
        </template>

        <template #item.asesor="{ item }">
          <span class="text-medium-emphasis" v-if="!asesorActivoMap[item.id]">—</span>
          <span v-else>{{ asesorActivoMap[item.id]?.asesor?.nombre }}</span>
        </template>

        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              size="small"
              variant="text"
              icon="mdi-eye"
              @click="verDetalle(item.id)"
              title="Ver detalle"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-pencil"
              color="primary"
              @click="openEditar(item.id)"
              title="Editar convenio"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-account-plus"
              @click="openAsignar(item.id)"
              title="Asignar asesor"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-account-remove"
              color="error"
              @click="openRetirar(item.id)"
              title="Retirar asesor"
            />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Modal: Ver detalle (solo lectura) -->
    <v-dialog v-model="dlgDetalle.visible" max-width="640">
      <v-card>
        <v-card-title class="text-h6">
          Detalle del convenio
        </v-card-title>
        <v-card-text>
          <v-skeleton-loader
            v-if="dlgDetalle.loading"
            type="article"
          />
          <div v-else-if="dlgDetalle.item">
            <div class="mb-2">
              <strong>Nombre:</strong> {{ dlgDetalle.item.nombre || '—' }}
            </div>
            <div class="mb-2">
              <strong>Tipo:</strong> {{ dlgDetalle.item.tipo || '—' }}
            </div>
            <div class="mb-2" v-if="dlgDetalle.item.establecimiento">
              <strong>Establecimiento:</strong> {{ dlgDetalle.item.establecimiento }}
            </div>
            <div class="mb-2">
              <strong>Documento:</strong>
              <span v-if="dlgDetalle.item.docTipo || dlgDetalle.item.docNumero">
                {{ dlgDetalle.item.docTipo || '' }} {{ dlgDetalle.item.docNumero || '' }}
              </span>
              <span v-else>—</span>
            </div>
            <div class="mb-2">
              <strong>Teléfono:</strong> {{ dlgDetalle.item.telefono || '—' }}
            </div>
            <div class="mb-2">
              <strong>Corporativo:</strong> {{ dlgDetalle.item.whatsapp || '—' }}
            </div>
            <div class="mb-2">
              <strong>Email:</strong> {{ dlgDetalle.item.email || '—' }}
            </div>
            <div class="mb-2">
              <strong>Dirección:</strong> {{ dlgDetalle.item.direccion || '—' }}
            </div>
            <div class="mb-2">
              <strong>Método de pago:</strong> {{ dlgDetalle.item.metodoPago || 'No especificado' }}
            </div>
            <div class="mb-2" v-if="dlgDetalle.item.metodoPago && dlgDetalle.item.metodoPago !== 'EFECTIVO'">
              <strong>Número de pago:</strong> {{ dlgDetalle.item.numeroMetodoPago || '—' }}
            </div>
            <div class="mb-2">
              <strong>Fecha de apertura:</strong> {{ dlgDetalle.item.fechaApertura || '—' }}
            </div>
          </div>
          <div v-else class="text-medium-emphasis">
            No se pudo cargar la información del convenio.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="dlgDetalle.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal: Editar convenio -->
    <v-dialog v-model="dlgEditar.visible" max-width="800" scrollable>
      <v-card>
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          <span>Editar Convenio #{{ dlgEditar.item?.id }}</span>
          <v-chip :color="dlgEditar.form.activo ? 'success' : 'error'" size="small">
            {{ dlgEditar.form.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-card-text style="max-height: 600px">
          <v-skeleton-loader v-if="dlgEditar.loading" type="article, article" />

          <v-form v-else ref="formEditar">
            <v-row>
              <!-- Nombre -->
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="dlgEditar.form.nombre"
                  label="Nombre *"
                  variant="outlined"
                  :rules="[v => !!v || 'El nombre es requerido']"
                />
              </v-col>

              <!-- Tipo -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="dlgEditar.form.tipo"
                  :items="tiposConvenio"
                  label="Tipo"
                  variant="outlined"
                />
              </v-col>

              <!-- Código -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dlgEditar.form.codigo"
                  label="Código"
                  variant="outlined"
                />
              </v-col>

              <!-- Establecimiento -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dlgEditar.form.establecimiento"
                  label="Establecimiento"
                  variant="outlined"
                />
              </v-col>

              <!-- Tipo Documento -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="dlgEditar.form.docTipo"
                  :items="tiposDocumento"
                  label="Tipo Doc."
                  variant="outlined"
                />
              </v-col>

              <!-- Número Documento -->
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="dlgEditar.form.docNumero"
                  label="Número Documento"
                  variant="outlined"
                />
              </v-col>

              <!-- Teléfono -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dlgEditar.form.telefono"
                  label="Teléfono"
                  variant="outlined"
                />
              </v-col>

              <!-- WhatsApp -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dlgEditar.form.whatsapp"
                  label="WhatsApp / Corporativo"
                  variant="outlined"
                />
              </v-col>

              <!-- Email -->
              <v-col cols="12">
                <v-text-field
                  v-model="dlgEditar.form.email"
                  label="Email"
                  type="email"
                  variant="outlined"
                />
              </v-col>

              <!-- Dirección -->
              <v-col cols="12">
                <v-textarea
                  v-model="dlgEditar.form.direccion"
                  label="Dirección"
                  variant="outlined"
                  rows="2"
                />
              </v-col>

              <!-- 👇 NUEVO: Fecha de Apertura -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dlgEditar.form.fechaApertura"
                  label="Fecha de Apertura"
                  type="date"
                  variant="outlined"
                  prepend-inner-icon="mdi-calendar"
                  hint="Selecciona la fecha de apertura del convenio"
                  persistent-hint
                />
              </v-col>

              <!-- Método de Pago -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="dlgEditar.form.metodoPago"
                  :items="metodosPago"
                  label="Método de Pago"
                  variant="outlined"
                />
              </v-col>

              <!-- Número Método Pago -->
              <v-col cols="12">
                <v-text-field
                  v-model="dlgEditar.form.numeroMetodoPago"
                  label="Número Método Pago"
                  variant="outlined"
                  :disabled="dlgEditar.form.metodoPago === 'EFECTIVO' || !dlgEditar.form.metodoPago"
                  :hint="dlgEditar.form.metodoPago !== 'EFECTIVO' && dlgEditar.form.metodoPago ? 'Requerido para métodos distintos a efectivo' : ''"
                  persistent-hint
                />
              </v-col>

              <!-- Notas -->
              <v-col cols="12">
                <v-textarea
                  v-model="dlgEditar.form.notas"
                  label="Notas"
                  variant="outlined"
                  rows="3"
                />
              </v-col>

              <!-- Activo -->
              <v-col cols="12">
                <v-switch
                  v-model="dlgEditar.form.activo"
                  label="Convenio Activo"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgEditar.visible = false" :disabled="dlgEditar.saving">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :loading="dlgEditar.saving"
            @click="guardarEdicion"
          >
            Guardar Cambios
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 👇 NUEVO: Modal profesional de cédula duplicada -->
    <v-dialog v-model="dlgErrorDuplicado.visible" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center py-4 px-6 bg-error">
          <v-icon size="32" class="mr-3 text-white">mdi-alert-circle-outline</v-icon>
          <span class="text-h5 text-white font-weight-bold">Documento Duplicado</span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <!-- Alerta principal -->
          <v-alert
            type="error"
            variant="tonal"
            prominent
            border="start"
            class="mb-5"
          >
            <div class="text-h6 mb-2">⚠️ No se puede guardar el convenio</div>
            <div class="text-body-1">
              El documento que intentas registrar ya está asociado a otro convenio en el sistema.
            </div>
          </v-alert>

          <!-- Información del documento -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-3">
                <v-icon color="error" class="mr-2">mdi-card-account-details</v-icon>
                <span class="text-subtitle-1 font-weight-bold">Documento Intentado</span>
              </div>
              <div class="pl-9">
                <v-chip color="error" variant="flat" size="large" class="font-weight-bold">
                  {{ dlgErrorDuplicado.cedula }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Información adicional -->
          <v-card variant="outlined" color="info">
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-2">
                <v-icon color="info" class="mr-2">mdi-information-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold">¿Qué hacer?</span>
              </div>
              <v-list density="compact" class="bg-transparent">
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small" color="info">mdi-numeric-1-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    Verifica que el número de documento sea correcto
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small" color="info">mdi-numeric-2-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    Si el documento es correcto, busca el convenio existente para editarlo
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small" color="info">mdi-numeric-3-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    Si es un error en el convenio anterior, corrígelo primero
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn
            variant="outlined"
            color="info"
            prepend-icon="mdi-magnify"
            @click="buscarConvenioDuplicado"
          >
            Buscar Convenio
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-check"
            @click="cerrarModalDuplicado"
          >
            Entendido
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal: Asignar asesor -->
    <v-dialog v-model="dlgAsignar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Asignar asesor</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="dlgAsignar.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor"
            :loading="asesoresLoading"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgAsignar.visible = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="dlgAsignar.loading" @click="confirmAsignar">Asignar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal: Retirar asesor -->
    <v-dialog v-model="dlgRetirar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Retirar asesor</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="dlgRetirar.motivo"
            label="Motivo (opcional)"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgRetirar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgRetirar.loading" @click="confirmRetirar">Retirar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import type { VForm } from 'vuetify/components'
import {
  listConvenios,
  getConvenio,
  updateConvenio,
  getAsesorActivo,
  asignarAsesorConvenio,
  retirarAsesorConvenio,
  listAgentesCaptacion,
} from '@/services/conveniosService'

/** Tipos lightweight para no depender de exports opcionales del service */
type ConvenioLite = {
  id: number
  nombre: string
  activo: boolean | 0 | 1
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  tipo?: string | null
  codigo?: string | null
  docTipo?: string | null
  docNumero?: string | null
  direccion?: string | null
  notas?: string | null
  establecimiento?: string | null
  metodoPago?: string | null
  numeroMetodoPago?: string | null
  fechaApertura?: string | null
}
type AsesorActivoLite = {
  asesor?: { id: number; nombre: string; tipo?: string } | null
  convenio_id?: number
  activo?: boolean
}

/* Opciones para selects */
const tiposConvenio = ['PERSONA', 'TALLER', 'PARQUEADERO', 'LAVADERO']
const tiposDocumento = ['CC', 'NIT', 'CE', 'PASAPORTE', 'RUT']
const metodosPago = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE']

/* Filtros */
const filters = ref<{ texto: string; activo: '' | 0 | 1 | boolean }>({
  texto: '',
  activo: '',
})
const estadoItems = [
  { label: 'Activos', value: 1 },
  { label: 'Inactivos', value: 0 },
]

/* Tabla */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Contacto', key: 'contacto', sortable: false },
  { title: 'Establecimiento', key: 'establecimiento', sortable: true },
  { title: 'Método Pago', key: 'metodoPago', sortable: false },
  { title: 'Asesor activo', key: 'asesor', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]
const rows = ref<ConvenioLite[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([{ key: 'id', order: 'desc' }])
const loading = ref(false)

/* Asesor activo cache por convenioId */
const asesorActivoMap = ref<Record<number, AsesorActivoLite>>({})

/* Catálogo asesores */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion('ASESOR_COMERCIAL')
  } finally {
    asesoresLoading.value = false
  }
}

/* Data */
async function loadItems() {
  loading.value = true
  try {
    const sort =
      Array.isArray(sortBy.value) && sortBy.value[0]
        ? sortBy.value[0]
        : { key: 'id', order: 'desc' as const }
    const res = await listConvenios({
      page: page.value,
      perPage: itemsPerPage.value,
      texto: filters.value.texto || undefined,
      activo: filters.value.activo === '' ? undefined : filters.value.activo,
      sortBy: sort.key,
      order: sort.order,
    })

    rows.value = res.data as ConvenioLite[]
    totalItems.value = Number(res.total || 0)

    // Cargar asesor activo por convenio (lazy, tolerante a errores)
    asesorActivoMap.value = {}
    for (const c of rows.value) {
      try {
        const info = await getAsesorActivo(c.id)
        asesorActivoMap.value[c.id] = info as AsesorActivoLite
      } catch {
        // ignora fallos individuales
      }
    }
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadItems()
}
function resetFilters() {
  filters.value = { texto: '', activo: '' }
  reload()
}

/* Dialog detalle convenio (solo lectura) */
const dlgDetalle = ref<{
  visible: boolean
  loading: boolean
  item: ConvenioLite | null
}>({
  visible: false,
  loading: false,
  item: null,
})

async function verDetalle(id: number) {
  dlgDetalle.value.visible = true
  dlgDetalle.value.loading = true
  dlgDetalle.value.item = null
  try {
    const conv = await getConvenio(id)
    dlgDetalle.value.item = conv as ConvenioLite
  } finally {
    dlgDetalle.value.loading = false
  }
}

/* Dialog de edición completo */
const formEditar = ref<VForm | null>(null)
const dlgEditar = ref<{
  visible: boolean
  loading: boolean
  saving: boolean
  item: ConvenioLite | null
  form: {
    nombre: string
    tipo: 'PERSONA' | 'TALLER' | 'PARQUEADERO' | 'LAVADERO'
    codigo: string
    establecimiento: string
    docTipo: string
    docNumero: string
    telefono: string
    whatsapp: string
    email: string
    direccion: string
    notas: string
    metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE' | ''
    numeroMetodoPago: string
    fechaApertura: string
    activo: boolean
  }
}>({
  visible: false,
  loading: false,
  saving: false,
  item: null,
  form: {
    nombre: '',
    tipo: 'PERSONA',
    codigo: '',
    establecimiento: '',
    docTipo: '',
    docNumero: '',
    telefono: '',
    whatsapp: '',
    email: '',
    direccion: '',
    notas: '',
    metodoPago: '',
    numeroMetodoPago: '',
    fechaApertura: '',
    activo: true,
  },
})

/* 👇 NUEVO: Dialog error duplicado */
const dlgErrorDuplicado = ref<{
  visible: boolean
  cedula: string
  convenioExistente: string | null
}>({
  visible: false,
  cedula: '',
  convenioExistente: null,
})

async function openEditar(id: number) {
  dlgEditar.value.visible = true
  dlgEditar.value.loading = true
  dlgEditar.value.item = null

  try {
    const conv = await getConvenio(id)
    dlgEditar.value.item = conv as ConvenioLite

    // Llenar el formulario con los datos actuales
    dlgEditar.value.form = {
      nombre: conv.nombre || '',
      tipo: (conv.tipo as 'PERSONA' | 'TALLER' | 'PARQUEADERO' | 'LAVADERO') || 'PERSONA',
      codigo: conv.codigo || '',
      establecimiento: conv.establecimiento || '',
      docTipo: conv.docTipo || '',
      docNumero: conv.docNumero || '',
      telefono: conv.telefono || '',
      whatsapp: conv.whatsapp || '',
      email: conv.email || '',
      direccion: conv.direccion || '',
      notas: conv.notas || '',
      metodoPago: (conv.metodoPago as 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE') || '',
      numeroMetodoPago: conv.numeroMetodoPago || '',
      fechaApertura: conv.fechaApertura ? conv.fechaApertura.split(' ')[0] : '',
      activo: !!conv.activo,
    }
  } finally {
    dlgEditar.value.loading = false
  }
}

async function guardarEdicion() {
  if (!dlgEditar.value.item) return

  // Validar formulario
  const validationResult = await formEditar.value?.validate()
  if (!validationResult?.valid) return

  // Validar método de pago
  if (dlgEditar.value.form.metodoPago &&
      dlgEditar.value.form.metodoPago !== 'EFECTIVO' &&
      !dlgEditar.value.form.numeroMetodoPago) {
    alert('Se requiere número de método de pago para métodos distintos a EFECTIVO')
    return
  }

  dlgEditar.value.saving = true
  try {
    await updateConvenio(dlgEditar.value.item.id, {
      nombre: dlgEditar.value.form.nombre,
      tipo: dlgEditar.value.form.tipo,
      codigo: dlgEditar.value.form.codigo || null,
      establecimiento: dlgEditar.value.form.establecimiento || null,
      doc_tipo: dlgEditar.value.form.docTipo || null,
      doc_numero: dlgEditar.value.form.docNumero || null,
      telefono: dlgEditar.value.form.telefono || null,
      whatsapp: dlgEditar.value.form.whatsapp || null,
      email: dlgEditar.value.form.email || null,
      direccion: dlgEditar.value.form.direccion || null,
      notas: dlgEditar.value.form.notas || null,
      metodo_pago: dlgEditar.value.form.metodoPago || null,
      numero_metodo_pago: dlgEditar.value.form.numeroMetodoPago || null,
      fecha_apertura: dlgEditar.value.form.fechaApertura || null,
      activo: dlgEditar.value.form.activo,
    })

    dlgEditar.value.visible = false
    await loadItems()
  } catch (error: any) {
    // 🔍 Detectar error de cédula duplicada - MEJORADO
    const errorMsg = error?.response?.data?.message || error?.message || ''

    // Buscar diferentes variaciones del mensaje de error
    const isDuplicado =
      errorMsg.includes('Duplicate entry') ||
      errorMsg.toLowerCase().includes('duplicado') ||
      errorMsg.toLowerCase().includes('documento ya está en uso') ||
      errorMsg.toLowerCase().includes('ya existe') ||
      (error?.response?.status === 409) || // HTTP Conflict
      errorMsg.includes('convenios_doc_tipo_doc_numero_unique')

    if (isDuplicado) {
      // Mostrar modal profesional
      const cedula = dlgEditar.value.form.docNumero || 'N/A'

      dlgErrorDuplicado.value = {
        visible: true,
        cedula: `${dlgEditar.value.form.docTipo || ''} ${cedula}`,
        convenioExistente: `Convenio ya existente con esta identificación`,
      }
    } else {
      // Otro tipo de error - mostrar mensaje genérico
      alert(`Error al guardar: ${errorMsg}`)
    }
  } finally {
    dlgEditar.value.saving = false
  }
}

// 👇 NUEVO: Funciones para el modal de duplicado
function cerrarModalDuplicado() {
  dlgErrorDuplicado.value.visible = false
  // Opcional: Limpiar el campo de documento para que el usuario lo corrija
  // dlgEditar.value.form.docNumero = ''
}

function buscarConvenioDuplicado() {
  // Cerrar el modal de edición
  dlgEditar.value.visible = false
  dlgErrorDuplicado.value.visible = false

  // Aplicar filtro de búsqueda con el documento duplicado
  const soloNumero = dlgErrorDuplicado.value.cedula.replace(/[^0-9]/g, '')
  filters.value.texto = soloNumero
  reload()
}

/* Dialog Asignar */
const dlgAsignar = ref<{
  visible: boolean
  convenioId: number | null
  asesorId: number | null
  loading: boolean
}>({
  visible: false,
  convenioId: null,
  asesorId: null,
  loading: false,
})
function openAsignar(convenioId: number) {
  dlgAsignar.value = { visible: true, convenioId, asesorId: null, loading: false }
  if (!asesoresItems.value.length) loadAsesores()
}
async function confirmAsignar() {
  if (!dlgAsignar.value.convenioId || !dlgAsignar.value.asesorId) return
  dlgAsignar.value.loading = true
  try {
    await asignarAsesorConvenio(dlgAsignar.value.convenioId, {
      asesor_id: dlgAsignar.value.asesorId,
    })
    const info = await getAsesorActivo(dlgAsignar.value.convenioId)
    asesorActivoMap.value[dlgAsignar.value.convenioId] = info as AsesorActivoLite
    dlgAsignar.value.visible = false
  } finally {
    dlgAsignar.value.loading = false
  }
}

/* Dialog Retirar */
const dlgRetirar = ref<{
  visible: boolean
  convenioId: number | null
  motivo: string
  loading: boolean
}>({
  visible: false,
  convenioId: null,
  motivo: '',
  loading: false,
})
function openRetirar(convenioId: number) {
  dlgRetirar.value = { visible: true, convenioId, motivo: '', loading: false }
}
async function confirmRetirar() {
  if (!dlgRetirar.value.convenioId) return
  dlgRetirar.value.loading = true
  try {
    await retirarAsesorConvenio(dlgRetirar.value.convenioId, {
      motivo: dlgRetirar.value.motivo || undefined,
    })
    const info = await getAsesorActivo(dlgRetirar.value.convenioId)
    asesorActivoMap.value[dlgRetirar.value.convenioId] = info as AsesorActivoLite
    dlgRetirar.value.visible = false
  } finally {
    dlgRetirar.value.loading = false
  }
}

/* Init */
loadAsesores()
loadItems()
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
