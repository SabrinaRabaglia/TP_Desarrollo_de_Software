import { DomainValidationError } from "./errors/DomainErrors.js"
export default class PersonaColaboradora {
  constructor(
    nombreFantasia,
    nombre = null,
    apellido = null,
    pronombres = [],
    presentacion = null,
    cuentas = [],
    habilidades = [],
  ) {
    PersonaColaboradora.validarDatos({ nombreFantasia })
    this.id = crypto.randomUUID()
    this.nombreFantasia = nombreFantasia
    this.nombre = nombre
    this.apellido = apellido
    this.pronombres = pronombres
    this.presentacion = presentacion
    this.cuentas = cuentas
    this.habilidades = habilidades
    this.colaboraciones = []
  }

  static validarDatos({ nombreFantasia }) {
    if (!nombreFantasia) {
      throw new DomainValidationError(
        "La persona colaboradora debe tener un nombre de fantasia",
      )
    }
  }

  agregarHabilidad(habilidad) {
    this.habilidades.push(habilidad)
  }

  agregarCuenta(cuenta) {
    this.cuentas.push(cuenta)
  }

  agregarColaboracion(colaboracion) {
    this.colaboraciones.push(colaboracion)
  }
}
