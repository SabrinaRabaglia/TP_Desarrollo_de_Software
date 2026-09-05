import { PersonaColaboradoraRepository } from "../repositories/PersonaColaboradoraRepository.js"
import { HabilidadRepository } from "../repositories/HabilidadRepository.js"
import { NotFoundError } from "../errors/AppError.js"
import { PersonaColaboradora } from "../domain/PersonaColaboradora.js"
import { Cuenta } from "../domain/Cuenta.js"

export default class PersonaColaboradoraService {
  constructor(
    personaColaboradoraRepository = new PersonaColaboradoraRepository(),
    habilidadRepository = new HabilidadRepository(),
  ) {
    this.personaColaboradoraRepository = personaColaboradoraRepository
    this.habilidadRepository = habilidadRepository
  }

  create = (nueva) => {
    const codigosHabilidades = (nueva.habilidades ?? []).map((codigo) => { // si nueva.habilidades viene undefined, se queda con la lista vacía así map no rompe
    const habilidad = this.habilidadRepository.findByCodigo(codigo)
      if (!habilidad) {
        throw new NotFoundError(`No existe una habilidad cuyo codigo sea: ${codigo}`)
      }
      return habilidad
    })

    const cuentas = (nueva.cuentas ?? []).map((cuenta) => new Cuenta(cuenta.nombreUsuario, cuenta.tipo))

    const personaColaboradora = new PersonaColaboradora(nueva.nombreFantasia, {
      nombre: nueva.nombre,
      apellido: nueva.apellido,
      pronombres: nueva.pronombres,
      presentacion: nueva.presentacion,
      cuentas,
      habilidades,
    })

    return this.personaColaboradoraRepository.save(personaColaboradora)
  }

  getAll = () => {
    return this.personaColaboradoraRepository.getAll()
  }
}