<template>
  <v-card
    :elevation="2"
    class="mini-card d-flex align-center justify-space-between px-3"
    :class="colorCard"
  >
    <div class="d-flex align-center gap-2">
      <v-icon :icon="icon" :class="['mini-icon', colorIcon]" size="20" />
      <span class="mini-title">{{ titulo }}</span>
    </div>

    <div class="mini-value" v-if="!loading">{{ valor }}</div>
    <v-progress-circular
      v-else
      indeterminate
      size="16"
      width="2"
    />
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  titulo: string
  valor: number | string
  loading?: boolean
  colorCard?: string   // ej: 'blue-lighten-5'
  colorIcon?: string   // ej: 'blue-darken-2'
}>()
</script>

<style scoped>
.mini-card {
  height: 44px;
  border-radius: 10px;
}
.mini-icon {
  opacity: .85;
}
.mini-title {
  font-size: .85rem;
  line-height: 1;
  opacity: .9;
}
.mini-value {
  font-weight: 700;
  font-size: 1rem;
}
.gap-2 { gap: 8px; }
</style>
