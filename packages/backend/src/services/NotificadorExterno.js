import { canalesSimulados } from "../canales/canalesSimulados.js"

export default class NotificadorExterno {
  constructor(canales = canalesSimulados) {
    this.canales = canales
  }

  // Un canal caído no frena a los demás: se intentan todos y se devuelven
  // solo los medios por los que el envío salió bien.
  notificar = async (personaColaboradora, contenido) => {
    const medios = personaColaboradora.mediosDeContacto ?? []
    const resultados = await Promise.allSettled(
      medios.map(async (medio) =>
        this.canales[medio.tipo].enviar(medio.valor, contenido),
      ),
    )
    resultados.forEach((resultado, i) => {
      if (resultado.status === "rejected") {
        console.error(
          `[${medios[i].tipo}] No se pudo enviar la notificación: ${resultado.reason?.message}`,
        )
      }
    })
    return medios.filter((_, i) => resultados[i].status === "fulfilled")
  }
}
