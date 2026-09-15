import { randomUUID } from "node:crypto"
import Colectivo from "../domain/Colectivo.js"
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "../errors/AppError.js"

export default class ColectivoService {
  constructor(
    colectivoRepository,
    tipoColectivoRepository,
    proyectoRepository,
    provinciaRepository,
  ) {
    this.colectivoRepository = colectivoRepository
    this.tipoColectivoRepository = tipoColectivoRepository
    this.proyectoRepository = proyectoRepository
    this.provinciaRepository = provinciaRepository
  }

  incluirProyectos = (colectivo) => ({
    ...colectivo,
    proyectos: this.proyectoRepository.findByColectivoId(colectivo.id),
  })

  getAll = () => {
    return this.colectivoRepository.findAll().map(this.incluirProyectos)
  }

  getById = (id) => {
    const colectivo = this.colectivoRepository.findById(id)
    if (!colectivo) {
      throw new NotFoundError("COLECTIVO NO ENCONTRADO!")
    }
    return this.incluirProyectos(colectivo)
  }
  validarTipo = (tipo) => {
    if (!this.tipoColectivoRepository.findByNombre(tipo)) {
      throw new UnprocessableEntityError(
        "El tipo de colectivo no pertenece al catálogo.",
      )
    }
  }

  create = (nuevo) => {
    const colectivoExistente = this.colectivoRepository.findByNombre(
      nuevo.nombre,
    )
    if (colectivoExistente) {
      throw new ConflictError("COLECTIVO EXISTENTE!")
    }

    this.validarTipo(nuevo.tipo)

    const colectivo = new Colectivo(
      nuevo.nombre,
      nuevo.descripcion,
      nuevo.tipo,
      nuevo.pais,
      nuevo.provincia,
      nuevo.ciudad,
    )
    colectivo.id = randomUUID()
    console.log("OBJETO ANTES DE GUARDAR:", colectivo)
    //return this.incluirProyectos(this.colectivoRepository.save(colectivo))
    return this.colectivoRepository.save(colectivo);
  }
  update = (id, colectivoActualizado) => {
    const colectivoExistente = this.colectivoRepository.findById(id)

    if (!colectivoExistente) throw new NotFoundError("Colectivo no encontrado")

    Colectivo.validarDatos(colectivoActualizado)
    this.validarTipo(colectivoActualizado.tipo)

    const otro = this.colectivoRepository.findByNombre(
      colectivoActualizado.nombre,
    )

    if (otro && otro.id !== colectivoExistente.id)
      throw new ConflictError("COLECTIVO EXISTENTE!")

    colectivoExistente.nombre = colectivoActualizado.nombre
    colectivoExistente.descripcion = colectivoActualizado.descripcion
    colectivoExistente.tipo = colectivoActualizado.tipo
    colectivoExistente.pais = colectivoActualizado.pais || null
    colectivoExistente.provincia = colectivoActualizado.provincia || null
    colectivoExistente.ciudad = colectivoActualizado.ciudad || null

    return this.incluirProyectos(
      this.colectivoRepository.save(colectivoExistente),
    )
  }
  patch = (id, cambios) => {
    const existente = this.getById(id)

    return this.update(id, {
      nombre: existente.nombre,
      descripcion: existente.descripcion,
      tipo: existente.tipo,
      pais: existente.pais,
      provincia: existente.provincia,
      ciudad: existente.ciudad,
      ...cambios,
    })
  }
  delete = (id) => {
    this.getById(id)
    this.colectivoRepository.delete(id)
  }
}
