import { TipoMedioContacto } from "../domain/enums/TipoMedioContacto.js"

export const canalesSimulados = Object.fromEntries(
  Object.values(TipoMedioContacto).map((tipo) => [
    tipo,
    {
      enviar: async (valor, contenido) => {
        console.log(`[${tipo}] Notificación a ${valor}: ${contenido}`)
      },
    },
  ]),
)
