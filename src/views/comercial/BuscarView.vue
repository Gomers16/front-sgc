<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="d-flex flex-column align-center text-center py-6">
        <div class="text-h5 font-weight-bold">🔎 Búsqueda unificada</div>
        <div class="text-body-2 text-medium-emphasis">
          Ingresa <strong>placa</strong> o <strong>teléfono</strong> para consultar vehículo/cliente, dateo, captación sugerida, asesor y si la placa pertenece a un <strong>prospecto</strong>.
        </div>
      </v-card-title>

      <v-divider />

      <!-- Barra de búsqueda -->
      <v-card-text class="pt-6">
        <v-row align="center" justify="center" class="g-4">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.placa"
              label="Placa"
              placeholder="ABC123"
              prepend-inner-icon="mdi-car-info"
              variant="outlined"
              density="comfortable"
              clearable
              @keydown.enter="handleBuscar"
              :readonly="loading"
            />
          </v-col>

          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.telefono"
              label="Teléfono"
              placeholder="3001234567"
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              density="comfortable"
              clearable
              @keydown.enter="handleBuscar"
              :readonly="loading"
            />
          </v-col>

          <v-col cols="12" sm="4" class="d-flex gap-3">
            <v-btn color="primary" size="large" class="flex-grow-1" :loading="loading" @click="handleBuscar">
              Buscar
            </v-btn>
            <v-btn variant="text" size="large" @click="handleLimpiar" :disabled="loading">
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-expand-transition>
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mx-6 mb-4" density="comfortable">
          {{ errorMsg }}
        </v-alert>
      </v-expand-transition>

      <!-- Resultados -->
      <template v-if="hasAnyCard">
        <v-card-text class="pb-6">
          <v-row class="g-4">
            <!-- Vehículo (por cliente o por placa) -->
            <v-col v-if="hasVehiculoCard" cols="12" md="6">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <v-icon class="me-2">mdi-car</v-icon>
                    Vehículo
                    <v-chip v-if="respuesta?.vehiculo?.placa" size="small" class="ms-2" variant="tonal">
                      {{ respuesta?.vehiculo?.placa }}
                    </v-chip>
                  </div>
                  <v-btn
                    v-if="vehiculosClienteCount > 0"
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-eye"
                    @click="dlgVehiculos = true"
                  >
                    Ver todo
                  </v-btn>
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <div class="text-body-2">
                    <strong>Clase:</strong> {{ respuesta.vehiculo?.clase?.nombre || '—' }}
                  </div>
                  <div class="text-body-2">
                    <strong>Marca/Línea/Modelo:</strong> {{ resumenVehiculo }}
                  </div>

                  <template v-if="vehiculosClienteCount > 0 || ultimaVisitaCliente">
                    <v-divider class="my-3" />

                    <div v-if="vehiculosClienteCount > 0" class="mb-2">
                      <div class="text-subtitle-2 mb-1">
                        Vehículos del cliente
                        <v-chip size="x-small" class="ms-1" variant="tonal">{{ vehiculosClienteCount }}</v-chip>
                      </div>
                      <div class="d-flex flex-wrap gap-1">
                        <v-chip
                          v-for="v in clienteDet!.vehiculos"
                          :key="v.id"
                          size="x-small"
                          variant="tonal"
                          title="Placa"
                        >
                          {{ v.placa }}
                        </v-chip>
                      </div>
                    </div>

                    <div v-if="ultimaVisitaCliente">
                      <div class="text-subtitle-2 mb-1">Última visita</div>
                      <div class="text-body-2">
                        <strong>Fecha:</strong> {{ formatDate(ultimaVisitaCliente!.fecha) }}
                      </div>
                      <div class="text-body-2">
                        <strong>Servicio:</strong> {{ ultimaVisitaCliente!.servicioNombre ?? '—' }}
                        <span class="ms-1">·</span>
                        <strong class="ms-1">Sede:</strong> {{ ultimaVisitaCliente!.sedeNombre ?? '—' }}
                      </div>
                      <div class="mt-1">
                        <v-chip
                          :color="ultimaVisitaCliente!.estado === 'finalizado' ? 'success'
                                  : ultimaVisitaCliente!.estado === 'cancelado' ? 'error' : 'warning'"
                          size="x-small"
                          label
                          class="text-capitalize"
                        >
                          {{ ultimaVisitaCliente!.estado }}
                        </v-chip>
                      </div>
                    </div>
                  </template>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Cliente -->
            <v-col v-if="hasCliente" cols="12" md="6">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="d-flex align-center">
                  <v-icon class="me-2">mdi-account</v-icon>
                  Cliente
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <div class="text-body-2"><strong>Nombre:</strong> {{ respuesta.cliente?.nombre }}</div>
                  <div class="text-body-2">
                    <strong>Documento:</strong>
                    {{ respuesta.cliente?.doc_tipo || '—' }} {{ respuesta.cliente?.doc_numero || '' }}
                  </div>
                  <div class="text-body-2"><strong>Teléfono:</strong> {{ respuesta.cliente?.telefono || '—' }}</div>

                  <div v-if="clienteDet" class="mt-3 d-flex flex-wrap gap-2">
                    <v-chip variant="tonal" size="x-small">Vehículos: {{ statsCliente?.vehiculos_count ?? 0 }}</v-chip>
                    <v-chip variant="tonal" size="x-small">Visitas: {{ statsCliente?.visitas_count ?? 0 }}</v-chip>
                    <v-chip
                      v-if="statsCliente?.dias_desde_ultima_visita !== undefined"
                      variant="tonal"
                      size="x-small"
                    >
                      Días sin visita: {{ statsCliente?.dias_desde_ultima_visita }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Dateo reciente -->
            <v-col v-if="hasDateo" cols="12" md="6">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="d-flex align-center">
                  <v-icon class="me-2">mdi-clipboard-text-search</v-icon>
                  Dateo reciente
                  <v-chip v-if="respuesta?.dateoReciente?.canal" class="ms-2" size="x-small" variant="tonal">
                    {{ respuesta?.dateoReciente?.canal }}
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <div class="text-body-2">
                    <strong>Agente:</strong>
                    {{ respuesta.dateoReciente?.agente?.nombre || '—' }}
                    <span v-if="respuesta.dateoReciente?.agente">
                      ({{ respuesta.dateoReciente?.agente?.tipo }})
                    </span>
                  </div>
                  <div class="text-body-2">
                    <strong>Creado:</strong> {{ formatDate(respuesta?.dateoReciente?.created_at) }}
                  </div>
                  <div class="text-body-2">
                    <strong>Obs.:</strong> {{ respuesta.dateoReciente?.observacion || '—' }}
                  </div>

                  <!-- Convenio del dateo (oculto cuando es teléfono de asesor) -->
                  <div class="mt-2" v-if="!telefonoEsAsesor && dateoConvenio">
                    <v-chip
                      color="deep-purple"
                      text-color="white"
                      variant="elevated"
                      prepend-icon="mdi-file-document-multiple-outline"
                    >
                      Convenio (dateo): {{ formatConvenioChip(dateoConvenio) }}
                    </v-chip>
                  </div>
                </v-card-text>

                <v-card-actions class="px-4 pb-4 pt-0">
                  <v-spacer />
                  <v-btn color="primary" @click="crearTurnoConDateo">
                    Crear turno con este dateo
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <!-- Captación y reserva (no en teléfono de asesor ni teléfono de cliente) -->
            <v-col v-if="hasCaptacion" cols="12" md="6">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="d-flex align-center">
                  <v-icon class="me-2">mdi-account-tie</v-icon>
                  Captación y reserva
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <div class="mb-3">
                    <div class="text-subtitle-2 mb-1">Reserva</div>
                    <div class="text-body-2">
                      <strong>Vigente:</strong> {{ boolLabel(respuesta?.reserva?.vigente) }}
                      <span v-if="respuesta?.reserva?.bloqueaHasta">· hasta {{ formatDate(respuesta?.reserva?.bloqueaHasta) }}</span>
                    </div>
                  </div>

                  <div>
                    <div class="text-subtitle-2 mb-1">Captación sugerida</div>
                    <div class="text-body-2">
                      <strong>Canal:</strong> {{ respuesta.captacionSugerida?.canal }} ·
                      <strong>Agente:</strong> {{ respuesta.captacionSugerida?.agente?.nombre || '—' }}
                    </div>
                  </div>
                </v-card-text>

                <v-card-actions class="px-4 pb-4 pt-0 d-flex flex-wrap gap-2">
                  <v-btn variant="tonal" @click="irCrearDateo">Crear dateo manual</v-btn>
                  <v-btn variant="tonal" @click="irCrearProspecto">Crear prospecto</v-btn>
                  <v-btn
                    v-if="puedeAutoDateo"
                    color="primary"
                    @click="dispararAutoDateo"
                    :loading="autoDateoLoading"
                  >
                    Auto-dateo por convenio
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <!-- Prospecto por placa -->
            <v-col v-if="hasProspecto" cols="12" md="6">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="d-flex align-center">
                  <v-icon class="me-2">mdi-account-search</v-icon>
                  Prospecto (por placa)
                  <v-chip class="ms-2" size="x-small" color="primary" variant="tonal">
                    Encontrado
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <div class="text-body-2">
                    <strong>Placa:</strong> {{ prospectoPlaca!.placa }}
                    <span v-if="prospectoPlaca!.nombre"> · <strong>Nombre:</strong> {{ prospectoPlaca!.nombre }}</span>
                  </div>
                  <div class="text-body-2" v-if="prospectoPlaca!.telefono">
                    <strong>Teléfono:</strong> {{ prospectoPlaca!.telefono }}
                  </div>
                  <div class="text-body-2" v-if="prospectoPlaca!.origen">
                    <strong>Origen:</strong> {{ prospectoPlaca!.origen }}
                  </div>
                  <div class="text-body-2" v-if="prospectoPlaca!.creado_por">
                    <strong>Creado por:</strong> {{ prospectoPlaca!.creado_por.nombre }}
                  </div>
                  <div class="text-body-2" v-if="prospectoPlaca!.asignacion_activa?.asesor">
                    <strong>Asignado a:</strong> {{ prospectoPlaca!.asignacion_activa.asesor.nombre }}
                  </div>
                  <div class="text-body-2" v-if="prospectoPlaca!.created_at">
                    <strong>Creado:</strong> {{ formatDate(prospectoPlaca!.created_at) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Asesor (solo cuando es búsqueda por teléfono de asesor; chip de tipo SIEMPRE) -->
            <v-col v-if="hasAsesor" cols="12" md="6">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="d-flex align-center">
                  <v-icon class="me-2">mdi-account-tie-outline</v-icon>
                  Asesor
                  <v-chip
                    v-if="respuesta?.captacionSugerida?.agente?.tipo"
                    class="ms-2"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ respuesta?.captacionSugerida?.agente?.tipo }}
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <div class="text-body-2">
                    <strong>Nombre:</strong>
                    {{ asesorInfo?.nombre ?? respuesta.captacionSugerida!.agente!.nombre }}
                  </div>

                  <div class="text-body-2">
                    <strong>Teléfono:</strong>
                    {{ asesorInfo?.telefono || asesorInfo?.celularCorporativo || asesorInfo?.celularPersonal || '—' }}
                  </div>

                  <div class="text-body-2" v-if="asesorInfo?.usuarioEmail">
                    <strong>Email:</strong> {{ asesorInfo.usuarioEmail }}
                  </div>

                  <div class="text-body-2" v-if="asesorInfo?.usuarioCargo">
                    <strong>Cargo:</strong> {{ asesorInfo.usuarioCargo }}
                  </div>

                  <div class="text-body-2" v-if="asesorInfo?.sedeNombre">
                    <strong>Sede:</strong> {{ asesorInfo.sedeNombre }}
                  </div>

                  <div class="text-body-2" v-if="asesorInfo?.usuarioEstado">
                    <strong>Estado usuario:</strong> {{ asesorInfo.usuarioEstado }}
                  </div>

                  <div class="text-body-2">
                    <strong>Estado agente:</strong>
                    <v-chip size="x-small" :color="asesorInfo?.activo ? 'success' : 'default'" variant="tonal">
                      {{ asesorInfo?.activo ? 'Activo' : 'Inactivo' }}
                    </v-chip>
                  </div>

                  <div v-if="loadingAsesor" class="text-medium-emphasis mt-2">
                    Cargando datos del asesor…
                  </div>
                </v-card-text>

                <!-- Acciones -->
                <v-card-actions class="px-4 pb-4 pt-0 d-flex flex-wrap gap-2">
                  <v-tooltip text="Ver convenios del asesor" location="top">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-eye"
                        variant="text"
                        @click="abrirConveniosModal"
                        :disabled="!respuesta?.captacionSugerida?.agente?.id"
                      />
                    </template>
                  </v-tooltip>

                  <v-tooltip text="Ver prospectos asignados al asesor" location="top">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-eye-outline"
                        variant="text"
                        @click="abrirProspectosModal"
                        :disabled="!respuesta?.captacionSugerida?.agente?.id"
                      />
                    </template>
                  </v-tooltip>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </template>

      <!-- Aviso “sin resultados” -->
      <template v-else-if="respuesta">
        <v-expand-transition>
          <v-alert
            type="info"
            variant="tonal"
            class="mx-6 mb-4"
            density="comfortable"
          >
            No se encontraron datos para mostrar con los filtros aplicados.
          </v-alert>
        </v-expand-transition>
      </template>

      <v-divider />

      <!-- CTA pie -->
      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn :disabled="!respuesta?.vehiculo && !respuesta?.cliente" color="primary" @click="irCrearTurno">
          Crear turno
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>

  <!-- MODALES -->
  <!-- MODAL: Vehículos del cliente -->
  <v-dialog v-model="dlgVehiculos" max-width="1000">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-subtitle-1">
          Vehículos del cliente
          <v-chip v-if="vehiculosClienteCount" size="x-small" class="ms-1" variant="tonal">{{ vehiculosClienteCount }}</v-chip>
        </span>
        <v-btn icon="mdi-close" variant="text" @click="dlgVehiculos = false" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <div v-if="vehiculosClienteCount === 0" class="text-medium-emphasis">
          Sin vehículos para mostrar.
        </div>

        <template v-else>
          <!-- Chips con placas -->
          <div class="mb-3">
            <div class="text-subtitle-2 mb-1">Placas</div>
            <div class="d-flex flex-wrap gap-1">
              <v-chip
                v-for="v in clienteDet!.vehiculos"
                :key="v.id"
                size="small"
                variant="tonal"
                title="Placa"
              >
                {{ v.placa }}
              </v-chip>
            </div>
          </div>

          <!-- Última visita por vehículo -->
          <div v-if="clienteDet?.ultimas_por_vehiculo?.length" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">Última visita por vehículo</div>
            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-left">Placa</th>
                  <th class="text-left">Fecha</th>
                  <th class="text-left">Servicio</th>
                  <th class="text-left">Sede</th>
                  <th class="text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in clienteDet!.ultimas_por_vehiculo" :key="u.vehiculoId">
                  <td>{{ u.placa }}</td>
                  <td>{{ formatDate(u.fecha) }}</td>
                  <td>{{ u.servicioNombre ?? '—' }}</td>
                  <td>{{ u.sedeNombre ?? '—' }}</td>
                  <td>
                    <v-chip
                      v-if="u.estado"
                      :color="u.estado === 'finalizado' ? 'success' : u.estado === 'cancelado' ? 'error' : 'warning'"
                      size="x-small" label class="text-capitalize"
                    >
                      {{ u.estado }}
                    </v-chip>
                    <span v-else>—</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- Tabla de vehículos -->
          <div>
            <div class="text-subtitle-2 font-weight-bold mb-2">Detalle de vehículos</div>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">ID</th>
                  <th class="text-left">Placa</th>
                  <th class="text-left">Marca</th>
                  <th class="text-left">Línea</th>
                  <th class="text-left">Modelo</th>
                  <th class="text-left">Clase</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in clienteDet!.vehiculos" :key="v.id">
                  <td>{{ v.id }}</td>
                  <td>{{ v.placa }}</td>
                  <td>{{ v.marca ?? '—' }}</td>
                  <td>{{ v.linea ?? '—' }}</td>
                  <td>{{ v.modelo ?? '—' }}</td>
                  <td>{{ v.clase?.nombre ?? '—' }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </template>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="dlgVehiculos = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- MODAL: Convenios asesor -->
  <v-dialog v-model="dlgConvenios" max-width="900">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-subtitle-1">
          Convenios del asesor
          <strong v-if="asesorNombre">({{ asesorNombre }})</strong>
        </span>
        <v-btn icon="mdi-close" variant="text" @click="dlgConvenios = false" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-alert v-if="errorConvenios" type="error" variant="tonal" class="mb-4">{{ errorConvenios }}</v-alert>
        <div v-if="loadingConvenios" class="text-medium-emphasis">Cargando convenios…</div>
        <template v-else>
          <div v-if="(asesorConvenios?.length || 0) === 0" class="text-medium-emphasis">Sin convenios asignados.</div>
          <v-table v-else density="comfortable">
            <thead>
              <tr>
                <th class="text-left">Convenio</th>
                <th class="text-left">Tipo</th>
                <th class="text-left">Contacto</th>
                <th class="text-left">Vigencia</th>
                <th class="text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in asesorConvenios" :key="c.id">
                <td>{{ c.nombre }}</td>
                <td>{{ c.tipo }}</td>
                <td>
                  <div>{{ c.telefono || c.whatsapp || '—' }}</div>
                  <div class="text-medium-emphasis">{{ c.email || '—' }}</div>
                </td>
                <td>
                  <span v-if="c.asignacion?.fecha_asignacion">{{ formatDate(c.asignacion.fecha_asignacion) }}</span>
                  <span v-else>—</span>
                  <span v-if="c.asignacion?.fecha_fin"> → {{ formatDate(c.asignacion.fecha_fin) }}</span>
                </td>
                <td>
                  <v-chip size="x-small" :color="c.asignacion?.activo ? 'success' : 'default'" variant="tonal">
                    {{ c.asignacion?.activo ? 'Vigente' : 'Inactivo' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="dlgConvenios = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- MODAL: Prospectos asesor -->
  <v-dialog v-model="dlgProspectos" max-width="1000">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-subtitle-1">
          Prospectos asignados al asesor
          <strong v-if="asesorNombre">({{ asesorNombre }})</strong>
        </span>
        <v-btn icon="mdi-close" variant="text" @click="dlgProspectos = false" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-alert v-if="errorProspectos" type="error" variant="tonal" class="mb-4">{{ errorProspectos }}</v-alert>
        <div v-if="loadingProspectos" class="text-medium-emphasis">Cargando prospectos…</div>
        <template v-else>
          <div v-if="(prospectosAsesor?.length || 0) === 0" class="text-medium-emphasis">Sin prospectos asignados a este asesor.</div>
          <v-table v-else density="comfortable">
            <thead>
              <tr>
                <th class="text-left">Nombre</th>
                <th class="text-left">Placa</th>
                <th class="text-left">Teléfono</th>
                <th class="text-left">Origen</th>
                <th class="text-left">Creado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in prospectosAsesor" :key="p.id">
                <td>{{ p.nombre || '—' }}</td>
                <td>{{ p.placa || '—' }}</td>
                <td>{{ p.telefono || '—' }}</td>
                <td>{{ p.origen || '—' }}</td>
                <td>{{ formatDate(p.created_at) }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="dlgProspectos = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/services/http'
import {
  buscar,
  crearDateoAutoPorConvenio,
  getConveniosByAsesor,
  getProspectosByCreador,
  type BusquedaResponse,
  type ProspectoLight,
} from '@/services/buscarService'
import {
  ClientesService,
  type ClienteDetalle,
  type ClienteHistorialItem
} from '@/services/clientes_service'

const router = useRouter()

/* =========================
   Form & estado general
   ========================= */
const form = ref<{ placa: string; telefono: string }>({ placa: '', telefono: '' })
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const respuesta = ref<BusquedaResponse | null>(null)

/* Prospecto por placa */
type ProspectoByPlaca = {
  exists: boolean
  id?: number
  placa?: string
  telefono?: string | null
  nombre?: string | null
  origen?: string | null
  creado_por?: { id: number | null; nombre: string } | null
  created_at?: string | null
  asignacion_activa?: {
    id: number
    asesor_id: number
    fecha_asignacion: string | null
    asesor?: { id?: number; nombre?: string | null } | null
  } | null
  resumenVigencias?: any
}
const prospectoPlaca = ref<ProspectoByPlaca | null>(null)

/* =========================
   Tipos/DTO para convenio
   ========================= */
type ConvenioDTO = { id: number; nombre: string; codigo: string | null }
type DateoRecienteConConvenio =
  NonNullable<BusquedaResponse['dateoReciente']> & { convenio?: ConvenioDTO | null }

/* =========================
   Asesor enriquecido
   ========================= */
type AsesorInfo = {
  id: number
  nombre: string
  telefono?: string | null
  tipo?: string | null
  activo?: boolean
  doc_tipo?: string | null
  doc_numero?: string | null
  usuario_id?: number | null
  usuarioEmail?: string | null
  usuarioCargo?: string | null
  sedeNombre?: string | null
  usuarioEstado?: string | null
  celularPersonal?: string | null
  celularCorporativo?: string | null
}
const asesorInfo = ref<AsesorInfo | null>(null)
const loadingAsesor = ref(false)
const asesorNombre = computed(() => respuesta.value?.captacionSugerida?.agente?.nombre || '')

/* Cliente enriquecido */
const clienteDet = ref<(ClienteDetalle & {
  ultimas_por_vehiculo?: Array<{
    vehiculoId:number; placa:string; fecha:string|null;
    servicioNombre:string|null; estado:string|null; sedeNombre:string|null
  }>
  visitas_recientes?: Array<ClienteHistorialItem>
}) | null>(null)
const visitasCliente = ref<ClienteHistorialItem[]>([])

/* KPIs cliente */
const statsCliente = computed(() => {
  const anyDet: any = clienteDet.value || {}
  return anyDet.metricas ?? anyDet.kpis ?? null
})
const vehiculosClienteCount = computed(() => clienteDet.value?.vehiculos?.length ?? 0)
const ultimaVisitaCliente = computed<ClienteHistorialItem | null>(() => visitasCliente.value[0] ?? null)

/* Modales */
const dlgVehiculos = ref(false)
const dlgConvenios = ref(false)
const dlgProspectos = ref(false)
const loadingConvenios = ref(false)
const loadingProspectos = ref(false)
const errorConvenios = ref<string | null>(null)
const errorProspectos = ref<string | null>(null)
const prospectosAsesor = ref<ProspectoLight[] | null>(null)

/* Lista de convenios del asesor (para fallback del convenio del dateo) */
const asesorConvenios = ref<Array<{
  id: number
  nombre: string
  tipo?: string | null
  email?: string | null
  telefono?: string | null
  whatsapp?: string | null
  asignacion?: { activo?: boolean; fecha_asignacion?: string | null; fecha_fin?: string | null } | null
  codigo?: string | null
}> | null>(null)

/* Auto-dateo */
const autoDateoLoading = ref(false)

/* =========================
   Helpers & computed
   ========================= */
function formatDate(v?: string | null): string {
  if (!v) return '—'
  const iso = String(v).length <= 10 ? `${v}T00:00:00` : String(v)
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', { day:'2-digit', month:'2-digit', year:'numeric', timeZone:'America/Bogota' }).format(d)
}
function boolLabel(v?: boolean) { return v ? 'Sí' : 'No' }

/* Resumen vehículo mostrado en tarjeta */
const resumenVehiculo = computed(() => {
  const v = respuesta.value?.vehiculo
  if (!v) return '—'
  const mlm = [v.marca, v.linea, v.modelo].filter(Boolean).join(' / ')
  return mlm || '—'
})

/* —— Tipo de búsqueda (reglas de visibilidad) —— */
const telefonoSolo = computed(() => !!form.value.telefono && !form.value.placa)
const telefonoEsCliente = computed(() =>
  telefonoSolo.value && !!respuesta.value?.cliente?.id
)
const telefonoEsAsesor = computed(() =>
  telefonoSolo.value && !respuesta.value?.cliente?.id && !!respuesta.value?.captacionSugerida?.agente?.id
)

/* —— Banderas de visibilidad —— */
const hasVehiculo = computed(() => !!respuesta.value?.vehiculo)
const hasCliente  = computed(() => !!respuesta.value?.cliente)
const hasDateo    = computed(() => !!respuesta.value?.dateoReciente)

/* Vehículo card:
   - se muestra si hay vehículo directo (por placa)
   - o si es búsqueda por teléfono de cliente y hay vehículos/visita */
const hasVehiculoCard = computed(() =>
  hasVehiculo.value ||
  (telefonoEsCliente.value && (vehiculosClienteCount.value > 0 || !!ultimaVisitaCliente.value))
)

/* Captación y reserva:
   - se oculta cuando es teléfono de asesor o de cliente
   - visible en placa o en búsquedas mixtas que traigan captación */
const hasCaptacion = computed(() =>
  !telefonoEsAsesor.value &&
  !telefonoEsCliente.value &&
  !!respuesta.value?.captacionSugerida
)

/* Prospecto: como estaba (por placa) */
const hasProspecto = computed(() => !!prospectoPlaca.value?.exists)

/* Asesor:
   - SOLO en teléfono de asesor
   - mantiene chip del tipo SIEMPRE (no se oculta) */
const hasAsesor = computed(() => telefonoEsAsesor.value)

/* ¿Hay algo que mostrar? */
const hasAnyCard = computed(() =>
  hasVehiculoCard.value ||
  hasCliente.value ||
  hasDateo.value ||
  hasCaptacion.value ||
  hasProspecto.value ||
  hasAsesor.value
)

/* —— Convenio del dateo: prioriza el del dateo; si no, 1ro activo del asesor
      (NO se muestra en teléfono de asesor) —— */
function formatConvenioChip(c?: ConvenioDTO | null): string {
  if (!c) return ''
  const code = (c.codigo || '').toUpperCase()
  return code && code !== 'SIN-COD' ? `${code} — ${c.nombre}` : `${c.nombre}`
}
const dateoConvenio = computed<ConvenioDTO | null>(() => {
  const convBack = (respuesta.value?.dateoReciente as DateoRecienteConConvenio | null)?.convenio ?? null
  if (convBack) return convBack
  const list = asesorConvenios.value || []
  const activo = list.find(c => c?.asignacion?.activo)
  if (activo) return { id: activo.id, nombre: activo.nombre, codigo: (activo as any).codigo ?? null }
  const first = list[0]
  return first ? { id: first.id, nombre: first.nombre, codigo: (first as any).codigo ?? null } : null
})

/* Navegación segura */
function safePush(toByName: { name: string; params?: any; query?: any }, fallbackPath: string) {
  const r = router.resolve(toByName)
  if (r.matched.length) return router.push(toByName)
  return router.push(fallbackPath)
}

/* =========================
   Acciones principales
   ========================= */
async function handleBuscar() {
  errorMsg.value = null
  loading.value = true
  respuesta.value = null

  // limpiar enriquecimiento
  clienteDet.value = null
  visitasCliente.value = []
  asesorInfo.value = null
  prospectoPlaca.value = null
  prospectosAsesor.value = null
  errorConvenios.value = null
  errorProspectos.value = null
  asesorConvenios.value = null

  try {
    if (!form.value.placa && !form.value.telefono) {
      throw new Error('Ingresa placa o teléfono para buscar.')
    }

    // 1) búsqueda principal
    const data = await buscar({
      placa: form.value.placa || undefined,
      telefono: form.value.telefono || undefined,
    })
    respuesta.value = data

    // 2) detalle cliente (si aplica por respuesta o por teléfono de cliente)
    const clienteId = data?.cliente?.id
    if (clienteId) await cargarDetalleCliente(clienteId)

    // 3) verificación de prospecto por placa
    if (form.value.placa) {
      try {
        const pr = await get<ProspectoByPlaca>('/api/prospectos/by-placa', {
          params: { placa: form.value.placa },
        })
        prospectoPlaca.value = pr
      } catch {
        prospectoPlaca.value = { exists: false }
      }
    }
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'Error realizando la búsqueda'
  } finally {
    loading.value = false
  }
}

async function cargarDetalleCliente(clienteId: number) {
  try {
    const [det, hist] = await Promise.all([
      ClientesService.detalle(clienteId),
      ClientesService.historial(clienteId, { page: 1, perPage: 5 }),
    ])
    clienteDet.value = det as any
    visitasCliente.value = (det as any).visitas_recientes?.length ? (det as any).visitas_recientes : hist.data
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e?.message || 'No fue posible cargar el detalle del cliente'
  }
}

function handleLimpiar() {
  form.value.placa = ''
  form.value.telefono = ''
  respuesta.value = null
  clienteDet.value = null
  visitasCliente.value = []
  asesorInfo.value = null
  prospectoPlaca.value = null
  prospectosAsesor.value = null
  errorMsg.value = null
  asesorConvenios.value = null
}

/* Ir a crear cosas */
function irCrearTurno() { safePush({ name: 'CrearTurno' }, '/rtm/crear-turno') }
function irCrearDateo() { safePush({ name: 'ComercialDateosNuevo' }, '/comercial/dateos/nuevo') }
function irCrearProspecto() { safePush({ name: 'ComercialProspectoNuevo' }, '/comercial/prospectos/nuevo') }
function crearTurnoConDateo() {
  const id = respuesta.value?.dateoReciente?.id
  safePush({ name: 'CrearTurno', query: { dateoId: id } }, '/rtm/crear-turno')
}

/* Auto-dateo (no cambia reglas de visibilidad) */
const puedeAutoDateo = computed(() =>
  (!!respuesta.value?.captacionSugerida) && (!!form.value.placa || !!form.value.telefono)
)
async function dispararAutoDateo() {
  if (!puedeAutoDateo.value) return
  autoDateoLoading.value = true
  errorMsg.value = null
  try {
    await crearDateoAutoPorConvenio({
      placa: form.value.placa || undefined,
      telefono: form.value.telefono || undefined,
    } as any)
    await handleBuscar()
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e?.message || 'No fue posible realizar el auto-dateo'
  } finally {
    autoDateoLoading.value = false
  }
}

/* =========================
   Modales asesor
   ========================= */
async function abrirConveniosModal() {
  const asesorId = respuesta.value?.captacionSugerida?.agente?.id
  if (!asesorId) return
  dlgConvenios.value = true
  loadingConvenios.value = true
  errorConvenios.value = null
  try {
    const list = await getConveniosByAsesor(asesorId, true)
    asesorConvenios.value = Array.isArray(list) ? list : []
  } catch (e: any) {
    errorConvenios.value = e?.response?.data?.message || e?.message || 'No fue posible cargar los convenios.'
    asesorConvenios.value = []
  } finally {
    loadingConvenios.value = false
  }
}
async function abrirProspectosModal() {
  const asesorId = respuesta.value?.captacionSugerida?.agente?.id
  if (!asesorId) return
  dlgProspectos.value = true
  loadingProspectos.value = true
  errorProspectos.value = null
  try {
    prospectosAsesor.value = await getProspectosByCreador(asesorId)
  } catch (e: any) {
    errorProspectos.value = e?.response?.data?.message || e?.message || 'No fue posible cargar los prospectos.'
    prospectosAsesor.value = []
  } finally {
    loadingProspectos.value = false
  }
}

/* =========================
   Watchers
   ========================= */
watch(
  () => respuesta.value?.captacionSugerida?.agente?.id,
  async (asesorId) => {
    // Solo enriquecemos asesor cuando realmente se mostrará la tarjeta de asesor:
    if (!telefonoEsAsesor.value || !asesorId) {
      asesorInfo.value = null
      asesorConvenios.value = null
      return
    }
    loadingAsesor.value = true
    try {
      // 1) Agente
      const ag = await get<any>(`/api/agentes-captacion/${asesorId}`)
      const info: AsesorInfo = {
        id: ag.id,
        nombre: ag.nombre,
        telefono: ag.telefono ?? null,
        tipo: ag.tipo ?? null,
        activo: ag.activo ?? false,
        doc_tipo: ag.doc_tipo ?? ag.docTipo ?? null,
        doc_numero: ag.doc_numero ?? ag.docNumero ?? null,
        usuario_id: ag.usuario_id ?? ag.usuarioId ?? null,
      }

      // 2) Usuario vinculado
      if (info.usuario_id) {
        const usr = await get<any>(`/api/usuarios/${info.usuario_id}`)
        info.usuarioEmail = usr?.correo ?? null
        info.usuarioCargo = usr?.cargo?.nombre ?? null
        info.sedeNombre   = usr?.sede?.nombre ?? null
        info.usuarioEstado = typeof usr?.estado === 'string' ? usr.estado : null
        info.celularPersonal = usr?.celularPersonal ?? null
        info.celularCorporativo = usr?.celularCorporativo ?? null
      }

      asesorInfo.value = info

      // Precargar convenios (aunque la tarjeta no los muestre, sí sirven de fallback para dateo)
      try {
        const list = await getConveniosByAsesor(asesorId, true)
        asesorConvenios.value = Array.isArray(list) ? list : []
      } catch {
        asesorConvenios.value = []
      }
    } finally {
      loadingAsesor.value = false
    }
  }
)
</script>

<style scoped>
.g-4 { gap: 16px; }
.gap-3 { gap: 12px; }
.text-medium-emphasis { opacity: .7; }
.rounded-lg { border-radius: 12px; }
</style>
