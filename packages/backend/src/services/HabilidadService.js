import { HabilidadRepository } from "../repositories/HabilidadRepository.js"
import { ConflictError } from "../errors/AppError.js"
import { Habilidad } from "../domain/Habilidad.js"
 
export default class HabilidadService {
  constructor(habilidadRepository = new HabilidadRepository()) {
    this.habilidadRepository = habilidadRepository
  }
 
  create = (nueva) => {
    const habilidadExistente = this.habilidadRepository.findByCodigo(nueva.codigo)
    if (habilidadExistente) {
      throw new ConflictError(`Ya existe una habilidad con código: ${nueva.codigo}`)
    }
    const habilidad = new Habilidad(nueva.titulo, nueva.codigo, nueva.descripcion)
    return this.habilidadRepository.save(habilidad)
  }
 
  getAll = () => {
    return this.habilidadRepository.getAll()
  }
}
