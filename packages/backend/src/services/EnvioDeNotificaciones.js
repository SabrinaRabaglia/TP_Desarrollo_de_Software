export default class EnvioDeNotificaciones {
  constructor(
    notificacionRepository,
    canales,
    {
      maximoDeIntentos = 5,
      esperaEntreIntentosMs = 30_000,
      bloqueoMs = 5 * 60_000,
      ahora = () => new Date(),
    } = {},
  ) {
    this.notificacionRepository = notificacionRepository
    this.canales = canales
    this.maximoDeIntentos = maximoDeIntentos
    this.esperaEntreIntentosMs = esperaEntreIntentosMs
    this.bloqueoMs = bloqueoMs
    this.ahora = ahora
    this.enCurso = null
  }

  despertar = () => {
    setImmediate(() =>
      this.procesarPendientes().catch((error) =>
        console.error(
          `No se pudieron procesar las notificaciones: ${String(error?.message ?? error)}`,
        ),
      ),
    )
  }

  procesarPendientes = () => {
    this.enCurso ??= this.procesar().finally(() => {
      this.enCurso = null
    })
    return this.enCurso
  }

  procesar = async () => {
    let procesadas = 0
    for (;;) {
      const ahora = this.ahora()
      const notificacion = await this.notificacionRepository.reclamarPendiente(
        ahora,
        new Date(ahora.getTime() - this.bloqueoMs),
      )
      if (!notificacion) {
        return procesadas
      }
      await this.enviar(notificacion)
      procesadas += 1
    }
  }

  enviar = async (notificacion) => {
    const reclamadaEn = notificacion.procesandoDesde
    for (const envio of notificacion.enviosPendientes()) {
      try {
        await this.canales[envio.medio.tipo].enviar(
          envio.medio.valor,
          notificacion.contenido,
        )
        notificacion.registrarEnvioExitoso(envio, this.ahora())
      } catch (error) {
        const motivo = String(error?.message ?? error)
        notificacion.registrarEnvioFallido(envio, motivo, this.maximoDeIntentos)
        console.error(
          `[${envio.medio.tipo}] No se pudo enviar la notificación ${notificacion.id} (intento ${envio.intentos} de ${this.maximoDeIntentos}): ${motivo}`,
        )
      }
    }
    notificacion.liberar(
      new Date(reclamadaEn.getTime() + this.esperaEntreIntentosMs),
    )
    const guardada = await this.notificacionRepository.liberar(
      notificacion,
      reclamadaEn,
    )
    if (!guardada) {
      console.error(
        `La notificación ${notificacion.id} fue retomada por otro proceso mientras se enviaba; se descarta este resultado.`,
      )
    }
  }
}
