import { randomBytes } from "node:crypto"

// Como Mongo: un ObjectId son 24 caracteres hexadecimales.
// Así los ids de los falsos pasan por validateId y objectIdSchema.
export default function nuevoId() {
  return randomBytes(12).toString("hex")
}
