// src/composables/contratos/useMaestrosRRHH.ts
import { ref, computed } from 'vue'
import { obtenerSedes, obtenerCargos, obtenerEntidadesSalud } from '@/services/userService'

type Dict = Record<string, unknown>
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const d = (data as Dict)['data']; const r = (data as Dict)['rows']; const i = (data as Dict)['items']
    if (Array.isArray(d)) return d as T[]
    if (Array.isArray(r)) return r as T[]
    if (Array.isArray(i)) return i as T[]
  }
  return []
}

export type AfiliacionTipo = 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'
export interface SedeLite { id: number; nombre: string }
export interface CargoLite { id: number; nombre: string }
export interface EntidadSalud { id: number; nombre: string; tipo: AfiliacionTipo | string }

export function useMaestrosRRHH() {
  const sedes = ref<SedeLite[]>([])
  const cargos = ref<CargoLite[]>([])
  const entidadesSalud = ref<EntidadSalud[]>([])

  const loadingSedes = ref(false)
  const loadingCargos = ref(false)
  const loadingEntidades = ref(false)

  async function cargarSedes() {
    loadingSedes.value = true
    try { sedes.value = toArray<SedeLite>(await obtenerSedes()) }
    finally { loadingSedes.value = false }
  }
  async function cargarCargos() {
    loadingCargos.value = true
    try { cargos.value = toArray<CargoLite>(await obtenerCargos()) }
    finally { loadingCargos.value = false }
  }
  async function cargarEntidadesSalud() {
    loadingEntidades.value = true
    try { entidadesSalud.value = toArray<EntidadSalud>(await obtenerEntidadesSalud()) }
    finally { loadingEntidades.value = false }
  }

  const filteredEps = computed(() => entidadesSalud.value.filter(e => e.tipo === 'eps'))
  const filteredArl = computed(() => entidadesSalud.value.filter(e => e.tipo === 'arl'))
  const filteredAfp = computed(() => entidadesSalud.value.filter(e => e.tipo === 'afp'))
  const filteredAfc = computed(() => entidadesSalud.value.filter(e => e.tipo === 'afc'))
  const filteredCcf = computed(() => entidadesSalud.value.filter(e => e.tipo === 'ccf'))

  async function cargarMaestros() {
    await Promise.all([cargarSedes(), cargarCargos(), cargarEntidadesSalud()])
  }

  return {
    sedes, cargos, entidadesSalud,
    loadingSedes, loadingCargos, loadingEntidades,
    filteredEps, filteredArl, filteredAfp, filteredAfc, filteredCcf,
    cargarSedes, cargarCargos, cargarEntidadesSalud, cargarMaestros,
  }
}
