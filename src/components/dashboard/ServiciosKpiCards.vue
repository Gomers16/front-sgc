<template>
  <v-row dense class="mb-8">
    <v-col cols="12" sm="4">
      <v-card class="kpi-card rtm" elevation="6">
        <div class="kpi-top">
          <v-icon size="22">mdi-car-wrench</v-icon>
          <span class="kpi-title">RTM</span>
        </div>
        <div class="kpi-value">
          <span v-if="!loading">{{ counts.rtm }}</span>
          <v-progress-circular v-else indeterminate size="20" width="2" />
        </div>
        <div class="kpi-sub">En proceso (hoy)</div>
      </v-card>
    </v-col>

    <v-col cols="12" sm="4">
      <v-card class="kpi-card prev" elevation="6">
        <div class="kpi-top">
          <v-icon size="22">mdi-shield-check</v-icon>
          <span class="kpi-title">Preventiva</span>
        </div>
        <div class="kpi-value">
          <span v-if="!loading">{{ counts.preventiva }}</span>
          <v-progress-circular v-else indeterminate size="20" width="2" />
        </div>
        <div class="kpi-sub">En proceso (hoy)</div>
      </v-card>
    </v-col>

    <v-col cols="12" sm="4">
      <v-card class="kpi-card peri" elevation="6">
        <div class="kpi-top">
          <v-icon size="22">mdi-magnify</v-icon>
          <span class="kpi-title">Peritaje</span>
        </div>
        <div class="kpi-value">
          <span v-if="!loading">{{ counts.peritaje }}</span>
          <v-progress-circular v-else indeterminate size="20" width="2" />
        </div>
        <div class="kpi-sub">En proceso (hoy)</div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean
  counts: { rtm: number; preventiva: number; peritaje: number }
}>()
</script>

<style scoped>
.kpi-card {
  border-radius: 16px;
  padding: 18px 18px 14px;
  border: 1px solid rgba(16,24,40,0.06);
  background: linear-gradient(180deg,#fff,#f9fbff);
}
.kpi-top { display:flex; align-items:center; gap:10px; color:#0f172a; }
.kpi-title { font-weight:700; letter-spacing:.2px }
.kpi-value { font-size:2rem; font-weight:800; margin-top:8px; color:#0f172a }
.kpi-sub { font-size:.85rem; color:#64748b; margin-top:2px }

/* sombras sutiles distintas */
.kpi-card.rtm { box-shadow: 0 6px 16px rgba(2,132,199,.18) }
.kpi-card.prev { box-shadow: 0 6px 16px rgba(34,197,94,.18) }
.kpi-card.peri { box-shadow: 0 6px 16px rgba(234,179,8,.18) }
</style>
