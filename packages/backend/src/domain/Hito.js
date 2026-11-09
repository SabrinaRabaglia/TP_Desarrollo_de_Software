import { DomainValidationError } from "./errors/DomainErrors.js"

const reglas = {
  fecha: (fecha) =>
    Number.isNaN(new Date(fecha).getTime()) && "La fecha del hito es inválida.",
  porcentajeConcrecion: (porcentaje) =>
    !(Number.isInteger(porcentaje) && porcentaje >= 0 && porcentaje <= 100) &&
    "El porcentaje de concreción debe ser un entero entre 0 y 100.",
  descripcion: (descripcion) =>
    !descripcion?.trim() && "La descripción del hito es obligatoria.",
}

export class Hito {
  constructor(fecha, porcentajeConcrecion, descripcion, proyecto) {
    Hito.validarDatos({ fecha, porcentajeConcrecion, descripcion })
    this.fecha = new Date(fecha)
    this.porcentajeConcrecion = porcentajeConcrecion
    this.descripcion = descripcion
    this.proyecto = proyecto
  }

  static validarDatos(datos) {
    Hito.validar(Object.keys(reglas), datos)
  }

  static validarCambios(cambios) {
    Hito.validar(Object.keys(cambios), cambios)
  }

  static validar(campos, datos) {
    for (const campo of campos) {
      const falla = reglas[campo]?.(datos[campo])
      if (falla) {
        throw new DomainValidationError(falla)
      }
    }
  }
}
