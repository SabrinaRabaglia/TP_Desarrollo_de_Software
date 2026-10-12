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
    aceptaMensajeriaInterna = false,
    mediosDeContacto = []
  ) {
    PersonaColaboradora.validarDatos({ nombreFantasia })
    this.nombreFantasia = nombreFantasia
    this.nombre = nombre
    this.apellido = apellido
    this.pronombres = pronombres
    this.presentacion = presentacion
    this.cuentas = cuentas
    this.habilidades = habilidades
    this.aceptaMensajeriaInterna = aceptaMensajeriaInterna
    this.mediosDeContacto = mediosDeContacto
    this.colaboraciones = []
  }

  static validarDatos({ nombreFantasia }) {
    if (!nombreFantasia) {
      throw new DomainValidationError(
        "La persona colaboradora debe tener un nombre de fantasía.",
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
