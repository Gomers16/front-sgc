// src/composables/contratos/useContratoTermOptions.ts
/**
 * useContratoTermOptions
 * -------------------------------------------------------
 * Expone:
 *  - terminosContratoOptions: opciones de término según tipo de contrato
 *  - terminoContratoRules: regla de campo (obligatorio si hay opciones)
 *
 * Mantiene exactamente la misma semántica que había en la vista.
 */
import { computed, type Ref } from 'vue'

export type TipoContrato = 'prestacion'|'temporal'|'laboral'|'aprendizaje'

export function useContratoTermOptions(tipoContratoRef: Ref<TipoContrato>) {
  const required = (v: unknown) =>
    (v !== null && v !== undefined && v !== '') || 'Este campo es obligatorio.'

  const terminosContratoOptions = computed(() => {
    const t = tipoContratoRef.value
    if (t === 'laboral') {
      return [
        { text: 'Fijo', value: 'fijo' as const },
        { text: 'Obra o labor determinada', value: 'obra_o_labor_determinada' as const },
        { text: 'Indefinido', value: 'indefinido' as const },
      ] as const
    }
    if (t === 'temporal') {
      return [{ text:'Obra o labor determinada', value:'obra_o_labor_determinada' as const }] as const
    }
    if (t === 'prestacion') {
      return [
        { text: 'Fijo', value: 'fijo' as const },
        { text: 'Obra o labor determinada', value: 'obra_o_labor_determinada' as const },
      ] as const
    }
    // aprendizaje
    return [{ text:'Fijo', value:'fijo' as const }] as const
  })

  const terminoContratoRules = computed(() =>
    terminosContratoOptions.value.length ? [required] : []
  )

  return { terminosContratoOptions, terminoContratoRules }
}
