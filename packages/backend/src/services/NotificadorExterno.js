import { canalesSimulados } from "../canales/canalesSimulados.js"

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
