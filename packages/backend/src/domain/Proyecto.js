import { EstadoProyecto } from "./enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "./enums/ModalidadColaboracion.js"
import { DomainValidationError,DomainRuleError } from "./errors/DomainErrors.js"

export default class Proyecto {
  constructor(
    titulo,
    descripcion,
    unidadCompromiso,
    cantHoras,
    colectivo,
    modalidadesColaboracion,
    estado = EstadoProyecto.PUBLICADO,
    fechaAlta = new Date(),
    fechaCierre = null,
    habilidadesRequeridas = [],
  ) {
    Proyecto.validarDatos({
      titulo,
      descripcion,
      unidadCompromiso,
      cantHoras,
      colectivo,
      modalidadesColaboracion,
      fechaAlta, fechaCierre
    })
    this.titulo = titulo
    this.descripcion = descripcion
    this.unidadCompromiso = unidadCompromiso
    this.cantHoras = cantHoras
    this.modalidadesColaboracion = modalidadesColaboracion
    this.estado = estado
    this.fechaAlta = fechaAlta
    this.fechaCierre = fechaCierre
    this.colectivo = colectivo
    this.habilidadesRequeridas = habilidadesRequeridas
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

  agregarColaboracion(colaboracion) {
    this.colaboraciones.push(colaboracion)
  }

  poseeHabilidadNecesaria(personaColaboradora) {
    return this.habilidadesRequeridas.some((idRequerido) =>
      personaColaboradora.habilidades.some(
        (habilidad) => habilidad.id === idRequerido,
      ),
    )
  }

  proyectoCerrado() {
    return this.estado === EstadoProyecto.CERRADO
  }

  static validarDatos({
    titulo,
    descripcion,
    unidadCompromiso,
    cantHoras,
    colectivo,
    modalidadesColaboracion,
    fechaAlta, fechaCierre
  }) {
    if (
      !titulo ||
      !descripcion ||
      !unidadCompromiso ||
      !cantHoras ||
      !colectivo
    ) {
      throw new DomainValidationError(
        "Título, descripción, unidad de compromiso, cantidad de horas y colectivo son obligatorios.",
      )
    }
    if (!Number.isInteger(cantHoras) || cantHoras <= 0) {
      throw new DomainValidationError(
        "La cantidad de horas debe ser un entero mayor que cero.",
      )
    }
    if (
      !Array.isArray(modalidadesColaboracion) ||
      modalidadesColaboracion.length === 0
    ) {
      throw new DomainValidationError(
        "El proyecto debe tener al menos una modalidad de colaboración.",
      )
    }
    if (
      modalidadesColaboracion.some(
        (modalidad) =>
          !Object.values(ModalidadColaboracion).includes(modalidad),
      )
    ) {
      throw new DomainValidationError(
        "La modalidad de colaboración es inválida.",
      )
    }
    if (fechaCierre && fechaCierre < fechaAlta) {
       throw new DomainValidationError(
         "La fecha de cierre no puede ser anterior a la fecha de alta."
       )
      }
  }






  
}

export { Proyecto }
