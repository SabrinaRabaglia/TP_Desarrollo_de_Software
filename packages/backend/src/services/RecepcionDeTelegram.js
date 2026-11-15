import { setTimeout as esperar } from "node:timers/promises"

const esMensajeDeTextoPrivado = (novedad) =>
  novedad.message?.chat?.type === "private" &&
  typeof novedad.message.text === "string"

export default class RecepcionDeTelegram {
  constructor(
    telegram,
    conexionDeTelegram,
    { esperaSeg = 25, pausaTrasErrorMs = 5000, pausar = esperar } = {},
  ) {
    this.telegram = telegram
    this.conexionDeTelegram = conexionDeTelegram
    this.esperaSeg = esperaSeg
    this.pausaTrasErrorMs = pausaTrasErrorMs
    this.pausar = pausar
    this.desde = undefined
    this.activa = false
    this.escuchando = null
  }

  iniciar = () => {
    if (this.activa) {
      return
    }
    this.activa = true
    this.escuchando = this.escuchar()
  }

  detener = () => {
    this.activa = false
  }

  escuchar = async () => {
    while (this.activa) {
      await this.procesarTanda()
    }
  }

  procesarTanda = async () => {
    let novedades
    try {
      novedades = await this.telegram.obtenerNovedades({
        desde: this.desde,
        esperaSeg: this.esperaSeg,
      })
    } catch (error) {
      console.error(
        `No se pudieron leer los mensajes de Telegram; se reintenta en ${this.pausaTrasErrorMs / 1000} s: ${String(error?.message ?? error)}`,
      )
      await this.pausar(this.pausaTrasErrorMs)
      return
    }
    for (const novedad of novedades) {
      // Telegram confirma las novedades anteriores al offset: avanzar aunque
      // atenderla falle evita reprocesar la misma para siempre.
      this.desde = novedad.update_id + 1
      try {
        await this.atender(novedad)
      } catch (error) {
        console.error(
          `No se pudo responder el mensaje de Telegram ${novedad.update_id}: ${String(error?.message ?? error)}`,
        )
      }
    }
  }

  atender = async (novedad) => {
    if (!esMensajeDeTextoPrivado(novedad)) {
      return
    }
    const { chat, text } = novedad.message
    const respuesta = await this.conexionDeTelegram.atenderMensaje({
      chatId: chat.id,
      texto: text,
    })
    await this.telegram.enviarMensaje(chat.id, respuesta)
  }
}
