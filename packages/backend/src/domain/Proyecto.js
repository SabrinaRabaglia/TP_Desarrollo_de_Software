import { EstadoProyecto } from "./enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "./enums/ModalidadColaboracion.js"
import { UnprocessableEntityError } from "../errors/AppError.js"

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

  static validarDatos({
    titulo,
    descripcion,
    unidadCompromiso,
    cantHoras,
    colectivo,
    modalidadesColaboracion,
  }) {
    if (
      !titulo ||
      !descripcion ||
      !unidadCompromiso ||
      !cantHoras ||
      !colectivo
    ) {
      throw new UnprocessableEntityError(
        "Titulo, descripción, unidadCompromiso, cantHoras y colectivo son obligatorios.",
      )
    }
    if (!Number.isInteger(cantHoras) || cantHoras <= 0) {
      throw new UnprocessableEntityError(
        "La cantidad de horas debe ser un entero mayor que cero.",
      )
    }
    if (
      !Array.isArray(modalidadesColaboracion) ||
      modalidadesColaboracion.length === 0
    ) {
      throw new UnprocessableEntityError(
        "El proyecto debe tener al menos una modalidad de colaboración.",
      )
    }
    if (
      modalidadesColaboracion.some(
        (modalidad) =>
          !Object.values(ModalidadColaboracion).includes(modalidad),
      )
    ) {
      throw new UnprocessableEntityError(
        "La modalidad de colaboración es inválida.",
      )
    }
  }
}

export { Proyecto }
