import { ModalidadColaboracion } from "./enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "./enums/UnidadCompromiso.js"
import { DomainValidationError } from "./errors/DomainErrors.js"

const esListaNoVacia = (valor) => Array.isArray(valor) && valor.length > 0
const idDe = (habilidad) => String(habilidad._id ?? habilidad.id ?? habilidad)

export default class Perfil {
  constructor(datos) {
    Perfil.validarDatos(datos)
    this.asignar(datos)
  }

  actualizar(datos) {
    Perfil.validarDatos(datos)
    this.asignar(datos)
  }

  cantidadDeHabilidadesOpcionalesDe(personaColaboradora) {
    const suyas = new Set(personaColaboradora.habilidades.map(idDe))
    return this.habilidadesOpcionales.filter((habilidad) =>
      suyas.has(idDe(habilidad)),
    ).length
  }

  asignar({
    nombre = null,
    descripcion,
    unidadCompromiso,
    cantidadHoras,
    modalidadesColaboracion,
    habilidadesRequeridas,
    habilidadesOpcionales,
  }) {
    this.nombre = nombre
    this.descripcion = descripcion
    this.unidadCompromiso = unidadCompromiso
    this.cantidadHoras = cantidadHoras
    this.modalidadesColaboracion = modalidadesColaboracion
    this.habilidadesRequeridas = habilidadesRequeridas
    this.habilidadesOpcionales = habilidadesOpcionales
  }

  static validarDatos({
    descripcion,
    unidadCompromiso,
    cantidadHoras,
    modalidadesColaboracion,
    habilidadesRequeridas,
    habilidadesOpcionales,
  }) {
    if (!descripcion) {
      throw new DomainValidationError(
        "La descripción del perfil es obligatoria.",
      )
    }
    if (!Object.values(UnidadCompromiso).includes(unidadCompromiso)) {
      throw new DomainValidationError("La unidad de compromiso es inválida.")
    }
    if (!Number.isInteger(cantidadHoras) || cantidadHoras <= 0) {
      throw new DomainValidationError(
        "La cantidad de horas debe ser un entero positivo.",
      )
    }
    if (
      !esListaNoVacia(modalidadesColaboracion) ||
      !modalidadesColaboracion.every((modalidad) =>
        Object.values(ModalidadColaboracion).includes(modalidad),
      )
    ) {
      throw new DomainValidationError(
        "El perfil debe tener al menos una modalidad de colaboración válida.",
      )
    }
    if (!esListaNoVacia(habilidadesRequeridas)) {
      throw new DomainValidationError(
        "El perfil debe tener al menos una habilidad requerida.",
      )
    }
    if (!esListaNoVacia(habilidadesOpcionales)) {
      throw new DomainValidationError(
        "El perfil debe tener al menos una habilidad opcional.",
      )
    }
  }
}
