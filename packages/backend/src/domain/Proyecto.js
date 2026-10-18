import { EstadoProyecto } from "./enums/EstadoProyecto.js"
import {
  DomainValidationError,
  DomainRuleError,
} from "./errors/DomainErrors.js"
import Notificacion from "./Notificacion.js"

export default class Proyecto {
  constructor(
    titulo,
    descripcion,
    colectivo,
    estado = EstadoProyecto.PUBLICADO,
    fechaAlta = new Date(),
    fechaCierre = null,
  ) {
    Proyecto.validarDatos({
      titulo,
      descripcion,
      colectivo,
      estado,
      fechaAlta,
      fechaCierre,
    })
    this.titulo = titulo
    this.descripcion = descripcion
    this.estado = estado
    this.fechaAlta = fechaAlta
    this.fechaCierre = fechaCierre
    this.colectivo = colectivo
    this.perfiles = []
    this.colaboraciones = []
  }

  cerrar() {
    if (this.proyectoCerrado()) {
      throw new DomainRuleError("El proyecto ya está cerrado.")
    }
    this.estado = EstadoProyecto.CERRADO
    this.fechaCierre = new Date()
  }

  assertPuedeActualizarEstado(nuevoEstado) {
    if (
      this.proyectoCerrado() &&
      nuevoEstado !== undefined &&
      nuevoEstado !== EstadoProyecto.CERRADO
    ) {
      throw new DomainRuleError("No se puede reabrir un proyecto cerrado.")
    }
  }

  assertPuedeModificarPerfiles() {
    if (this.proyectoCerrado()) {
      throw new DomainRuleError(
        "No se pueden modificar los perfiles de un proyecto cerrado.",
      )
    }
  }

  assertPuedeBuscarColaboradores() {
    if (this.proyectoCerrado()) {
      throw new DomainRuleError(
        "Un proyecto cerrado no busca personas colaboradoras.",
      )
    }
  }

  buscarPerfil(perfilId) {
    return this.perfiles.find((perfil) => perfil.id === perfilId)
  }

  agregarPerfil(perfil) {
    this.assertPuedeModificarPerfiles()
    this.perfiles.push(perfil)
    return this.perfiles.at(-1)
  }

  actualizarPerfil(perfil, datos) {
    this.assertPuedeModificarPerfiles()
    perfil.actualizar(datos)
  }

  eliminarPerfil(perfilId) {
    this.assertPuedeModificarPerfiles()
    this.perfiles = this.perfiles.filter((perfil) => perfil.id !== perfilId)
  }

  contactar(perfil, personaColaboradora, contenido) {
    if (this.proyectoCerrado()) {
      throw new DomainRuleError(
        "Un proyecto cerrado no puede contactar personas colaboradoras.",
      )
    }
    personaColaboradora.assertAceptaMensajeriaInterna()
    return new Notificacion({
      contenido,
      colectivo: this.colectivo,
      personaColaboradora,
      perfil,
    })
  }

  agregarColaboracion(colaboracion) {
    this.colaboraciones.push(colaboracion)
  }

  algunPerfilEsCubiertoPor(personaColaboradora) {
    return this.perfiles.some((perfil) =>
      perfil.estaCubiertoPor(personaColaboradora.habilidades),
    )
  }

  proyectoCerrado() {
    return this.estado === EstadoProyecto.CERRADO
  }

  static validarDatos({
    titulo,
    descripcion,
    colectivo,
    estado,
    fechaAlta,
    fechaCierre,
  }) {
    if (!titulo || !descripcion || !colectivo) {
      throw new DomainValidationError(
        "Título, descripción y colectivo son obligatorios.",
      )
    }
    if (estado != null && !Object.values(EstadoProyecto).includes(estado)) {
      throw new DomainValidationError("El estado del proyecto es inválido.")
    }
    if (fechaCierre && fechaCierre < fechaAlta) {
      throw new DomainValidationError(
        "La fecha de cierre no puede ser anterior a la fecha de alta.",
      )
    }
  }
}
