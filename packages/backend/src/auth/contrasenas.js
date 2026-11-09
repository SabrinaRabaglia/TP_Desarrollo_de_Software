import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const derivar = promisify(scrypt)
const LARGO_DEL_HASH = 64

export const hashear = async (contrasena) => {
  const salt = randomBytes(16)
  const hash = await derivar(contrasena, salt, LARGO_DEL_HASH)
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`
}

export const coincide = async (contrasena, guardado) => {
  const [, salt, hash] = guardado.split("$")
  const esperado = Buffer.from(hash, "hex")
  const calculado = await derivar(
    contrasena,
    Buffer.from(salt, "hex"),
    esperado.length,
  )
  return timingSafeEqual(calculado, esperado)
}
