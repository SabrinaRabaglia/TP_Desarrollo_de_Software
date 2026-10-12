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

export default class NotificadorExterno {
  constructor(canales = canalesSimulados) {
    this.canales = canales
  }

  notificar = async (personaColaboradora, contenido) => {
    const medios = personaColaboradora.mediosDeContacto ?? []
    await Promise.all(
      medios.map((medio) =>
        this.canales[medio.tipo].enviar(medio.valor, contenido),
      ),
    )
    return medios
  }
}
