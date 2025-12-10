<template>
  <v-container class="py-6">
    <v-card elevation="10" class="rounded-2xl">
      <!-- Header -->
      <v-card-title class="d-flex justify-space-between align-center flex-wrap py-5">
        <div class="d-flex align-center">
          <v-avatar class="mr-4" size="46" color="primary">
            <v-icon>mdi-account-tie</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Ficha comercial</div>
            <div class="text-medium-emphasis">
              <template v-if="asesor">
                {{ asesor.nombre }} • {{ humanTipo(asesor.tipo) }}
              </template>
              <template v-else>Cargando…</template>
            </div>
          </div>
        </div>

        <!-- Filtros de periodo -->
        <div class="d-flex align-center flex-wrap gap-2">
          <v-text-field
            v-model="filtros.desde"
            type="date"
            label="Desde"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
          />
          <v-text-field
            v-model="filtros.hasta"
            type="date"
            label="Hasta"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
          />

          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="tonal" prepend-icon="mdi-calendar-range">
                Rangos rápidos
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="setUltimosNDias(7)">
                <v-list-item-title>Últimos 7 días</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setUltimosNDias(30)">
                <v-list-item-title>Últimos 30 días</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setUltimosNDias(90)">
                <v-list-item-title>Últimos 90 días</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setEsteMes()">
                <v-list-item-title>Este mes</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn color="primary" :loading="loading" @click="reload">Aplicar</v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetRango">Este mes</v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <!-- Mensajes -->
      <v-card-text class="py-5">
        <v-expand-transition>
          <v-alert v-if="globalError" type="error" variant="tonal" class="mb-5">
            {{ globalError }}
          </v-alert>
        </v-expand-transition>

        <!-- Datos + KPIs -->
        <v-row class="mb-6">
          <!-- Datos del asesor: COMPACTOS HORIZONTALES -->
          <v-col cols="12">
            <v-card variant="outlined" rounded="lg">
              <v-card-text class="py-3">
                <div class="d-flex flex-wrap align-center" style="gap: 24px">
                  <template v-if="asesor && !loading">
                    <div class="data-item">
                      <span class="data-label">Nombre:</span>
                      <span class="data-value">{{ asesor.nombre ?? '—' }}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Tipo:</span>
                      <span class="data-value">{{ humanTipo(asesor?.tipo) }}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Teléfono:</span>
                      <span class="data-value">{{ asesor.telefono ?? '—' }}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Correo:</span>
                      <span class="data-value">{{ asesor.email || asesor.correo || '—' }}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Documento:</span>
                      <span class="data-value">{{ docFull(asesor) }}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Estado:</span>
                      <v-chip size="x-small" :color="asesor?.activo ? 'success' : 'error'" variant="flat">
                        {{ asesor?.activo ? 'Activo' : 'Inactivo' }}
                      </v-chip>
                    </div>
                  </template>
                  <template v-else>
                    <v-skeleton-loader type="text@3" />
                  </template>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- KPIs Grid 4x2 -->
          <v-col cols="6" sm="3">
            <div class="kpi-card-compact">
              <div class="kpi-title-compact">Prospectos</div>
              <div class="kpi-value-compact">{{ kpi.prospectos }}</div>
              <div class="kpi-sub-compact">en el rango</div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="kpi-card-compact">
              <div class="kpi-title-compact">Dateos exitosos</div>
              <div class="kpi-value-compact text-success">{{ kpi.dateosExitosos }}</div>
              <div class="kpi-sub-compact">en el rango</div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="kpi-card-compact">
              <div class="kpi-title-compact">Total generado</div>
              <div class="kpi-value-compact">{{ money(kpi.montoGenerado) }}</div>
              <div class="kpi-sub-compact">
                {{ esAsesorConvenio ? 'dateo + placa' : 'del asesor' }}
              </div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="kpi-card-compact kpi-warning">
              <div class="kpi-title-compact">🟡 Pendientes</div>
              <div class="kpi-value-compact">{{ money(kpi.comisionesPendientes) }}</div>
              <div class="kpi-sub-compact">por aprobar</div>
            </div>
          </v-col>

          <!-- Segunda fila de KPIs -->
          <v-col cols="6" sm="3">
            <div class="kpi-card-compact kpi-info">
              <div class="kpi-title-compact">🔵 Aprobadas</div>
              <div class="kpi-value-compact">{{ money(kpi.comisionesAprobadas) }}</div>
              <div class="kpi-sub-compact">por pagar</div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="kpi-card-compact kpi-success">
              <div class="kpi-title-compact">✅ Pagadas</div>
              <div class="kpi-value-compact">{{ money(kpi.comisionesPagadas) }}</div>
              <div class="kpi-sub-compact">ya liquidadas</div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="kpi-card-compact kpi-primary">
              <div class="kpi-title-compact">💰 Saldo</div>
              <div class="kpi-value-compact" :class="saldoEstimado < 0 ? 'text-error' : ''">
                {{ money(saldoEstimado) }}
              </div>
              <div class="kpi-sub-compact">por cobrar</div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="kpi-card-compact kpi-clickable" @click="abrirHistorialPagos">
              <div class="kpi-title-compact">📊 Historial</div>
              <v-btn size="small" color="success" variant="tonal" block class="mt-1">
                Ver pagos
              </v-btn>
              <div class="kpi-sub-compact">completo</div>
            </div>
          </v-col>

          <!-- Metas mensuales: SOLO si es asesor comercial -->
          <v-col cols="12" sm="6" v-if="esAsesorComercial">
            <v-card variant="outlined" rounded="lg" class="h-100">
              <v-card-title class="text-subtitle-2 font-weight-bold d-flex justify-space-between align-center py-3">
                🎯 Metas mensuales
                <v-btn
                  size="x-small"
                  variant="tonal"
                  prepend-icon="mdi-target"
                  @click="metasDialogVisible = true"
                >
                  Ver detalle
                </v-btn>
              </v-card-title>
              <v-card-text class="pt-1 text-body-2">
                <template v-if="metaResumen">
                  <div class="d-flex justify-space-between mb-2">
                    <span><strong>Mes:</strong> {{ metaResumen.mesLabel }}</span>
                    <span><strong>Avance:</strong> {{ metaResumen.avance.toFixed(1) }}%</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span><strong>Meta RTM:</strong> {{ money(metaResumen.metaDinero) }}</span>
                    <span><strong>Faltante:</strong> {{ money(metaResumen.faltante) }}</span>
                  </div>
                  <div class="text-center mt-2">
                    <span class="text-caption">Comisión estimada:</span>
                    <div class="text-h6 text-success font-weight-bold">
                      {{ money(metaResumen.comisionEstimada) }}
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="text-medium-emphasis text-caption">
                    Sin configuración de meta RTM para este asesor.
                  </span>
                </template>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Info del periodo -->
          <v-col cols="12" :sm="esAsesorComercial ? 6 : 12">
            <v-alert type="info" variant="tonal" density="compact" class="mb-0">
              <div class="d-flex justify-space-between align-center">
                <span><strong>Periodo actual:</strong> {{ rangoLegible }}</span>
                <v-chip size="small" color="primary" variant="flat">
                  Reseteo mensual activo
                </v-chip>
              </div>
            </v-alert>
          </v-col>
        </v-row>

        <!-- Tabs -->
        <v-tabs v-model="tab" align-tabs="start" class="mb-2">
          <v-tab value="prospectos" prepend-icon="mdi-account-search">Prospectos</v-tab>

          <!-- Ocultar pestaña Convenios si es asesor convenio -->
          <v-tab v-if="!esAsesorConvenio" value="convenios" prepend-icon="mdi-handshake">
            Convenios
          </v-tab>

          <v-tab value="dateos" prepend-icon="mdi-clipboard-check-multiple">Dateos</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Prospectos -->
          <v-window-item value="prospectos">
  <div class="d-flex justify-space-between align-center mb-3">
    <div class="text-medium-emphasis">
      <template v-if="verTodosProspectos">
        <strong>{{ totalProspectosTodos }}</strong> prospecto(s) del asesor (todos).
      </template>
      <template v-else>
        <strong>{{ totalProspectosEnRango }}</strong> prospecto(s) del asesor en el rango.
      </template>
    </div>
  </div>

  <!-- Nueva fila con botón crear y switch -->
  <div class="d-flex justify-space-between align-center mb-2">
    <v-btn
      color="primary"
      prepend-icon="mdi-plus-circle"
      @click="irACrearProspecto"
      v-if="puedeCrearProspecto"
    >
      Crear prospecto
    </v-btn>

    <v-switch
      v-model="verTodosProspectos"
      color="primary"
      inset
      label="Ver todos los prospectos"
      hide-details
    />
  </div>

  <v-data-table
    :items="prospectosVisibles"
    :headers="headersProspectos"
              :loading="loading"
              class="elevation-1"
              item-key="id"
              :no-data-text="'Sin prospectos para los filtros'"
            >
              <template #loading>
                <v-skeleton-loader type="table-row@6" />
              </template>

              <!-- SOAT -->
              <template #item.soat="{ item }">
                <div class="doc-cell">
                  <v-chip :color="docColor(item.soat_vigente)" size="small" variant="flat" label>
                    {{ docText(item.soat_vigente) }}
                  </v-chip>
                  <span class="doc-date">{{ formatFechaDoc(item.soat_vencimiento) }}</span>
                </div>
              </template>

              <!-- RTM -->
              <template #item.tecno="{ item }">
                <div class="doc-cell">
                  <v-chip :color="docColor(item.tecno_vigente)" size="small" variant="flat" label>
                    {{ docText(item.tecno_vigente) }}
                  </v-chip>
                  <span class="doc-date">{{ formatFechaDoc(item.tecno_vencimiento) }}</span>
                </div>
              </template>

              <!-- Preventiva -->
              <template #item.preventiva="{ item }">
                <div class="doc-cell">
                  <v-chip :color="docColor(item.preventiva_vigente)" size="small" variant="flat" label>
                    {{ docText(item.preventiva_vigente) }}
                  </v-chip>
                  <span class="doc-date">{{ formatFechaDoc(item.preventiva_vencimiento) }}</span>
                </div>
              </template>

              <!-- Peritaje -->
              <template #item.peritaje="{ item }">
                <div class="doc-cell">
                  <v-chip
                    :color="item.peritaje_ultima_fecha ? 'success' : 'grey-darken-1'"
                    size="small"
                    variant="flat"
                    label
                  >
                    {{ item.peritaje_ultima_fecha ? 'Registrado' : 'Sin datos' }}
                  </v-chip>
                  <span class="doc-date">{{ formatFechaDoc(item.peritaje_ultima_fecha) }}</span>
                </div>
              </template>

              <!-- Acciones -->
              <template #item.acciones="{ item }">
                <div class="d-flex gap-1">
                  <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-eye"
                    @click="verProspecto(item.id)"
                  />
                </div>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Convenios: oculto si es asesor convenio -->
          <v-window-item value="convenios" v-if="!esAsesorConvenio">
            <v-data-table
              :items="convenios"
              :headers="headersConvenios"
              :loading="loading"
              class="elevation-1"
              item-key="id"
              :no-data-text="'Sin convenios asignados'"
            >
              <template #loading>
                <v-skeleton-loader type="table-row@6" />
              </template>
              <template #item.vigencia="{ item }">
                {{ vigenciaText(item) }}
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Dateos -->
          <v-window-item value="dateos">
  <div class="d-flex justify-space-between align-center mb-3">
    <div class="text-medium-emphasis">
      <strong>{{ totalDateosFiltrados }}</strong> dateo(s) ·
      Exitosos: <strong>{{ totalExitosos }}</strong> ·
      {{ esAsesorConvenio ? 'Monto total (comisión convenio):' : 'Monto total (comisión asesor):' }}
      <strong>{{ money(totalComisionAsesor) }}</strong>
    </div>
  </div>

  <!-- Nueva fila con botón crear y filtros -->
  <div class="d-flex justify-space-between align-center mb-2">
    <v-btn
      color="primary"
      prepend-icon="mdi-plus-circle"
      @click="irACrearDateo"
      v-if="puedeCrearDateo"
    >
      Crear dateo
    </v-btn>

    <div class="d-flex align-center" style="gap:8px">
      <v-switch
        v-model="verTodosDateos"
        color="primary"
        inset
        label="Ver todos los dateos"
        hide-details
      />
      <v-switch
        v-model="filtrosDateo.soloExitosos"
        color="success"
        inset
        label="Solo exitosos"
        hide-details
      />
      <v-btn
        size="small"
        variant="tonal"
        prepend-icon="mdi-download"
        @click="exportCsv(false)"
      >
        Exportar CSV
      </v-btn>
      <v-btn
        size="small"
        color="success"
        prepend-icon="mdi-download"
        @click="exportCsv(true)"
      >
        CSV (solo exitosos)
      </v-btn>
    </div>
  </div>

  <v-data-table
    :items="dateosFiltrados"
    :headers="headersDateos"
              :loading="loading"
              class="elevation-1"
              item-key="id"
              :no-data-text="'Sin dateos para los filtros'"
            >
              <template #loading>
                <v-skeleton-loader type="table-row@6" />
              </template>

              <!-- Foto -->
              <template #item.imagen_url="{ item }">
                <div class="d-flex items-center">
                  <v-avatar
                    v-if="item.imagen_url"
                    size="42"
                    class="evidence-thumb"
                    @click="openViewer(item.imagen_url)"
                  >
                    <v-img :src="item.imagen_url" alt="evidencia" cover />
                  </v-avatar>
                  <v-btn
                    v-else
                    icon="mdi-image-off"
                    variant="text"
                    size="small"
                    class="text-medium-emphasis"
                    :disabled="true"
                    :ripple="false"
                    aria-label="Sin evidencia"
                    :title="'Sin evidencia'"
                  />
                </div>
              </template>

              <!-- Convenio -->
              <template #item.convenio="{ item }">
                <v-chip v-if="item.convenio?.nombre" size="small" variant="flat">
                  {{ item.convenio.nombre }}
                </v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </template>

              <!-- Estado -->
              <template #item.resultado="{ item }">
                <v-chip :color="chipColorResultado(item.resultado)" size="small" variant="flat">
                  {{ textoResultado(item.resultado) }}
                </v-chip>
              </template>

              <!-- Turno -->
              <template #item.turnoInfo="{ item }">
                <div
                  v-if="item.turnoInfo"
                  class="d-flex align-center justify-center"
                  style="gap:6px"
                >
                  <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-600">
                    {{ (item.turnoInfo.fecha && formatDateOnly(item.turnoInfo.fecha)) || '—' }}
                  </v-chip>
                  <v-chip size="x-small" color="indigo" variant="tonal" class="font-weight-600">
                    G: {{ item.turnoInfo.numeroGlobal ?? '—' }}
                  </v-chip>
                  <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-600">
                    S: {{ item.turnoInfo.numeroServicio ?? '—' }}
                  </v-chip>
                  <v-chip
                    v-if="item.turnoInfo.servicioCodigo"
                    size="x-small"
                    variant="tonal"
                    class="font-weight-600"
                  >
                    {{ item.turnoInfo.servicioCodigo }}
                  </v-chip>
                  <v-chip
                    size="x-small"
                    :color="chipColorEstadoTurno(item.turnoInfo.estado || item.resultado)"
                    variant="elevated"
                    prepend-icon="mdi-progress-clock"
                    class="font-weight-600"
                  >
                    {{ textoEstadoTurno(item.turnoInfo.estado || item.resultado) }}
                  </v-chip>
                </div>
                <span v-else class="text-medium-emphasis d-flex justify-center">—</span>
              </template>

              <!-- Comisión (dinámica según rol) -->
              <template #item.comisionAsesor="{ item }">
                {{ money(getComisionPorRolParaDateo(item.id)) }}
              </template>

              <!-- 💰 NUEVO: Estado Comisión -->
              <template #item.estadoComision="{ item }">
                <v-chip
                  :color="getEstadoComisionColor(getEstadoComisionParaDateo(item.id))"
                  size="small"
                  variant="flat"
                  :prepend-icon="getEstadoComisionIcon(getEstadoComisionParaDateo(item.id))"
                >
                  {{ getEstadoComisionLabel(getEstadoComisionParaDateo(item.id)) }}
                </v-chip>
              </template>

              <!-- Fecha creado -->
              <template #item.created_at="{ item }">
                {{ item.created_at_fmt || fmtDate(item.created_at) }}
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Visor de imagen -->
    <v-dialog v-model="viewer.visible" max-width="720">
      <v-card>
        <v-card-title class="text-h6">Evidencia</v-card-title>
        <v-card-text>
          <v-img v-if="viewer.url" :src="viewer.url" class="rounded" height="420" cover />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="viewer.url"
            variant="text"
            :href="viewer.url"
            target="_blank"
            prepend-icon="mdi-open-in-new"
          >
            Abrir en pestaña
          </v-btn>
          <v-btn color="primary" @click="viewer.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de metas: SOLO si es asesor comercial -->
    <v-dialog v-if="esAsesorComercial" v-model="metasDialogVisible" max-width="820">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <div>
            Metas mensuales RTM
            <div class="text-caption text-medium-emphasis">
              {{ asesor?.nombre || 'Asesor' }}
            </div>
          </div>
          <div class="d-flex align-center" style="gap:8px">
            <v-text-field
              v-model="metaMes"
              type="month"
              label="Mes"
              density="comfortable"
              variant="outlined"
              hide-details
              style="max-width: 160px"
            />
            <v-btn color="primary" size="small" :loading="metasLoading" @click="loadMetasAsesor">
              Actualizar
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersMetas"
            :items="metasRows"
            :loading="metasLoading"
            density="comfortable"
            item-key="asesor_id"
            :no-data-text="'Sin metas configuradas para este mes'"
          >
            <template #item.asesor="{ item }">
              {{ item.asesor_nombre || asesor?.nombre || '—' }}
            </template>

            <template #item.rtm_motos="{ item }">
              {{ item.rtm_motos || 0 }}
            </template>

            <template #item.rtm_vehiculos="{ item }">
              {{ item.rtm_vehiculos || 0 }}
            </template>

            <template #item.total_rtm="{ item }">
              {{ calcTotalRtm(item) }}
            </template>

            <template #item.meta_rtm="{ item }">
              <span v-if="getMetaDinero(item) > 0">
                {{ money(getMetaDinero(item)) }}
              </span>
              <span v-else>—</span>
            </template>

            <template #item.avance="{ item }">
              <span v-if="getMetaDinero(item) > 0">
                {{ calcAvance(item).toFixed(1) }}%
              </span>
              <span v-else>—</span>
            </template>

            <template #item.faltante="{ item }">
              <span v-if="getMetaDinero(item) > 0">
                {{ money(calcFaltante(item)) }}
              </span>
              <span v-else>—</span>
            </template>

            <template #item.porcentaje_comision_meta="{ item }">
              {{ (item.porcentaje_comision_meta ?? item.porcentaje_comision ?? 0) }}%
            </template>

            <template #item.comision_estimada="{ item }">
              {{ money(calcComisionMeta(item)) }}
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="metasDialogVisible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 💰 Modal: Historial de pagos -->
    <v-dialog v-model="historialDialogVisible" max-width="920" scrollable>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center bg-success-darken-1 text-white">
          <div class="d-flex align-center" style="gap: 12px">
            <v-icon size="28">mdi-cash-multiple</v-icon>
            <div>
              <div class="text-h6">Historial de pagos</div>
              <div class="text-caption opacity-90">
                {{ asesor?.nombre || 'Asesor' }}
              </div>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pt-4">
          <!-- Filtros -->
          <v-row class="mb-3">
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="historialFiltros.desde"
                type="date"
                label="Desde"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="historialFiltros.hasta"
                type="date"
                label="Hasta"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4" class="d-flex align-center">
              <v-btn
                color="primary"
                block
                prepend-icon="mdi-filter"
                :loading="historialLoading"
                @click="aplicarFiltroHistorial"
              >
                Filtrar
              </v-btn>
            </v-col>
          </v-row>

          <!-- Resumen -->
          <v-alert type="success" variant="tonal" class="mb-3">
            <div class="d-flex justify-space-between align-center">
              <div>
                <strong>{{ historialPagos.length }}</strong> pago(s) en el rango seleccionado
              </div>
              <div class="text-h6 font-weight-bold">
                Total: {{ money(totalHistorialPagos) }}
              </div>
            </div>
          </v-alert>

          <!-- Tabla -->
          <v-data-table
            :items="historialPagos"
            :headers="[
              { title: 'Fecha', key: 'fecha', sortable: true },
              { title: 'Placa', key: 'placa', sortable: true },
              { title: 'Convenio', key: 'convenio', sortable: true },
              { title: 'Monto', key: 'monto', align: 'end', sortable: true },
            ]"
            :loading="historialLoading"
            density="comfortable"
            class="elevation-1"
            item-key="id"
            :no-data-text="'No hay pagos en este rango de fechas'"
          >
            <template #item.fecha="{ item }">
              {{ item.fecha ? formatDateTime(item.fecha) : '—' }}
            </template>

            <template #item.placa="{ item }">
              <v-chip size="small" variant="tonal" color="primary">
                {{ item.placa }}
              </v-chip>
            </template>

            <template #item.convenio="{ item }">
              <span class="text-body-2">{{ item.convenio }}</span>
            </template>

            <template #item.monto="{ item }">
              <span class="font-weight-bold text-success">
                {{ money(item.monto) }}
              </span>
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions class="bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" @click="historialDialogVisible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '@/services/http'
// ✅ Imports necesarios
import { getMiFicha, getAsesorById } from '@/services/asesoresService'
import { useAuthStore } from '@/stores/AuthStore'
import { listDateos, type Dateo, formatDateTime } from '@/services/dateosService'
import {
  listComisiones,
  type ComisionListItem,
  listMetasMensuales,
  type MetaMensualRow,
} from '@/services/comisionesService'
import {
  listProspectos,
  type ProspectoDetail,
  formatDate as formatFechaDocBase,
} from '@/services/prospectosService'

/* ===== Tipos locales ===== */
type Asesor = {
  id: number
  nombre: string
  tipo?: string | null
  email?: string | null
  correo?: string | null
  telefono?: string | null
  doc_tipo?: string | null
  doc_numero?: string | null
  documento?: string | null
  activo?: boolean | 0 | 1
}

type Convenio = {
  id: number
  nombre: string
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
}

// 🔥 CORRECCIÓN 1: Obtener asesorId dinámicamente según contexto
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const API = '/api'

const asesorId = computed(() => {
  // 1️⃣ Si hay ID en la ruta → usarlo (gerencia/admin viendo ficha de otro)
  if (route.params.id) return Number(route.params.id)

  // 2️⃣ Si no, usar el del usuario autenticado (comercial viendo su propia ficha)
  return authStore.currentAgenteId || 0
})

// 🔥 CORRECCIÓN 2: Permisos para crear dateos/prospectos
const puedeCrearDateo = computed(() => {
  // SUPER_ADMIN puede crear en cualquier ficha
  if (authStore.isSuperAdmin) return true

  // COMERCIAL solo puede crear en su propia ficha
  return authStore.isComercial && asesorId.value === authStore.currentAgenteId
})

const puedeCrearProspecto = computed(() => {
  // SUPER_ADMIN puede crear en cualquier ficha
  if (authStore.isSuperAdmin) return true

  // COMERCIAL solo puede crear en su propia ficha
  return authStore.isComercial && asesorId.value === authStore.currentAgenteId
})

/* ===== Estado principal ===== */
const asesor = ref<Asesor | null>(null)
const prospectos = ref<ProspectoDetail[]>([])
const convenios = ref<Convenio[]>([])
const dateos = ref<Dateo[]>([])
const comisiones = ref<ComisionListItem[]>([])
const pagos = ref<{ id: number; valor: number; fecha?: string }[]>([])

const loading = ref(false)
const globalError = ref<string | null>(null)
const tab = ref<'prospectos' | 'convenios' | 'dateos'>('prospectos')

/* ===== Filtros de fecha ===== */
const filtros = ref<{ desde: string; hasta: string }>({ desde: '', hasta: '' })

function toInputDate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
function setUltimosNDias(n: number) {
  const hoy = new Date()
  const desde = new Date()
  desde.setDate(hoy.getDate() - n)
  filtros.value.desde = toInputDate(desde)
  filtros.value.hasta = toInputDate(hoy)
}
function setUltimos30() {
  setUltimosNDias(30)
}
function setEsteMes() {
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  filtros.value.desde = toInputDate(desde)
  filtros.value.hasta = toInputDate(hasta)
}
function resetRango() {
  setEsteMes() // ✅ Cambio: por defecto "Este mes" (reseteo automático)
  reload()
}
setEsteMes() // ✅ Cambio: inicializa con "Este mes"

const rangoLegible = computed(() => {
  const f = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString()
  return `${f(filtros.value.desde)} → ${f(filtros.value.hasta)}`
})

/* ===== Headers de tablas ===== */
const headersProspectos = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Teléfono', key: 'telefono', sortable: true },
  { title: 'Placa', key: 'placa', sortable: true },
  { title: 'SOAT', key: 'soat', sortable: false },
  { title: 'RTM', key: 'tecno', sortable: false },
  { title: 'Preventiva', key: 'preventiva', sortable: false },
  { title: 'Peritaje', key: 'peritaje', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
] as const

const headersConvenios = [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'nombre' },
  { title: 'Vigencia', key: 'vigencia' },
] as const

/* ✨ Encabezados de dateos: con columna Estado Pago */
const headersDateos = computed(() => {
  const tituloComision = esAsesorConvenio.value ? 'Comisión convenio' : 'Comisión asesor'
  return [
    { title: 'ID', key: 'id' },
    { title: 'Foto', key: 'imagen_url' },
    { title: 'Placa', key: 'placa' },
    { title: 'Teléfono', key: 'telefono' },
    { title: 'Convenio', key: 'convenio' },
    { title: 'Estado', key: 'resultado' },
    { title: 'Turno', key: 'turnoInfo', align: 'center' as const },
    { title: tituloComision, key: 'comisionAsesor', align: 'end' as const },
    { title: '💰 Estado Pago', key: 'estadoComision', align: 'center' as const },
    { title: 'Creado', key: 'created_at' },
  ] as const
})

/* ===== Headers metas (dialogo) ===== */
const headersMetas = [
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

/* ===== Helpers UI/negocio ===== */
function humanTipo(t?: string | null) {
  const v = String(t || '').toUpperCase()
  if (v === 'ASESOR_COMERCIAL') return 'Asesor comercial'
  if (v === 'ASESOR_CONVENIO') return 'Asesor convenio'
  if (v === 'ASESOR_TELEMERCADEO') return 'Asesor telemercadeo'
  return t || '—'
}
function docFull(a?: Asesor | null) {
  if (!a) return '—'
  const tipo = a.doc_tipo || (a as any).tipo_documento || (a as any).tipoDoc || ''
  const num =
    a.doc_numero ||
    (a as any).numero_documento ||
    (a as any).numDocumento ||
    a.documento ||
    (a as any).cedula ||
    ''
  if (tipo || num) return `${tipo} ${num}`.trim()
  return '—'
}
function vigenciaText(c: Convenio) {
  const f = (s?: string | null) => (!s ? '—' : new Date(s as string).toLocaleDateString())
  return `${f(c.vigencia_desde)} – ${f(c.vigencia_hasta)}`
}
function normalizeCreatedAt(obj: any) {
  return (
    obj?.created_at ||
    obj?.createdAt ||
    obj?.fecha ||
    obj?.fecha_creacion ||
    obj?.creado ||
    obj?.created ||
    null
  )
}
function fmtDate(d?: string) {
  if (!d) return '—'
  return formatDateTime(d)
}
function money(n?: number | null) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0)
}
function isExitoso(d: any) {
  const r = String(d.resultado || '').toUpperCase()
  return (
    !!d.exitoso ||
    !!d.consumido_exitoso ||
    ['EXITOSO', 'COMPLETADO', 'ATENDIDO', 'CONVERTIDO'].includes(r)
  )
}

/* Prospectos: helpers de vigencias */
function docColor(v?: boolean | null) {
  if (v === true) return 'success'
  if (v === false) return 'error'
  return 'grey-darken-1'
}
function docText(v?: boolean | null) {
  if (v === true) return 'Vigente'
  if (v === false) return 'Vencido'
  return 'Sin datos'
}
function formatFechaDoc(d?: string | null) {
  return formatFechaDocBase(d || undefined)
}

/* Texto/Color chips dateos */
function chipColorResultado(r?: string) {
  if (r === 'EXITOSO') return 'success'
  if (r === 'NO_EXITOSO') return 'error'
  if (r === 'EN_PROCESO') return 'info'
  return 'warning'
}
function textoResultado(r?: string) {
  if (r === 'EXITOSO') return 'Exitoso'
  if (r === 'NO_EXITOSO') return 'No exitoso'
  if (r === 'EN_PROCESO') return 'En proceso'
  return 'Pendiente'
}
function chipColorEstadoTurno(e?: string) {
  const v = String(e || '').toLowerCase()
  if (v.includes('proceso')) return 'info'
  if (v.includes('final')) return 'success'
  if (v.includes('cancel')) return 'error'
  return 'warning'
}
function textoEstadoTurno(e?: string) {
  const v = String(e || '').toUpperCase()
  if (v === 'EN_PROCESO') return 'En proceso'
  if (v === 'FINALIZADO') return 'Finalizado'
  if (v === 'CANCELADO') return 'Cancelado'
  if (v === 'ACTIVO') return 'Activo'
  return 'Pendiente'
}
function formatDateOnly(iso: string) {
  const p = iso.split('T')[0] || iso
  const [y, m, d] = p.split('-')
  return `${d}/${m}/${y}`
}

/* ===== Visor de imagen ===== */
const viewer = ref<{ visible: boolean; url: string | null }>({ visible: false, url: null })
function openViewer(url: string) {
  viewer.value = { visible: true, url }
}

/* ===== 🆕 Guardar el convenio del asesor (para asesores convenio) ===== */
const convenioDelAsesor = ref<{ id: number; nombre: string } | null>(null)

/* ===== Mapear comisiones a dateo ===== */
const comisionesPorDateo = computed(() => {
  const map = new Map<number, ComisionListItem[]>()
  for (const c of comisiones.value) {
    const dateoId =
      (c as any).dateo_id ?? (c as any).captacionDateoId ?? (c as any).captacion_dateo_id ?? null
    if (!dateoId) continue
    const key = Number(dateoId)
    if (!map.has(key)) map.set(key, [] as ComisionListItem[])
    map.get(key)!.push(c)
  }
  return map
})

/**
 * 🎯 Comisión dinámica según rol del asesor - VERSIÓN FINAL CORREGIDA
 *  - Asesor comercial:
 *      • CON convenio → solo valor_unitario (comisión dateo)
 *      • SIN convenio → valor_unitario + valor_cliente (dateo + placa)
 *  - Asesor convenio:
 *      • Cuando otros usan su convenio → solo valor_cliente (comisión placa)
 *      • Cuando él mismo datea → valor_unitario + valor_cliente (ambas)
 */
function getComisionPorRolParaDateo(dateoId: number): number {
  const arr = comisionesPorDateo.value.get(Number(dateoId)) || []

  // 🟢 ASESOR CONVENIO
  if (esAsesorConvenio.value) {
    return arr.reduce((sum, c: any) => {
      const montoAsesor = Number(c.valor_unitario || 0)    // Comisión por dateo
      const montoConvenio = Number(c.valor_cliente || 0)   // Comisión por placa/convenio

      // 🔥 CLAVE: El convenio de la comisión coincide con el convenio del asesor
      const esConvenioDelAsesor =
        c.convenio &&
        convenioDelAsesor.value &&
        c.convenio.id === convenioDelAsesor.value.id

      const esAsesorQueDateo = c.asesor?.id === asesorId.value

      let total = 0

      // Cuando otros usan su convenio → solo la parte de convenio
      if (esConvenioDelAsesor) {
        total += montoConvenio
      }

      // Cuando él mismo datea → además se suma la parte de asesor
      if (esAsesorQueDateo) {
        total += montoAsesor
      }

      return sum + total
    }, 0)
  }

  // 🟠 ASESOR COMERCIAL / TELEMERCADEO
  return arr.reduce((sum, c: any) => {
    const montoAsesor = Number(c.valor_unitario || 0)
    const montoConvenio = Number(c.valor_cliente || 0)

    // Detectar si hay convenio asociado
    const hayConvenio = !!c.convenio

    if (hayConvenio) {
      // 💼 Comercial usando convenio → SOLO dateo
      return sum + montoAsesor
    }

    // 💼 Comercial SIN convenio → se lleva dateo + placa
    return sum + montoAsesor + montoConvenio
  }, 0)
}

/**
 * 💰 NUEVO: Obtener estado de comisión más relevante para un dateo
 * Prioridad: PAGADA > APROBADA > PENDIENTE > ANULADA > null
 */
function getEstadoComisionParaDateo(dateoId: number): string | null {
  const arr = comisionesPorDateo.value.get(Number(dateoId)) || []
  if (!arr.length) return null

  // 🔥 Filtrar comisiones relevantes según rol
  const comisionesRelevantes = arr.filter((c: any) => {
    if (esAsesorConvenio.value) {
      // Asesor convenio: buscar donde:
      // 1. El convenio de la comisión es el suyo (asesor_secundario_id)
      // 2. O él mismo es el asesor (asesor_id)
      const esConvenioDelAsesor =
        c.convenio &&
        convenioDelAsesor.value &&
        c.convenio.id === convenioDelAsesor.value.id

      const esAsesorQueDateo = c.asesor?.id === asesorId.value

      return esConvenioDelAsesor || esAsesorQueDateo
    }

    // Asesor comercial: buscar donde él es el asesor principal
    return c.asesor?.id === asesorId.value
  })

  if (!comisionesRelevantes.length) return null

  // Priorizar estados: PAGADA > APROBADA > PENDIENTE > ANULADA
  const prioridad = { PAGADA: 4, APROBADA: 3, PENDIENTE: 2, ANULADA: 1 }

  const estadoMasRelevante = comisionesRelevantes.reduce((mejor: any, actual: any) => {
    const prioActual = prioridad[actual.estado as keyof typeof prioridad] || 0
    const prioMejor = mejor ? prioridad[mejor.estado as keyof typeof prioridad] || 0 : 0
    return prioActual > prioMejor ? actual : mejor
  }, null)

  return estadoMasRelevante?.estado || null
}

/**
 * 🎨 Funciones de UI para chips de estado de comisión
 */
function getEstadoComisionColor(estado: string | null): string {
  if (estado === 'PAGADA') return 'success'
  if (estado === 'APROBADA') return 'info'
  if (estado === 'PENDIENTE') return 'warning'
  if (estado === 'ANULADA') return 'default'
  return 'grey-lighten-1'
}

function getEstadoComisionLabel(estado: string | null): string {
  if (estado === 'PAGADA') return 'Pagada'
  if (estado === 'APROBADA') return 'Aprobada'
  if (estado === 'PENDIENTE') return 'Pendiente'
  if (estado === 'ANULADA') return 'Anulada'
  return 'Sin comisión'
}

function getEstadoComisionIcon(estado: string | null): string {
  if (estado === 'PAGADA') return 'mdi-check-circle'
  if (estado === 'APROBADA') return 'mdi-check'
  if (estado === 'PENDIENTE') return 'mdi-clock-outline'
  if (estado === 'ANULADA') return 'mdi-cancel'
  return 'mdi-help-circle-outline'
}

/**
 * 💰 Calcular comisiones por estado (PENDIENTE, APROBADA, PAGADA)
 * Retorna un objeto con el desglose de comisiones según su estado
 */
function calcularComisionesPorEstado(dateosExitosos: any[]) {
  let totalGenerado = 0
  let comisionesPendientes = 0
  let comisionesAprobadas = 0
  let comisionesPagadas = 0

  for (const dateo of dateosExitosos) {
    const dateoId = Number(dateo.id)
    const arr = comisionesPorDateo.value.get(dateoId) || []

    // Filtrar comisiones relevantes según rol
    const comisionesRelevantes = arr.filter((c: any) => {
      if (esAsesorConvenio.value) {
        // Asesor convenio
        const esConvenioDelAsesor =
          c.convenio &&
          convenioDelAsesor.value &&
          c.convenio.id === convenioDelAsesor.value.id

        const esAsesorQueDateo = c.asesor?.id === asesorId.value

        return esConvenioDelAsesor || esAsesorQueDateo
      }

      // Asesor comercial
      return c.asesor?.id === asesorId.value
    })

    // Sumar por estado
    for (const c of comisionesRelevantes) {
      const monto = getComisionPorRolParaDateo(dateoId)

      totalGenerado += monto

      if (c.estado === 'PAGADA') {
        comisionesPagadas += monto
      } else if (c.estado === 'APROBADA') {
        comisionesAprobadas += monto
      } else if (c.estado === 'PENDIENTE') {
        comisionesPendientes += monto
      }
      // ANULADA no se cuenta en ninguna categoría

      // Solo contamos una vez por dateo, así que salimos del loop
      break
    }
  }

  return {
    totalGenerado,
    comisionesPendientes,
    comisionesAprobadas,
    comisionesPagadas,
  }
}

/**
 * Cálculo del KPI "Generado por dateos" (deprecated, usar calcularComisionesPorEstado)
 * Usamos SIEMPRE la misma lógica de getComisionPorRolParaDateo
 */
async function calcularMontoGenerado(exitosos: any[]) {
  return exitosos.reduce((acc: number, d: any) => acc + getComisionPorRolParaDateo(d.id), 0)
}

/* ===== Prospectos: ver todos / solo en rango ===== */
const verTodosProspectos = ref(false)

const prospectosEnRango = computed(() => {
  const desde = new Date(filtros.value.desde + 'T00:00:00')
  const hasta = new Date(filtros.value.hasta + 'T23:59:59')
  return prospectos.value.filter((p: any) => {
    const created = p.created_at || p.createdAt || p.asignacion_activa?.fecha_asignacion || null
    if (!created) return true
    const t = new Date(created)
    return t >= desde && t <= hasta
  })
})

const prospectosVisibles = computed(() =>
  verTodosProspectos.value ? prospectos.value : prospectosEnRango.value,
)

const totalProspectosEnRango = computed(() => prospectosEnRango.value.length)
const totalProspectosTodos = computed(() => prospectos.value.length)

/* ===== Filtros Dateos (solo exitosos / ver todos) ===== */
const filtrosDateo = ref<{ soloExitosos: boolean }>({ soloExitosos: false })
const verTodosDateos = ref(false)

const dateosFiltrados = computed(() => {
  const desde = new Date(filtros.value.desde + 'T00:00:00')
  const hasta = new Date(filtros.value.hasta + 'T23:59:59')
  return dateos.value.filter((d: any) => {
    const tRaw = normalizeCreatedAt(d)
    const t = tRaw ? new Date(tRaw) : null
    const enRango = t ? t >= desde && t <= hasta : true
    const pasaRango = verTodosDateos.value ? true : enRango
    const pasaExito = filtrosDateo.value.soloExitosos ? isExitoso(d) : true
    d.created_at = tRaw || d.created_at
    return pasaRango && pasaExito
  })
})

const totalDateosFiltrados = computed(() => dateosFiltrados.value.length)
const totalExitosos = computed(() => dateosFiltrados.value.filter((d) => isExitoso(d)).length)
/* Para KPIs: también mostramos el monto dinámico según rol */
const totalComisionAsesor = computed(() =>
  dateosFiltrados.value
    .filter((d) => isExitoso(d))
    .reduce((acc: number, d: any) => acc + getComisionPorRolParaDateo(d.id), 0),
)

/* ===== KPIs ===== */
const kpi = ref({
  prospectos: 0,
  convenios: 0,
  dateosExitosos: 0,
  montoGenerado: 0, // Total de todas las comisiones (dinámico por rol)
  comisionesPendientes: 0, // 🟡 Comisiones pendientes
  comisionesAprobadas: 0,  // 🔵 Comisiones aprobadas
  comisionesPagadas: 0,    // ✅ Comisiones pagadas
  pagosRegistrados: 0, // Deprecated: usar comisionesPagadas
})
const saldoEstimado = computed(() => kpi.value.montoGenerado - kpi.value.comisionesPagadas)

/* ===== Detectar tipo de asesor ===== */
function normalizeTipoAgente(t?: string | null) {
  return (t ?? '').toString().toUpperCase().trim()
}
const esAsesorComercial = computed(() => {
  const t = normalizeTipoAgente(asesor.value?.tipo)
  return t.includes('COMERCIAL')
})
const esAsesorConvenio = computed(() => {
  const t = normalizeTipoAgente(asesor.value?.tipo)
  return t.includes('CONVENIO')
})

/* ===== METAS mensuales RTM (solo comerciales) ===== */
function getCurrentMes() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const metasRows = ref<MetaMensualRow[]>([])
const metasLoading = ref(false)
const metasDialogVisible = ref(false)
const metaMes = ref(getCurrentMes())

// 💰 Historial de pagos
const historialDialogVisible = ref(false)
const historialLoading = ref(false)
const historialFiltros = ref({
  desde: '',
  hasta: ''
})

// Inicializar filtros de historial con el año actual
function initHistorialFiltros() {
  const hoy = new Date()
  const inicioAnio = new Date(hoy.getFullYear(), 0, 1)
  historialFiltros.value.desde = toInputDate(inicioAnio)
  historialFiltros.value.hasta = toInputDate(hoy)
}
initHistorialFiltros()

/* Valores referencias RTM (editables si backend retorna otros) */
const valorRtmMoto = ref(126100)
const valorRtmVehiculo = ref(208738)

/* ===== Historial de pagos ===== */
const historialPagos = computed(() => {
  const desde = new Date(historialFiltros.value.desde + 'T00:00:00')
  const hasta = new Date(historialFiltros.value.hasta + 'T23:59:59')

  const pagos: Array<{
    id: number
    fecha: string
    placa: string
    convenio: string
    monto: number
    dateoId: number
  }> = []

  // Iterar todos los dateos exitosos
  for (const dateo of dateos.value.filter((d) => isExitoso(d))) {
    const dateoId = Number((dateo as any).id)
    const arr = comisionesPorDateo.value.get(dateoId) || []

    // Filtrar comisiones relevantes y PAGADAS
    const comisionesRelevantes = arr.filter((c: any) => {
      if (c.estado !== 'PAGADA') return false

      if (esAsesorConvenio.value) {
        const esConvenioDelAsesor =
          c.convenio &&
          convenioDelAsesor.value &&
          c.convenio.id === convenioDelAsesor.value.id
        const esAsesorQueDateo = c.asesor?.id === asesorId.value
        return esConvenioDelAsesor || esAsesorQueDateo
      }

      return c.asesor?.id === asesorId.value
    })

    // Si hay comisión pagada, agregar al historial
    for (const c of comisionesRelevantes) {
      const fechaPago = c.generado_at || (dateo as any).created_at || ''
      const fechaPagoDate = fechaPago ? new Date(fechaPago) : null

      // Filtrar por rango de fechas
      if (fechaPagoDate && (fechaPagoDate < desde || fechaPagoDate > hasta)) {
        continue
      }

      pagos.push({
        id: c.id,
        fecha: fechaPago,
        placa: (dateo as any).placa || '—',
        convenio: (dateo as any).convenio?.nombre || 'Sin convenio',
        monto: getComisionPorRolParaDateo(dateoId),
        dateoId: dateoId,
      })

      break // Solo una vez por dateo
    }
  }

  // Ordenar por fecha descendente
  return pagos.sort((a, b) => {
    const dateA = new Date(a.fecha).getTime()
    const dateB = new Date(b.fecha).getTime()
    return dateB - dateA
  })
})

const totalHistorialPagos = computed(() =>
  historialPagos.value.reduce((sum, p) => sum + p.monto, 0)
)

function abrirHistorialPagos() {
  historialDialogVisible.value = true
}

function aplicarFiltroHistorial() {
  // El computed se actualiza automáticamente
  historialLoading.value = true
  setTimeout(() => {
    historialLoading.value = false
  }, 300)
}

function calcTotalRtm(item: MetaMensualRow) {
  return (item.rtm_motos || 0) + (item.rtm_vehiculos || 0)
}
function getMetaDinero(item: MetaMensualRow): number {
  const raw =
    item.meta_global_rtm ?? item.meta_rtm ?? (item as any).meta_mensual ?? item.meta_mensual ?? 0
  return Number(raw) || 0
}
function getTotalFacturacion(item: MetaMensualRow) {
  const backend: any =
    (item as any).total_facturacion_global ?? (item as any).totalFacturacionGlobal ?? null
  if (backend != null && !Number.isNaN(Number(backend))) return Number(backend)

  const totalRtmMotos = item.rtm_motos ?? item.total_rtm_motos ?? 0
  const totalRtmVehiculos = item.rtm_vehiculos ?? item.total_rtm_vehiculos ?? 0
  return totalRtmMotos * valorRtmMoto.value + totalRtmVehiculos * valorRtmVehiculo.value
}
function calcAvance(item: MetaMensualRow) {
  const meta = getMetaDinero(item)
  if (!meta || meta <= 0) return 0
  const total = getTotalFacturacion(item)
  return (total / meta) * 100
}
function calcFaltante(item: MetaMensualRow) {
  const meta = getMetaDinero(item)
  if (!meta || meta <= 0) return 0
  const total = getTotalFacturacion(item)
  const diff = meta - total
  return diff > 0 ? diff : 0
}
function calcComisionMeta(item: MetaMensualRow) {
  const meta = getMetaDinero(item)
  const pct = item.porcentaje_comision_meta ?? (item as any).porcentaje_comision ?? 0
  if (!meta || meta <= 0 || !pct) return 0
  const total = getTotalFacturacion(item)
  if (total < meta) return 0
  return (total * pct) / 100
}

/* resumen card */
const metaResumen = computed(() => {
  const row = metasRows.value[0]
  if (!row) return null
  const metaDinero = getMetaDinero(row)
  if (!metaDinero || metaDinero <= 0) return null
  return {
    mesLabel: metaMes.value,
    metaDinero,
    avance: calcAvance(row),
    faltante: calcFaltante(row),
    comisionEstimada: calcComisionMeta(row),
  }
})

async function loadMetasAsesor() {
  metasLoading.value = true
  try {
     const res = await listMetasMensuales({ mes: metaMes.value, asesorId: asesorId.value })
    metasRows.value = res.data

    const row = metasRows.value[0]
    if (row) {
      if (typeof row.valor_rtm_moto === 'number' && row.valor_rtm_moto > 0) {
        valorRtmMoto.value = row.valor_rtm_moto
      }
      if (typeof row.valor_rtm_vehiculo === 'number' && row.valor_rtm_vehiculo > 0) {
        valorRtmVehiculo.value = row.valor_rtm_vehiculo
      }
    }
  } finally {
    metasLoading.value = false
  }
}

/* ===== API helpers ===== */
function normalizeAsesor(raw: any): Asesor | null {
  if (!raw) return null
  const nombre =
    raw.nombre ||
    [raw.nombres, raw.apellidos].filter(Boolean).join(' ') ||
    raw.fullname ||
    raw.displayName ||
    '—'
  const email = raw.email || raw.correo || raw.email_personal || raw?.user?.email || null
  const telefono = raw.telefono || raw.celular || raw.cel || raw.phone || null

  const doc_tipo = raw.doc_tipo || raw.tipo_documento || raw.tipoDoc || null
  const doc_numero =
    raw.doc_numero ||
    raw.numero_documento ||
    raw.numDocumento ||
    raw.documento ||
    raw.cedula ||
    null

  const activo =
    typeof raw.activo !== 'undefined'
      ? !!raw.activo
      : String(raw.estado || '').toUpperCase() === 'ACTIVO'
      ? true
      : undefined

  return {
    id: Number(raw.id),
    nombre,
    tipo: raw.tipo || raw.rol || raw.cargo || null,
    email,
    correo: raw.correo || null,
    telefono,
    doc_tipo,
    doc_numero,
    documento: raw.documento || null,
    activo: (activo as any) ?? true,
  }
}

// 🔥 CORRECCIÓN 3: Usar endpoint correcto según rol
async function fetchAsesor(id: number) {
  try {
    // Si soy COMERCIAL y estoy viendo MI propia ficha → usar /me
    if (authStore.isComercial && id === authStore.currentAgenteId) {
      const r = await getMiFicha()
      if (r) return normalizeAsesor(r)
    } else {
      // Si soy GERENCIA/ADMIN viendo ficha de otro → usar /agentes-captacion/:id
      const r = await getAsesorById(id)
      if (r) return normalizeAsesor(r)
    }
  } catch (e) {
    console.error('Error al cargar asesor:', e)
  }
  return null
}

/** Calcula vigente desde una fecha si falta el flag */
function computeVigenteFromDate(flag: unknown, venc: unknown): boolean | null {
  if (flag === true || flag === false) return flag as boolean
  if (!venc) return null
  const d = new Date(typeof venc === 'string' ? venc : String(venc))
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d.getTime() >= today.getTime()
}

/** Normaliza claves y completa flags desde vencimientos */
function normalizeProspecto(p: Record<string, unknown>) {
  const soat_venc = (p.soat_vencimiento ?? p.soatVencimiento ?? null) as string | null
  const tecno_venc = (p.tecno_vencimiento ?? p.tecnoVencimiento ?? null) as string | null
  const soat_flag = computeVigenteFromDate(p.soat_vigente ?? p.soatVigente, soat_venc)
  const tecno_flag = computeVigenteFromDate(p.tecno_vigente ?? p.tecnoVigente, tecno_venc)

  const prev_venc =
    (p.preventiva_vencimiento ?? p.preventivaVencimiento ?? null) as string | null
  const prev_flag = computeVigenteFromDate(
    p.preventiva_vigente ?? p.preventivaVigente,
    prev_venc,
  )

  const peri_fecha =
    (p.peritaje_ultima_fecha ?? p.peritajeUltimaFecha ?? null) as string | null

  const created = (p.created_at ?? p.createdAt ?? (p as any).asignacion_activa?.fecha_asignacion ?? null) as string | null

  return {
    ...p,
    soat_vigente: soat_flag,
    tecno_vigente: tecno_flag,
    soat_vencimiento: soat_venc,
    tecno_vencimiento: tecno_venc,
    preventiva_vigente: prev_flag,
    preventiva_vencimiento: prev_venc,
    peritaje_ultima_fecha: peri_fecha,
    created_at: created,
    updated_at: (p.updated_at ?? p.updatedAt ?? null) as string | null,
  }
}

async function fetchProspectos(id: number) {
  const res = await listProspectos({
    page: 1,
    perPage: 500,
    asesorId: id,
    sortBy: 'updated_at',
    order: 'desc',
  })
  return res.data.map((p) => normalizeProspecto(p as unknown as Record<string, unknown>)) as ProspectoDetail[]
}

async function fetchConvenios(id: number) {
  try {
    const r = await get<any>(`${API}/agentes-captacion/${id}/convenios`)
    const arr = r?.data ?? r
    if (Array.isArray(arr)) return arr
  } catch (e) {
    console.error('Error al cargar convenios del asesor', e)
  }
  return []
}

async function fetchDateosUnionAsesorYConvenio(opts: {
  asesor: Asesor | null
  convenios: Convenio[]
}) {
  const a = opts.asesor
  if (!a) return [] as Dateo[]

  const fetchByAgente = () =>
    listDateos({
      page: 1,
      perPage: 500,
      canal: 'ASESOR',
      agenteId: a.id,
      sortBy: 'id',
      order: 'desc',
    }).then((r) => (r.data as Dateo[]) || [])

  const fetchByConvenio = (convenioId: number) =>
    listDateos({
      page: 1,
      perPage: 500,
      canal: 'ASESOR',
      convenioId,
      sortBy: 'id',
      order: 'desc',
    }).then((r) => (r.data as Dateo[]) || [])

  const esConvenioLocal = normalizeTipoAgente(a.tipo).includes('CONVENIO')

  if (!esConvenioLocal) {
    return await fetchByAgente()
  }

  // 🚀 Asesor convenio: buscar en AMBOS roles
  const calls: Promise<Dateo[]>[] = []

  // 1️⃣ Como AGENTE (usando asesor_convenio_id)
  calls.push(fetchByAgente())

  // 2️⃣ Como CONVENIO - buscar el convenio directamente por nombre EXACTO
  try {
    const resConvenio = await get<any>(
      `${API}/convenios/buscar-por-nombre?nombre=${encodeURIComponent(a.nombre)}`
    )

    if (resConvenio && resConvenio.id) {
      calls.push(fetchByConvenio(Number(resConvenio.id)))
    }
  } catch (e: any) {
    if (e?.response?.status !== 404) {
      console.error('❌ Error buscando convenio por nombre:', e)
    }
  }

  const results = await Promise.all(calls)

  // Unir sin duplicados por id
  const map = new Map<number, Dateo>()
  for (const arr of results) {
    if (!Array.isArray(arr)) continue
    for (const it of arr) {
      map.set((it as any).id, it)
    }
  }

  return Array.from(map.values()).sort((a: any, b: any) => Number(b.id) - Number(a.id))
}

async function fetchComisiones(id: number) {
  const esConvenioLocal =
    asesor.value && normalizeTipoAgente(asesor.value.tipo).includes('CONVENIO')

  if (!esConvenioLocal) {
    const res = await listComisiones({ asesorId: id, perPage: 500 })
    return res.data as ComisionListItem[]
  }

  const porAsesor = await listComisiones({ asesorId: id, perPage: 500 }).then(
    (r) => r.data as ComisionListItem[],
  )

  let porConvenio: ComisionListItem[] = []

  try {
    const resConvenio = await get<any>(
      `${API}/convenios/buscar-por-nombre?nombre=${encodeURIComponent(asesor.value!.nombre)}`,
    )

    if (resConvenio && resConvenio.id) {
      convenioDelAsesor.value = { id: resConvenio.id, nombre: resConvenio.nombre }

      const resComisiones = await listComisiones({
        convenioId: Number(resConvenio.id),
        perPage: 500,
      })
      porConvenio = resComisiones.data as ComisionListItem[]
    }
  } catch (e: any) {
    if (e?.response?.status !== 404) {
      console.error('❌ Error buscando comisiones por convenio:', e)
    }
  }

  const map = new Map<number, ComisionListItem>()
  for (const c of [...porAsesor, ...porConvenio]) {
    if (!c || c.id == null) continue
    map.set(Number(c.id), c)
  }

  return Array.from(map.values())
}

async function fetchPagos(_id: number) {
  return []
}

/* ===== Carga principal ===== */
async function loadAll() {
  loading.value = true
  globalError.value = null
  try {
    const a = await fetchAsesor(asesorId.value)
    asesor.value = a

    let c: Convenio[] = []
    if (asesor.value && (esAsesorComercial.value || esAsesorConvenio.value)) {
      c = await fetchConvenios(asesorId.value)
    }
    convenios.value = Array.isArray(c) ? c : []

    const d = await fetchDateosUnionAsesorYConvenio({
      asesor: asesor.value,
      convenios: convenios.value,
    })
    dateos.value = Array.isArray(d) ? d : []

    const [p, pg, cm] = await Promise.all([
      fetchProspectos(asesorId.value),
      fetchPagos(asesorId.value),
      fetchComisiones(asesorId.value)
    ])
    prospectos.value = Array.isArray(p) ? p : []
    pagos.value = Array.isArray(pg) ? pg : []
    comisiones.value = Array.isArray(cm) ? cm : []

    if (asesor.value && esAsesorComercial.value) {
      await loadMetasAsesor()
    } else {
      metasRows.value = []
    }

    const desde = new Date(filtros.value.desde + 'T00:00:00')
    const hasta = new Date(filtros.value.hasta + 'T23:59:59')

    const dateosEnRango = dateos.value.filter((x: any) => {
      const tRaw = normalizeCreatedAt(x)
      const t = tRaw ? new Date(tRaw) : null
      return t ? t >= desde && t <= hasta : true
    })
    const exitosos = dateosEnRango.filter((x) => isExitoso(x))

    // 💰 Calcular comisiones por estado
    const comisionesPorEstado = calcularComisionesPorEstado(exitosos)

    kpi.value = {
      prospectos: prospectosEnRango.value.length,
      convenios: convenios.value.length,
      dateosExitosos: exitosos.length,
      montoGenerado: comisionesPorEstado.totalGenerado,
      comisionesPendientes: comisionesPorEstado.comisionesPendientes,
      comisionesAprobadas: comisionesPorEstado.comisionesAprobadas,
      comisionesPagadas: comisionesPorEstado.comisionesPagadas,
      pagosRegistrados: comisionesPorEstado.comisionesPagadas, // Deprecated
    }
  } catch (e: any) {
    globalError.value = e?.message || 'No fue posible cargar la ficha comercial'
  } finally {
    loading.value = false
  }
}

function reload() {
  loadAll()
}

watch(
  () => convenios.value.map((c) => c.id).join(','),
  async () => {
    if (asesor.value && esAsesorConvenio.value) {
      const d = await fetchDateosUnionAsesorYConvenio({
        asesor: asesor.value,
        convenios: convenios.value,
      })
      dateos.value = Array.isArray(d) ? d : []

      const desde = filtros.value.desde
      const hasta = filtros.value.hasta

      const desdeD = new Date(desde + 'T00:00:00')
      const hastaD = new Date(hasta + 'T23:59:59')
      const dEnRango = dateos.value.filter((x: any) => {
        const tRaw = normalizeCreatedAt(x)
        const t = tRaw ? new Date(tRaw) : null
        return t ? t >= desdeD && t <= hastaD : true
      })
      const exitosos = dEnRango.filter((x) => isExitoso(x))

      // 💰 Actualizar KPIs con comisiones por estado
      const comisionesPorEstado = calcularComisionesPorEstado(exitosos)
      kpi.value.montoGenerado = comisionesPorEstado.totalGenerado
      kpi.value.comisionesPendientes = comisionesPorEstado.comisionesPendientes
      kpi.value.comisionesAprobadas = comisionesPorEstado.comisionesAprobadas
      kpi.value.comisionesPagadas = comisionesPorEstado.comisionesPagadas
      kpi.value.pagosRegistrados = comisionesPorEstado.comisionesPagadas
    }
  },
)

onMounted(async () => {
  // ✅ Solo esperar si es COMERCIAL SIN route.params.id
  if (authStore.isComercial && !route.params.id) {
    let intentos = 0
    const maxIntentos = 10

    while (!authStore.currentAgenteId && intentos < maxIntentos) {
      console.log(`⏳ Esperando currentAgenteId... intento ${intentos + 1}/${maxIntentos}`)
      await new Promise(resolve => setTimeout(resolve, 100))
      intentos++
    }

    if (!authStore.currentAgenteId) {
      console.error('❌ No se pudo obtener currentAgenteId')
      globalError.value = 'No se pudo cargar tu información de asesor. Por favor, refresca la página.'
      loading.value = false
      return
    }

    console.log(`✅ currentAgenteId disponible: ${authStore.currentAgenteId}`)
  }

  await loadAll()
})

/* ===== Navegación extra ===== */
function verProspecto(id: number) {
  router.push({
    name: 'ComercialProspectoDetalle',
    params: { id },
    query: { fromFicha: String(asesorId.value) }
  }).catch(() => {})
}

function irACrearDateo() {
  router.push({
    name: 'ComercialDateosNuevo',
    query: { fromFicha: String(asesorId.value) }
  }).catch(() => {})
}

function irACrearProspecto() {
  router.push({
    name: 'ComercialProspectoNuevo',
    query: { fromFicha: String(asesorId.value) }
  }).catch(() => {})
}
/* ===== Exportar CSV (dateos) ===== */
function getMontoDateo(d: Dateo) {
  return getComisionPorRolParaDateo((d as any).id)
}

function formatFechaCSV(fechaISO?: string): string {
  if (!fechaISO) return ''
  try {
    const d = new Date(fechaISO)
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const año = d.getFullYear()
    const hora = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const seg = String(d.getSeconds()).padStart(2, '0')
    return `${dia}/${mes}/${año} ${hora}:${min}:${seg}`
  } catch {
    return String(fechaISO)
  }
}

function exportCsv(soloExitosos: boolean) {
  const baseRows = soloExitosos
    ? dateosFiltrados.value.filter((d) => isExitoso(d))
    : dateosFiltrados.value

  const sortedRows = [...baseRows].sort((a: any, b: any) => Number(b.id) - Number(a.id))

  const rows = sortedRows.map((d: any) => ({
    id: d.id || '',
    placa: (d.placa || '').toUpperCase(),
    telefono: d.telefono || '',
    convenio: d.convenio?.nombre || 'Sin convenio',
    estado: isExitoso(d) ? 'EXITOSO' : textoResultado(d.resultado),
    monto_comision: getMontoDateo(d),
    estado_comision: getEstadoComisionLabel(getEstadoComisionParaDateo(d.id)),
    fecha_creacion: formatFechaCSV(d.created_at),
  }))

  const headersDisplay = [
    'ID',
    'Placa',
    'Teléfono',
    'Convenio',
    'Estado',
    'Monto Comisión (COP)',
    'Estado Pago',
    'Fecha de Creación'
  ]

  const headersKeys = [
    'id',
    'placa',
    'telefono',
    'convenio',
    'estado',
    'monto_comision',
    'estado_comision',
    'fecha_creacion'
  ]

  const delimiter = ';'

  const BOM = '\uFEFF'
  const csv = BOM + [
    headersDisplay.join(delimiter),
    ...rows.map((r) => headersKeys.map((h) => csvEscape((r as any)[h])).join(delimiter)),
  ].join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url

  const now = new Date()
  const fechaHora = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  const tag = soloExitosos ? 'exitosos' : 'todos'
  const asesorNombre = asesor.value?.nombre?.replace(/[^a-zA-Z0-9]/g, '_') || `asesor_${asesor.value?.id || 'desconocido'}`

  a.download = `dateos_${asesorNombre}_${tag}_${fechaHora}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function csvEscape(val: unknown) {
  const s = String(val ?? '')
  const cleaned = s.replace(/;/g, ' ')
  if (/["\r\n]/.test(cleaned)) return `"${cleaned.replace(/"/g, '""')}"`
  return cleaned
}
</script>

<style scoped>
/* Datos del asesor: horizontal compacto */
.data-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.data-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
}

.data-value {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.87);
}

/* KPIs compactos */
.kpi-card-compact {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  height: 100%;
  min-height: 90px;
  background: rgb(var(--v-theme-surface));
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-card-compact:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.kpi-card-compact.kpi-clickable {
  cursor: pointer;
  border-color: rgba(var(--v-theme-success), 0.3);
}

.kpi-card-compact.kpi-clickable:hover {
  border-color: rgb(var(--v-theme-success));
  box-shadow: 0 4px 12px rgba(var(--v-theme-success), 0.2);
}

.kpi-card-compact.kpi-warning {
  background: rgba(var(--v-theme-warning), 0.05);
  border-color: rgba(var(--v-theme-warning), 0.2);
}

.kpi-card-compact.kpi-info {
  background: rgba(var(--v-theme-info), 0.05);
  border-color: rgba(var(--v-theme-info), 0.2);
}

.kpi-card-compact.kpi-success {
  background: rgba(var(--v-theme-success), 0.05);
  border-color: rgba(var(--v-theme-success), 0.2);
}

.kpi-card-compact.kpi-primary {
  background: rgba(var(--v-theme-primary), 0.05);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.kpi-title-compact {
  font-weight: 600;
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
}

.kpi-value-compact {
  font-weight: 800;
  font-size: 1.25rem;
  line-height: 1.2;
  margin: 4px 0;
}

.kpi-sub-compact {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}

/* Estilos antiguos para compatibilidad */
.kpi-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 14px 16px;
  height: 100%;
  background: rgb(var(--v-theme-surface));
}

.kpi-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

.kpi-value {
  font-weight: 800;
  font-size: 1.4rem;
  line-height: 1.2;
  margin: 6px 0;
}

.kpi-sub {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.45);
}

.gap-2 {
  gap: 8px;
}

.evidence-thumb {
  cursor: zoom-in;
}

.doc-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.doc-date {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

:deep(th[data-key='soat']),
:deep(td[data-key='soat']),
:deep(th[data-key='tecno']),
:deep(td[data-key='tecno']),
:deep(th[data-key='preventiva']),
:deep(td[data-key='preventiva']),
:deep(th[data-key='peritaje']),
:deep(td[data-key='peritaje']) {
  min-width: 132px;
}

:deep(table.v-table) {
  font-size: 0.92rem;
}

:deep(.v-data-table-footer) {
  padding-inline: 8px !important;
}

:deep(.v-card .v-btn.v-btn--size-small) {
  letter-spacing: 0.2px;
}

@media (max-width: 960px) {
  .kpi-value-compact {
    font-size: 1.1rem;
  }
  .kpi-title-compact {
    font-size: 0.75rem;
  }
}

@media (max-width: 600px) {
  .data-item {
    width: 100%;
  }

  .kpi-card-compact {
    min-height: 80px;
  }

  .kpi-value-compact {
    font-size: 1rem;
  }
}
</style>
