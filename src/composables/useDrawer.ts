// src/composables/useDrawer.ts
import { ref } from 'vue'

const drawer = ref(true)

export function useDrawer() {
  const toggleDrawer = () => {
    drawer.value = !drawer.value
  }

  const openDrawer = () => {
    drawer.value = true
  }

  const closeDrawer = () => {
    drawer.value = false
  }

  return {
    drawer,
    toggleDrawer,
    openDrawer,
    closeDrawer
  }
}
