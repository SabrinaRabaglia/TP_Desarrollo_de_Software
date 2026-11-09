import { DomainValidationError } from "./errors/DomainErrors.js"
import { EstadoEnvio } from "./enums/EstadoEnvio.js"

export default class Notificacion {
  constructor({
    contenido,
    colectivo,
    personaColaboradora,
    perfil,
    mediosDeContacto = [],
  }) {
    Notificacion.validarDatos({
      contenido,
      colectivo,
      personaColaboradora,
      perfil,
    })
    this.fecha = new Date()
    this.contenido = contenido
    this.colectivo = colectivo
    this.personaColaboradora = personaColaboradora
    this.perfil = perfil
    this.envios = mediosDeContacto.map((medio) => ({
      medio: { tipo: medio.tipo, valor: medio.valor },
      estado: EstadoEnvio.PENDIENTE,
      intentos: 0,
      ultimoError: null,
      enviadoEn: null,
    }))
    this.procesandoDesde = null
    this.reintentarDesde = null
  }

  static validarDatos({ contenido, colectivo, personaColaboradora, perfil }) {
    if (!contenido?.trim()) {
      throw new DomainValidationError("La notificación debe tener contenido.")
    }
    if (!colectivo || !personaColaboradora || !perfil) {
      throw new DomainValidationError(
        "La notificación debe indicar colectivo, persona colaboradora y perfil.",
      )
    }
  }

  get pendienteDeEnvio() {
    return this.enviosPendientes().length > 0
  }

  get mediosExternosUtilizados() {
    return this.envios
      .filter((envio) => envio.estado === EstadoEnvio.ENVIADO)
      .map((envio) => envio.medio.tipo)
  }

  enviosPendientes() {
    return this.envios.filter((envio) => envio.estado === EstadoEnvio.PENDIENTE)
  }

  registrarEnvioExitoso(envio, fecha) {
    envio.estado = EstadoEnvio.ENVIADO
    envio.intentos += 1
    envio.ultimoError = null
    envio.enviadoEn = fecha
  }

  registrarEnvioFallido(envio, error, maximoDeIntentos) {
    envio.intentos += 1
    envio.ultimoError = error
    if (envio.intentos >= maximoDeIntentos) {
      envio.estado = EstadoEnvio.FALLIDO
    }
  }

  liberar(reintentarDesde) {
    this.procesandoDesde = null
    this.reintentarDesde = this.pendienteDeEnvio ? reintentarDesde : null
  }
}
