import { firmar } from "../../src/auth/tokens.js"

// Token de un usuario del colectivo, sin registrarlo: alcanza para las rutas
// que solo miran el rol y a qué colectivo pertenece quien las llama.
export const tokenDeColectivo = (colectivoId) =>
  firmar({
    id: "64f1a2b3c4d5e6f7a8b9c0aa",
    rol: "COLECTIVO",
    entidad: colectivoId,
  })

export const tokenDePersona = (personaId) =>
  firmar({
    id: "64f1a2b3c4d5e6f7a8b9c0ab",
    rol: "PERSONA_COLABORADORA",
    entidad: personaId,
  })
