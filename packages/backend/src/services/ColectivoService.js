import { randomUUID } from "node:crypto"
import Colectivo from "../domain/Colectivo.js"
import  ColectivoRepository  from "../repositories/ColectivoRepository.js"
import  TipoColectivoRepository  from "../repositories/TipoColectivoRepository.js"
import  ProyectoRepository  from "../repositories/ProyectoRepository.js"
import  ProvinciaRepository  from "../repositories/ProvinciaRepository.js"
import  PaisRepository  from "../repositories/PaisRepository.js"
import {
  AlreadyExists,
  EntityNotFound,
  InvalidReference,
} from "../errors/ApplicationErrors.js"

export default class ColectivoService {
  constructor(
    colectivoRepository = new ColectivoRepository(),
    tipoColectivoRepository = new TipoColectivoRepository(),
    proyectoRepository = new ProyectoRepository(),
    provinciaRepository = new ProvinciaRepository(),
    paisRepository = new PaisRepository()
  ) {
    this.colectivoRepository = colectivoRepository
    this.tipoColectivoRepository = tipoColectivoRepository
    this.proyectoRepository = proyectoRepository
    this.provinciaRepository = provinciaRepository
    this.paisRepository = paisRepository
  }
  incluirProyectos = async (colectivo) => ({
    ...colectivo,
    proyectos: await this.proyectoRepository.findByColectivoId(colectivo.id),
  })

  getAll = async () => {
    const colectivos = await this.colectivoRepository.findAll()
    return await Promise.all(colectivos.map(this.incluirProyectos))
  }

  getById = async (id) => {
    const colectivo = await this.colectivoRepository.findById(id)
    if (!colectivo) {
      throw new EntityNotFound("Colectivo no encontrado")
    }
    return await this.incluirProyectos(colectivo)
  }
  validarTipo = async(tipo) => {
    if (!await this.tipoColectivoRepository.findByNombre(tipo)) {
      throw new InvalidReference(
        "El tipo de colectivo no pertenece al catálogo.",
      )
    }
  }

  create = async (nuevo) => {
    const colectivoExistente = await this.colectivoRepository.findByNombre(
      nuevo.nombre,
    )
    if (colectivoExistente) {
      throw new AlreadyExists("Ya existe un colectivo con ese nombre")
    }

    await this.validarTipo(nuevo.tipo)


    let instanciaProvincia = null;
    if (nuevo.provincia) {
      instanciaProvincia = await this.provinciaRepository.findById(nuevo.provincia);
      if (!instanciaProvincia) throw new InvalidReference("Provincia no encontrada")
    }

    let instanciaPais = null;
    if (nuevo.pais) {
      instanciaPais = await this.paisRepository.findById(nuevo.pais);
      if (!instanciaPais) throw new InvalidReference("País no encontrado")
    }

    const colectivo = new Colectivo(
      nuevo.nombre,
      nuevo.descripcion,
      nuevo.tipo,
      instanciaPais,
      instanciaProvincia,
      nuevo.ciudad,
    )
    colectivo.id = randomUUID()
    
    return await this.colectivoRepository.save(colectivo);
  }
  update = async (id, colectivoActualizado) => {
    const colectivoExistente = await this.colectivoRepository.findById(id)

    if (!colectivoExistente) throw new EntityNotFound("Colectivo no encontrado")

    Colectivo.validarDatos(colectivoActualizado)
    await this.validarTipo(colectivoActualizado.tipo)

    const otro = await this.colectivoRepository.findByNombre(
      colectivoActualizado.nombre,
    )

    if (otro && otro.id !== colectivoExistente.id)
      throw new AlreadyExists("Ya existe un colectivo con ese nombre")
    let instanciaProvincia = null;
    if (colectivoActualizado.provincia) {
      instanciaProvincia = await this.provinciaRepository.findById(colectivoActualizado.provincia);
      if (!instanciaProvincia) throw new InvalidReference("Provincia no encontrada")
    }
    colectivoExistente.nombre = colectivoActualizado.nombre
    colectivoExistente.descripcion = colectivoActualizado.descripcion
    colectivoExistente.tipo = colectivoActualizado.tipo
    colectivoExistente.pais = colectivoActualizado.pais || null
    colectivoExistente.provincia = colectivoActualizado.provincia || null
    colectivoExistente.ciudad = colectivoActualizado.ciudad || null

    const colectivoGuardado = await this.colectivoRepository.save(colectivoExistente)
    return await this.incluirProyectos(colectivoGuardado)
  }
  patch = async (id, cambios) => {
    const existente = await this.colectivoRepository.findById(id)
    if (!existente) throw new EntityNotFound("Colectivo no encontrado")

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
  delete = async (id) => {
    const colectivo = await this.colectivoRepository.findById(id)
    if (!colectivo) throw new EntityNotFound("Colectivo no encontrado")
    await this.colectivoRepository.delete(id)
  }
}
