import { EstadoProyecto } from "./enums/EstadoProyecto.js"
import {
  DomainValidationError,
  DomainRuleError,
} from "./errors/DomainErrors.js"
import Notificacion from "./Notificacion.js"
import { inicioDelDiaSiguiente } from "./fechas.js"

export default class Proyecto {
  constructor(
    titulo,
    descripcion,
    colectivo,
    estado = EstadoProyecto.PUBLICADO,
    fechaAlta = new Date(),
    fechaCierre = null,
    enlaceSistemaEnFuncionamiento = null,
    enlaceCodigoFuente = null,
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
    this.enlaceSistemaEnFuncionamiento = enlaceSistemaEnFuncionamiento
    this.enlaceCodigoFuente = enlaceCodigoFuente
    this.hitos = []
  }
  getPorcentajeConcrecionActual() {
    if (this.hitos.length === 0) return 0
    // Asumiendo que el último hito cargado cronológicamente tiene el porcentaje actual
    const ultimoHito = this.hitos.reduce((latest, current) =>
      current.fecha > latest.fecha ? current : latest,
    )
    return ultimoHito.porcentajeConcrecion
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

  assertAdmiteHito({ fecha }) {
    if (fecha !== undefined && this.fechaAlta >= inicioDelDiaSiguiente(fecha)) {
      throw new DomainValidationError(
        "La fecha del hito no puede ser anterior al alta del proyecto.",
      )
    }
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
      mediosDeContacto: personaColaboradora.mediosDeContacto,
    })
  }

  poseeHabilidadNecesaria(personaColaboradora) {
    return this.perfiles.some((perfil) =>
      perfil.habilidadesRequeridas.some((idRequerido) =>
        personaColaboradora.habilidades.some(
          (habilidad) => String(habilidad.id) === String(idRequerido),
        ),
      ),
    )
  }

  proyectoCerrado() {
    return this.estado === EstadoProyecto.CERRADO
  }

  // El colectivo llega como ObjectId desde Mongo y como texto desde el token:
  // se comparan por su forma de texto (los 24 caracteres hexadecimales).
  esDelColectivo(colectivoId) {
    return String(this.colectivo) === String(colectivoId)
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
