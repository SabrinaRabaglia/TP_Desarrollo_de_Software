import { createHmac, timingSafeEqual } from "node:crypto"
import { secreto } from "./tokens.js"

// Va en el parámetro start de Telegram: hasta 64 caracteres de [A-Za-z0-9_-].
// Por eso no es un JWT sino id (24 hex) + vencimiento (7 en base 36) + firma (32 en base64url).
const VIGENCIA_MS = 15 * 60_000
const ANCHO_VENCIMIENTO = 7
const LARGO_FIRMA = 32
const FORMA = /^([0-9a-f]{24})([0-9a-z]{7})([A-Za-z0-9_-]{32})$/

const firmar = (cuerpo) =>
  createHmac("sha256", secreto())
    .update(`vincular-telegram:${cuerpo}`)
    .digest("base64url")
    .slice(0, LARGO_FIRMA)

export const emitirCodigo = (personaId, ahora = new Date()) => {
  const segundos = Math.floor((ahora.getTime() + VIGENCIA_MS) / 1000)
  const cuerpo = `${personaId}${segundos.toString(36).padStart(ANCHO_VENCIMIENTO, "0")}`
  return {
    codigo: `${cuerpo}${firmar(cuerpo)}`,
    venceEn: new Date(segundos * 1000),
  }
}

export const leerCodigo = (codigo, ahora = new Date()) => {
  const partes = FORMA.exec(codigo ?? "")
  if (!partes) {
    return null
  }
  const [, personaId, vencimiento, firma] = partes
  const esperada = firmar(`${personaId}${vencimiento}`)
  if (!timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) {
    return null
  }
  const venceEn = parseInt(vencimiento, 36) * 1000
  return ahora.getTime() < venceEn ? personaId : null
}
