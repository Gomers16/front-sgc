<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">

      <!-- ── CABECERA ─────────────────────────────────────────── -->
      <v-card-title class="py-5 px-6 d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="text-h5 font-weight-bold d-flex align-center gap-2">
          💸 Comisiones
        </div>
        <div class="d-flex gap-2">
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-filter-variant"
            @click="showFilters = !showFilters"
          >
            Filtros
            <v-badge v-if="activeFiltersCount > 0" :content="activeFiltersCount" color="primary" inline />
          </v-btn>
          <v-btn variant="text" size="small" :disabled="loading || metaLoading" @click="resetFilters">
            Limpiar
          </v-btn>
          <v-btn color="primary" :loading="loading || metaLoading" @click="reload" prepend-icon="mdi-refresh">
            Actualizar
          </v-btn>
        </div>
      </v-card-title>

      <!-- ── PANEL DE FILTROS (colapsable) ─────────────────────── -->
      <v-expand-transition>
        <div v-show="showFilters">
          <v-divider />
          <v-card-text class="pt-4 pb-2 px-6">
            <v-row dense>
              <!-- Desde -->
              <v-col cols="12" sm="6" md="2" lg="2">
                <v-text-field
                  v-model="filters.desde"
                  label="Desde"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <!-- Hasta -->
              <v-col cols="12" sm="6" md="2" lg="2">
                <v-text-field
                  v-model="filters.hasta"
                  label="Hasta"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <!-- Estado -->
              <v-col cols="12" sm="6" md="3" lg="2">
                <v-select
                  v-model="filters.estado"
                  :items="estadoItems"
                  item-title="label"
                  item-value="value"
                  label="Estado"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                />
              </v-col>

              <!-- Tipo Vehículo -->
              <v-col cols="12" sm="6" md="3" lg="2">
                <v-select
                  v-model="filters.tipoVehiculo"
                  :items="tipoVehiculoItems"
                  item-title="label"
                  item-value="value"
                  label="Tipo vehículo"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                />
              </v-col>

              <!-- Descuento -->
              <v-col cols="12" sm="6" md="3" lg="2">
                <v-autocomplete
                  v-model="filters.descuentoCodigo"
                  :items="descuentosItems"
                  item-title="label"
                  item-value="codigo"
                  label="Descuento"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                  :loading="descuentosLoading"
                  prepend-inner-icon="mdi-tag"
                  placeholder="Todos los descuentos"
                />
              </v-col>

              <!-- Asesor Comercial -->
              <v-col cols="12" sm="6" md="4" lg="3">
                <v-autocomplete
                  v-model="filters.asesorId"
                  :items="asesoresComerciales"
                  item-title="nombre"
                  item-value="id"
                  label="Asesor comercial"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                  :loading="asesoresLoading"
                  prepend-inner-icon="mdi-account-tie"
                />
              </v-col>

              <!-- Convenio -->
              <v-col cols="12" sm="6" md="4" lg="3">
                <v-autocomplete
                  v-model="filters.convenioId"
                  :items="conveniosItems"
                  item-title="nombre"
                  item-value="id"
                  label="Convenio"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                  :loading="conveniosLoading"
                  prepend-inner-icon="mdi-handshake"
                />
              </v-col>
            </v-row>

            <div class="d-flex justify-end mt-3 gap-2">
              <v-btn size="small" variant="text" @click="resetFilters">Limpiar filtros</v-btn>
              <v-btn color="primary" size="small" :loading="loading" @click="applyFilters">
                Aplicar
              </v-btn>
            </div>
          </v-card-text>
        </div>
      </v-expand-transition>

      <!-- ── PESTAÑAS ──────────────────────────────────────────── -->
      <v-tabs v-model="activeTab" density="comfortable" class="px-4 mt-1">
        <v-tab value="detalle">Detalle comisiones</v-tab>
        <v-tab value="metas">Metas mensuales</v-tab>
      </v-tabs>

      <v-divider />

      <!-- ====== TAB DETALLE ====================================== -->
      <template v-if="activeTab === 'detalle'">

        <!-- Resumen de página -->
        <v-card-text class="pt-4 pb-2 px-6">
          <div class="d-flex flex-wrap gap-3 align-center">
            <v-chip variant="tonal" size="large">
              Total página: <strong class="ms-1">{{ formatCOP(totalPagina) }}</strong>
            </v-chip>
            <v-chip v-if="pendientesPagina > 0" variant="tonal" size="large" color="warning">
              Pendientes: <strong class="ms-1">{{ pendientesPagina }}</strong>
            </v-chip>
            <v-chip v-if="pagadasPagina > 0" variant="tonal" size="large" color="success">
              Pagadas: <strong class="ms-1">{{ pagadasPagina }}</strong>
            </v-chip>
            <v-chip v-if="filters.descuentoCodigo" variant="outlined" size="small" color="orange">
              <v-icon start size="12">mdi-tag</v-icon>
              Descuento: {{ filters.descuentoCodigo }}
            </v-chip>
          </div>
        </v-card-text>

        <!-- ── BARRA DE ACCIONES BULK ── -->
        <v-expand-transition>
          <div v-if="selectedIds.length > 0" class="px-6 pb-3">
            <v-card variant="tonal" color="primary" class="rounded-lg px-4 py-3">
              <div class="d-flex align-center flex-wrap gap-3">
                <v-icon color="primary">mdi-checkbox-multiple-marked</v-icon>
                <span class="font-weight-medium">
                  {{ selectedIds.length }} comisión{{ selectedIds.length !== 1 ? 'es' : '' }} seleccionada{{ selectedIds.length !== 1 ? 's' : '' }}
                  &nbsp;|&nbsp; Total:
                  <strong>{{ formatCOP(totalSeleccionado) }}</strong>
                </span>

                <v-spacer />

                <v-btn
                  v-if="canAprobarSelected"
                  size="small"
                  color="info"
                  variant="elevated"
                  prepend-icon="mdi-check-decagram"
                  :loading="bulkLoading"
                  @click="confirmBulkAprobar"
                >
                  Aprobar seleccionadas
                </v-btn>

                <v-btn
                  v-if="canPagarSelected"
                  size="small"
                  color="success"
                  variant="elevated"
                  prepend-icon="mdi-cash-multiple"
                  :loading="bulkLoading"
                  @click="confirmBulkPagar"
                >
                  Pagar seleccionadas
                </v-btn>

                <!-- 🆕 Generar comprobante (guarda en backend) -->
                <v-btn
                  size="small"
                  color="orange"
                  variant="elevated"
                  prepend-icon="mdi-file-document-plus"
                  @click="abrirConfirmacionComprobante"
                >
                  Generar comprobante
                </v-btn>

                <v-btn
                  size="small"
                  variant="text"
                  @click="selectedIds = []"
                  icon="mdi-close"
                />
              </div>
            </v-card>
          </div>
        </v-expand-transition>

        <!-- ── TABLA ──────────────────────────────────────────── -->
        <v-data-table-server
          class="px-4 pb-4"
          :headers="headers"
          :items="filteredRows"
          :items-length="totalItems"
          v-model:page="page"
          v-model:items-per-page="itemsPerPage"
          :loading="loading"
          :sort-by="sortBy"
          @update:options="loadItems"
          item-value="id"
          v-model="selectedIds"
          show-select
          return-object
        >
          <template #item.estado="{ item }">
            <v-chip :color="estadoColor(item.estado)" size="small" variant="flat">
              {{ item.estado }}
            </v-chip>
          </template>

          <template #item.tipo_vehiculo="{ item }">
            <v-chip
              v-if="item.tipo_vehiculo"
              size="x-small"
              :color="item.tipo_vehiculo === 'MOTO' ? 'deep-purple' : 'teal'"
              variant="tonal"
              :prepend-icon="item.tipo_vehiculo === 'MOTO' ? 'mdi-motorbike' : 'mdi-car'"
            >
              {{ item.tipo_vehiculo === 'MOTO' ? 'Moto' : 'Vehículo' }}
            </v-chip>
            <span v-else class="text-medium-emphasis text-caption">—</span>
          </template>

          <template #item.tipo_cliente="{ item }">
            <v-chip size="x-small" :color="tipoClienteColor(item.turno)" variant="tonal">
              {{ tipoClienteLabel(item.turno) }}
            </v-chip>
          </template>

          <template #item.turno="{ item }">
            <div class="d-flex flex-column">
              <span>
                Turno #{{ item.turno?.numero_global || item.turno?.numero || item.turno?.id || '—' }}
              </span>
              <span class="text-caption text-medium-emphasis">
                {{ item.turno?.placa || '—' }} ·
                {{ item.turno?.servicio?.nombre || item.turno?.servicio?.codigo || '—' }}
              </span>
            </div>
          </template>

          <template #item.descuento="{ item }">
            <template v-if="item.descuento">
              <v-chip size="x-small" color="orange-darken-2" variant="tonal" prepend-icon="mdi-tag-check">
                {{ item.descuento.nombre }}
              </v-chip>
              <div class="text-caption text-medium-emphasis mt-1">
                <v-icon size="12" class="mr-1">
                  {{ item.descuento_origen === 'dateo' ? 'mdi-calendar-check' : 'mdi-cash-register' }}
                </v-icon>
                {{ item.descuento_origen === 'dateo' ? 'Pre-marcado' : 'En caja' }}
              </div>
            </template>
            <span v-else class="text-medium-emphasis text-caption">—</span>
          </template>

          <template #item.valor_unitario="{ item }">
            {{ formatCOP(Number(item.monto_asesor ?? item.valor_unitario ?? 0)) }}
          </template>

          <template #item.valor_cliente="{ item }">
            {{ formatCOP(Number(item.monto_convenio ?? item.valor_cliente ?? 0)) }}
          </template>

          <template #item.valor_total="{ item }">
            <strong>{{ formatCOP(calcTotalItem(item)) }}</strong>
          </template>

          <template #item.asesor="{ item }">{{ item.asesor?.nombre || '—' }}</template>
          <template #item.convenio="{ item }">{{ item.convenio?.nombre || '—' }}</template>
          <template #item.generado_at="{ item }">{{ formatDate(item.generado_at) }}</template>

          <template #item.acciones="{ item }">
            <div class="d-flex gap-1">
              <v-btn size="small" variant="text" icon="mdi-eye" @click="verDetalle(item)" />
              <v-btn
                v-if="item.estado === 'PENDIENTE'"
                size="small" variant="text" color="warning"
                icon="mdi-check-decagram"
                @click="confirmAprobar(item.id)"
              />
              <v-btn
                v-if="item.estado === 'APROBADA'"
                size="small" variant="text" color="success"
                icon="mdi-cash-multiple"
                @click="confirmPagar(item.id)"
              />
              <v-btn
                v-if="item.estado === 'PENDIENTE' || item.estado === 'APROBADA'"
                size="small" variant="text" color="error"
                icon="mdi-cancel"
                @click="confirmAnular(item.id)"
              />
            </div>
          </template>
        </v-data-table-server>
      </template>

      <!-- ====== TAB METAS ======================================== -->
      <template v-else>
        <v-card-text class="pt-5">
          <div class="mb-4 text-subtitle-1 font-weight-medium">
            Metas mensuales de RTM por asesor
          </div>
          <v-row dense class="mb-2">
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="valorRtmMoto"
                label="Valor RTM Motos" prefix="$"
                variant="outlined" density="comfortable" type="number" hide-details
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="valorRtmVehiculo"
                label="Valor RTM Vehículos" prefix="$"
                variant="outlined" density="comfortable" type="number" hide-details
              />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <div class="text-caption text-medium-emphasis">
                Valores usados para estimar la facturación RTM y la comisión de meta mensual.
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-data-table
          class="px-4 pb-4"
          :headers="metaHeaders"
          :items="metaRows"
          :loading="metaLoading"
          item-key="asesor_id"
        >
          <template #item.asesor="{ item }">{{ item.asesor_nombre }}</template>
          <template #item.rtm_motos="{ item }">{{ item.rtm_motos || 0 }}</template>
          <template #item.rtm_vehiculos="{ item }">{{ item.rtm_vehiculos || 0 }}</template>
          <template #item.total_rtm="{ item }">{{ calcTotalRtm(item) }}</template>
          <template #item.meta_rtm="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ formatCOP(getMetaDinero(item)) }}</span>
            <span v-else>—</span>
          </template>
          <template #item.avance="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ calcAvance(item).toFixed(1) }}%</span>
            <span v-else>—</span>
          </template>
          <template #item.faltante="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ formatCOP(calcFaltante(item)) }}</span>
            <span v-else>—</span>
          </template>
          <template #item.porcentaje_comision_meta="{ item }">
            {{ item.porcentaje_comision_meta ?? 0 }}%
          </template>
          <template #item.comision_estimada="{ item }">
            {{ formatCOP(calcComisionMeta(item)) }}
          </template>
        </v-data-table>
      </template>
    </v-card>

    <!-- ══════════════════════════════════════════════════════════
         DIÁLOGO: Confirmación simple
    ══════════════════════════════════════════════════════════ -->
    <v-dialog v-model="dialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">{{ dialog.title }}</v-card-title>
        <v-card-text>{{ dialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.visible = false">Cancelar</v-btn>
          <v-btn :color="dialog.color" @click="dialog.onConfirm">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════════════════════════════
         DIÁLOGO: Detalle comisión
    ══════════════════════════════════════════════════════════ -->
    <v-dialog v-model="detailDialog.visible" max-width="760" scrollable>
      <v-card v-if="detailDialog.item">
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          <span>Detalle comisión #{{ detailDialog.item.id }}</span>
          <v-chip :color="estadoColor(detailDialog.item.estado)" size="small" variant="flat">
            {{ detailDialog.item.estado }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-card-text class="pt-4">
          <v-skeleton-loader v-if="detailDialog.loading" type="card, card" />

          <template v-else>
            <!-- Tipo cliente / recurrencia -->
            <v-card
              v-if="detailDialog.item.turno"
              class="mb-4"
              variant="tonal"
              :color="tipoClienteColor(detailDialog.item.turno)"
            >
              <v-card-title class="d-flex align-center gap-2 text-subtitle-1">
                <v-icon>{{ tipoClienteIcono(detailDialog.item.turno) }}</v-icon>
                {{ tipoClienteLabel(detailDialog.item.turno) }}
              </v-card-title>
              <v-card-text>
                <template v-if="detailDialog.item.turno.es_recurrente && !detailDialog.item.turno.es_recuperacion">
                  <v-row dense>
                    <v-col cols="12" md="4">
                      <strong>Última visita:</strong><br />
                      {{ formatDate(detailDialog.item.turno.fecha_ultima_visita) }}
                    </v-col>
                    <v-col cols="12" md="4">
                      <strong>Meses transcurridos:</strong><br />
                      {{ detailDialog.item.turno.meses_desde_ultima_visita || '—' }} meses
                    </v-col>
                    <v-col cols="12" md="4">
                      <strong>Turno anterior:</strong><br />
                      #{{ detailDialog.item.turno.ultimo_turno_id || '—' }}
                    </v-col>
                  </v-row>
                </template>
                <template v-else-if="detailDialog.item.turno.es_recuperacion">
                  <v-row dense>
                    <v-col cols="12" md="4">
                      <strong>Última visita:</strong><br />
                      {{ formatDate(detailDialog.item.turno.fecha_ultima_visita) }}
                    </v-col>
                    <v-col cols="12" md="4">
                      <strong>Meses transcurridos:</strong><br />
                      {{ detailDialog.item.turno.meses_desde_ultima_visita || '—' }} meses
                    </v-col>
                    <v-col cols="12" md="4">
                      <strong>Turno anterior:</strong><br />
                      #{{ detailDialog.item.turno.ultimo_turno_id || '—' }}
                    </v-col>
                  </v-row>
                </template>
                <template v-else>
                  <div class="text-caption">
                    ✨ <strong>Cliente nuevo:</strong> Primera visita. Comisión estándar de dateo.
                  </div>
                </template>
              </v-card-text>
            </v-card>

            <!-- Descuento informativo -->
            <v-card
              v-if="detailDialog.item.descuento"
              class="mb-4"
              variant="tonal"
              color="orange-darken-2"
            >
              <v-card-title class="d-flex align-center gap-2 text-subtitle-1">
                <v-icon>mdi-tag-check</v-icon>
                Descuento informativo aplicado
                <v-chip
                  size="x-small" class="ms-2"
                  :color="detailDialog.item.descuento_origen === 'dateo' ? 'blue' : 'purple'"
                  variant="flat"
                >
                  {{ detailDialog.item.descuento_origen === 'dateo' ? 'Pre-marcado' : 'En caja' }}
                </v-chip>
              </v-card-title>
              <v-card-text>
                <v-row dense>
                  <v-col cols="12" md="4">
                    <strong>Descuento:</strong>
                    {{ detailDialog.item.descuento.nombre }}
                    <span class="text-caption">({{ detailDialog.item.descuento.codigo }})</span>
                  </v-col>
                  <v-col cols="12" md="4" v-if="detailDialog.item.descuento_aplicado_at">
                    <strong>Aplicado el:</strong><br />
                    {{ formatDate(detailDialog.item.descuento_aplicado_at) }}
                  </v-col>
                  <v-col cols="12" md="4" v-if="detailDialog.item.descuento_aplicado_por">
                    <strong>Confirmado por:</strong><br />
                    {{ detailDialog.item.descuento_aplicado_por.nombre }}
                  </v-col>
                </v-row>
                <v-divider class="my-2" />
                <div class="text-caption text-medium-emphasis">
                  <template v-if="detailDialog.item.es_avance">
                    <strong>🏷️ AVANCE:</strong>
                    Incentivo base: <strong>{{ formatCOP(Number(detailDialog.item.base ?? 0)) }}</strong>
                    − Avance cobrado: <strong style="color:#e53935">{{ formatCOP(Number(detailDialog.item.descuento_monto_aplicado ?? 0)) }}</strong>
                    = Incentivo final: <strong>{{ formatCOP(Number(detailDialog.item.monto_convenio ?? 0)) }}</strong>
                  </template>
                  <template v-else>
                    <strong>🏷️ Efecto:</strong> Valor recurrente aplicado en lugar del valor nuevo directo.
                  </template>
                </div>
              </v-card-text>
            </v-card>

            <!-- Info general -->
            <v-row dense>
              <v-col cols="12" md="6">
                <strong>Generado:</strong>
                <div>{{ formatDate(detailDialog.item.generado_at) }}</div>
              </v-col>
              <v-col cols="12" md="6">
                <strong>Asesor:</strong>
                <div>{{ detailDialog.item.asesor?.nombre || '—' }}</div>
                <div class="text-caption text-medium-emphasis">
                  Dateo: <strong>{{ formatCOP(Number(detailDialog.item.monto_asesor ?? detailDialog.item.valor_unitario ?? 0)) }}</strong>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <strong>Convenio:</strong>
                <div>{{ detailDialog.item.convenio?.nombre || '—' }}</div>
                <div v-if="Number(detailDialog.item.monto_convenio ?? detailDialog.item.valor_cliente ?? 0) > 0" class="text-caption text-medium-emphasis">
                  Incentivo: <strong>{{ formatCOP(Number(detailDialog.item.monto_convenio ?? detailDialog.item.valor_cliente ?? 0)) }}</strong>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <strong>Turno:</strong>
                <div>#{{ detailDialog.item.turno?.numero_global || detailDialog.item.turno?.id || '—' }}</div>
                <div class="text-caption text-medium-emphasis">
                  Placa: {{ detailDialog.item.turno?.placa || '—' }}
                  · {{ detailDialog.item.turno?.servicio?.nombre || '—' }}
                </div>
              </v-col>

              <v-col cols="12" class="mt-2"><v-divider /></v-col>

              <v-col cols="12" md="4">
                <strong>Tipo vehículo:</strong>
                <div>{{ detailDialog.item.tipo_vehiculo === 'MOTO' ? '🏍️ Moto' : detailDialog.item.tipo_vehiculo === 'VEHICULO' ? '🚗 Vehículo' : '—' }}</div>
              </v-col>
              <v-col cols="12" md="4">
                <strong>Valor dateo (asesor):</strong>
                <div>{{ formatCOP(Number(detailDialog.item.monto_asesor ?? detailDialog.item.valor_unitario ?? 0)) }}</div>
              </v-col>
              <v-col cols="12" md="4">
                <strong>Incentivo (convenio):</strong>
                <div>{{ formatCOP(Number(detailDialog.item.monto_convenio ?? detailDialog.item.valor_cliente ?? 0)) }}</div>
              </v-col>

              <v-col cols="12" class="mt-2"><v-divider /></v-col>
              <v-col cols="12" class="text-right">
                <strong>Total comisión:</strong>
                <div class="text-h6">{{ formatCOP(calcTotalDetalle(detailDialog.item)) }}</div>
              </v-col>
            </v-row>
          </template>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════════════════════════════
         DIÁLOGO: Vista previa del comprobante
    ══════════════════════════════════════════════════════════ -->
    <v-dialog v-model="printDialog.visible" max-width="880" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between py-4 px-6">
          <div class="d-flex align-center gap-2">
            <v-icon color="primary">mdi-printer</v-icon>
            <span class="text-h6">Vista previa del comprobante</span>
          </div>
          <div class="d-flex gap-2">
            <v-btn color="primary" prepend-icon="mdi-printer" @click="doPrint">
              Imprimir / Guardar PDF
            </v-btn>
            <v-btn variant="text" icon="mdi-close" @click="printDialog.visible = false" />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6 bg-grey-lighten-4" style="max-height:65vh; overflow-y:auto;">
          <v-card class="mb-4 rounded-lg pa-5" elevation="1">
            <div class="text-center mb-3">
              <div class="text-h6 font-weight-bold text-primary">COMPROBANTE DE PAGO DE COMISIONES</div>
              <div class="text-caption text-medium-emphasis">
                Generado el {{ printDialog.fechaGeneracion }}
                <template v-if="filters.desde || filters.hasta"> · Período: {{ filters.desde || '...' }} → {{ filters.hasta || '...' }}</template>
                <template v-if="printDialog.estadoPagado"> · Estado pagado: {{ printDialog.estadoPagado }}</template>
              </div>
            </div>

            <v-row dense class="mt-3">
              <v-col cols="6" sm="3" class="text-center">
                <div class="text-caption text-medium-emphasis">Total comisiones</div>
                <div class="font-weight-bold">{{ printDialog.items.length }}</div>
              </v-col>
              <v-col cols="6" sm="3" class="text-center">
                <div class="text-caption text-medium-emphasis">🏍️ Motos</div>
                <div class="font-weight-bold">{{ printDialog.totalMotos }}</div>
              </v-col>
              <v-col cols="6" sm="3" class="text-center">
                <div class="text-caption text-medium-emphasis">🚗 Vehículos</div>
                <div class="font-weight-bold">{{ printDialog.totalVehiculos }}</div>
              </v-col>
              <v-col cols="6" sm="3" class="text-center">
                <div class="text-caption text-medium-emphasis">Total general</div>
                <div class="text-h6 font-weight-bold text-success">{{ formatCOP(printDialog.totalGeneral) }}</div>
              </v-col>
            </v-row>
          </v-card>

          <v-card
            v-for="group in printDialog.groups"
            :key="group.key"
            class="mb-4 rounded-lg"
            elevation="1"
          >
            <div class="bg-primary pa-3 rounded-t-lg d-flex align-center justify-space-between">
              <div class="text-white font-weight-bold d-flex align-center gap-2">
                <v-icon color="white" size="18">mdi-handshake</v-icon>
                {{ group.nombre }}
              </div>
              <div class="text-white text-caption">
                {{ group.items.length }} comisión{{ group.items.length !== 1 ? 'es' : '' }}
              </div>
            </div>

            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-left">Turno</th>
                  <th class="text-left">Placa</th>
                  <th class="text-left">Tipo</th>
                  <th class="text-left">Servicio</th>
                  <th class="text-right">Dateo (asesor)</th>
                  <th class="text-right">Incentivo (convenio)</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in group.items" :key="item.id">
                  <td class="text-caption">#{{ item.turno?.numero_global || item.turno?.id || '—' }}</td>
                  <td class="text-caption font-weight-medium">{{ item.turno?.placa || '—' }}</td>
                  <td>
                    <v-chip size="x-small" :color="item.tipo_vehiculo === 'MOTO' ? 'deep-purple' : 'teal'" variant="tonal">
                      {{ item.tipo_vehiculo === 'MOTO' ? '🏍️ Moto' : '🚗 Vehículo' }}
                    </v-chip>
                  </td>
                  <td class="text-caption">{{ item.turno?.servicio?.nombre || item.turno?.servicio?.codigo || '—' }}</td>
                  <td class="text-right text-caption">{{ formatCOP(Number(item.monto_asesor ?? item.valor_unitario ?? 0)) }}</td>
                  <td class="text-right text-caption">{{ formatCOP(Number(item.monto_convenio ?? item.valor_cliente ?? 0)) }}</td>
                  <td class="text-right text-caption font-weight-medium">{{ formatCOP(calcTotalItem(item)) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-grey-lighten-3">
                  <td colspan="2" class="text-caption font-weight-bold">
                    🏍️ {{ group.motosCount }} moto{{ group.motosCount !== 1 ? 's' : '' }}
                    · 🚗 {{ group.vehiculosCount }} vehículo{{ group.vehiculosCount !== 1 ? 's' : '' }}
                  </td>
                  <td colspan="2" class="text-caption text-medium-emphasis">Subtotales del grupo</td>
                  <td class="text-right text-caption font-weight-bold">{{ formatCOP(group.totalDateo) }}</td>
                  <td class="text-right text-caption font-weight-bold">{{ formatCOP(group.totalIncentivo) }}</td>
                  <td class="text-right font-weight-bold text-primary">{{ formatCOP(group.totalDateo + group.totalIncentivo) }}</td>
                </tr>
              </tfoot>
            </v-table>
          </v-card>

          <v-card class="rounded-lg pa-4" color="success" variant="tonal" elevation="1">
            <div class="d-flex justify-space-between align-center">
              <div class="font-weight-bold text-success text-h6">TOTAL GENERAL A PAGAR</div>
              <div class="text-h5 font-weight-bold text-success">{{ formatCOP(printDialog.totalGeneral) }}</div>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              Dateo asesores: {{ formatCOP(printDialog.totalDateoGlobal) }}
              · Incentivos convenios: {{ formatCOP(printDialog.totalIncentivoGlobal) }}
            </div>
          </v-card>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════════════════════════════
         DIÁLOGO: Confirmar generación de comprobante
    ══════════════════════════════════════════════════════════ -->
    <v-dialog v-model="confirmComprobante.visible" max-width="560">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center gap-2 py-4 px-6">
          <v-icon color="orange">mdi-file-document-plus</v-icon>
          Generar comprobante de pago
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <p class="mb-3 text-body-2">
            Se generarán <strong>{{ confirmComprobante.groups.length }} comprobante{{ confirmComprobante.groups.length !== 1 ? 's' : '' }}</strong>
            (uno por beneficiario):
          </p>

          <v-list density="compact" class="mb-3 rounded-lg border">
            <v-list-item
              v-for="(g, i) in confirmComprobante.groups"
              :key="i"
              :title="g.nombre"
              :subtitle="`🏍️ ${g.motosCount} motos · 🚗 ${g.vehiculosCount} vehículos · ${formatCOP(g.totalDateo + g.totalIncentivo)}`"
            >
              <template #prepend>
                <v-avatar size="28" color="primary" class="text-caption font-weight-bold">
                  {{ i + 1 }}
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-chip variant="tonal" size="large" color="success" class="w-100 justify-center">
                Total: <strong class="ms-1">{{ formatCOP(confirmComprobante.totalGeneral) }}</strong>
              </v-chip>
            </v-col>
            <v-col cols="12" sm="6">
              <v-chip variant="tonal" size="large" color="info" class="w-100 justify-center">
                {{ confirmComprobante.totalComisiones }} comisiones
              </v-chip>
            </v-col>
          </v-row>

          <v-textarea
            v-model="confirmComprobante.notas"
            label="Notas opcionales"
            rows="2"
            class="mt-4"
            variant="outlined"
            density="comfortable"
            hide-details
            placeholder="Ej: Pago semana del 10 al 16 de marzo"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-btn variant="text" @click="confirmComprobante.visible = false" :disabled="confirmComprobante.loading">
            Cancelar
          </v-btn>
          <v-spacer />
          <v-btn
            color="orange"
            variant="elevated"
            prepend-icon="mdi-content-save"
            :loading="confirmComprobante.loading"
            @click="ejecutarGenerarComprobante"
          >
            Confirmar y guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  listComisiones,
  getComision,
  aprobarComision,
  pagarComision,
  anularComision,
  listAgentesCaptacion,
  listConvenios,
  listDescuentos,
  formatCOP,
  listMetasMensuales,
  type ComisionListItem,
  type ComisionDetail,
  type ComisionEstado,
  type MetaMensualRow,
  type TurnoLight,
  type ConvenioItem,
} from '@/services/comisionesService'
import { createComprobantes, type ComprobantePago as ComprobantePagoDto } from '@/services/comprobantesService'

/* ── Extended types ── */
interface ComisionListItemExtended extends ComisionListItem {
  monto_asesor?: number | null
  monto_convenio?: number | null
  es_avance?: boolean | null
  base?: number | null
  descuento_monto_aplicado?: number | null
  tipo_vehiculo?: 'MOTO' | 'VEHICULO' | null
}

interface ComisionDetailExtended extends ComisionDetail {
  es_avance?: boolean | null
  base?: number | null
  descuento_monto_aplicado?: number | null
  tipo_vehiculo?: 'MOTO' | 'VEHICULO' | null
}

interface MetaMensualResumen extends MetaMensualRow {
  meta_global_rtm?: number | null
  porcentaje_comision?: number | null
}

interface PrintGroup {
  key: string
  nombre: string
  medioPago: string | null
  telefono: string | null
  esConvenio: boolean
  items: ComisionListItemExtended[]
  motosCount: number
  vehiculosCount: number
  totalIncentivo: number
  totalDateo: number
}

interface ConfirmComprobanteGroup {
  key: string
  nombre: string
  motosCount: number
  vehiculosCount: number
  totalDateo: number
  totalIncentivo: number
  esConvenio: boolean
  beneficiarioId: number | null
  medioPago: string | null
  telefono: string | null
  comisionIds: number[]
  placas: string[]
}

/* ── Estado general ── */
const activeTab = ref<'detalle' | 'metas'>('detalle')
const showFilters = ref(true)

const filters = ref<{
  desde: string
  hasta: string
  asesorId: number | null
  convenioId: number | null
  estado: ComisionEstado | ''
  tipoVehiculo: 'MOTO' | 'VEHICULO' | ''
  descuentoCodigo: string
}>({
  desde: '',
  hasta: '',
  asesorId: null,
  convenioId: null,
  estado: '',
  tipoVehiculo: '',
  descuentoCodigo: '',
})

const activeFiltersCount = computed(() =>
  [filters.value.desde, filters.value.hasta, filters.value.asesorId, filters.value.convenioId,
   filters.value.estado, filters.value.tipoVehiculo, filters.value.descuentoCodigo]
   .filter(Boolean).length
)

/* ── Tabla detalle ── */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Vehículo', key: 'tipo_vehiculo', sortable: false },
  { title: 'Tipo cliente', key: 'tipo_cliente', sortable: false },
  { title: 'Turno', key: 'turno', sortable: false },
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Convenio', key: 'convenio', sortable: false },
  { title: 'Descuento', key: 'descuento', sortable: false },
  { title: 'Dateo (asesor)', key: 'valor_unitario', sortable: true },
  { title: 'Incentivo (convenio)', key: 'valor_cliente', sortable: false },
  { title: 'Total', key: 'valor_total', sortable: true },
  { title: 'Fecha', key: 'generado_at', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const rows = ref<ComisionListItemExtended[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([{ key: 'id', order: 'desc' }])
const loading = ref(false)

const selectedIds = ref<ComisionListItemExtended[]>([])
const selectedItemsData = computed<ComisionListItemExtended[]>(() => selectedIds.value)

const filteredRows = computed<ComisionListItemExtended[]>(() => {
  if (!filters.value.descuentoCodigo) return rows.value
  const codigo = filters.value.descuentoCodigo.toUpperCase()
  return rows.value.filter((item) => item.descuento?.codigo?.toUpperCase() === codigo)
})

const totalSeleccionado = computed(() =>
  selectedItemsData.value.reduce((acc, i) => acc + calcTotalItem(i), 0)
)

const canAprobarSelected = computed(() =>
  selectedItemsData.value.length > 0 && selectedItemsData.value.every((i) => i.estado === 'PENDIENTE')
)
const canPagarSelected = computed(() =>
  selectedItemsData.value.length > 0 && selectedItemsData.value.every((i) => i.estado === 'APROBADA')
)

/* ── Tabla metas ── */
const metaHeaders = [
  { title: 'Asesor', key: 'asesor' },
  { title: 'RTM Motos', key: 'rtm_motos' },
  { title: 'RTM Vehículos', key: 'rtm_vehiculos' },
  { title: 'Total RTM', key: 'total_rtm' },
  { title: 'Meta facturación RTM', key: 'meta_rtm' },
  { title: '% Avance', key: 'avance' },
  { title: 'Faltante ($)', key: 'faltante' },
  { title: '% Comisión Meta', key: 'porcentaje_comision_meta' },
  { title: 'Comisión estimada', key: 'comision_estimada' },
]

const metaRows = ref<MetaMensualRow[]>([])
const metaLoading = ref(false)
const valorRtmMoto = ref(126100)
const valorRtmVehiculo = ref(208738)

/* ── Catálogos ── */
const asesoresLoading = ref(false)
const conveniosLoading = ref(false)
const allAsesores = ref<{ id: number; nombre: string; tipo: string; medioPago?: string | null; telefono?: string | null }[]>([])
const conveniosItems = ref<ConvenioItem[]>([])

const asesoresComerciales = computed(() =>
  allAsesores.value.filter((a) => a.tipo?.toUpperCase() !== 'CONVENIO')
)

const descuentosLoading = ref(false)
const descuentosItems = ref<{ codigo: string; label: string }[]>([])

const estadoItems = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Aprobada', value: 'APROBADA' },
  { label: 'Pagada', value: 'PAGADA' },
  { label: 'Anulada', value: 'ANULADA' },
]

const tipoVehiculoItems = [
  { label: '🏍️ Moto', value: 'MOTO' },
  { label: '🚗 Vehículo', value: 'VEHICULO' },
]

const totalPagina = computed(() => filteredRows.value.reduce((acc, r) => acc + calcTotalItem(r), 0))
const pendientesPagina = computed(() => filteredRows.value.filter((r) => r.estado === 'PENDIENTE').length)
const pagadasPagina = computed(() => filteredRows.value.filter((r) => r.estado === 'PAGADA').length)

/* ── Print dialog ── */
interface PrintDialogState {
  visible: boolean
  items: ComisionListItemExtended[]
  groups: PrintGroup[]
  fechaGeneracion: string
  estadoPagado: string
  comprobantes: ComprobantePagoDto[]
  totalMotos: number
  totalVehiculos: number
  totalGeneral: number
  totalDateoGlobal: number
  totalIncentivoGlobal: number
}

const printDialog = ref<PrintDialogState>({
  visible: false,
  items: [],
  groups: [],
  fechaGeneracion: '',
  estadoPagado: '',
  comprobantes: [],
  totalMotos: 0,
  totalVehiculos: 0,
  totalGeneral: 0,
  totalDateoGlobal: 0,
  totalIncentivoGlobal: 0,
})

/* ── Confirm comprobante ── */
const confirmComprobante = ref<{
  visible: boolean
  loading: boolean
  groups: ConfirmComprobanteGroup[]
  totalGeneral: number
  totalComisiones: number
  notas: string
}>({
  visible: false,
  loading: false,
  groups: [],
  totalGeneral: 0,
  totalComisiones: 0,
  notas: '',
})

/* ── Helpers ── */
function tipoClienteLabel(turno?: TurnoLight | null): string {
  if (!turno) return '—'
  if (turno.es_recuperacion) return '💛 Recuperación'
  if (turno.es_recurrente) return '🔄 Recurrente'
  return '🆕 Nuevo'
}

function tipoClienteColor(turno?: TurnoLight | null): string {
  if (!turno) return 'grey'
  if (turno.es_recuperacion) return 'amber-darken-2'
  if (turno.es_recurrente) return 'warning'
  return 'success'
}

function tipoClienteIcono(turno?: TurnoLight | null): string {
  if (!turno) return 'mdi-help-circle'
  if (turno.es_recuperacion) return 'mdi-account-reactivate'
  if (turno.es_recurrente) return 'mdi-account-clock'
  return 'mdi-account-star'
}

function calcTotalItem(item: ComisionListItemExtended): number {
  if (item.monto_asesor != null && item.monto_convenio != null) {
    return Number(item.monto_asesor) + Number(item.monto_convenio)
  }
  return item.valor_total || 0
}

function calcTotalDetalle(item: ComisionDetailExtended | null): number {
  if (!item) return 0
  if (item.monto_asesor != null && item.monto_convenio != null) {
    return Number(item.monto_asesor) + Number(item.monto_convenio)
  }
  return item.valor_total || 0
}

function estadoColor(e: ComisionEstado) {
  switch (e) {
    case 'PENDIENTE': return 'warning'
    case 'APROBADA': return 'info'
    case 'PAGADA': return 'success'
    case 'ANULADA': return 'error'
    default: return undefined
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(d)
}

/* ── Carga de datos ── */
async function loadCatalogos() {
  asesoresLoading.value = true
  conveniosLoading.value = true
  descuentosLoading.value = true
  try {
    const [asesores, convenios, descuentos] = await Promise.all([
      listAgentesCaptacion(),
      listConvenios(),
      listDescuentos(),
    ])
    allAsesores.value = asesores
    conveniosItems.value = convenios
    descuentosItems.value = descuentos.map((d) => ({ codigo: d.codigo, label: d.nombre }))
  } finally {
    asesoresLoading.value = false
    conveniosLoading.value = false
    descuentosLoading.value = false
  }
}

async function loadItems() {
  loading.value = true
  try {
    const sort = Array.isArray(sortBy.value) && sortBy.value[0]
      ? sortBy.value[0]
      : { key: 'id', order: 'desc' as const }

    const res = await listComisiones({
      page: page.value,
      perPage: itemsPerPage.value,
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
      asesorId: filters.value.asesorId || undefined,
      convenioId: filters.value.convenioId || undefined,
      estado: filters.value.estado || undefined,
      tipoVehiculo: (filters.value.tipoVehiculo as 'MOTO' | 'VEHICULO') || undefined,
      sortBy: sort.key,
      order: sort.order,
    })
    rows.value = res.data as ComisionListItemExtended[]
    totalItems.value = res.total
  } catch {
    rows.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  selectedIds.value = []
  loadItems()
}

async function loadMetas() {
  metaLoading.value = true
  try {
    let mes: string
    if (filters.value.desde) {
      mes = filters.value.desde.substring(0, 7)
    } else {
      const now = new Date()
      mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    const res = await listMetasMensuales({ mes, asesorId: filters.value.asesorId || undefined })
    let data = res.data as MetaMensualRow[]
    data = data.filter((r) => !(r.asesor_tipo?.toUpperCase()?.includes('CONVENIO')))
    metaRows.value = data

    const rowMoto = metaRows.value.find((r) => r.valor_rtm_moto && r.valor_rtm_moto > 0)
    if (rowMoto?.valor_rtm_moto) valorRtmMoto.value = rowMoto.valor_rtm_moto
    const rowVehiculo = metaRows.value.find((r) => r.valor_rtm_vehiculo && r.valor_rtm_vehiculo > 0)
    if (rowVehiculo?.valor_rtm_vehiculo) valorRtmVehiculo.value = rowVehiculo.valor_rtm_vehiculo
  } catch {
    metaRows.value = []
  } finally {
    metaLoading.value = false
  }
}

function reload() {
  if (activeTab.value === 'detalle') { page.value = 1; loadItems() }
  else loadMetas()
}

function resetFilters() {
  filters.value = { desde: '', hasta: '', asesorId: null, convenioId: null, estado: '', tipoVehiculo: '', descuentoCodigo: '' }
  selectedIds.value = []
  reload()
}

/* ── Metas helpers ── */
function calcTotalRtm(item: MetaMensualRow): number {
  return (item.rtm_motos || 0) + (item.rtm_vehiculos || 0)
}

function getMetaDinero(item: MetaMensualRow): number {
  const ext = item as MetaMensualResumen
  const raw = ext.meta_global_rtm ?? item.meta_rtm ?? item.meta_mensual ?? 0
  return Number(raw) || 0
}

function getTotalFacturacion(item: MetaMensualRow): number {
  const backend = item.total_facturacion_global ?? null
  if (backend != null && !Number.isNaN(backend)) return backend
  return (item.rtm_motos || 0) * valorRtmMoto.value + (item.rtm_vehiculos || 0) * valorRtmVehiculo.value
}

function calcAvance(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  if (!metaDinero) return 0
  return (getTotalFacturacion(item) / metaDinero) * 100
}

function calcFaltante(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  if (!metaDinero) return 0
  const diff = metaDinero - getTotalFacturacion(item)
  return diff > 0 ? diff : 0
}

function calcComisionMeta(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  const porcentaje = item.porcentaje_comision_meta ?? (item as MetaMensualResumen).porcentaje_comision ?? 0
  if (!metaDinero || !porcentaje) return 0
  const totalFacturacion = getTotalFacturacion(item)
  if (totalFacturacion < metaDinero) return 0
  return (totalFacturacion * porcentaje) / 100
}

/* ── Diálogos simples ── */
const dialog = ref<{
  visible: boolean; title: string; message: string; color: string; onConfirm: () => void
}>({ visible: false, title: '', message: '', color: 'primary', onConfirm: () => {} })

function openConfirm(title: string, message: string, color: string, onConfirm: () => void) {
  dialog.value = { visible: true, title, message, color, onConfirm }
}

function confirmAprobar(id: number) {
  openConfirm('Aprobar comisión', '¿Confirmas aprobar esta comisión?', 'info', async () => {
    dialog.value.visible = false
    await aprobarComision(id)
    loadItems()
  })
}

function confirmPagar(id: number) {
  openConfirm('Pagar comisión', '¿Confirmas registrar el pago?', 'success', async () => {
    dialog.value.visible = false
    await pagarComision(id)
    loadItems()
  })
}

function confirmAnular(id: number) {
  openConfirm('Anular comisión', '¿Seguro que deseas anularla?', 'error', async () => {
    dialog.value.visible = false
    await anularComision(id)
    loadItems()
  })
}

/* ── Detalle ── */
const detailDialog = ref<{ visible: boolean; item: ComisionDetailExtended | null; loading: boolean }>({
  visible: false,
  item: null,
  loading: false,
})

async function verDetalle(item: ComisionListItem) {
  detailDialog.value = { visible: true, item: item as ComisionDetailExtended, loading: true }
  try {
    const full = await getComision(item.id)
    detailDialog.value.item = full as ComisionDetailExtended
  } finally {
    detailDialog.value.loading = false
  }
}

/* ── Acciones Bulk ── */
const bulkLoading = ref(false)

function confirmBulkAprobar() {
  const count = selectedItemsData.value.length
  openConfirm(
    'Aprobar comisiones',
    `¿Confirmas aprobar las ${count} comisiones seleccionadas?`,
    'info',
    async () => {
      dialog.value.visible = false
      bulkLoading.value = true
      try {
        await Promise.all(selectedItemsData.value.map((i) => aprobarComision(i.id)))
        selectedIds.value = []
        await loadItems()
      } finally {
        bulkLoading.value = false
      }
    }
  )
}

function confirmBulkPagar() {
  const count = selectedItemsData.value.length
  const total = formatCOP(totalSeleccionado.value)
  openConfirm(
    'Pagar comisiones',
    `¿Confirmas registrar el pago de ${count} comisiones por un total de ${total}?`,
    'success',
    async () => {
      dialog.value.visible = false
      bulkLoading.value = true
      try {
        await Promise.all(selectedItemsData.value.map((i) => pagarComision(i.id)))
        selectedIds.value = []
        await loadItems()
      } finally {
        bulkLoading.value = false
      }
    }
  )
}

/* ── Comprobante / Print ── */
function buildPrintGroups(items: ComisionListItemExtended[]): PrintGroup[] {
  const groupsMap = new Map<string, PrintGroup>()

  for (const item of items) {
    const esConvenio = !!item.convenio
    const key = esConvenio ? `c-${item.convenio!.id}` : `a-${item.asesor?.id ?? 'sin'}`
    const nombre = item.convenio?.nombre || item.asesor?.nombre || 'Sin asignar'

    if (!groupsMap.has(key)) {
      let medioPago: string | null = null
      let telefono: string | null = null

      if (esConvenio) {
        const metodo = item.convenio?.metodo_pago ?? null
        const numero = item.convenio?.numero_metodo_pago ?? null
        if (metodo && numero) medioPago = `${metodo}: ${numero}`
        else if (numero) medioPago = numero
        else if (metodo) medioPago = metodo
      } else {
        const agenteInfo = item.asesor?.id ? allAsesores.value.find(a => a.id === item.asesor!.id) : null
        medioPago = agenteInfo?.medioPago ?? null
        telefono = agenteInfo?.telefono ?? null
      }

      groupsMap.set(key, { key, nombre, esConvenio, medioPago, telefono, items: [], motosCount: 0, vehiculosCount: 0, totalIncentivo: 0, totalDateo: 0 })
    }

    const g = groupsMap.get(key)!
    g.items.push(item)
    if (item.tipo_vehiculo === 'MOTO') g.motosCount++
    else g.vehiculosCount++
    g.totalIncentivo += Number(item.monto_convenio ?? item.valor_cliente ?? 0)
    g.totalDateo += Number(item.monto_asesor ?? item.valor_unitario ?? 0)
  }

  return Array.from(groupsMap.values())
}

function openPrintPreview(items: ComisionListItemExtended[], estadoPagado?: string, savedComprobantes?: ComprobantePagoDto[]) {
  const groups = buildPrintGroups(items)
  const totalMotos = items.filter((i) => i.tipo_vehiculo === 'MOTO').length
  const totalVehiculos = items.filter((i) => i.tipo_vehiculo === 'VEHICULO').length
  const totalDateoGlobal = items.reduce((acc, i) => acc + Number(i.monto_asesor ?? i.valor_unitario ?? 0), 0)
  const totalIncentivoGlobal = items.reduce((acc, i) => acc + Number(i.monto_convenio ?? i.valor_cliente ?? 0), 0)
  const totalGeneral = totalDateoGlobal + totalIncentivoGlobal
  const fechaGeneracion = new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date())

  printDialog.value = {
    visible: true,
    items,
    groups,
    fechaGeneracion,
    estadoPagado: estadoPagado || '',
    comprobantes: savedComprobantes ?? [],
    totalMotos,
    totalVehiculos,
    totalGeneral,
    totalDateoGlobal,
    totalIncentivoGlobal,
  }
}

/* ── Abrir confirmación de comprobante ── */
function abrirConfirmacionComprobante() {
  const items = selectedItemsData.value
  if (items.length === 0) return

  const groupsMap = new Map<string, ConfirmComprobanteGroup>()
  for (const item of items) {
    const esConvenio = !!item.convenio
    const key = esConvenio ? `c-${item.convenio!.id}` : `a-${item.asesor?.id ?? 'sin'}`
    const nombre = item.convenio?.nombre || item.asesor?.nombre || 'Sin asignar'

    if (!groupsMap.has(key)) {
      let medioPago: string | null = null
      let telefono: string | null = null
      let beneficiarioId: number | null = null

      if (esConvenio) {
        beneficiarioId = item.convenio?.id ?? null
        const metodo = item.convenio?.metodo_pago ?? null
        const numero = item.convenio?.numero_metodo_pago ?? null
        if (metodo && numero) medioPago = `${metodo}: ${numero}`
        else if (numero) medioPago = numero
        else if (metodo) medioPago = metodo
      } else {
        beneficiarioId = item.asesor?.id ?? null
        const ag = item.asesor?.id ? allAsesores.value.find(a => a.id === item.asesor!.id) : null
        medioPago = ag?.medioPago ?? null
        telefono = ag?.telefono ?? null
      }

      groupsMap.set(key, {
        key, nombre, esConvenio, beneficiarioId, medioPago, telefono,
        motosCount: 0, vehiculosCount: 0, totalDateo: 0, totalIncentivo: 0,
        comisionIds: [], placas: [],
      })
    }

    const g = groupsMap.get(key)!
    if (item.tipo_vehiculo === 'MOTO') g.motosCount++
    else g.vehiculosCount++
    g.totalDateo += Number(item.monto_asesor ?? item.valor_unitario ?? 0)
    g.totalIncentivo += Number(item.monto_convenio ?? item.valor_cliente ?? 0)
    g.comisionIds.push(item.id)
    if (item.turno?.placa) g.placas.push(item.turno.placa)
  }

  const groups = Array.from(groupsMap.values())
  confirmComprobante.value = {
    visible: true,
    loading: false,
    groups,
    totalGeneral: groups.reduce((acc, g) => acc + g.totalDateo + g.totalIncentivo, 0),
    totalComisiones: items.length,
    notas: '',
  }
}

/* ── Ejecutar generación y guardar en backend ── */
async function ejecutarGenerarComprobante() {
  confirmComprobante.value.loading = true
  try {
    const { groups, notas } = confirmComprobante.value
    const itemsSnapshot = [...selectedItemsData.value]

    const payload = {
      periodo_desde: filters.value.desde || undefined,
      periodo_hasta: filters.value.hasta || undefined,
      filtro_estado: filters.value.estado || undefined,
      filtro_tipo_vehiculo: filters.value.tipoVehiculo || undefined,
      notas: notas || undefined,
      groups: groups.map(g => ({
        beneficiario_tipo: g.esConvenio ? 'CONVENIO' as const : 'ASESOR' as const,
        beneficiario_id: g.beneficiarioId,
        beneficiario_nombre: g.nombre,
        medio_pago: g.medioPago,
        telefono: g.telefono,
        total_motos: g.motosCount,
        total_vehiculos: g.vehiculosCount,
        total_dateo: g.totalDateo,
        total_incentivo: g.totalIncentivo,
        total_general: g.totalDateo + g.totalIncentivo,
        comision_ids: g.comisionIds,
        placas: g.placas,
      })),
    }

    // Guarda en backend → devuelve un comprobante por beneficiario
    const savedList = await createComprobantes(payload)
    confirmComprobante.value.visible = false
    selectedIds.value = []

    // Abre el PDF con los números reales asignados
    openPrintPreview(itemsSnapshot, undefined, savedList)
  } finally {
    confirmComprobante.value.loading = false
  }
}

function doPrint() {
  const { groups, fechaGeneracion, totalMotos, totalVehiculos, totalGeneral, totalDateoGlobal, totalIncentivoGlobal } = printDialog.value

  const savedComprobantes = printDialog.value.comprobantes
  const numComp = savedComprobantes.length > 0
    ? savedComprobantes.map(c => `#${c.numero}`).join(', ')
    : null
  const numLabel = numComp
    ? `Comprobante${savedComprobantes.length > 1 ? 's' : ''} ${numComp}`
    : 'Vista previa'

  const periodoParts: string[] = []
  if (filters.value.desde || filters.value.hasta) {
    const rango = [filters.value.desde, filters.value.hasta].filter(Boolean).join(' → ')
    periodoParts.push(`Período: ${rango}`)
  }
  if (filters.value.tipoVehiculo) periodoParts.push(`Filtro: ${filters.value.tipoVehiculo === 'MOTO' ? 'Solo motos' : 'Solo vehículos'}`)
  if (filters.value.descuentoCodigo) periodoParts.push(`Descuento: ${filters.value.descuentoCodigo}`)

  const groupsHtml = groups.map((g, gIdx) => {
    const compNum = savedComprobantes[gIdx]?.numero ?? null
    const compLabel = compNum ? `Comprobante N° ${compNum}` : ''
    const totalGrupo = g.totalDateo + g.totalIncentivo

    const motoItems = g.items.filter(i => i.tipo_vehiculo === 'MOTO')
    const carroItems = g.items.filter(i => i.tipo_vehiculo === 'VEHICULO')

    const motosByValor = new Map<number, number>()
    motoItems.forEach(i => { const v = calcTotalItem(i); motosByValor.set(v, (motosByValor.get(v) || 0) + 1) })
    const carrosByValor = new Map<number, number>()
    carroItems.forEach(i => { const v = calcTotalItem(i); carrosByValor.set(v, (carrosByValor.get(v) || 0) + 1) })

    const desgloseMotoHtml = motoItems.length > 0
      ? Array.from(motosByValor.entries()).map(([val, cnt]) => {
          const label = val === 0
            ? motoItems.filter(i => calcTotalItem(i) === 0 && i.descuento?.nombre).map(i => i.descuento!.nombre)[0] ?? 'con descuento'
            : null
          const extra = label ? ` <span style="font-size:9px;color:#E65100">(${label})</span>` : ''
          return `<div class="desglose-row"><span>🏍️ ${cnt} moto${cnt !== 1 ? 's' : ''}${extra} × ${formatCOP(val)}</span><span class="desglose-val">${formatCOP(cnt * val)}</span></div>`
        }).join('') : ''

    const desgloseCarroHtml = carroItems.length > 0
      ? Array.from(carrosByValor.entries()).map(([val, cnt]) => {
          const label = val === 0
            ? carroItems.filter(i => calcTotalItem(i) === 0 && i.descuento?.nombre).map(i => i.descuento!.nombre)[0] ?? 'con descuento'
            : null
          const extra = label ? ` <span style="font-size:9px;color:#E65100">(${label})</span>` : ''
          return `<div class="desglose-row"><span>🚗 ${cnt} vehículo${cnt !== 1 ? 's' : ''}${extra} × ${formatCOP(val)}</span><span class="desglose-val">${formatCOP(cnt * val)}</span></div>`
        }).join('') : ''

    const medioPagoHtml = g.medioPago
      ? `<div class="pay-detail"><span class="pay-label">💳 Medio de pago</span><span class="pay-value">${g.medioPago}</span></div>`
      : `<div class="pay-detail pay-missing"><span class="pay-label">💳 Medio de pago</span><span class="pay-value">No registrado</span></div>`
    const telHtml = g.telefono
      ? `<div class="pay-detail"><span class="pay-label">📞 Teléfono</span><span class="pay-value">${g.telefono}</span></div>`
      : ''

    const rowsHtml = g.items.map((item, idx) => {
      const descNombre = item.descuento?.nombre ?? null
      const descOrigen = item.descuento_origen ?? null
      let descCell = '—'
      if (descNombre) {
        const origenLabel = descOrigen === 'caja' ? 'En caja' : 'Pre-marcado'
        descCell = `<span class="badge-desc-name">${descNombre}</span><br><span class="desc-origen">${origenLabel}</span>`
      }
      return `<tr>
        <td class="center">${idx + 1}</td>
        <td class="center bold">${item.turno?.placa || '—'}</td>
        <td class="center">${item.tipo_vehiculo === 'MOTO' ? '🏍️ Moto' : item.tipo_vehiculo === 'VEHICULO' ? '🚗 Carro' : '—'}</td>
        <td>${item.turno?.servicio?.nombre || item.turno?.servicio?.codigo || '—'}</td>
        <td>${descCell}</td>
        <td class="right">${formatCOP(Number(item.monto_asesor ?? item.valor_unitario ?? 0))}</td>
        <td class="right">${formatCOP(Number(item.monto_convenio ?? item.valor_cliente ?? 0))}</td>
        <td class="right bold-green">${formatCOP(calcTotalItem(item))}</td>
      </tr>`
    }).join('')

    return `<div class="group">
      <div class="recipient-header">
        <div class="recipient-left">
          <div class="recipient-label">${g.esConvenio ? 'PAGO A CONVENIO' : 'PAGO A ASESOR'}${compLabel ? ' · ' + compLabel : ''}</div>
          <div class="recipient-name">${g.nombre}</div>
          <div class="recipient-count">${g.items.length} comisión${g.items.length !== 1 ? 'es' : ''} · 🏍️ ${g.motosCount} · 🚗 ${g.vehiculosCount}</div>
        </div>
        <div class="recipient-right">${medioPagoHtml}${telHtml}</div>
      </div>
      <div class="pay-summary">
        <div class="pay-summary-title">RESUMEN DE PAGO</div>
        ${desgloseMotoHtml}${desgloseCarroHtml}
        <div class="pay-total-row"><span>TOTAL A PAGAR</span><span class="pay-total-amount">${formatCOP(totalGrupo)}</span></div>
      </div>
      <table>
        <thead><tr>
          <th class="center">#</th><th class="center">Placa</th><th class="center">Tipo</th>
          <th>Servicio</th><th>Descuento</th><th class="right">Dateo</th><th class="right">Incentivo</th><th class="right">Total</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`
  }).join('')

  const printScript = '<scr' + 'ipt>window.onload = function() { window.print(); }</scr' + 'ipt>'
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${numLabel} – ${fechaGeneracion}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:11px; color:#1a1a1a; padding:20px; background:#fff; }
    .doc-header { border-bottom:3px solid #1565C0; padding-bottom:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-end; }
    .doc-title { font-size:18px; font-weight:bold; color:#1565C0; letter-spacing:.3px; }
    .doc-meta { font-size:9.5px; color:#666; text-align:right; line-height:1.6; }
    .global-summary { display:flex; gap:0; margin-bottom:20px; border:1px solid #90CAF9; border-radius:6px; overflow:hidden; }
    .gs-item { flex:1; padding:8px 12px; text-align:center; background:#E3F2FD; border-right:1px solid #90CAF9; }
    .gs-item:last-child { border-right:none; background:#E8F5E9; }
    .gs-label { font-size:9px; color:#555; margin-bottom:3px; text-transform:uppercase; }
    .gs-value { font-size:15px; font-weight:bold; color:#1565C0; }
    .gs-item:last-child .gs-value { color:#1B5E20; font-size:17px; }
    .group { margin-bottom:24px; border:1px solid #ddd; border-radius:6px; overflow:hidden; page-break-inside:avoid; }
    .recipient-header { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 14px; background:linear-gradient(135deg,#1565C0,#1976D2); color:white; }
    .recipient-label { font-size:9px; opacity:.8; text-transform:uppercase; letter-spacing:.5px; }
    .recipient-name { font-size:16px; font-weight:bold; margin:2px 0 4px; }
    .recipient-count { font-size:10px; opacity:.85; }
    .recipient-right { text-align:right; }
    .pay-detail { display:flex; gap:8px; justify-content:flex-end; align-items:center; margin-bottom:3px; }
    .pay-label { font-size:9px; opacity:.75; }
    .pay-value { font-size:11px; font-weight:bold; }
    .pay-missing .pay-value { opacity:.5; font-weight:normal; font-style:italic; }
    .pay-summary { background:#F8FFF8; border-bottom:1px solid #C8E6C9; padding:8px 14px; }
    .pay-summary-title { font-size:9px; font-weight:bold; color:#388E3C; text-transform:uppercase; letter-spacing:.4px; margin-bottom:5px; }
    .desglose-row { display:flex; justify-content:space-between; font-size:11px; color:#444; padding:1px 0; }
    .desglose-val { font-weight:bold; color:#1a1a1a; }
    .pay-total-row { display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding-top:6px; border-top:1px solid #A5D6A7; }
    .pay-total-row span:first-child { font-size:11px; font-weight:bold; color:#2E7D32; text-transform:uppercase; }
    .pay-total-amount { font-size:17px; font-weight:bold; color:#1B5E20; }
    table { width:100%; border-collapse:collapse; }
    th { background:#E8EAF6; color:#283593; padding:5px 8px; border-bottom:2px solid #C5CAE9; font-size:9.5px; }
    td { padding:4px 8px; border-bottom:1px solid #EEE; font-size:10px; }
    tr:last-child td { border-bottom:none; }
    tr:nth-child(even) td { background:#FAFAFA; }
    .right { text-align:right; } .center { text-align:center; } .bold { font-weight:bold; }
    .bold-green { font-weight:bold; color:#2E7D32; }
    .badge-desc-name { background:#FFF3E0; color:#E65100; border:1px solid #FFCC80; border-radius:3px; padding:1px 5px; font-size:9px; font-weight:bold; }
    .desc-origen { font-size:8.5px; color:#888; }
    .grand-total { margin-top:20px; background:#E8F5E9; border:2px solid #A5D6A7; border-radius:6px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; }
    .grand-left .grand-label { font-size:11px; color:#555; }
    .grand-left .grand-breakdown { font-size:9.5px; color:#777; margin-top:3px; }
    .grand-amount { font-size:22px; font-weight:bold; color:#1B5E20; }
    .footer { margin-top:16px; text-align:center; font-size:9px; color:#bbb; border-top:1px solid #eee; padding-top:8px; }
    @media print { body { padding:10px; } .group { page-break-inside:avoid; } }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="doc-title">COMPROBANTE DE PAGO DE COMISIONES</div>
      <div style="font-size:13px;color:#1565C0;font-weight:bold;margin-top:2px;">${numLabel}</div>
    </div>
    <div class="doc-meta">
      Generado: ${fechaGeneracion}<br>
      ${periodoParts.length ? periodoParts.join(' · ') : 'Sin filtro de período'}
    </div>
  </div>
  <div class="global-summary">
    <div class="gs-item"><div class="gs-label">Comisiones</div><div class="gs-value">${printDialog.value.items.length}</div></div>
    <div class="gs-item"><div class="gs-label">🏍️ Motos</div><div class="gs-value">${totalMotos}</div></div>
    <div class="gs-item"><div class="gs-label">🚗 Vehículos</div><div class="gs-value">${totalVehiculos}</div></div>
    <div class="gs-item"><div class="gs-label">Beneficiarios</div><div class="gs-value">${groups.length}</div></div>
    <div class="gs-item"><div class="gs-label">TOTAL GENERAL</div><div class="gs-value">${formatCOP(totalGeneral)}</div></div>
  </div>
  ${groupsHtml}
  <div class="grand-total">
    <div class="grand-left">
      <div class="grand-label">TOTAL GENERAL A PAGAR (${groups.length} beneficiario${groups.length !== 1 ? 's' : ''})</div>
      <div class="grand-breakdown">Dateo asesores: ${formatCOP(totalDateoGlobal)} &nbsp;·&nbsp; Incentivos convenios: ${formatCOP(totalIncentivoGlobal)}</div>
    </div>
    <div class="grand-amount">${formatCOP(totalGeneral)}</div>
  </div>
  <div class="footer">Comprobante generado automáticamente · Sistema de Comisiones · ${fechaGeneracion}</div>
  ${printScript}
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
}

/* ── Watchers ── */
watch(activeTab, (val) => {
  if (val === 'metas' && metaRows.value.length === 0) loadMetas()
})

/* ── Init ── */
loadCatalogos()
loadItems()
</script>
