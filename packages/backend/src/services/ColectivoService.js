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

  getAll = async () => {
    return (await this.colectivoRepository.findAll()).map(this.incluirProyectos)
  }

  getById = async (id) => {
    const colectivo = await this.colectivoRepository.findById(id)
    if (!colectivo) {
      throw new NotFoundError("COLECTIVO NO ENCONTRADO!")
    }
    return this.incluirProyectos(colectivo)
  }
  validarTipo = async(tipo) => {
    if (!await this.tipoColectivoRepository.findByNombre(tipo)) {
      throw new UnprocessableEntityError(
        "El tipo de colectivo no pertenece al catálogo.",
      )
    }
  }

  create = async (nuevo) => {
    const colectivoExistente = await this.colectivoRepository.findByNombre(
      nuevo.nombre,
    )
    if (colectivoExistente) {
      throw new ConflictError("COLECTIVO EXISTENTE!")
    }

    await this.validarTipo(nuevo.tipo)


    let instanciaProvincia = null;
    if (nuevo.provincia) {
      instanciaProvincia = await this.provinciaRepository.findById(nuevo.provincia);
      if (!instanciaProvincia) throw new NotFoundError("PROVINCIA NO ENCONTRADA!");
    }

    let instanciaPais = null;
    if (nuevo.pais) {
      instanciaPais = await this.paisRepository.findById(nuevo.pais);
      if (!instanciaPais) throw new NotFoundError("PAÍS NO ENCONTRADO!");
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
    console.log("OBJETO ANTES DE GUARDAR:", colectivo)
    //return this.incluirProyectos(this.colectivoRepository.save(colectivo))
    return await this.colectivoRepository.save(colectivo);
  }
  update = async (id, colectivoActualizado) => {
    const colectivoExistente = await this.colectivoRepository.findById(id)

    if (!colectivoExistente) throw new NotFoundError("Colectivo no encontrado")

    Colectivo.validarDatos(colectivoActualizado)
    await this.validarTipo(colectivoActualizado.tipo)

    const otro = await this.colectivoRepository.findByNombre(
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

    return await this.incluirProyectos(
      this.colectivoRepository.save(colectivoExistente),
    )
  }
  patch = async (id, cambios) => {
    const existente = await this.colectivoRepository.findById(id)

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
    await this.colectivoRepository.findById(id)
    await this.colectivoRepository.delete(id)
  }
}
