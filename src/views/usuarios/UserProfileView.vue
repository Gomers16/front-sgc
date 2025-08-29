<template>
  <v-container class="py-8">
    <v-card class="elevation-12 rounded-xl pa-8">
      <!-- Loading -->
      <div
        v-if="isLoadingUser"
        class="d-flex justify-center align-center"
        style="min-height: 400px;"
      >
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="ml-4 text-h6 text-grey-darken-1">Cargando perfil...</div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-10">
        <v-icon size="80" color="error">mdi-alert-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-bold mt-4 text-error">Error al cargar el perfil</h3>
        <p class="mt-2">{{ error }}</p>
        <p class="mt-4 font-weight-bold text-caption text-grey-darken-1">
          Por favor, revisa la consola para más detalles.
        </p>
        <v-btn color="primary" class="mt-4" @click="loadUser">Reintentar</v-btn>
      </div>

      <!-- Content -->
      <div v-else-if="user">
        <!-- Header -->
        <v-row align="center" justify="center" class="mb-8">
          <v-col cols="12" md="auto" class="d-flex justify-center">
            <div class="avatar-container">
              <v-avatar size="180" class="elevation-8 border-lg border-white">
                <v-img
                  :src="user.fotoPerfil ? toAbsoluteApiUrl(user.fotoPerfil) : 'https://i.imgur.com/I8iJ8sX.png'"
                  alt="Foto de perfil"
                  cover
                />
              </v-avatar>
              <v-btn
                icon
                class="edit-avatar-btn"
                color="primary"
                size="small"
                @click="showPhotoDialog = true"
                aria-label="Cambiar foto de perfil"
              >
                <v-icon>mdi-camera</v-icon>
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" md="auto" class="text-center text-md-left">
            <v-card-title class="text-h2 font-weight-black text-blue-grey-darken-3 mb-1">
              {{ user.nombres }} {{ user.apellidos }}
            </v-card-title>
            <v-card-subtitle class="text-h5 text-blue-grey-darken-1 d-flex align-center">
              <v-icon class="mr-1">mdi-briefcase-account</v-icon>
              {{ primaryContrato?.cargo?.nombre || user.cargo?.nombre || 'Sin Cargo' }}
            </v-card-subtitle>
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <v-card-text>
          <v-row>
            <!-- Información de Contacto -->
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon class="mr-1">mdi-account-details</v-icon>
                  Información de Contacto
                </v-card-title>
                <v-list dense class="pa-4">
                  <v-list-item prepend-icon="mdi-card-account-details-outline" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Número de Cédula:</v-list-item-title>
                    <v-list-item-subtitle>{{ primaryContrato?.identificacion || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item prepend-icon="mdi-email" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Correo Electrónico:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.correo }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-phone" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Celular Personal:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.celularPersonal || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-phone-classic" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Celular Corporativo:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.celularCorporativo || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-map-marker" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Dirección:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.direccion || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Detalles de Empleo -->
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon class="mr-1">mdi-briefcase</v-icon>
                  Detalles de Empleo
                </v-card-title>
                <v-list dense class="pa-4">
                  <v-list-item prepend-icon="mdi-account-star-outline" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Rol:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.rol?.nombre || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-domain" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Empresa:</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ primaryContrato?.razonSocial?.nombre || user.razonSocial?.nombre || 'N/A' }}
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-city" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Sede:</v-list-item-title>
                    <v-list-item-subtitle>{{ primaryContrato?.sede?.nombre || user.sede?.nombre || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-cash-multiple" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Centro de Costo:</v-list-item-title>
                    <v-list-item-subtitle>{{ primaryContrato?.centroCosto || user.centroCosto || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Seguridad Social -->
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg mt-6 h-100 seg-social">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon class="mr-1">mdi-security</v-icon>
                  Información de Seguridad Social
                </v-card-title>

                <v-row class="pa-4">
                  <!-- EPS -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.eps || user.eps">
                    <v-list-item prepend-icon="mdi-hospital-building">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        EPS
                        <v-tooltip text="ENTIDAD PRESTADORA DE SERVICIOS DE SALUD" location="top">
                          <template #activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-help-circle-outline" size="16" class="ml-1 text-medium-emphasis" />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>

                      <v-list-item-subtitle class="afiliacion-nombre" :title="primaryContrato?.eps?.nombre || user.eps?.nombre">
                        {{ primaryContrato?.eps?.nombre || user.eps?.nombre }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          v-if="getEntidadId('eps')"
                          :model-value="certs.eps.has"
                          color="success"
                          overlap
                          class="clip-badge"
                        >
                          <template #badge><v-icon size="14">mdi-check</v-icon></template>
                          <v-btn icon variant="text" size="small" :disabled="!getEntidadId('eps')" @click="abrirDialogoCertificado('eps')">
                            <v-icon>mdi-paperclip</v-icon>
                          </v-btn>
                        </v-badge>
                      </template>
                    </v-list-item>
                  </v-col>

                  <!-- ARL -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.arl || user.arl">
                    <v-list-item prepend-icon="mdi-account-injury">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        ARL
                        <v-tooltip text="ADMINISTRADORA DE RIESGOS LABORALES" location="top">
                          <template #activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-help-circle-outline" size="16" class="ml-1 text-medium-emphasis" />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>

                      <v-list-item-subtitle class="afiliacion-nombre" :title="primaryContrato?.arl?.nombre || user.arl?.nombre">
                        {{ primaryContrato?.arl?.nombre || user.arl?.nombre }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          v-if="getEntidadId('arl')"
                          :model-value="certs.arl.has"
                          color="success"
                          overlap
                          class="clip-badge"
                        >
                          <template #badge><v-icon size="14">mdi-check</v-icon></template>
                          <v-btn icon variant="text" size="small" :disabled="!getEntidadId('arl')" @click="abrirDialogoCertificado('arl')">
                            <v-icon>mdi-paperclip</v-icon>
                          </v-btn>
                        </v-badge>
                      </template>
                    </v-list-item>
                  </v-col>

                  <!-- AFP -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.afp || user.afp">
                    <v-list-item prepend-icon="mdi-piggy-bank">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        AFP
                        <v-tooltip text="ADMINISTRADORA DE FONDO DE PENSIONES" location="top">
                          <template #activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-help-circle-outline" size="16" class="ml-1 text-medium-emphasis" />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>

                      <v-list-item-subtitle class="afiliacion-nombre" :title="primaryContrato?.afp?.nombre || user.afp?.nombre">
                        {{ primaryContrato?.afp?.nombre || user.afp?.nombre }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          v-if="getEntidadId('afp')"
                          :model-value="certs.afp.has"
                          color="success"
                          overlap
                          class="clip-badge"
                        >
                          <template #badge><v-icon size="14">mdi-check</v-icon></template>
                          <v-btn icon variant="text" size="small" :disabled="!getEntidadId('afp')" @click="abrirDialogoCertificado('afp')">
                            <v-icon>mdi-paperclip</v-icon>
                          </v-btn>
                        </v-badge>
                      </template>
                    </v-list-item>
                  </v-col>

                  <!-- AFC -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.afc || user.afc">
                    <v-list-item prepend-icon="mdi-bank-transfer">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        AFC
                        <v-tooltip text="ADMINISTRADORA DE FONDO DE CESANTÍAS" location="top">
                          <template #activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-help-circle-outline" size="16" class="ml-1 text-medium-emphasis" />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>

                      <v-list-item-subtitle class="afiliacion-nombre" :title="primaryContrato?.afc?.nombre || user.afc?.nombre">
                        {{ primaryContrato?.afc?.nombre || user.afc?.nombre }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          v-if="getEntidadId('afc')"
                          :model-value="certs.afc.has"
                          color="success"
                          overlap
                          class="clip-badge"
                        >
                          <template #badge><v-icon size="14">mdi-check</v-icon></template>
                          <v-btn icon variant="text" size="small" :disabled="!getEntidadId('afc')" @click="abrirDialogoCertificado('afc')">
                            <v-icon>mdi-paperclip</v-icon>
                          </v-btn>
                        </v-badge>
                      </template>
                    </v-list-item>
                  </v-col>

                  <!-- CCF -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.ccf || user.ccf">
                    <v-list-item prepend-icon="mdi-family-tree">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        CCF
                        <v-tooltip text="CAJA DE COMPENSACIÓN FAMILIAR" location="top">
                          <template #activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-help-circle-outline" size="16" class="ml-1 text-medium-emphasis" />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>

                      <v-list-item-subtitle class="afiliacion-nombre" :title="primaryContrato?.ccf?.nombre || user.ccf?.nombre">
                        {{ primaryContrato?.ccf?.nombre || user.ccf?.nombre }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          v-if="getEntidadId('ccf')"
                          :model-value="certs.ccf.has"
                          color="success"
                          overlap
                          class="clip-badge"
                        >
                          <template #badge><v-icon size="14">mdi-check</v-icon></template>
                          <v-btn icon variant="text" size="small" :disabled="!getEntidadId('ccf')" @click="abrirDialogoCertificado('ccf')">
                            <v-icon>mdi-paperclip</v-icon>
                          </v-btn>
                        </v-badge>
                      </template>
                    </v-list-item>
                  </v-col>

                  <v-col cols="12" v-if="!primaryContrato && !user.eps && !user.arl && !user.afp && !user.afc && !user.ccf">
                    <div class="text-center text-subtitle-1 text-grey-darken-1">
                      No hay información de seguridad social disponible.
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- Configuraciones -->
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg mt-6 h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon class="mr-1">mdi-account-cog</v-icon>
                  Configuraciones
                </v-card-title>
                <v-row class="pa-4">
                  <v-col cols="12" sm="6">
                    <v-list-item :prepend-icon="user.estado === 'activo' ? 'mdi-account-check' : 'mdi-account-off'">
                      <v-list-item-title class="font-weight-bold">Estado:</v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip :color="user.estado === 'activo' ? 'success' : 'error'" class="font-weight-bold" label small>
                          {{ user.estado }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-list-item :prepend-icon="user.recomendaciones ? 'mdi-lightbulb-on-outline' : 'mdi-lightbulb-off-outline'">
                      <v-list-item-title class="font-weight-bold">Recibe Recomendaciones:</v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip :color="user.recomendaciones ? 'success' : 'warning'" class="font-weight-bold" label small>
                          {{ user.recomendaciones ? 'Sí' : 'No' }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <!-- Recomendación Médica (clip + chulito) -->
                  <v-col cols="12" sm="12">
                    <v-list-item prepend-icon="mdi-heart-pulse">
                      <v-list-item-title class="font-weight-bold">
                        Recomendación Médica (Contrato actual):
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip :color="recContrato.has ? 'success' : 'warning'" class="font-weight-bold" label small>
                          {{ recContrato.has ? 'Cargada' : 'Sin archivo' }}
                        </v-chip>
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          :model-value="recContrato.has"
                          color="success"
                          overlap
                          class="clip-badge"
                        >
                          <template #badge><v-icon size="14">mdi-check</v-icon></template>
                          <v-btn
                            icon
                            variant="text"
                            size="small"
                            :disabled="!contratoIdActual"
                            @click="abrirDialogoRecomendacionContrato()"
                            aria-label="Gestionar recomendación médica"
                          >
                            <v-icon>mdi-paperclip</v-icon>
                          </v-btn>
                        </v-badge>
                      </template>
                    </v-list-item>
                  </v-col>
                  <!-- /Recomendación Médica -->
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider class="my-6" />

        <!-- Contratos -->
        <v-card-title class="text-h5 font-weight-bold text-blue-grey-darken-3 mb-4 d-flex align-center">
          <v-icon class="mr-1">mdi-file-document-outline</v-icon>
          Información de Contratos
        </v-card-title>

        <v-card-text>
          <div v-if="user.contratos && user.contratos.length > 0">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="contrato in user.contratos"
                :key="contrato.id"
                class="rounded-lg mb-4 elevation-2"
              >
                <v-expansion-panel-title>
                  Contrato #{{ contrato.id }} — Tipo: {{ contrato.tipoContrato }}
                  <v-spacer />
                  <v-chip
                    :color="(contrato.estado || '').toLowerCase() === 'activo' ? 'success' : 'error'"
                    class="font-weight-bold"
                    small
                  >
                    {{ contrato.estado }}
                  </v-chip>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <v-tabs v-model="contrato.activeTab" color="primary" align-tabs="center">
                    <v-tab value="detalles">Detalles</v-tab>
                    <v-tab value="eventos">Eventos</v-tab>
                    <v-tab value="fin">Fin</v-tab>
                    <v-tab value="historial">Historial</v-tab>
                  </v-tabs>

                  <v-window v-model="contrato.activeTab" class="pa-4">
                    <!-- Detalles -->
                    <v-window-item value="detalles">
                      <v-list dense>
                        <v-list-item prepend-icon="mdi-calendar-start" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Fecha de Inicio:</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(contrato.fechaInicio) }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-calendar-end" class="mb-2" v-if="contrato.fechaTerminacion">
                          <v-list-item-title class="font-weight-bold">Fecha de Finalización:</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(contrato.fechaTerminacion) }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-city" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Sede:</v-list-item-title>
                          <v-list-item-subtitle>{{ contrato.sede?.nombre || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-briefcase-outline" class="mb-2" v-if="contrato.cargo?.nombre">
                          <v-list-item-title class="font-weight-bold">Cargo del Contrato:</v-list-item-title>
                          <v-list-item-subtitle>{{ contrato.cargo?.nombre }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-card-account-details-outline" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Número de Cédula:</v-list-item-title>
                          <v-list-item-subtitle>{{ contrato.identificacion || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-file-download" class="mb-2" v-if="contrato.rutaArchivoContratoFisico">
                          <v-list-item-title class="font-weight-bold">Contrato Físico:</v-list-item-title>
                          <v-list-item-subtitle>
                            <a
                              :href="toAbsoluteApiUrl(contrato.rutaArchivoContratoFisico)"
                              target="_blank"
                              class="contrato-link"
                            >
                              {{ contrato.nombreArchivoContratoFisico }}
                            </a>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <!-- Recomendaciones Médicas -->
                        <v-list-item prepend-icon="mdi-heart-pulse" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Recomendaciones Médicas:</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip
                              :color="contrato.tieneRecomendacionesMedicas ? 'success' : 'warning'"
                              class="font-weight-bold"
                              label
                              small
                            >
                              {{ contrato.tieneRecomendacionesMedicas ? 'Sí' : 'No' }}
                            </v-chip>

                            <template v-if="contrato.tieneRecomendacionesMedicas && contrato.rutaArchivoRecomendacionMedica">
                              <v-btn
                                :href="toAbsoluteApiUrl(contrato.rutaArchivoRecomendacionMedica)"
                                target="_blank"
                                color="primary"
                                variant="text"
                                size="small"
                                class="ml-2"
                                prepend-icon="mdi-file-eye-outline"
                              >
                                Descargar
                              </v-btn>
                            </template>
                          </v-list-item-subtitle>
                        </v-list-item>
                        <!-- /Recomendaciones Médicas -->
                      </v-list>

                      <v-card-actions class="pa-0 mt-4">
                        <v-btn
                          v-if="(contrato.estado || '').toLowerCase() === 'activo'"
                          color="error"
                          variant="outlined"
                          size="small"
                          prepend-icon="mdi-power-off"
                          @click="confirmarCambioEstadoContrato(contrato.id, 'inactivo')"
                        >
                          Desactivar Contrato
                        </v-btn>
                        <v-btn
                          v-else
                          color="success"
                          variant="outlined"
                          size="small"
                          prepend-icon="mdi-power-on"
                          @click="confirmarCambioEstadoContrato(contrato.id, 'activo')"
                        >
                          Activar Contrato
                        </v-btn>
                      </v-card-actions>
                    </v-window-item>

                    <!-- Eventos -->
                    <v-window-item value="eventos">
                      <v-tabs v-model="contrato.activeSubTab" color="secondary" align-tabs="center" class="mb-4">
                        <v-tab value="inicio">Inicio</v-tab>
                        <v-tab value="desarrollo">Desarrollo</v-tab>
                      </v-tabs>

                      <v-window v-model="contrato.activeSubTab" class="pa-2">
                        <!-- Inicio -->
                        <v-window-item value="inicio">
                          <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                            Pasos de Inicio del Contrato
                          </h4>

                          <div v-if="contrato.pasos && contrato.pasos.length > 0">
                            <v-timeline side="end" density="compact">
                              <v-timeline-item
                                v-for="paso in contrato.pasos"
                                :key="paso.id"
                                dot-color="success"
                                size="small"
                              >
                                <div class="d-flex justify-space-between align-center mb-1">
                                  <div class="d-flex align-center">
                                    <span class="font-weight-bold text-subtitle-1 mr-1">
                                      {{ paso.nombrePaso }} ({{ paso.fase }})
                                    </span>
                                    <!-- ✏️ Lápiz pegado al título -->
                                    <v-btn
                                      icon
                                      variant="text"
                                      size="x-small"
                                      color="info"
                                      class="ml-1"
                                      @click="openEditPasoDialog(contrato.id, paso)"
                                      :aria-label="`Editar ${paso.nombrePaso}`"
                                    >
                                      <v-icon size="16">mdi-pencil</v-icon>
                                    </v-btn>
                                  </div>
                                  <span class="text-caption text-grey-darken-1">
                                    {{ paso.fecha ? formatDate(paso.fecha) : 'Sin fecha' }}
                                  </span>
                                </div>

                                <div class="text-body-2 text-grey-darken-2">
                                  {{ paso.observacion || 'Sin observación' }}
                                </div>

                                <div class="mt-1 text-caption text-grey-darken-1">
                                  Por:
                                  <v-chip v-if="paso.usuario" size="x-small" color="primary" label>
                                    {{ fullName(paso.usuario) }}
                                  </v-chip>
                                  <span v-else>Sistema</span>
                                </div>

                                <div v-if="paso.archivoUrl" class="mt-2">
                                  <a
                                    :href="toAbsoluteApiUrl(paso.archivoUrl)"
                                    target="_blank"
                                    class="text-caption d-flex align-center text-primary"
                                  >
                                    <v-icon size="small" class="mr-1">mdi-file-eye-outline</v-icon>
                                    Ver archivo
                                  </a>
                                </div>
                              </v-timeline-item>
                            </v-timeline>
                          </div>

                          <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                            No hay pasos de inicio registrados para este contrato.
                          </div>
                        </v-window-item>

                        <!-- Desarrollo -->
                        <v-window-item value="desarrollo">
                          <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                            Eventos durante el Contrato
                          </h4>

                          <v-card-actions class="justify-end pa-0 mb-4">
                            <v-btn
                              color="primary"
                              variant="flat"
                              size="small"
                              prepend-icon="mdi-plus"
                              @click="showAddEventDialog(contrato.id)"
                            >
                              Agregar Evento
                            </v-btn>
                          </v-card-actions>

                          <div v-if="contrato.eventos && contrato.eventos.length > 0">
                            <v-timeline side="end" density="compact">
                              <v-timeline-item
                                v-for="evento in contrato.eventos"
                                :key="evento.id"
                                dot-color="primary"
                                size="small"
                              >
                                <div class="d-flex justify-space-between align-center mb-1">
                                  <span class="font-weight-bold text-subtitle-1">
                                    {{ evento.tipo }}
                                  </span>
                                  <v-spacer />
                                  <span class="text-caption text-grey-darken-1">
                                    {{ formatDate(evento.createdAt) }}
                                  </span>
                                </div>

                                <div class="text-body-2 text-grey-darken-2">
                                  {{ evento.descripcion || 'Sin descripción' }}
                                </div>

                                <div class="mt-1 text-caption text-grey-darken-1">
                                  Por:
                                  <v-chip v-if="(evento as any).usuario" size="x-small" color="primary" label>
                                    {{ fullName((evento as any).usuario) }}
                                  </v-chip>
                                  <span v-else>Sistema</span>
                                </div>

                                <div class="mt-2 d-flex justify-end">
                                  <v-btn
                                    icon="mdi-eye"
                                    variant="text"
                                    size="small"
                                    color="info"
                                    @click="viewEventDetails(evento)"
                                    class="mr-2"
                                  />
                                  <v-btn
                                    v-if="evento.documentoUrl"
                                    :href="toAbsoluteApiUrl(evento.documentoUrl)"
                                    target="_blank"
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    prepend-icon="mdi-file-eye-outline"
                                  >
                                    Descargar
                                  </v-btn>
                                </div>
                              </v-timeline-item>
                            </v-timeline>
                          </div>

                          <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                            No hay eventos registrados para este contrato.
                          </div>
                        </v-window-item>
                      </v-window>
                    </v-window-item>

                    <!-- Fin -->
                    <v-window-item value="fin">
                      <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                        Finalización del Contrato
                      </h4>

                      <div v-if="(contrato.estado || '').toLowerCase() === 'inactivo'">
                        <v-alert type="info" variant="tonal" class="mb-4">
                          Este contrato ha sido finalizado.
                        </v-alert>

                        <v-list dense>
                          <v-list-item>
                            <v-list-item-title class="font-weight-bold">Fecha de Finalización:</v-list-item-title>
                            <v-list-item-subtitle>{{ contrato.fechaTerminacion ? formatDate(contrato.fechaTerminacion) : 'N/A' }}</v-list-item-subtitle>
                          </v-list-item>

                          <v-list-item>
                            <v-list-item-title class="font-weight-bold">Motivo de Finalización:</v-list-item-title>
                            <v-list-item-subtitle>{{ contrato.motivoFinalizacion || 'N/A' }}</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </div>

                      <v-form ref="finalizationForm" v-else>
                        <v-row>
                          <v-col cols="12" md="6">
                            <v-text-field
                              v-model="finalizationDate"
                              label="Fecha de Finalización"
                              type="date"
                              variant="outlined"
                              :rules="[v => !!v || 'La fecha de finalización es obligatoria']"
                              required
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-textarea
                              v-model="finalizationReason"
                              label="Motivo de Finalización"
                              variant="outlined"
                              :rules="[v => !!v || 'El motivo de finalización es obligatorio']"
                              required
                            />
                          </v-col>
                        </v-row>

                        <v-card-actions class="justify-end pa-0 mt-4">
                          <v-btn
                            color="error"
                            variant="elevated"
                            prepend-icon="mdi-flag-checkered"
                            @click="confirmFinalizeContract(contrato.id)"
                            :loading="isLoadingAction"
                          >
                            Finalizar Contrato
                          </v-btn>
                        </v-card-actions>
                      </v-form>
                    </v-window-item>

                    <!-- Historial -->
                    <v-window-item value="historial">
                      <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                        Historial del Contrato (estados y cambios)
                      </h4>

                      <div v-if="contrato.timeline?.length">
                        <v-timeline side="end" density="compact">
                          <v-timeline-item
                            v-for="item in contrato.timeline"
                            :key="item.kind + '-' + item.id"
                            :dot-color="item.kind === 'estado'
                              ? (item.newEstado === 'activo' ? 'success' : 'error')
                              : 'secondary'"
                            size="small"
                          >
                            <template v-if="item.kind === 'estado'">
                              <div class="d-flex justify-space-between align-center mb-1">
                                <span class="font-weight-bold text-subtitle-1">
                                  Cambio de Estado: {{ getEstadoNombre(item.oldEstado) }} → {{ getEstadoNombre(item.newEstado) }}
                                </span>
                                <span class="text-caption text-grey-darken-1">{{ formatDate(item.fechaCambio) }}</span>
                              </div>

                              <v-list density="compact" class="pl-0">
                                <v-list-item v-if="item.fechaInicioContrato">
                                  <v-list-item-title class="text-caption font-weight-bold">Inicio del Contrato:</v-list-item-title>
                                  <v-list-item-subtitle class="text-caption">
                                    {{ formatDate(item.fechaInicioContrato) }}
                                  </v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="item.motivo">
                                  <v-list-item-title class="text-caption font-weight-bold">Motivo del Cambio:</v-list-item-title>
                                  <v-list-item-subtitle class="text-caption">
                                    {{ item.motivo }}
                                  </v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item>
                                  <v-list-item-title class="text-caption font-weight-bold">Realizado por:</v-list-item-title>
                                  <v-list-item-subtitle class="text-caption">
                                    <v-chip v-if="item.usuario" size="x-small" color="primary" label>
                                      {{ fullName(item.usuario) }}
                                    </v-chip>
                                    <span v-else>Sistema</span>
                                  </v-list-item-subtitle>
                                </v-list-item>
                              </v-list>
                            </template>

                            <template v-else>
                              <div class="d-flex justify-space-between align-center mb-1">
                                <span class="font-weight-bold text-subtitle-1 d-flex align-center">
                                  {{ labelCampo(item.campo) }}
                                  <v-tooltip
                                    v-if="ABBREV_TOOLTIPS[item.campo]"
                                    :text="ABBREV_TOOLTIPS[item.campo]"
                                    location="top"
                                  >
                                    <template #activator="{ props }">
                                      <v-icon
                                        v-bind="props"
                                        icon="mdi-help-circle-outline"
                                        size="16"
                                        class="ml-1 text-medium-emphasis"
                                        :aria-label="`¿Qué es {{ labelCampo(item.campo) }}?`"
                                      />
                                    </template>
                                  </v-tooltip>
                                </span>
                                <span class="text-caption text-grey-darken-1">{{ formatDate(item.createdAt) }}</span>
                              </div>

                              <div class="text-body-2 text-grey-darken-2">
                                <div class="mb-1">
                                  <strong>De:</strong>
                                  <span>{{ renderValor(item.campo, item.oldValue, contrato) }}</span>
                                </div>
                                <div>
                                  <strong>A:</strong>
                                  <span>{{ renderValor(item.campo, item.newValue, contrato) }}</span>
                                </div>
                              </div>

                              <div class="mt-2">
                                <small class="text-grey-darken-1">
                                  Por:
                                  <v-chip v-if="item.usuario" size="x-small" color="primary" label>
                                    {{ fullName(item.usuario) }}
                                  </v-chip>
                                  <span v-else>Sistema</span>
                                </small>
                              </div>
                            </template>
                          </v-timeline-item>
                        </v-timeline>
                      </div>

                      <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                        No hay historial registrado para este contrato.
                      </div>
                    </v-window-item>
                  </v-window>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
            Este usuario no tiene contratos registrados.
          </div>
        </v-card-text>

        <v-card-actions class="justify-end pt-8">
          <v-btn
            color="blue-grey-darken-2"
            @click="goBack"
            class="mr-4 text-white rounded-pill"
            size="large"
            elevation="4"
          >
            <v-icon class="mr-1">mdi-arrow-left</v-icon>
            Volver
          </v-btn>
          <v-btn
            color="primary"
            @click="openEditUserDialog"
            class="rounded-pill"
            size="large"
            elevation="4"
          >
            <v-icon class="mr-1">mdi-pencil</v-icon>
            Editar Perfil
          </v-btn>
        </v-card-actions>
      </div>

      <!-- Diálogo Foto -->
      <v-dialog v-model="showPhotoDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-camera</v-icon>
            Cambiar Foto de Perfil
          </v-card-title>
          <v-card-text class="py-4">
            <v-file-input
              v-model="profilePhotoFiles"
              ref="fileInputRef"
              label="Seleccionar nueva foto"
              prepend-icon="mdi-camera"
              accept="image/*"
              variant="outlined"
              :clearable="true"
              :rules="[v => ((Array.isArray(v) ? v.length : !!v) || 'Debe seleccionar una imagen.')]"
              :loading="isLoadingAction"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="closePhotoDialog" :disabled="isLoadingAction">
              Cancelar
            </v-btn>
            <v-btn color="primary" variant="elevated" @click="uploadProfilePhoto" :disabled="isLoadingAction">
              Subir Foto
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo Editar Usuario -->
      <v-dialog v-model="showEditUserDialog" max-width="800px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-pencil</v-icon>
            Editar Perfil
          </v-card-title>
          <v-card-text class="py-4">
            <v-form ref="userForm">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editedUser.nombres" label="Nombres" variant="outlined" :rules="[v => !!v || 'El nombre es obligatorio']" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editedUser.apellidos" label="Apellidos" variant="outlined" :rules="[v => !!v || 'El apellido es obligatorio']" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editedUser.celularPersonal" label="Celular Personal" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editedUser.celularCorporativo" label="Celular Corporativo" variant="outlined" />
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="editedUser.direccion" label="Dirección" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox v-model="editedUser.recomendaciones" label="Recibir recomendaciones" />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="closeEditUserDialog" :disabled="isLoadingAction">Cancelar</v-btn>
            <v-btn color="primary" variant="elevated" @click="submitEditUser" :loading="isLoadingAction">Guardar Cambios</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo Agregar Evento -->
      <v-dialog v-model="showAddEventDialogForContrato" max-width="600px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-plus-circle</v-icon>
            Agregar Evento a Contrato #{{ contratoIdForNewEvent }}
          </v-card-title>
          <v-card-text class="py-4">
            <v-form ref="eventForm">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="newEvent.tipo"
                    :items="tiposEvento"
                    item-title="label"
                    item-value="value"
                    label="Tipo de Evento"
                    variant="outlined"
                    :rules="[v => !!v || 'El tipo de evento es obligatorio']"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="newEvent.subtipo" label="Subtipo (opcional)" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newEvent.fechaInicio"
                    label="Fecha de Inicio"
                    type="date"
                    variant="outlined"
                    :rules="[v => !!v || 'La fecha de inicio es obligatoria']"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="newEvent.fechaFin" label="Fecha de Fin (opcional)" type="date" variant="outlined" />
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="newEvent.descripcion" label="Descripción (opcional)" variant="outlined" />
                </v-col>
                <v-col cols="12">
                  <v-file-input
                    v-model="eventFiles"
                    ref="eventFileRef"
                    label="Documento adjunto (PDF, JPG, PNG, WEBP)"
                    prepend-icon="mdi-paperclip"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    variant="outlined"
                    show-size
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="closeAddEventDialog" :disabled="isLoadingAction">Cancelar</v-btn>
            <v-btn color="primary" variant="elevated" @click="submitNewEvent" :loading="isLoadingAction">Guardar Evento</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo Detalle Evento -->
      <v-dialog v-model="showEventDetailsDialog" max-width="500px">
        <v-card v-if="selectedEvent">
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-information-outline</v-icon>
            Detalles del Evento: {{ selectedEvent.tipo }}
          </v-card-title>
          <v-card-text class="py-4">
            <v-list dense>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Tipo:</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.tipo }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.subtipo">
                <v-list-item-title class="font-weight-bold">Subtipo:</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.subtipo }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Fecha de Inicio:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedEvent.fechaInicio) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.fechaFin">
                <v-list-item-title class="font-weight-bold">Fecha de Fin:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedEvent.fechaFin) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.descripcion">
                <v-list-item-title class="font-weight-bold">Descripción:</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.descripcion }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.documentoUrl">
                <v-list-item-subtitle>
                  <a :href="toAbsoluteApiUrl(selectedEvent.documentoUrl)" target="_blank">Ver Documento</a>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Creado el:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedEvent.createdAt) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Creado por:</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip v-if="(selectedEvent as any).usuario" size="x-small" color="primary" label>
                    {{ fullName((selectedEvent as any).usuario) }}
                  </v-chip>
                  <span v-else>Sistema</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="showEventDetailsDialog = false">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo EDITAR PASO -->
      <v-dialog v-model="showEditPasoDialog" max-width="640px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-pencil</v-icon>
            Editar Paso de Inicio
          </v-card-title>

          <v-card-text class="py-4">
            <v-form ref="editPasoForm">
              <!-- 📝 Observación -->
              <v-textarea v-model="pasoEditData.observacion" label="Observación" variant="outlined" rows="3" class="mb-3" />

              <!-- 📎 Archivo actual (si existe) -->
              <v-alert
                v-if="pasoDialogMeta.has"
                type="success"
                variant="tonal"
                class="mb-3"
              >
                <div class="d-flex flex-wrap align-center ga-2">
                  <div><strong>Actual:</strong> {{ pasoDialogMeta.nombre || 'Archivo cargado' }}</div>
                </div>
              </v-alert>

              <!-- 👉 Reemplazar archivo -->
              <v-file-input
                v-model="editPasoFiles"
                ref="editPasoFileRef"
                label="Seleccionar archivo (PDF/JPG/PNG/WEBP)"
                variant="outlined"
                density="compact"
                show-size
                prepend-icon="mdi-paperclip"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                class="mb-1"
              />
              <div class="text-caption mt-1 text-grey-darken-1">
                Si adjuntas un archivo nuevo, reemplazará el existente.
              </div>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" color="grey-darken-1" @click="closeEditPasoDialog" :disabled="isLoadingAction">Cerrar</v-btn>
            <v-btn
              v-if="pasoDialogMeta.has"
              variant="tonal"
              prepend-icon="mdi-file-eye-outline"
              @click="verArchivoPasoActual"
            >
              Descargar
            </v-btn>
            <v-btn
              v-if="pasoDialogMeta.has"
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="eliminarArchivoPasoActual"
              :disabled="isLoadingAction"
            >
              Eliminar
            </v-btn>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="submitEditPaso" :loading="isLoadingAction">
              {{ pasoDialogMeta.has ? 'Reemplazar' : 'Subir' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Alertas (queda, pero se usa snackbar) -->
      <v-dialog v-model="showAlertDialog" max-width="400px">
        <v-card>
          <v-card-title class="text-h6 bg-primary text-white">{{ alertDialogTitle }}</v-card-title>
        </v-card>
        <v-card-text class="py-4">{{ alertDialogMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showAlertDialog = false">Aceptar</v-btn>
        </v-card-actions>
      </v-dialog>

      <!-- Confirmaciones -->
      <v-dialog v-model="showConfirmDialog" max-width="400px">
        <v-card>
          <v-card-title class="text-h6 bg-warning text-white">{{ confirmDialogTitle }}</v-card-title>
          <v-card-text class="py-4">{{ confirmDialogMessage }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="confirmDialogCallback(false)">Cancelar</v-btn>
            <v-btn color="primary" @click="confirmDialogCallback(true)">Confirmar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo Certificado (por CONTRATO + tipo) -->
      <v-dialog v-model="certDialog.open" max-width="640px">
        <v-card>
          <v-card-title class="text-h6">
            {{ certDialog.entidadNombre ? certDialog.entidadNombre : 'Entidad' }} — Certificado ({{ certDialog.tipo?.toUpperCase() }})
          </v-card-title>
          <v-card-text>
            <v-alert v-if="certDialog.loading" type="info" variant="tonal" class="mb-3">
              Cargando información del certificado...
            </v-alert>

            <div v-else>
              <v-alert v-if="certTieneArchivo" type="success" variant="tonal" class="mb-3">
                <div class="d-flex flex-wrap align-center ga-2">
                  <div>
                    <strong>Actual:</strong>
                    {{ certDialog.meta?.data?.nombreOriginal || certDialog.meta?.nombreOriginal || 'Archivo cargado' }}
                  </div>
                  <div v-if="certDialog.meta?.data?.fechaEmision || certDialog.meta?.fechaEmision">
                    • Emisión: {{ formatFechaOrFechaHora(certDialog.meta?.data?.fechaEmision || certDialog.meta?.fechaEmision) }}
                  </div>
                  <div v-if="certDialog.meta?.data?.fechaExpiracion || certDialog.meta?.fechaExpiracion">
                    • Expira: {{ formatFechaOrFechaHora(certDialog.meta?.data?.fechaExpiracion || certDialog.meta?.fechaExpiracion) }}
                  </div>
                </div>
              </v-alert>

              <v-file-input
                v-model="certDialog.file"
                label="Seleccionar archivo (PDF/JPG/PNG/WEBP)"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                variant="outlined"
                density="compact"
                prepend-icon="mdi-paperclip"
                show-size
                class="mb-3"
              />
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" color="grey-darken-1" @click="cerrarCertDialog">Cerrar</v-btn>
            <v-btn v-if="certTieneArchivo" variant="tonal" prepend-icon="mdi-file-eye-outline" @click="verCertificadoSeleccionado"> Descargar</v-btn>
            <v-btn v-if="certTieneArchivo" variant="tonal" color="error" prepend-icon="mdi-delete" @click="eliminarCertificadoSeleccionado">Eliminar</v-btn>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" :disabled="!certDialog.file || certDialog.loading" @click="subirCertificadoSeleccionado">
              {{ certTieneArchivo ? 'Reemplazar' : 'Subir' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo Recomendación Médica (POR CONTRATO) -->
      <v-dialog v-model="recDialog.open" max-width="640px">
        <v-card>
          <v-card-title class="text-h6">
            Recomendación Médica — Contrato #{{ contratoIdActual || '—' }}
          </v-card-title>

        <v-card-text>
            <v-alert v-if="recDialog.loading" type="info" variant="tonal" class="mb-3">
              Cargando información…
            </v-alert>

            <div v-else>
              <v-alert v-if="recTieneArchivo" type="success" variant="tonal" class="mb-3">
                <div class="d-flex flex-wrap align-center ga-2">
                  <div><strong>Actual:</strong> {{ recDialog.meta?.nombreOriginal || 'Archivo cargado' }}</div>
                </div>
              </v-alert>

              <v-file-input
                v-model="recDialog.file"
                label="Seleccionar archivo (PDF/JPG/PNG/WEBP)"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                variant="outlined"
                density="compact"
                prepend-icon="mdi-paperclip"
                show-size
                class="mb-3"
              />
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" color="grey-darken-1" @click="cerrarRecDialog">Cerrar</v-btn>
            <v-btn v-if="recTieneArchivo" variant="tonal" prepend-icon="mdi-file-eye-outline" @click="verRecomendacionMedicaContrato">Descargar</v-btn>
            <v-btn v-if="recTieneArchivo" variant="tonal" color="error" prepend-icon="mdi-delete" @click="eliminarRecomendacionMedicaContrato">Eliminar</v-btn>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" :disabled="!recDialog.file || recDialog.loading || !contratoIdActual" @click="subirRecomendacionMedicaContrato">
              {{ recTieneArchivo ? 'Reemplazar' : 'Subir' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 🟦 Snackbar con cabecera azul y cuerpo blanco -->
      <v-snackbar v-model="snack.open" timeout="1500" location="top">
        <div class="snackbar-card">
          <div class="snackbar-header">{{ snack.title }}</div>
          <div class="snackbar-body">{{ snack.text }}</div>
        </div>
      </v-snackbar>

    </v-card>
  </v-container>
</template><script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

/* ===== Servicios base usuario/contrato ===== */
import {
  obtenerUsuarioPorId,
  uploadProfilePicture,
  actualizarUsuario,
  type User,
  type Contrato as BaseContrato
} from '@/services/userService'

import {
  actualizarContrato,
  /* ✅ Recomendación Médica (POR CONTRATO) */
  obtenerRecomendacionMedicaMeta as obtenerRecMetaContrato,
  subirRecomendacionMedica as subirRecContrato,
  eliminarRecomendacionMedica as eliminarRecContrato,
  obtenerUrlPublicaRecomendacionDesdeRuta as urlPublicaRecDesdeRuta,

  /* ✅ Afiliaciones por CONTRATO (EPS/ARL/AFP/AFC/CCF) */
  obtenerAfiliacionArchivoMeta as obtenerArchivoAfiliacionMeta,
  subirAfiliacionArchivo as subirArchivoAfiliacion,
  eliminarAfiliacionArchivo as eliminarArchivoAfiliacion,
  tieneArchivoAfiliacion,
  type TipoAfiliacion
} from '@/services/contratoService'

import {
  crearEventoDeContrato,
  type ContratoEvento
} from '@/services/contratoEventosService'

import {
  actualizarPasoContrato,
  fetchPasosInicio,
  type ContratoPaso
} from '@/services/contratosPasosService'

import type { ContratoHistorialEstado } from '@/services/contratoHistorialEstadosService'

/* ===== Tipos locales ===== */
interface Rel { id: number; nombre: string }
interface CambioUsuario { id: number; nombres: string; apellidos: string; correo?: string }
interface ContratoCambio {
  id: number; contratoId: number; usuarioId: number | null; usuario?: CambioUsuario | null
  campo: string; oldValue: any; newValue: any; createdAt: string
}
type ContratoEventoExt = ContratoEvento & { usuario?: CambioUsuario | null }
type ContratoPasoExt = ContratoPaso & { usuario?: CambioUsuario | null }
type TimelineItemEstado = (ContratoHistorialEstado & { usuario?: CambioUsuario | null }) & { kind: 'estado' }
type TimelineItemCambio = ContratoCambio & { kind: 'cambio' }
type TimelineItem = TimelineItemEstado | TimelineItemCambio

interface Contrato extends BaseContrato {
  identificacion?: string
  cargo?: Rel | null
  sede?: Rel | null
  eps?: Rel | null
  arl?: Rel | null
  afp?: Rel | null
  afc?: Rel | null
  ccf?: Rel | null
  fechaTerminacion?: string | null
  activeTab?: string
  activeSubTab?: string
  eventos?: ContratoEventoExt[]
  pasos?: ContratoPasoExt[]
  historialEstados?: (ContratoHistorialEstado & { usuario?: CambioUsuario | null })[]
  cambios?: ContratoCambio[]
  timeline?: TimelineItem[]
  fechaFinalizacion?: string | null
  motivoFinalizacion?: string | null
  tieneRecomendacionesMedicas?: boolean
  rutaArchivoRecomendacionMedica?: string | null
}
interface UserProfile extends User { contratos?: Contrato[] }
interface UserEditForm {
  nombres: string; apellidos: string; celularPersonal?: string; celularCorporativo?: string; direccion?: string; recomendaciones?: boolean
}

/* ===== Helpers fecha ===== */
function parseYMDLocal(s: string): Date | null {
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec((s||'').trim())
  return m?new Date(+m[1],+m[2]-1,+m[3],0,0,0):null
}
function coerceToDate(v:any):Date|null{
  if(!v) return null
  if(v instanceof Date) return isNaN(v.getTime())?null:v
  if(typeof v==='string'){ return parseYMDLocal(v)??(isNaN(new Date(v).getTime())?null:new Date(v)) }
  return null
}
const fmtFecha = new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'2-digit',year:'numeric'})
const fmtFechaHora = new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})
function formatFecha(v:any){ const d=coerceToDate(v); return d?fmtFecha.format(d):'—' }
function formatFechaHora(v:any){ const d=coerceToDate(v); return d?fmtFechaHora.format(d).replace(',',''):'—' }
function formatFechaOrFechaHora(v:any){
  const hasTime= typeof v==='string' && (/[T ]\d{2}:\d{2}/.test(v));
  return hasTime?formatFechaHora(v):formatFecha(v)
}

/* formateo corto para algunas fechas del template */
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  const d = new Date(dateString as string)
  return Number.isNaN(d.getTime()) ? String(dateString) : d.toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})
}

/* ====== Helper URL absoluta ====== */
function toAbsoluteApiUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return ''
  const url = String(pathOrUrl)
  if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url
  const base = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || 'http://localhost:3333'
  return `${base.replace(/\/+$/,'')}/${url.replace(/^\/+/,'')}`
}

const router = useRouter()
const route = useRoute()

const user = ref<UserProfile | null>(null)
const isLoadingUser = ref(true)
const error = ref<string | null>(null)
const isLoadingAction = ref(false)

/** Actor logueado */
const actorId = computed<number | null>(() => {
  const tryNum = (k: string) => {
    const v = localStorage.getItem(k) ?? sessionStorage.getItem(k)
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return tryNum('actorId') ?? tryNum('authUserId') ?? tryNum('userId') ?? null
})

/* Tooltips */
const ABBREV_TOOLTIPS: Record<string,string> = {
  epsId:'ENTIDAD PRESTADORA DE SERVICIOS DE SALUD',
  arlId:'ADMINISTRADORA DE RIESGOS LABORALES',
  afpId:'ADMINISTRADORA DE FONDO DE PENSIONES',
  afcId:'ADMINISTRADORA DE FONDO DE CESANTÍAS',
  ccfId:'CAJA DE COMPENSACIÓN FAMILIAR',
}

/* ====== v-model para file inputs ====== */
const profilePhotoFiles = ref<File[] | File | null>(null)
const eventFiles = ref<File[] | File | null>(null)
const editPasoFiles = ref<File[] | File | null>(null)

/* Dialogs/refs */
const showPhotoDialog = ref(false)
const fileInputRef = ref<any>(null)
const showEditUserDialog = ref(false)
const editedUser = ref<Partial<UserEditForm>>({})
const userForm = ref<any>(null)

const showAddEventDialogForContrato = ref(false)
const contratoIdForNewEvent = ref<number | null>(null)
const newEvent = ref<Partial<ContratoEvento>>({})
const eventFileRef = ref<any>(null)
const eventForm = ref<any>(null)

/** 🔁 Tipos de evento (UI label → value en minúsculas para backend) */
const tiposEvento = [
  { label: 'Incapacidad',  value: 'incapacidad' },
  { label: 'Suspensión',   value: 'suspension' },
  { label: 'Licencia',     value: 'licencia' },
  { label: 'Permiso',      value: 'permiso' },
  { label: 'Vacaciones',   value: 'vacaciones' },
  { label: 'Cesantías',    value: 'cesantias' },
  { label: 'Disciplinario',value: 'disciplinario' },
  { label: 'Terminación',  value: 'terminacion' },
]

const showAlertDialog = ref(false)
const alertDialogTitle = ref('')
const alertDialogMessage = ref('')
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogCallback = ref((confirmed:boolean)=>{})

const showEventDetailsDialog = ref(false)
const selectedEvent = ref<ContratoEventoExt | null>(null)

const finalizationDate = ref<string | null>(null)
const finalizationReason = ref<string | null>(null)
const finalizationForm = ref<any>(null)

/* Editar paso */
const showEditPasoDialog = ref(false)
const editPasoForm = ref<any>(null)
const editPasoFileRef = ref<any>(null)
const pasoEditData = ref<{observacion?:string}>({ })
const contratoIdForPasoEdit = ref<number | null>(null)
const pasoIdForEdit = ref<number | null>(null)

/* 🔎 Meta del archivo del paso (para “Actual/Descargar/Eliminar”) */
const pasoDialogMeta = ref<{ has:boolean; nombre:string; url:string }>(
  { has:false, nombre:'', url:'' }
)

/* ===== Helper: contrato prioritario ===== */
function pickPrimaryContrato(list: any[]): any | null {
  const cs = (list || []).filter(Boolean)
  if (!cs.length) return null
  const ts = (d:any) => {
    if (!d) return 0
    const t = new Date(d).getTime()
    return Number.isFinite(t) ? t : 0
  }
  const activos = cs.filter((c:any)=> (c.estado || '').toLowerCase() === 'activo')
  if (activos.length) return activos.slice().sort((a:any,b:any)=> ts(b.fechaInicio)-ts(a.fechaInicio))[0]
  return cs.slice().sort((a:any,b:any)=> ts(b.fechaInicio)-ts(a.fechaInicio))[0]
}

/* ===== Contrato prioritario reactivo ===== */
const primaryContrato = computed<Contrato | null>(() => {
  const cs = user.value?.contratos || []
  if (!cs.length) return null
  return pickPrimaryContrato(cs) as Contrato | null
})

/* ===== Recomendación Médica (POR CONTRATO) ===== */
const recContrato = ref<{ has: boolean; loading: boolean; meta: any | null }>({
  has: false, loading: false, meta: null,
})
const recDialog = ref<{
  open: boolean
  file: File | File[] | null
  fechaEmision: string
  fechaExpiracion: string
  loading: boolean
  meta: any
}>({
  open: false, file: null, fechaEmision: '', fechaExpiracion: '', loading: false, meta: null,
})
/** contrato activo (id) */
const contratoIdActual = computed<number | null>(() => primaryContrato.value?.id ?? null)
/** ¿hay archivo actualmente en el diálogo? */
const recTieneArchivo = computed(() => !!recDialog.value?.meta?.url || !!recDialog.value?.meta?.path)

/* ===== Estado visual de certificados (afiliaciones por CONTRATO) ===== */
type AfiliacionTipoLocal = TipoAfiliacion
const certs = ref<Record<AfiliacionTipoLocal, { has: boolean; loading: boolean; meta: any | null }>>({
  eps: { has: false, loading: false, meta: null },
  arl: { has: false, loading: false, meta: null },
  afp: { has: false, loading: false, meta: null },
  afc: { has: false, loading: false, meta: null },
  ccf: { has: false, loading: false, meta: null },
})

const certDialog = ref<{
  open: boolean
  tipo: AfiliacionTipoLocal | ''
  entidadId: number | null
  entidadNombre: string
  file: File | File[] | null
  fechaEmision: string
  fechaExpiracion: string
  loading: boolean
  meta: any
}>({
  open: false, tipo: '', entidadId: null, entidadNombre: '', file: null,
  fechaEmision: '', fechaExpiracion: '', loading: false, meta: null,
})

const certTieneArchivo = computed(()=> {
  try { return tieneArchivoAfiliacion(certDialog.value.meta) } catch { return false }
})

// Helper: id de usuario actual (solo para actualizar perfil/foto)
const currentUserId = () => Number(user.value?.id ?? NaN) || null

/* ======== SNACKBAR (cabecera azul + cuerpo blanco) ======== */
const snack = ref<{open:boolean; title:string; text:string; timeout:number}>({
  open: false, title: '', text: '', timeout: 3000
})
const showSnack = (title:string, text:string, timeout=3000)=>{
  snack.value = { open:true, title, text, timeout }
}

/* ===== Utils generales ===== */
const showAlert = (title:string, message:string) => {
  showSnack(title, message)
}
const showConfirm = (title:string, message:string):Promise<boolean> => {
  confirmDialogTitle.value = title
  confirmDialogMessage.value = message
  showConfirmDialog.value = true
  return new Promise((resolve)=>{
    confirmDialogCallback.value = (ok:boolean)=>{
      showConfirmDialog.value = false
      resolve(ok)
    }
  })
}
const getEstadoNombre = (e:'activo'|'inactivo') => e === 'activo' ? 'Activo' : 'Inactivo'
const fullName = (u?:{nombres?:string; apellidos?:string|null}|null) => u ? [u.nombres,u.apellidos].filter(Boolean).join(' ') : '—'

/* ======= Render limpio en HISTORIAL ======= */
const CAMPO_LABELS: Record<string,string> = {
  razonSocialId:'Empresa', sedeId:'Sede', cargoId:'Cargo', funcionesCargo:'Funciones',
  tipoContrato:'Tipo de Contrato', terminoContrato:'Término', fechaInicio:'Fecha de Inicio',
  fechaTerminacion:'Fecha de Terminación', periodoPrueba:'Periodo de Prueba', horarioTrabajo:'Horario de Trabajo',
  centroCosto:'Centro de Costo', epsId:'EPS', arlId:'ARL', afpId:'AFP', afcId:'AFC', ccfId:'CCF',
  estado:'Estado', motivoFinalizacion:'Motivo de Finalización', tieneRecomendacionesMedicas:'Recomendaciones médicas',
  salarioBasico:'Salario básico', bonoSalarial:'Bono salarial', auxilioTransporte:'Auxilio transporte', auxilioNoSalarial:'Auxilio no salarial', creacion:'Creación',
}
const labelCampo = (c:string)=> CAMPO_LABELS[c] || c

const parseMaybeJson = (v:any)=>{ if(v===null||v===undefined) return v; if(typeof v==='string'){ try{return JSON.parse(v)}catch{return v } } return v }
const isNamedRel = (val:any): val is { id?: number|string; nombre?: string } => !!val && typeof val==='object' && ('nombre' in val || 'id' in val)
const toNumberLoose = (v:any)=>{ if(v===null||v===undefined||v==='') return null; if(typeof v==='number') return Number.isFinite(v)?v:null; if(typeof v==='string'){ const s=v.replace(/\./g,'').replace(/,/g,'.').trim(); const n = Number(s); return Number.isFinite(n)?n:null } return null }
const toBoolLoose = (v:any)=>{ if(v===null||v===undefined||v==='') return null; if(typeof v==='boolean') return v; if(typeof v==='string'){ const s=v.toLowerCase().trim(); if(['true','1','si','sí'].includes(s)) return true; if(['false','0','no'].includes(s)) return false } return null }

/** Compara valores antiguos/nuevos evitando falsos positivos */
const equalForField = (campo:string,a:any,b:any)=>{
  const va=parseMaybeJson(a); const vb=parseMaybeJson(b)
  if(campo==='tieneRecomendacionesMedicas'){ return toBoolLoose(va)===toBoolLoose(vb)}
  if(['salarioBasico','bonoSalarial','auxilioTransporte','auxilioNoSalarial'].includes(campo)){ return toNumberLoose(va)===toNumberLoose(vb)}
  if(campo.endsWith('Id')){
    const idA=isNamedRel(va)?Number(va.id):Number(va)
    const idB=isNamedRel(vb)?Number(vb.id):Number(vb)
    if(!Number.isNaN(idA)&&!Number.isNaN(idB)) return idA===idB
    return JSON.stringify(va)===JSON.stringify(vb)
  }
  return (va??null)===(vb??null)
}

/** Render amigable del valor según el tipo de campo */
const renderValor = (campo:string, raw:any, contrato?:Contrato)=>{
  const v=parseMaybeJson(raw)
  if(v===null||v===undefined||v==='') return 'N/A'
  if(campo.endsWith('Id') && isNamedRel(v)) return v.nombre ?? `#${v.id ?? ''}`
  if(campo.endsWith('Id')){
    const id= typeof v==='number'?v:Number(v)
    const nameMatch = (()=> {
      if(campo==='epsId' && contrato?.eps?.id===id) return contrato.eps.nombre
      if(campo==='arlId' && contrato?.arl?.id===id) return contrato.arl.nombre
      if(campo==='afpId' && contrato?.afp?.id===id) return contrato.afp.nombre
      if(campo==='afcId' && contrato?.afc?.id===id) return contrato.afc.nombre
      if(campo==='ccfId' && contrato?.ccf?.id===id) return contrato.ccf.nombre
      if(campo==='sedeId' && contrato?.sede?.id===id) return contrato.sede.nombre
      if(campo==='cargoId' && contrato?.cargo?.id===id) return contrato.cargo.nombre
      return null
    })()
    return nameMatch ? nameMatch : `#${isNaN(id) ? String(v) : id}`
  }
  if(campo.startsWith('fecha')) return typeof v==='string' ? formatFecha(v) : formatFecha(String(v))
  if(campo==='estado') return v==='activo' ? 'Activo' : (v==='inactivo' ? 'Inactivo' : String(v))
  if(typeof v==='boolean') return v ? 'Sí' : 'No'
  if(typeof v==='number') return new Intl.NumberFormat('es-CO').format(v)
  if(typeof v==='object'){
    if ('nombre' in v) return (v as any).nombre
    if ('valor' in v) return String((v as any).valor)
    try { return JSON.stringify(v) } catch { return String(v) }
  }
  return String(v)
}

/* Timeline combinado (estados + cambios) — sin duplicados del campo "estado" */
const buildTimeline = (c: Contrato): TimelineItem[] => {
  const items: TimelineItem[] = []

  const estados = (c.historialEstados || []).map(h => ({ ...h, kind: 'estado' as const }))
  const cambios = (c.cambios || []).map(ch => ({
    ...ch,
    oldValue: parseMaybeJson(ch.oldValue),
    newValue: parseMaybeJson(ch.newValue),
    kind: 'cambio' as const,
  }))

  // 1) Siempre incluimos los eventos específicos de estado
  items.push(...estados)

  // 2) Separamos los cambios del campo "estado"
  const cambiosEstado = cambios.filter(ch => ch.campo === 'estado')
  const cambiosNoEstado = cambios.filter(ch => ch.campo !== 'estado')

  // 3) Si NO hay historialEstados, promovemos cambios.estado a eventos de estado
  if (estados.length === 0 && cambiosEstado.length > 0) {
    for (const ch of cambiosEstado) {
      const oldE = typeof ch.oldValue === 'string' ? ch.oldValue : String(ch.oldValue ?? '')
      const newE = typeof ch.newValue === 'string' ? ch.newValue : String(ch.newValue ?? '')
      items.push({
        kind: 'estado',
        id: Number.isFinite(+ch.id) ? (ch.id as any) : Date.now(),
        contratoId: c.id,
        oldEstado: oldE as any,
        newEstado: newE as any,
        fechaCambio: ch.createdAt,
        usuario: ch.usuario ?? null,
      } as any)
    }
  }

  // 4) Añadimos el resto de cambios (excluyendo "estado") evitando falsos positivos
  for (const ch of cambiosNoEstado) {
    if (!equalForField(ch.campo, ch.oldValue, ch.newValue)) items.push(ch as any)
  }

  // 5) Orden descendente por fecha
  return items.sort((a, b) => {
    const ta = new Date(a.kind === 'estado' ? (a as any).fechaCambio : (a as any).createdAt).getTime()
    const tb = new Date(b.kind === 'estado' ? (b as any).fechaCambio : (b as any).createdAt).getTime()
    return tb - ta
  })
}

/* ===== Helpers archivo ===== */
function firstFileFrom(model: File | File[] | null | undefined): File | null {
  if (!model) return null
  return Array.isArray(model) ? (model[0] ?? null) : model
}

/* ===== Recomendación Médica (funciones por CONTRATO) ===== */
function cerrarRecDialog(){
  recDialog.value = { open:false, file:null, fechaEmision:'', fechaExpiracion:'', loading:false, meta:null }
}

async function refreshRecStatusForContrato() {
  const cid = contratoIdActual.value
  recContrato.value.loading = true
  try {
    if (!cid) {
      recContrato.value = { has:false, loading:false, meta:null }
      const pc = primaryContrato.value
      if (pc) {
        pc.tieneRecomendacionesMedicas = false
        pc.rutaArchivoRecomendacionMedica = null
      }
      return
    }
    const meta = await obtenerRecMetaContrato(cid)
    recContrato.value.meta = meta
    recContrato.value.has = !!meta

    const pc = primaryContrato.value
    if (pc) {
      pc.tieneRecomendacionesMedicas = !!meta
      pc.rutaArchivoRecomendacionMedica =
        meta?.url || urlPublicaRecDesdeRuta(meta?.path) || null
    }
  } catch (e) {
    console.error('No se pudo refrescar Recomendación Médica (contrato):', e)
    recContrato.value.meta = null
    recContrato.value.has = false
    const pc = primaryContrato.value
    if (pc) {
      pc.tieneRecomendacionesMedicas = false
      pc.rutaArchivoRecomendacionMedica = null
    }
  } finally {
    recContrato.value.loading = false
  }
}

async function abrirDialogoRecomendacionContrato(){
  recDialog.value.open = true
  recDialog.value.loading = true
  try {
    const cid = contratoIdActual.value
    if (!cid) throw new Error('No hay contrato activo.')
    const meta = await obtenerRecMetaContrato(cid)
    recDialog.value.meta = meta
    recContrato.value.meta = meta
    recContrato.value.has = !!meta

    const pc = primaryContrato.value
    if (pc) {
      pc.tieneRecomendacionesMedicas = !!meta
      pc.rutaArchivoRecomendacionMedica =
        meta?.url || urlPublicaRecDesdeRuta(meta?.path) || null
    }
  } catch (e) {
    console.error('Error cargando meta Recomendación Médica (contrato):', e)
    recDialog.value.meta = null
    recContrato.value.meta = null
    recContrato.value.has = false
  } finally {
    recDialog.value.loading = false
  }
}

async function subirRecomendacionMedicaContrato(){
  const cid = contratoIdActual.value
  const file = firstFileFrom(recDialog.value.file)
  if (!cid || !file) return
  recDialog.value.loading = true
  try {
    const updated = await subirRecContrato(cid, file, {
      fechaEmision: recDialog.value.fechaEmision || undefined,
      fechaExpiracion: recDialog.value.fechaExpiracion || undefined,
    } as any)
    recDialog.value.meta = updated
    recDialog.value.file = null
    recContrato.value.meta = updated
    recContrato.value.has = !!updated
    const pc = primaryContrato.value
    if (pc) {
      pc.tieneRecomendacionesMedicas = true
      pc.rutaArchivoRecomendacionMedica = updated?.url || urlPublicaRecDesdeRuta(updated?.path) || pc.rutaArchivoRecomendacionMedica || null
    }
    showAlert('Listo','Recomendación médica guardada con éxito.')
  } catch (e:any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible subir la recomendación.')
  } finally {
    recDialog.value.loading = false
  }
}

async function eliminarRecomendacionMedicaContrato(){
  const cid = contratoIdActual.value
  if (!cid) return
  try {
    await eliminarRecContrato(cid)
    recDialog.value.meta = null
    recContrato.value.meta = null
    recContrato.value.has = false
    const pc = primaryContrato.value
    if (pc) {
      pc.tieneRecomendacionesMedicas = false
      pc.rutaArchivoRecomendacionMedica = null
    }
    showAlert('Listo','Archivo eliminado.')
  } catch (e:any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible eliminar el archivo.')
  }
}

/** Abrir en visor la recomendación */
function verRecomendacionMedicaContrato(){
  const url = recDialog.value?.meta?.url || urlPublicaRecDesdeRuta(recDialog.value?.meta?.path)
  if (!url) { showAlert('Sin archivo','No hay archivo para ver.'); return }
  const absolute = toAbsoluteApiUrl(url)
  window.open(absolute, '_blank', 'noopener,noreferrer')
}

/* IDs/nombres UI (solo para etiquetar seguridad social) */
const getEntidadId = (tipo: AfiliacionTipoLocal): number | null => {
  const c = primaryContrato.value
  switch (tipo) {
    case 'eps': return c?.eps?.id ?? (user.value as any)?.eps?.id ?? null
    case 'arl': return c?.arl?.id ?? (user.value as any)?.arl?.id ?? null
    case 'afp': return c?.afp?.id ?? (user.value as any)?.afp?.id ?? null
    case 'afc': return c?.afc?.id ?? (user.value as any)?.afc?.id ?? null
    case 'ccf': return c?.ccf?.id ?? (user.value as any)?.ccf?.id ?? null
  }
}
const getEntidadNombre = (tipo: AfiliacionTipoLocal): string => {
  const c = primaryContrato.value
  switch (tipo) {
    case 'eps': return c?.eps?.nombre ?? (user.value as any)?.eps?.nombre ?? 'EPS'
    case 'arl': return c?.arl?.nombre ?? (user.value as any)?.arl?.nombre ?? 'ARL'
    case 'afp': return c?.afp?.nombre ?? (user.value as any)?.afp?.nombre ?? 'AFP'
    case 'afc': return c?.afc?.nombre ?? (user.value as any)?.afc?.nombre ?? 'AFC'
    case 'ccf': return c?.ccf?.nombre ?? (user.value as any)?.ccf?.nombre ?? 'CCF'
  }
}

/* ===== Afiliaciones (archivos por CONTRATO) ===== */
async function refreshCertStatusByTipo(tipo: AfiliacionTipoLocal) {
  const cid = contratoIdActual.value
  certs.value[tipo].loading = true
  try {
    if (!cid) { certs.value[tipo] = { has:false, loading:false, meta:null }; return }
    const meta = await obtenerArchivoAfiliacionMeta(cid, tipo)
    certs.value[tipo].meta = meta
    certs.value[tipo].has = tieneArchivoAfiliacion(meta)
  } catch (e) {
    console.error(`No se pudo refrescar ${tipo}:`, e)
    certs.value[tipo].meta = null
    certs.value[tipo].has = false
  } finally {
    certs.value[tipo].loading = false
  }
}
async function refreshAllCertStatuses() {
  await Promise.all((['eps','arl','afp','afc','ccf'] as AfiliacionTipoLocal[]).map(refreshCertStatusByTipo))
}

/* Diálogo de certificado */
function cerrarCertDialog(){
  certDialog.value = { open:false, tipo:'', entidadId:null, entidadNombre:'', file:null, fechaEmision:'', fechaExpiracion:'', loading:false, meta:null }
}
async function abrirDialogoCertificado(tipo:AfiliacionTipoLocal){
  const id = getEntidadId(tipo)
  if (!id) { showAlert('Selecciona una entidad','Debes tener una entidad asociada para gestionar su archivo.'); return }

  certDialog.value.tipo = tipo
  certDialog.value.entidadId = id
  certDialog.value.entidadNombre = getEntidadNombre(tipo)
  certDialog.value.open = true
  certDialog.value.loading = true

  try {
    const cid = contratoIdActual.value
    if (!cid) throw new Error('No hay contrato activo')
    const meta = await obtenerArchivoAfiliacionMeta(cid, tipo)
    certDialog.value.meta = meta
    certs.value[tipo].meta = meta
    certs.value[tipo].has = tieneArchivoAfiliacion(meta)
  } catch (e) {
    console.error('Error cargando meta de afiliación:', e)
    certDialog.value.meta = null
    certs.value[tipo].meta = null
    certs.value[tipo].has = false
  } finally { certDialog.value.loading = false }
}

async function subirCertificadoSeleccionado(){
  const t = certDialog.value.tipo as AfiliacionTipoLocal
  const cid = contratoIdActual.value
  const file = firstFileFrom(certDialog.value.file)
  if (!cid || !t || !file) return
  certDialog.value.loading = true
  try {
    const updated = await subirArchivoAfiliacion(cid, t, file)
    certDialog.value.meta = updated
    certDialog.value.file = null
    certs.value[t].meta = updated
    certs.value[t].has = tieneArchivoAfiliacion(updated)
    showAlert('Listo','Archivo de afiliación guardado con éxito.')
  } catch (e:any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible subir el archivo.')
  } finally { certDialog.value.loading = false }
}

async function eliminarCertificadoSeleccionado(){
  const t = certDialog.value.tipo as AfiliacionTipoLocal
  const cid = contratoIdActual.value
  if (!cid || !t) return
  try {
    await eliminarArchivoAfiliacion(cid, t)
    certDialog.value.meta = null
    certs.value[t].meta = null
    certs.value[t].has = false
    showAlert('Listo','Archivo eliminado.')
  } catch (e:any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible eliminar el archivo.')
  }
}

/** Abrir en visor el certificado seleccionado */
function verCertificadoSeleccionado(){
  const meta = certDialog.value.meta as any
  const raw = meta?.url || meta?.data?.url || meta?.path || ''
  if (!raw) { showAlert('Sin archivo','No hay archivo para ver.'); return }
  const absolute = toAbsoluteApiUrl(raw)
  window.open(absolute, '_blank', 'noopener,noreferrer')
}

/* Eventos de contrato */
const showAddEventDialog = (id:number)=>{
  contratoIdForNewEvent.value=id
  newEvent.value = {}
  eventFiles.value = null
  showAddEventDialogForContrato.value=true
}
const closeAddEventDialog = ()=>{
  showAddEventDialogForContrato.value=false
  eventForm.value?.reset()
  eventFileRef.value?.reset()
  eventFiles.value = null
}
const submitNewEvent = async () => {
  if (!contratoIdForNewEvent.value) return
  const { valid } = await eventForm.value.validate()
  if (!valid) return
  isLoadingAction.value = true
  const fileToUpload = firstFileFrom(eventFiles.value) || eventFileRef.value?.files?.[0] || null
  const payload = new FormData()
  if (newEvent.value.tipo) payload.append('tipo', newEvent.value.tipo as string) // ← minúsculas
  if (newEvent.value.subtipo) payload.append('subtipo', newEvent.value.subtipo as string)
  if (newEvent.value.fechaInicio) payload.append('fechaInicio', newEvent.value.fechaInicio as string)
  if (newEvent.value.fechaFin) payload.append('fechaFin', newEvent.value.fechaFin as string)
  if (newEvent.value.descripcion) payload.append('descripcion', newEvent.value.descripcion as string)
  if (fileToUpload) payload.append('documento', fileToUpload)
  if (actorId.value != null) payload.append('actorId', String(actorId.value))
  try {
    const created = await crearEventoDeContrato(contratoIdForNewEvent.value, payload) as ContratoEventoExt
    showAlert('Éxito','Evento creado correctamente.')
    closeAddEventDialog()
    const target = user.value?.contratos?.find(c=>c.id===contratoIdForNewEvent.value)
    if (target) { target.eventos = target.eventos || []; target.eventos.push(created) }
  } catch (err:any) {
    console.error('Error al crear el evento:', err)
    showAlert('Error', `Error al crear el evento: ${err.message || 'error desconocido'}.`)
  } finally { isLoadingAction.value = false }
}
const viewEventDetails = (e:ContratoEventoExt)=>{ selectedEvent.value=e; showEventDetailsDialog.value=true }

/* Estado contrato */
const confirmarCambioEstadoContrato = async (contratoId:number, nuevoEstado:'activo'|'inactivo')=>{
  const msg = nuevoEstado==='activo'
    ? '¿Estás seguro de que deseas activar este contrato?'
    : '¿Estás seguro de que deseas desactivar este contrato?'
  const ok = await showConfirm('Confirmar Cambio de Estado', msg)
  if (!ok) return
  isLoadingAction.value = true
  try {
    await actualizarContrato(contratoId, { estado:nuevoEstado, actorId: actorId.value ?? undefined } as any)
    showAlert('Éxito', nuevoEstado==='activo' ? 'Contrato activado correctamente.' : 'Contrato desactivado correctamente.')
    await loadUser()
  } catch (err:any) {
    console.error('Error al cambiar el estado del contrato:', err)
    showAlert('Error', `Error al cambiar el estado del contrato: ${err.message || 'error desconocido'}.`)
  } finally { isLoadingAction.value = false }
}

/* Finalizar contrato */
const confirmFinalizeContract = async (id:number)=>{
  const ok = await showConfirm('Confirmar Finalización','¿Estás seguro de que deseas finalizar este contrato? Esta acción no se puede deshacer.')
  if(ok) await submitContractFinalization(id)
}
const submitContractFinalization = async (id:number)=>{
  if(!finalizationDate.value || !finalizationReason.value){
    showAlert('Advertencia','Por favor, complete la fecha y el motivo de finalización.')
    return
  }
  isLoadingAction.value = true
  try {
    await actualizarContrato(id, {
      estado:'inactivo',
      fechaTerminacion: finalizationDate.value,
      motivoFinalizacion: finalizationReason.value,
      actorId: actorId.value ?? undefined
    } as any)
    showAlert('Éxito','Contrato finalizado correctamente.')
    await loadUser()
  } catch (err:any) {
    console.error('Error al finalizar el contrato:', err)
    showAlert('Error', `Error al finalizar el contrato: ${err.message || 'error desconocido'}.`)
  } finally {
    isLoadingAction.value = false
  }
}

/* ==================== PASO: abrir/guardar/ver/eliminar ==================== */
const openEditPasoDialog = (contratoId:number, paso:ContratoPasoExt)=>{
  contratoIdForPasoEdit.value=contratoId
  pasoIdForEdit.value=(paso as any).id||null
  pasoEditData.value={observacion: paso.observacion||''}
  editPasoFiles.value = null

  /* Meta del archivo del paso */
  const url = paso.archivoUrl || ''
  const nombre = url ? decodeURIComponent(String(url).split('/').pop() || 'archivo') : ''
  pasoDialogMeta.value = {
    has: !!url,
    nombre,
    url
  }

  showEditPasoDialog.value=true
}
const closeEditPasoDialog = ()=>{
  showEditPasoDialog.value=false
  editPasoForm.value?.reset()
  editPasoFileRef.value?.reset()
  editPasoFiles.value = null
}

/** Localiza el paso actualmente en edición en la data del usuario */
function getPasoEnEdicion(): ContratoPasoExt | null {
  const cid = contratoIdForPasoEdit.value
  const pid = pasoIdForEdit.value
  if (!cid || !pid) return null
  const c = user.value?.contratos?.find(x=>x.id===cid)
  return c?.pasos?.find(p=> (p as any).id === pid) || null
}

const submitEditPaso = async ()=>{
  if(!contratoIdForPasoEdit.value || !pasoIdForEdit.value) return
  isLoadingAction.value = true
  const fileToUpload = firstFileFrom(editPasoFiles.value) || editPasoFileRef.value?.files?.[0] || null
  const payload = new FormData()
  payload.append('observacion', pasoEditData.value.observacion || '')
  if (fileToUpload) payload.append('archivo', fileToUpload)
  if (actorId.value != null) payload.append('actorId', String(actorId.value))
  try {
    await actualizarPasoContrato(contratoIdForPasoEdit.value, pasoIdForEdit.value, payload)
    showAlert('Éxito','Paso actualizado correctamente.')
    closeEditPasoDialog()
    await loadUser()
  } catch (err:any) {
    console.error('Error al actualizar paso:', err)
    showAlert('Error', `Error al actualizar el paso: ${err.message || 'error desconocido'}.`)
  } finally { isLoadingAction.value = false }
}

/** Ver/descargar el archivo actual del paso */
function verArchivoPasoActual(){
  const raw = pasoDialogMeta.value.url || getPasoEnEdicion()?.archivoUrl || ''
  if (!raw) { showAlert('Sin archivo','No hay archivo para ver.'); return }
  window.open(toAbsoluteApiUrl(raw), '_blank', 'noopener,noreferrer')
}

/** Eliminar el archivo actual del paso (sin afectar otros modals) */
async function eliminarArchivoPasoActual(){
  if(!contratoIdForPasoEdit.value || !pasoIdForEdit.value) return
  const ok = await showConfirm('Eliminar archivo','¿Seguro que deseas eliminar el archivo de este paso?')
  if(!ok) return

  isLoadingAction.value = true
  try {
    const payload = new FormData()
    payload.append('observacion', pasoEditData.value.observacion || '')
    payload.append('eliminarArchivo','1') // backend puede ignorar si no aplica
    if (actorId.value != null) payload.append('actorId', String(actorId.value))

    await actualizarPasoContrato(contratoIdForPasoEdit.value, pasoIdForEdit.value, payload)

    // refresco local mínimo para que el diálogo refleje el cambio
    const paso = getPasoEnEdicion()
    if (paso) (paso as any).archivoUrl = null
    pasoDialogMeta.value = { has:false, nombre:'', url:'' }

    showAlert('Listo','Archivo eliminado.')
  } catch (e:any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible eliminar el archivo.')
  } finally {
    isLoadingAction.value = false
  }
}
/* ================== /PASO ================== */

/* Foto de perfil */
function closePhotoDialog(){
  showPhotoDialog.value = false
  profilePhotoFiles.value = null
  fileInputRef.value?.reset?.()
}
async function uploadProfilePhoto(){
  const file = firstFileFrom(profilePhotoFiles.value) || fileInputRef.value?.files?.[0] || null
  if (!user.value?.id || !file) {
    showAlert('Atención','Debes seleccionar una imagen.')
    return
  }
  isLoadingAction.value = true
  try {
    await uploadProfilePicture(user.value.id as number, file)
    showAlert('Listo','Foto de perfil actualizada.')
    closePhotoDialog()
    await loadUser()
  } catch (err:any) {
    console.error('Error al subir la foto de perfil:', err)
    showAlert('Error', err?.message || 'No fue posible actualizar la foto de perfil.')
  } finally {
    isLoadingAction.value = false
  }
}

/* Editar usuario */
function openEditUserDialog(){
  if (!user.value) return
  editedUser.value = {
    nombres: user.value.nombres,
    apellidos: user.value.apellidos,
    celularPersonal: user.value.celularPersonal,
    celularCorporativo: user.value.celularCorporativo,
    direccion: user.value.direccion,
    recomendaciones: !!user.value.recomendaciones,
  }
  showEditUserDialog.value = true
}
function closeEditUserDialog(){
  showEditUserDialog.value = false
  editedUser.value = {}
}
async function submitEditUser(){
  const { valid } = await userForm.value?.validate?.() ?? { valid: true }
  if (!valid || !user.value?.id) return
  isLoadingAction.value = true
  try {
    await actualizarUsuario(user.value.id as number, editedUser.value as UserEditForm)
    showAlert('Éxito','Perfil actualizado correctamente.')
    showEditUserDialog.value = false
    await loadUser()
  } catch (err:any) {
    console.error('Error al actualizar el usuario:', err)
    showAlert('Error', err?.message || 'No fue posible actualizar el perfil.')
  } finally {
    isLoadingAction.value = false
  }
}

const goBack = ()=> router.go(-1)

/* Carga de datos */
const loadUser = async () => {
  isLoadingUser.value = true
  error.value = null
  user.value = null
  const userIdFromRoute = Number(route.params.id)
  if (isNaN(userIdFromRoute)) { error.value = 'ID de usuario inválido en la URL.'; isLoadingUser.value = false; return }

  try {
    const fetchedUser = await obtenerUsuarioPorId(userIdFromRoute) as UserProfile
    if (fetchedUser) {
      if (fetchedUser.contratos) {
        fetchedUser.contratos = await Promise.all(
          fetchedUser.contratos.map(async (contrato:any) => {
            const c: Contrato = {
              ...contrato,
              activeTab:'detalles',
              activeSubTab:'inicio',
              eventos: contrato.eventos || [],
              pasos: contrato.pasos || [],
              historialEstados: contrato.historialEstados || [],
              cambios: (contrato.cambios||[]).map((x:any)=>({...x, oldValue:parseMaybeJson(x.oldValue), newValue:parseMaybeJson(x.newValue)})),
              fechaFinalizacion: contrato.fechaTerminacion ? String(contrato.fechaTerminacion).split('T')[0] : null,
              motivoFinalizacion: contrato.motivoFinalizacion || null,
              tieneRecomendacionesMedicas: contrato.tieneRecomendacionesMedicas ?? false,
              rutaArchivoRecomendacionMedica: contrato.rutaArchivoRecomendacionMedica ?? null,
            }
            if (!c.pasos || c.pasos.length === 0) c.pasos = await fetchPasosInicio(c.id) as unknown as ContratoPasoExt[]
            c.timeline = buildTimeline(c)
            return c
          })
        )
      }

      /* 🔁 Sincronizar cabecera con contrato prioritario */
      const pcLocal = pickPrimaryContrato(fetchedUser.contratos || []) as any
      if (pcLocal) {
        fetchedUser.razonSocial = pcLocal.razonSocial || fetchedUser.razonSocial || null
        fetchedUser.sede        = pcLocal.sede        || fetchedUser.sede        || null
        fetchedUser.cargo       = pcLocal.cargo       || fetchedUser.cargo       || null
        if (pcLocal.centroCosto !== undefined && pcLocal.centroCosto !== null) {
          fetchedUser.centroCosto = pcLocal.centroCosto
        }
        fetchedUser.eps = pcLocal.eps || fetchedUser.eps || null
        fetchedUser.arl = pcLocal.arl || fetchedUser.arl || null
        fetchedUser.afp = pcLocal.afp || fetchedUser.afp || null
        fetchedUser.afc = pcLocal.afc || fetchedUser.afc || null
        fetchedUser.ccf = pcLocal.ccf || fetchedUser.ccf || null
        if (pcLocal.identificacion && !(fetchedUser as any).identificacion) {
          (fetchedUser as any).identificacion = pcLocal.identificacion
        }
      }

      user.value = fetchedUser
      await refreshAllCertStatuses()       // ✅ chulitos afiliación
      await refreshRecStatusForContrato()  // ✅ recomendación médica
    } else {
      error.value = 'No se encontraron datos del usuario.'
    }
  } catch (err:any) {
    console.error('Error al cargar datos del usuario:', err)
    error.value = `Error al cargar el usuario: ${err.message || 'error desconocido'}.`
  } finally { isLoadingUser.value = false }
}

/* Watchers */
watch(contratoIdActual, () => {
  refreshAllCertStatuses()
  refreshRecStatusForContrato()
})

/* Montaje */
onMounted(()=>{ loadUser() })

/* Expuestos implícitamente por <script setup> */
</script>



<style scoped>
/* Avatar */
.avatar-container {
  position: relative;
  display: inline-block;
}
.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
}

/* Clip badge */
.clip-badge {
  margin-left: 8px;
}

/* Estilo del modal de editar paso */
.v-dialog .v-card-text .v-textarea {
  margin-bottom: 12px;
}

/* Ícono de lápiz al lado del título */
.v-timeline-item .d-flex.align-center > .v-btn {
  margin-left: 6px;
  padding: 0;
}

/* Snackbar azul */
.snackbar-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  min-width: 260px;
}
.snackbar-header {
  background: #1976d2;
  color: white;
  font-weight: bold;
  padding: 6px 12px;
}
.snackbar-body {
  padding: 10px 12px;
  color: #333;
}
</style>
