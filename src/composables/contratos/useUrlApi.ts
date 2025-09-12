// src/composables/contratos/useUrlApi.ts
const API_ORIGIN = (() => {
  const raw =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    'http://localhost:3333'
  try { return new URL(String(raw)).origin } catch { return String(raw).replace(/\/+$/, '') }
})()

export function toAbsoluteApiUrl(input?: string | null): string {
  if (!input) return ''
  const raw = String(input).trim()
  if (/^https?:\/\//i.test(raw)) return raw
  const base = API_ORIGIN.replace(/\/+$/, '')
  const rel = raw.startsWith('/') ? raw : `/${raw}`
  return `${base}${rel}`
}
