// src/services/descuentosService.ts
import { get, post, put, del } from './http'

export interface Descuento {
  id?: number
  codigo: string
  nombre: string
  valorCarro: number
  valorMoto: number
  descripcion?: string | null
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export interface DescuentoResponse {
  success: boolean
  data?: Descuento | Descuento[]
  message?: string
}

const descuentosService = {
  /**
   * Obtener todos los descuentos
   */
  async getAll(): Promise<DescuentoResponse> {
    return get<DescuentoResponse>('/api/descuentos')
  },

  /**
   * Obtener descuentos activos
   */
  async getActivos(): Promise<DescuentoResponse> {
    return get<DescuentoResponse>('/api/descuentos/activos')
  },

  /**
   * Obtener un descuento por ID
   */
  async getById(id: number): Promise<DescuentoResponse> {
    return get<DescuentoResponse>(`/api/descuentos/${id}`)
  },

  /**
   * Crear un nuevo descuento
   */
  async create(descuento: Omit<Descuento, 'id' | 'createdAt' | 'updatedAt'>): Promise<DescuentoResponse> {
    return post<DescuentoResponse, typeof descuento>('/api/descuentos', descuento)
  },

  /**
   * Actualizar un descuento
   */
  async update(id: number, descuento: Partial<Descuento>): Promise<DescuentoResponse> {
    return put<DescuentoResponse, typeof descuento>(`/api/descuentos/${id}`, descuento)
  },

  /**
   * Eliminar (desactivar) un descuento
   */
  async delete(id: number): Promise<DescuentoResponse> {
    return del<DescuentoResponse>(`/api/descuentos/${id}`)
  },
}

export default descuentosService
