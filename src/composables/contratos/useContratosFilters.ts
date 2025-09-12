// src/composables/contratos/useContratosFilters.ts
/**
 * useContratosFilters
 * -------------------------------------------------------
 * Responsable de la capa de "filtros" de la vista de contratos:
 * - Estado seleccionado: razonSocialSeleccionada, usuarioSeleccionado, tipoContratoSeleccionado
 * - Listas: razonesSociales, usuarios
 * - Loaders: loadingRazonesSociales, loadingUsuarios
 * - Opciones de tipo de contrato: tiposContratoSelectItems
 * - Acciones: cargarRazonesSociales(), cargarUsuariosPorRazonSocial()
 *
 * NOTAS:
 * - Mantiene EXACTAMENTE los mismos nombres que ya usa el template para NO romper nada.
 * - Normaliza respuestas a array (toArray) y agrega nombreCompleto a usuarios.
 * - No define watchers; la vista conserva los tuyos.
 */
import { ref } from 'vue'
import { listarRazonesSociales, fetchUsuariosPorRazonSocial } from '@/services/razonSocialService'

type Dict = Record<string, unknown>
function isRecord(x: unknown): x is Dict { return typeof x === 'object' && x !== null }
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (isRecord(data)) {
    const d = data['data']; const r = data['rows']; const i = data['items']
    if (Array.isArray(d)) return d as T[]
    if (Array.isArray(r)) return r as T[]
    if (Array.isArray(i)) return i as T[]
  }
  return []
}

export function useContratosFilters() {
  // Estado seleccionado
  const razonSocialSeleccionada = ref<number | null>(null)
  const usuarioSeleccionado = ref<number | null>(null)
  const tipoContratoSeleccionado = ref<'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'>('prestacion')

  // Listas
  const razonesSociales = ref<Array<{ id:number; nombre:string }>>([])
  const usuarios = ref<Array<{ id:number; nombres:string; apellidos:string; nombreCompleto?:string }>>([])

  // Loaders
  const loadingRazonesSociales = ref(false)
  const loadingUsuarios = ref(false)

  // Opciones de tipo de contrato (igual a tu vista)
  const tiposContratoSelectItems = ref([
    { nombre: 'Prestación de Servicios', valor: 'prestacion' as const },
    { nombre: 'Temporal', valor: 'temporal' as const },
    { nombre: 'Laboral', valor: 'laboral' as const },
    { nombre: 'Contrato de Aprendizaje', valor: 'aprendizaje' as const },
  ])

  // Acciones
  async function cargarRazonesSociales(){
    loadingRazonesSociales.value = true
    try {
      const raw = await listarRazonesSociales()
      razonesSociales.value = toArray<{ id:number; nombre:string }>(raw)
    } finally { loadingRazonesSociales.value = false }
  }

  async function cargarUsuariosPorRazonSocial(){
    loadingUsuarios.value = true
    usuarios.value = []
    usuarioSeleccionado.value = null
    if (razonSocialSeleccionada.value) {
      try {
        const raw = await fetchUsuariosPorRazonSocial(razonSocialSeleccionada.value)
        const arr = toArray<{ id:number; nombres:string; apellidos:string }>(raw)
        usuarios.value = arr.map(u => ({ ...u, nombreCompleto:`${u.nombres} ${u.apellidos}`.trim() }))
      } finally { loadingUsuarios.value = false }
    } else {
      loadingUsuarios.value = false
    }
  }

  return {
    // estado
    razonSocialSeleccionada,
    usuarioSeleccionado,
    tipoContratoSeleccionado,
    // listas
    razonesSociales,
    usuarios,
    // loaders
    loadingRazonesSociales,
    loadingUsuarios,
    // opciones
    tiposContratoSelectItems,
    // acciones
    cargarRazonesSociales,
    cargarUsuariosPorRazonSocial,
  }
}
