<template>
  <v-container class="mt-4 mt-sm-6" fluid>
    <!-- Header con stats -->
    <v-card elevation="8" class="pa-0 rounded-xl rounded-sm-2xl card-surface mb-4">
      <div class="card-header px-4 px-sm-6 py-3 py-sm-5">
        <div class="header-left">
          <div class="icon-pill d-none d-sm-inline-flex">
            <v-icon size="22">mdi-clipboard-list-outline</v-icon>
          </div>
          <div class="title-group">
            <h2 class="title text-h6 text-sm-h5">Cola de Trámites</h2>
            <p class="subtitle d-none d-sm-block">Gestión y categorización de trámites del día</p>
          </div>
        </div>

        <!-- Stats chips -->
        <div class="d-flex align-center flex-wrap" style="gap:8px">
          <v-chip :size="$vuetify.display.xs ? 'small' : 'default'" variant="tonal" color="grey-darken-1" prepend-icon="mdi-counter">
            Total: {{ paginationMeta?.total ?? tramites.length }}
          </v-chip>
          <v-chip :size="$vuetify.display.xs ? 'small' : 'default'" variant="tonal" color="warning" prepend-icon="mdi-clock-outline">
            Espera: {{ tramitesEnEspera }}
          </v-chip>
          <v-chip :size="$vuetify.display.xs ? 'small' : 'default'" variant="tonal" color="info" prepend-icon="mdi-account-clock">
            Atención: {{ tramitesEnAtencion }}
          </v-chip>
          <v-chip :size="$vuetify.display.xs ? 'small' : 'default'" variant="tonal" color="success" prepend-icon="mdi-check-circle">
            Completados: {{ tramitesCompletados }}
          </v-chip>
        </div>
      </div>

      <v-divider class="mx-4 mx-sm-6 divider-muted" />

      <!-- Filtros -->
      <div class="pa-4 pa-sm-6">
        <v-row dense>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="fechaFiltro"
              label="Fecha"
              type="date"
              variant="outlined"
              :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
              prepend-inner-icon="mdi-calendar"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filtroEstado"
              :items="estadosFilter"
              label="Filtrar por estado"
              variant="outlined"
              :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
              prepend-inner-icon="mdi-filter-variant"
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filtroTipo"
              :items="tiposFilter"
              label="Filtrar por tipo"
              variant="outlined"
              :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
              prepend-inner-icon="mdi-tag-outline"
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="busqueda"
              label="Buscar por nombre o cédula"
              variant="outlined"
              :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
              prepend-inner-icon="mdi-magnify"
              clearable
            />
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- Lista de trámites -->
    <v-card elevation="8" class="rounded-xl rounded-sm-2xl card-surface">
      <v-data-table
        :headers="headers"
        :items="tramitesFiltrados"
        :loading="cargando"
        :items-per-page="20"
        class="tramites-table"
        :mobile-breakpoint="0"
      >
        <!-- Turno -->
        <template #item.turnoNumero="{ item }">
          <div class="font-weight-bold text-primary">
            #{{ item.turnoNumero }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ item.turnoCodigo }}
          </div>
        </template>

        <!-- Cliente -->
        <template #item.nombreCliente="{ item }">
          <div class="font-weight-medium">{{ item.nombreCliente }}</div>
          <div class="text-caption text-medium-emphasis">CC: {{ item.cedula }}</div>
        </template>

        <!-- Tipo -->
        <template #item.tipoTramite="{ item }">
          <v-chip
            v-if="item.tipoTramite"
            :size="$vuetify.display.xs ? 'x-small' : 'small'"
            variant="tonal"
            color="deep-purple"
          >
            {{ formatTipoTramite(item.tipoTramite) }}
          </v-chip>
          <span v-else class="text-caption text-medium-emphasis">Sin categorizar</span>
        </template>

        <!-- Estado -->
        <template #item.estado="{ item }">
          <v-chip
            :size="$vuetify.display.xs ? 'x-small' : 'small'"
            :color="estadoConfig[item.estado].color"
            :prepend-icon="estadoConfig[item.estado].icon"
            variant="elevated"
          >
            {{ estadoConfig[item.estado].label }}
          </v-chip>
        </template>

        <!-- Hora -->
        <template #item.horaIngreso="{ item }">
          <div class="d-flex flex-column">
            <span class="text-caption">{{ item.horaIngreso }}</span>
            <span v-if="item.horaAtencion" class="text-caption text-success">
              Atención: {{ item.horaAtencion }}
            </span>
          </div>
        </template>

        <!-- Acciones -->
        <template #item.acciones="{ item }">
          <div class="d-flex align-center flex-nowrap" style="gap: 4px">
            <v-btn size="x-small" color="primary" variant="tonal" @click="abrirDetalle(item)">
              <v-icon size="small">mdi-eye</v-icon> Ver
            </v-btn>
            <v-btn size="x-small" color="deep-purple" variant="tonal" @click="abrirFormularioDirecto(item)">
              <v-icon size="small">mdi-file-document</v-icon> Formulario
            </v-btn>
            <v-btn size="x-small" color="teal" variant="tonal" @click="abrirChecklistDirecto(item)">
              <v-icon size="small">mdi-checkbox-multiple-marked-outline</v-icon> Checklist
            </v-btn>
            <v-btn size="x-small" color="orange-darken-2" variant="tonal" @click="abrirLiquidacionDirecto(item)">
              <v-icon size="small">mdi-calculator</v-icon> Liquidación
            </v-btn>
            <template v-if="item.tipoTramite">
              <v-btn
                v-if="!item.estadoPago || item.estadoPago === 'pendiente'"
                size="x-small"
                color="orange"
                variant="tonal"
                @click="abrirPagoDirecto(item)"
              >
                <v-icon size="small">mdi-cash-clock</v-icon> Registrar Pago
              </v-btn>
              <v-chip
                v-else-if="item.estadoPago === 'pagado'"
                size="x-small"
                color="green"
                variant="tonal"
                style="cursor: pointer"
                @click="abrirDetallePago(item)"
              >
                ✅ Pagado
              </v-chip>
              <v-chip
                v-else-if="item.estadoPago === 'exento'"
                size="x-small"
                color="grey"
                variant="tonal"
              >
                Exento
              </v-chip>
            </template>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Modal de detalle -->
    <v-dialog
      v-model="showDetalle"
      :max-width="$vuetify.display.xs ? '95%' : '900'"
      :fullscreen="$vuetify.display.xs"
      scrollable
    >
      <v-card v-if="tramiteSeleccionado" class="rounded-xl">
        <!-- Header del modal -->
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-deep-purple-lighten-5">
          <div class="d-flex align-center" style="gap:12px">
            <v-icon color="deep-purple" :size="$vuetify.display.xs ? 24 : 28">mdi-file-document-edit-outline</v-icon>
            <div>
              <div class="text-h6 font-weight-bold">Trámite #{{ tramiteSeleccionado.turnoNumero }}</div>
              <div class="text-caption text-medium-emphasis">{{ tramiteSeleccionado.turnoCodigo }}</div>
            </div>
          </div>
          <v-btn icon variant="text" @click="cerrarDetalle">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4 pa-sm-6">
          <v-row dense>
            <!-- Datos del solicitante -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                <v-icon size="20" class="mr-2" color="primary">mdi-account</v-icon>
                Datos del Solicitante
              </div>
              <v-card variant="tonal" class="pa-3 rounded-lg">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis">Nombre completo</div>
                    <div class="font-weight-medium">{{ tramiteSeleccionado.nombreCliente }}</div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis">Cédula</div>
                    <div class="font-weight-medium">{{ tramiteSeleccionado.cedula }}</div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis">Teléfono</div>
                    <div class="font-weight-medium">{{ tramiteSeleccionado.telefono || 'No registrado' }}</div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis">Email</div>
                    <div class="font-weight-medium">{{ tramiteSeleccionado.email || 'No registrado' }}</div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- Tipo de trámite -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                <v-icon size="20" class="mr-2" color="deep-purple">mdi-tag-outline</v-icon>
                Categorización
              </div>
              <v-select
                v-model="tramiteSeleccionado.tipoTramite"
                :items="tipoTramiteItems"
                label="Tipo de trámite"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-file-document-outline"
                @update:model-value="onTipoTramiteChange"
              />
              <v-select
                v-model="tramiteSeleccionado.tipoVehiculo"
                :items="[
                  { title: 'Vehículo (carro, camioneta, camión, bus...)', value: 'automovil' },
                  { title: 'Motocicleta', value: 'motocicleta' },
                ]"
                label="Tipo de vehículo"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-car-outline"
                clearable
                class="mt-2"
                @update:model-value="onTipoVehiculoChange"
              />
            </v-col>

            <!-- Estado -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                <v-icon size="20" class="mr-2" color="info">mdi-state-machine</v-icon>
                Gestión de Estado
              </div>
              <div class="d-flex flex-wrap" style="gap:8px">
                <v-btn
                  v-if="tramiteSeleccionado.estado === 'en_espera'"
                  color="info"
                  variant="elevated"
                  @click="cambiarEstado('en_atencion')"
                  :loading="guardando"
                >
                  <v-icon left>mdi-account-clock</v-icon>
                  Pasar a Atención
                </v-btn>
                <v-btn
                  v-if="tramiteSeleccionado.estado === 'en_atencion'"
                  color="success"
                  variant="elevated"
                  @click="cambiarEstado('completado')"
                  :loading="guardando"
                >
                  <v-icon left>mdi-check-circle</v-icon>
                  Completar
                </v-btn>
                <v-btn
                  v-if="tramiteSeleccionado.estado !== 'cancelado'"
                  color="error"
                  variant="outlined"
                  @click="showCancelConfirm = true"
                  :loading="guardando"
                >
                  <v-icon left>mdi-close-circle</v-icon>
                  Cancelar
                </v-btn>
              </div>
              <v-chip
                class="mt-3"
                :color="estadoConfig[tramiteSeleccionado.estado].color"
                :prepend-icon="estadoConfig[tramiteSeleccionado.estado].icon"
                variant="elevated"
              >
                Estado actual: {{ estadoConfig[tramiteSeleccionado.estado].label }}
              </v-chip>
            </v-col>

            <!-- Observaciones -->
            <v-col cols="12">
              <v-textarea
                v-model="tramiteSeleccionado.observaciones"
                label="Observaciones"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                rows="3"
                auto-grow
                prepend-inner-icon="mdi-comment-text-outline"
                @blur="guardarCambios"
              />
            </v-col>

            <!-- Resultado -->
            <v-col cols="12">
              <v-textarea
                v-model="tramiteSeleccionado.resultado"
                label="Resultado del trámite"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                rows="2"
                auto-grow
                prepend-inner-icon="mdi-file-check-outline"
                @blur="guardarCambios"
              />
            </v-col>

            <!-- Otros Datos del Traspaso -->
            <v-col cols="12" v-if="tramiteSeleccionado.tipoTramite === 'TRASPASO'">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <v-icon size="20" class="mr-2" color="green">mdi-cash</v-icon>
                Otros Datos del Traspaso
              </div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="tramiteSeleccionado.valorVehiculo"
                    label="Valor del vehículo"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-currency-usd"
                    type="number"
                    @blur="guardarCambios"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="tramiteSeleccionado.formaPago"
                    :items="['Efectivo', 'Transferencia', 'Cheque', 'Mixto']"
                    label="Forma de pago"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-credit-card-outline"
                    clearable
                    @update:model-value="guardarCambios"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="tramiteSeleccionado.fechaEntrega"
                    label="Fecha de entrega"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-calendar-check"
                    type="date"
                    @blur="guardarCambios"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="tramiteSeleccionado.destrate"
                    label="Destrate"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-bank-outline"
                    type="number"
                    hint="Valor de deuda a cancelar"
                    persistent-hint
                    @blur="guardarCambios"
                  />
                </v-col>
              </v-row>
            </v-col>

            <!-- Liquidación y Pago -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <v-icon size="20" class="mr-2" color="amber-darken-2">mdi-cash-register</v-icon>
                Liquidación y Pago
              </div>
              <v-row dense align="center">
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="tramiteSeleccionado.valorLiquidado"
                    label="Valor liquidado"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-currency-usd"
                    type="number"
                    step="1"
                    :loading="cargandoTarifa"
                    @blur="onValorLiquidadoBlur"
                  />
                </v-col>
                <v-col cols="12" sm="4" class="d-flex align-center" style="gap: 8px">
                  <v-chip
                    :color="ESTADO_PAGO_CONFIG[tramiteSeleccionado.estadoPago ?? 'pendiente'].color"
                    variant="elevated"
                    prepend-icon="mdi-circle-small"
                  >
                    {{ ESTADO_PAGO_CONFIG[tramiteSeleccionado.estadoPago ?? 'pendiente'].label }}
                  </v-chip>
                </v-col>
                <v-col cols="12" sm="4" class="d-flex flex-wrap" style="gap: 8px">
                  <template v-if="tramiteSeleccionado.estadoPago !== 'pagado' && tramiteSeleccionado.estadoPago !== 'exento'">
                    <v-btn
                      color="success"
                      variant="elevated"
                      size="small"
                      prepend-icon="mdi-cash-check"
                      @click="showPagoDialog = true"
                    >
                      Registrar Pago
                    </v-btn>
                    <v-btn
                      color="grey-darken-1"
                      variant="outlined"
                      size="small"
                      prepend-icon="mdi-tag-off-outline"
                      :loading="guardando"
                      @click="marcarExento"
                    >
                      Marcar Exento
                    </v-btn>
                  </template>
                </v-col>
                <v-col cols="12" v-if="tramiteSeleccionado.estadoPago === 'pagado'">
                  <v-card variant="tonal" class="pa-3 rounded-lg bg-green-lighten-5">
                    <v-row dense>
                      <v-col cols="12" sm="4">
                        <div class="text-caption text-medium-emphasis">Forma de pago</div>
                        <div class="font-weight-medium">{{ tramiteSeleccionado.formaPagoCobro ?? '—' }}</div>
                      </v-col>
                      <v-col cols="12" sm="4">
                        <div class="text-caption text-medium-emphasis">Referencia</div>
                        <div class="font-weight-medium">{{ tramiteSeleccionado.referenciaPago ?? '—' }}</div>
                      </v-col>
                      <v-col cols="12" sm="4">
                        <div class="text-caption text-medium-emphasis">Fecha de pago</div>
                        <div class="font-weight-medium">{{ tramiteSeleccionado.fechaPago ?? '—' }}</div>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>

            <!-- Tiempos -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-3 rounded-lg">
                <div class="text-caption font-weight-bold mb-2">⏱️ Registro de tiempos</div>
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <div class="text-caption text-medium-emphasis">Hora Ingreso</div>
                    <div class="font-weight-medium">{{ formatHora(tramiteSeleccionado.horaIngreso) }}</div>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div class="text-caption text-medium-emphasis">Hora Atención</div>
                    <div class="font-weight-medium">{{ formatHora(tramiteSeleccionado.horaAtencion) }}</div>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div class="text-caption text-medium-emphasis">Hora Fin</div>
                    <div class="font-weight-medium">{{ formatHora(tramiteSeleccionado.horaFin) }}</div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 d-flex flex-wrap" style="gap: 8px">
          <v-spacer />
          <v-btn
            color="teal"
            variant="tonal"
            prepend-icon="mdi-checkbox-multiple-marked-outline"
            @click="showChecklist = true"
          >
            Checklist
          </v-btn>
          <v-btn
            color="orange-darken-2"
            variant="tonal"
            prepend-icon="mdi-calculator"
            @click="showLiquidacion = true"
          >
            Liquidación
          </v-btn>
          <v-btn
            color="deep-purple"
            variant="tonal"
            prepend-icon="mdi-clipboard-list-outline"
            @click="showFormularioRunt = true"
          >
            Formulario RUNT
          </v-btn>
          <v-btn color="grey-darken-1" variant="outlined" @click="cerrarDetalle">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Registrar Pago -->
    <v-dialog v-model="showPagoDialog" max-width="480">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-green-lighten-5">
          <div class="d-flex align-center" style="gap:8px">
            <v-icon color="green-darken-2" size="24">mdi-cash-check</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Registrar Pago</span>
          </div>
          <v-btn icon variant="text" @click="showPagoDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12">
              <v-select
                v-model="pagoForm.formaPagoCobro"
                :items="['Efectivo', 'Transferencia', 'Datáfono']"
                label="Forma de pago *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-credit-card-outline"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="pagoForm.referenciaPago"
                label="Referencia de pago"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-pound"
                hint="Opcional"
                persistent-hint
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="pagoForm.fechaPago"
                label="Fecha de pago"
                variant="outlined"
                density="comfortable"
                type="date"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>
            <v-col cols="12">
              <v-file-input
                v-model="pagoForm.evidencia"
                label="Evidencia de pago"
                variant="outlined"
                density="comfortable"
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                accept="image/*,.pdf"
                hint="Opcional"
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end" style="gap: 8px">
          <v-btn color="grey-darken-1" variant="outlined" @click="showPagoDialog = false">Cancelar</v-btn>
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-check"
            :loading="subiendoPago"
            :disabled="!pagoForm.formaPagoCobro"
            @click="confirmarPago"
          >
            Confirmar Pago
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Detalle de Pago -->
    <v-dialog v-model="showDetallePagoDialog" max-width="480">
      <v-card v-if="tramiteSeleccionado" class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-green-lighten-5">
          <div class="d-flex align-center" style="gap: 8px">
            <v-icon color="green-darken-2" size="24">mdi-cash-check</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Detalle del Pago</span>
          </div>
          <v-btn icon variant="text" @click="showDetallePagoDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Forma de pago</div>
              <div class="font-weight-medium">{{ tramiteSeleccionado.formaPagoCobro ?? '—' }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Fecha de pago</div>
              <div class="font-weight-medium">
                {{ tramiteSeleccionado.fechaPago ? new Date(tramiteSeleccionado.fechaPago).toLocaleDateString('es-CO') : '—' }}
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Valor liquidado</div>
              <div class="font-weight-medium">
                {{ tramiteSeleccionado.valorLiquidado != null ? `$ ${tramiteSeleccionado.valorLiquidado.toLocaleString('es-CO')}` : '—' }}
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Referencia</div>
              <div class="font-weight-medium">{{ tramiteSeleccionado.referenciaPago ?? '—' }}</div>
            </v-col>
            <v-col cols="12" class="mt-2">
              <div class="text-caption text-medium-emphasis mb-1">Evidencia</div>
              <v-img
                v-if="evidenciaUrl"
                :src="evidenciaUrl"
                max-height="300"
                class="rounded-lg mt-3"
                style="cursor: zoom-in"
                cover
                @click="showImagenCompleta = true"
              />
              <div v-else class="text-caption text-medium-emphasis mt-2">Sin evidencia adjunta</div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end">
          <v-btn color="grey-darken-1" variant="outlined" @click="showDetallePagoDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog imagen completa de evidencia -->
    <v-dialog v-model="showImagenCompleta" max-width="90vw" :scrim="false" content-class="elevation-0 pa-0" @click:outside="showImagenCompleta = false">
      <v-img
        :src="evidenciaUrl ?? undefined"
        max-height="90vh"
        contain
        class="rounded-lg"
        style="cursor: pointer"
        @click="showImagenCompleta = false"
      />
    </v-dialog>

    <!-- Formulario RUNT -->
    <FormularioRuntDialog
      v-if="tramiteSeleccionado"
      v-model="showFormularioRunt"
      :tramite-id="tramiteSeleccionado.id"
      :tramite-numero="tramiteSeleccionado.turnoNumero"
      :tipo-tramite="tramiteSeleccionado.tipoTramite"
    />

    <!-- Checklist de Documentos -->
    <ChecklistTurnoDialog
      v-if="tramiteSeleccionado"
      v-model="showChecklist"
      :sede-id="tramiteSeleccionado.sede?.id ?? 0"
      :fecha="tramiteSeleccionado.fecha"
      :turno-numero="tramiteSeleccionado.turnoNumero"
    />

    <!-- Liquidación de Trámite -->
    <LiquidacionTramiteDialog
      v-if="tramiteSeleccionado"
      v-model="showLiquidacion"
      :tramite-id="tramiteSeleccionado.id"
      :placa="null"
      :turno-numero="tramiteSeleccionado.turnoNumero"
    />

    <!-- Confirmación cancelar trámite -->
    <ConfirmarDialogo
      v-model="showCancelConfirm"
      title="Cancelar trámite"
      message="¿Estás seguro de que deseas cancelar este trámite? Esta acción es irreversible y no puede deshacerse."
      confirm-text="Sí, cancelar"
      confirm-color="error"
      @confirm="cambiarEstado('cancelado')"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.card-surface {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 1px solid rgba(16,24,40,0.06);
}

.card-header {
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  background:
    radial-gradient(1200px 200px at 20% -50%, rgba(103,58,183,.08), transparent 60%),
    radial-gradient(900px 180px at 80% -60%, rgba(156,39,176,.10), transparent 60%),
    linear-gradient(180deg, #ffffff, #f7f9fc);
  border-top-left-radius:12px; border-top-right-radius:12px;
}

@media (min-width: 600px) {
  .card-header { gap:16px; border-top-left-radius:16px; border-top-right-radius:16px; }
}

.header-left { display:flex; align-items:center; gap:12px; }
.icon-pill {
  display:inline-flex; align-items:center; justify-content:center;
  height:40px; width:40px; border-radius:10px;
  border:1px solid rgba(16,24,40,0.08); background:#fff;
  box-shadow:0 1px 2px rgba(16,24,40,0.06);
}
.title-group .title { margin:0; font-weight:700; letter-spacing:.2px; line-height:1.2; color:#0f172a; }
.title-group .subtitle { margin:2px 0 0 0; font-size:.925rem; color:#475569; }

.divider-muted { border-color: rgba(16,24,40,0.08) !important; }

.tramites-table :deep(.v-data-table__th) {
  background: #f8f9fb !important;
  font-weight: 600 !important;
}

.tramites-table :deep(.v-data-table__tr:hover) {
  background: rgba(103,58,183,0.04) !important;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { TramitesService, TIPOS_TRAMITE_ITEMS, ESTADO_CONFIG } from '@/services/tramitesService'
import type { Tramite, EstadoTramite, FormaPagoCobro, PaginatedMeta } from '@/services/tramitesService'
import { authSetStore } from '@/stores/AuthStore'
import ConfirmarDialogo from '@/components/UI/ConfirmarDialogo.vue'
import FormularioRuntDialog from '@/components/tramites/FormularioRuntDialog.vue'
import ChecklistTurnoDialog from '@/components/tramites/ChecklistTurnoDialog.vue'
import LiquidacionTramiteDialog from '@/components/tramites/LiquidacionTramiteDialog.vue'

const authStore = authSetStore()
const cargando = ref(false)
const guardando = ref(false)
const tramites = ref<Tramite[]>([])
const paginationMeta = ref<PaginatedMeta | null>(null)
const tramiteSeleccionado = ref<Tramite | null>(null)
const showDetalle = ref(false)
const tramiteOriginalSnapshot = ref<{ tipoTramite: Tramite['tipoTramite']; observaciones: Tramite['observaciones']; resultado: Tramite['resultado'] } | null>(null)
const showCancelConfirm = ref(false)
const showFormularioRunt = ref(false)
const showChecklist    = ref(false)
const showLiquidacion  = ref(false)

// Pago
const showPagoDialog = ref(false)
const showDetallePagoDialog = ref(false)
const showImagenCompleta = ref(false)
const cargandoTarifa = ref(false)
const subiendoPago = ref(false)
const pagoForm = ref<{
  formaPagoCobro: FormaPagoCobro | null
  referenciaPago: string
  fechaPago: string
  evidencia: File[]
}>({
  formaPagoCobro: null,
  referenciaPago: '',
  fechaPago: new Date().toISOString().split('T')[0],
  evidencia: [],
})

const ESTADO_PAGO_CONFIG: Record<string, { color: string; label: string }> = {
  pendiente: { color: 'orange', label: 'Pendiente' },
  pagado:    { color: 'green',  label: 'Pagado' },
  exento:    { color: 'grey',   label: 'Exento' },
}

const evidenciaUrl = computed(() => {
  const url = tramiteSeleccionado.value?.evidenciaPagoUrl
  if (!url) return null
  if (url.startsWith('http')) return url
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333').replace(/\/$/, '')
  return `${base}${url}`
})

// Filtros
const fechaFiltro = ref(new Date().toISOString().split('T')[0])
const filtroEstado = ref<EstadoTramite | null>(null)
const filtroTipo = ref<string | null>(null)
const busqueda = ref('')

const tipoTramiteItems = TIPOS_TRAMITE_ITEMS
const estadoConfig = ESTADO_CONFIG

const estadosFilter = [
  { title: 'En espera', value: 'en_espera' },
  { title: 'En atención', value: 'en_atencion' },
  { title: 'Completado', value: 'completado' },
  { title: 'Cancelado', value: 'cancelado' },
]

const tiposFilter = computed(() => 
  TIPOS_TRAMITE_ITEMS.map(t => ({ title: t.title, value: t.value }))
)

const headers = [
  { title: 'Turno', key: 'turnoNumero', sortable: true },
  { title: 'Cliente', key: 'nombreCliente', sortable: true },
  { title: 'Tipo', key: 'tipoTramite', sortable: false },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Hora', key: 'horaIngreso', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'center' as const },
]

// Stats
const tramitesEnEspera = computed(() => 
  tramites.value.filter(t => t.estado === 'en_espera').length
)
const tramitesEnAtencion = computed(() => 
  tramites.value.filter(t => t.estado === 'en_atencion').length
)
const tramitesCompletados = computed(() =>
  tramites.value.filter(t => t.estado === 'completado').length
)

const isDirty = computed(() => {
  if (!tramiteSeleccionado.value || !tramiteOriginalSnapshot.value) return false
  const t = tramiteSeleccionado.value
  const s = tramiteOriginalSnapshot.value
  return t.tipoTramite !== s.tipoTramite ||
    t.observaciones !== s.observaciones ||
    t.resultado !== s.resultado
})

// Filtrado
const tramitesFiltrados = computed(() => {
  let resultado = [...tramites.value]

  if (filtroEstado.value) {
    resultado = resultado.filter(t => t.estado === filtroEstado.value)
  }

  if (filtroTipo.value) {
    resultado = resultado.filter(t => t.tipoTramite === filtroTipo.value)
  }

  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    resultado = resultado.filter(t => 
      t.nombreCliente.toLowerCase().includes(term) ||
      t.cedula.includes(term)
    )
  }

  return resultado
})

// Snackbar
const snackbar = ref({ show: false, message: '', color: '', timeout: 4000 })
function showSnackbar(message: string, color = 'info', timeout = 4000) {
  snackbar.value = { show: true, message, color, timeout }
}

// Funciones
function formatHora(hora: string | null): string {
  if (!hora) return '—'
  const [hStr, mStr = '00'] = hora.split(':')
  const h = parseInt(hStr, 10)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${mStr} ${suffix}`
}

function formatTipoTramite(tipo: string) {
  const item = TIPOS_TRAMITE_ITEMS.find(t => t.value === tipo)
  return item ? item.title : tipo
}

async function cargarTramites() {
  cargando.value = true
  try {
    const response = await TramitesService.getAll({ fecha: fechaFiltro.value })
    tramites.value = response.data
    paginationMeta.value = response.meta
  } catch (err) {
    console.error('Error al cargar trámites:', err)
    showSnackbar('Error al cargar trámites', 'error')
  } finally {
    cargando.value = false
  }
}

watch(fechaFiltro, () => cargarTramites())

function abrirDetalle(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  if (tramiteSeleccionado.value.valorLiquidado !== null)
    tramiteSeleccionado.value.valorLiquidado = Math.round(tramiteSeleccionado.value.valorLiquidado)
  tramiteOriginalSnapshot.value = {
    tipoTramite: tramite.tipoTramite,
    observaciones: tramite.observaciones,
    resultado: tramite.resultado,
  }
  showDetalle.value = true
  cargarTarifa()
}

function abrirChecklistDirecto(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  showChecklist.value = true
}

function abrirLiquidacionDirecto(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  showLiquidacion.value = true
}

async function abrirFormularioDirecto(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  tramiteOriginalSnapshot.value = {
    tipoTramite: tramite.tipoTramite,
    observaciones: tramite.observaciones,
    resultado: tramite.resultado,
  }
  await nextTick()
  showFormularioRunt.value = true
}

async function abrirPagoDirecto(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  await nextTick()
  if (!tramiteSeleccionado.value.valorLiquidado && tramite.tipoTramite) {
    try {
      const resp = await TramitesService.getTarifa(
        tramite.tipoTramite,
        tramite.tipoVehiculo ?? undefined,
      )
      tramiteSeleccionado.value.valorLiquidado = Math.round(resp.valor ?? 0)
    } catch {}
  }
  showPagoDialog.value = true
}

function abrirDetallePago(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  showDetallePagoDialog.value = true
}

watch(showFormularioRunt, (val) => {
  if (!val && !showDetalle.value) {
    tramiteSeleccionado.value = null
    tramiteOriginalSnapshot.value = null
  }
})

function cerrarDetalle() {
  showDetalle.value = false
  showFormularioRunt.value = false
  tramiteSeleccionado.value = null
  tramiteOriginalSnapshot.value = null
}

function getAuthUserId(): number {
  const u: unknown = authStore.user
  if (typeof u === 'object' && u !== null) {
    const id = (u as Record<string, unknown>).id
    if (typeof id === 'number') return id
  }
  throw new Error('Usuario no autenticado')
}

async function guardarCambios(): Promise<boolean> {
  if (!tramiteSeleccionado.value) return true

  guardando.value = true
  try {
    const userUnknown: unknown = authStore.user
    const userId = ((): number | null => {
      if (typeof userUnknown === 'object' && userUnknown !== null) {
        const maybe = userUnknown as Record<string, unknown>
        return typeof maybe.id === 'number' ? maybe.id : null
      }
      return null
    })()
    if (!userId) throw new Error('Usuario no autenticado')

    await TramitesService.update(tramiteSeleccionado.value.id, {
      usuarioId: userId,
      tipoTramite: tramiteSeleccionado.value.tipoTramite,
      tipoVehiculo: tramiteSeleccionado.value.tipoVehiculo ?? undefined,
      observaciones: tramiteSeleccionado.value.observaciones || undefined,
      resultado: tramiteSeleccionado.value.resultado || undefined,
      valorVehiculo: tramiteSeleccionado.value.valorVehiculo ?? undefined,
      formaPago: tramiteSeleccionado.value.formaPago ?? undefined,
      fechaEntrega: tramiteSeleccionado.value.fechaEntrega ?? undefined,
      destrate: tramiteSeleccionado.value.destrate ?? undefined,
      valorLiquidado: tramiteSeleccionado.value.valorLiquidado ?? undefined,
    })

    tramiteOriginalSnapshot.value = {
      tipoTramite: tramiteSeleccionado.value.tipoTramite,
      observaciones: tramiteSeleccionado.value.observaciones,
      resultado: tramiteSeleccionado.value.resultado,
    }

    const idx = tramites.value.findIndex(t => t.id === tramiteSeleccionado.value!.id)
    if (idx !== -1) tramites.value[idx] = { ...tramiteSeleccionado.value }

    showSnackbar('Cambios guardados', 'success')
    return true
  } catch (err) {
    console.error('Error al guardar:', err)
    showSnackbar('Error al guardar cambios', 'error')
    return false
  } finally {
    guardando.value = false
  }
}

function onValorLiquidadoBlur() {
  if (tramiteSeleccionado.value?.valorLiquidado != null)
    tramiteSeleccionado.value.valorLiquidado = Math.round(tramiteSeleccionado.value.valorLiquidado)
  guardarCambios()
}

async function recalcularTarifa() {
  if (!tramiteSeleccionado.value?.tipoTramite) return
  cargandoTarifa.value = true
  try {
    const resp = await TramitesService.getTarifa(
      tramiteSeleccionado.value.tipoTramite,
      tramiteSeleccionado.value.tipoVehiculo ?? undefined,
    )
    if (tramiteSeleccionado.value) tramiteSeleccionado.value.valorLiquidado = Math.round(resp.valor ?? 0)
  } catch { /* tarifa no configurada, no es error crítico */ } finally {
    cargandoTarifa.value = false
  }
}

async function cargarTarifa() {
  if (tramiteSeleccionado.value?.valorLiquidado !== null) return
  await recalcularTarifa()
}

async function onTipoTramiteChange() {
  await guardarCambios()
  if (tramiteSeleccionado.value) tramiteSeleccionado.value.valorLiquidado = null
  await recalcularTarifa()
}

async function onTipoVehiculoChange() {
  await guardarCambios()
  await recalcularTarifa()
}

async function confirmarPago() {
  if (!tramiteSeleccionado.value || !pagoForm.value.formaPagoCobro) return
  subiendoPago.value = true
  try {
    const fd = new FormData()
    fd.append('formaPagoCobro', pagoForm.value.formaPagoCobro)
    fd.append('fechaPago', pagoForm.value.fechaPago)
    if (pagoForm.value.referenciaPago) fd.append('referenciaPago', pagoForm.value.referenciaPago)
    fd.append('valorLiquidado', String(tramiteSeleccionado.value?.valorLiquidado ?? ''))
    const archivo = pagoForm.value.evidencia
    if (archivo instanceof File) {
      fd.append('evidencia', archivo)
    } else if (Array.isArray(archivo) && archivo.length > 0) {
      fd.append('evidencia', archivo[0])
    }
    const updated = await TramitesService.registrarPago(tramiteSeleccionado.value.id, fd)
    tramiteSeleccionado.value = { ...tramiteSeleccionado.value, ...updated }
    const idx = tramites.value.findIndex(t => t.id === tramiteSeleccionado.value!.id)
    if (idx !== -1) tramites.value[idx] = { ...tramiteSeleccionado.value }
    showPagoDialog.value = false
    pagoForm.value = { formaPagoCobro: null, referenciaPago: '', fechaPago: new Date().toISOString().split('T')[0], evidencia: [] }
    showSnackbar('Pago registrado correctamente', 'success')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al registrar el pago'
    showSnackbar(msg, 'error')
  } finally {
    subiendoPago.value = false
  }
}

async function marcarExento() {
  if (!tramiteSeleccionado.value) return
  guardando.value = true
  try {
    const userId = getAuthUserId()
    const updated = await TramitesService.update(tramiteSeleccionado.value.id, {
      usuarioId: userId,
      estadoPago: 'exento',
    })
    tramiteSeleccionado.value = { ...tramiteSeleccionado.value, ...updated }
    const idx = tramites.value.findIndex(t => t.id === tramiteSeleccionado.value!.id)
    if (idx !== -1) tramites.value[idx] = { ...tramiteSeleccionado.value }
    showSnackbar('Trámite marcado como exento', 'success')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al marcar como exento'
    showSnackbar(msg, 'error')
  } finally {
    guardando.value = false
  }
}

async function cambiarEstado(nuevoEstado: EstadoTramite) {
  if (!tramiteSeleccionado.value) return

  if (isDirty.value) {
    const saved = await guardarCambios()
    if (!saved) return
  }

  guardando.value = true
  try {
    const userUnknown: unknown = authStore.user
    const userId = ((): number | null => {
      if (typeof userUnknown === 'object' && userUnknown !== null) {
        const maybe = userUnknown as Record<string, unknown>
        return typeof maybe.id === 'number' ? maybe.id : null
      }
      return null
    })()
    if (!userId) throw new Error('Usuario no autenticado')

    const actualizado = await TramitesService.update(tramiteSeleccionado.value.id, {
      usuarioId: userId,
      estado: nuevoEstado,
    })

    tramiteSeleccionado.value = actualizado
    const idx = tramites.value.findIndex(t => t.id === actualizado.id)
    if (idx !== -1) tramites.value[idx] = actualizado

    showSnackbar(`Estado actualizado a: ${estadoConfig[nuevoEstado].label}`, 'success')
  } catch (err) {
    console.error('Error al cambiar estado:', err)
    showSnackbar('Error al cambiar estado', 'error')
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  await cargarTramites()
})
</script>