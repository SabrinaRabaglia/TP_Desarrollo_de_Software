import { emitirCodigo, leerCodigo } from "../auth/codigoDeVinculacion.js"
import {
  EntityNotFound,
  ServicioNoDisponible,
} from "../errors/ApplicationErrors.js"

const RESPUESTAS = {
  enlaceVencido:
    "Ese enlace ya no sirve. Entrá a Mi perfil en Código a Voluntad y tocá Conectar Telegram de nuevo.",
  sinCodigo:
    "Para recibir avisos por acá, entrá a Mi perfil en Código a Voluntad y tocá Conectar Telegram.",
  soloAvisos:
    "Este chat es solo para avisos. Para responder a un colectivo entrá a Código a Voluntad.",
  conectada: (nombreFantasia) =>
    `Listo, ${nombreFantasia}. Desde ahora te aviso por acá cuando un colectivo te escriba en Código a Voluntad. Este chat es solo para avisos: para responder entrá a la plataforma.`,
}

export default class ConexionDeTelegram {
  constructor(
    telegram,
    personaColaboradoraRepository,
    { ahora = () => new Date() } = {},
  ) {
    this.telegram = telegram
    this.personaColaboradoraRepository = personaColaboradoraRepository
    this.ahora = ahora
    this.usuarioDelBot = null
  }

  crearEnlace = async (personaId) => {
    if (!this.telegram) {
      throw new ServicioNoDisponible(
        "Telegram no está disponible en este servidor",
      )
    }
    if (!(await this.personaColaboradoraRepository.findById(personaId))) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }
    this.usuarioDelBot ??= (await this.telegram.obtenerBot()).username
    const { codigo, venceEn } = emitirCodigo(personaId, this.ahora())
    return {
      enlace: `https://t.me/${this.usuarioDelBot}?start=${codigo}`,
      venceEn,
    }
  }

  atenderMensaje = async ({ chatId, texto }) => {
    const inicio = /^\/start(?:\s+(\S+))?$/.exec(texto.trim())
    if (!inicio) {
      return RESPUESTAS.soloAvisos
    }
    const [, codigo] = inicio
    if (!codigo) {
      return RESPUESTAS.sinCodigo
    }
    const personaId = leerCodigo(codigo, this.ahora())
    const persona =
      personaId &&
      (await this.personaColaboradoraRepository.findById(personaId))
    if (!persona) {
      return RESPUESTAS.enlaceVencido
    }
    persona.conectarTelegram(String(chatId))
    await this.personaColaboradoraRepository.save(persona)
    return RESPUESTAS.conectada(persona.nombreFantasia)
  }
}
