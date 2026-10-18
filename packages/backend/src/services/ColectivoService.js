import Colectivo from "../domain/Colectivo.js"
import {
  AlreadyExists,
  EntityInUse,
  EntityNotFound,
  InvalidReference,
} from "../errors/ApplicationErrors.js"

export default class ColectivoService {
  constructor(
    colectivoRepository,
    tipoColectivoRepository,
    proyectoRepository,
    provinciaRepository,
    paisRepository,
  ) {
    this.colectivoRepository = colectivoRepository
    this.tipoColectivoRepository = tipoColectivoRepository
    this.proyectoRepository = proyectoRepository
    this.provinciaRepository = provinciaRepository
    this.paisRepository = paisRepository
  }
  toDTO = (colectivo, proyectos) => ({
    id: colectivo.id,
    nombre: colectivo.nombre,
    descripcion: colectivo.descripcion,
    tipo: colectivo.tipo,
    pais: colectivo.pais,
    provincia: colectivo.provincia,
    ciudad: colectivo.ciudad,
    proyectos,
  })

  conProyectos = async (colectivo) =>
    this.toDTO(
      colectivo,
      await this.proyectoRepository.findByColectivoId(colectivo.id),
    )

  getAll = async () => {
    const colectivos = await this.colectivoRepository.findAll()
    return await Promise.all(colectivos.map(this.conProyectos))
  }

  getById = async (id) => {
    const colectivo = await this.colectivoRepository.findById(id)
    if (!colectivo) {
      throw new EntityNotFound("Colectivo no encontrado")
    }
    return await this.conProyectos(colectivo)
  }
  validarTipo = async(tipo) => {
    if (!await this.tipoColectivoRepository.findByNombre(tipo)) {
      throw new InvalidReference(
        "El tipo de colectivo no pertenece al catálogo",
      )
    }
  }

  resolverUbicacion = async ({ pais, provincia }) => {
    const provinciaId = provincia?.id ?? provincia
    let instanciaProvincia = null
    if (provinciaId) {
      instanciaProvincia = await this.provinciaRepository.findById(provinciaId)
      if (!instanciaProvincia) throw new InvalidReference("Provincia no encontrada")
    }

    const paisId = pais?.id ?? pais
    let instanciaPais = null
    if (paisId) {
      instanciaPais = await this.paisRepository.findById(paisId)
      if (!instanciaPais) throw new InvalidReference("País no encontrado")
    }

    return { pais: instanciaPais, provincia: instanciaProvincia }
  }

  create = async (nuevo) => {
    Colectivo.validarDatos(nuevo)
    await this.validarTipo(nuevo.tipo)
    const { pais, provincia } = await this.resolverUbicacion(nuevo)

    const colectivo = new Colectivo(
      nuevo.nombre,
      nuevo.descripcion,
      nuevo.tipo,
      pais,
      provincia,
      nuevo.ciudad,
    )

    const colectivoExistente = await this.colectivoRepository.findByNombre(
      colectivo.nombre,
    )
    if (colectivoExistente) {
      throw new AlreadyExists("Ya existe un colectivo con ese nombre")
    }

    return this.toDTO(await this.colectivoRepository.save(colectivo), [])
  }
  update = async (id, colectivoActualizado) => {
    const colectivoExistente = await this.colectivoRepository.findById(id)

    if (!colectivoExistente) throw new EntityNotFound("Colectivo no encontrado")

    Colectivo.validarDatos(colectivoActualizado)
    await this.validarTipo(colectivoActualizado.tipo)
    const { pais, provincia } = await this.resolverUbicacion(colectivoActualizado)

    const otro = await this.colectivoRepository.findByNombre(
      colectivoActualizado.nombre,
    )

    if (otro && otro.id !== colectivoExistente.id)
      throw new AlreadyExists("Ya existe un colectivo con ese nombre")
    colectivoExistente.nombre = colectivoActualizado.nombre
    colectivoExistente.descripcion = colectivoActualizado.descripcion
    colectivoExistente.tipo = colectivoActualizado.tipo
    colectivoExistente.pais = pais
    colectivoExistente.provincia = provincia
    colectivoExistente.ciudad = colectivoActualizado.ciudad || null

    const colectivoGuardado = await this.colectivoRepository.save(colectivoExistente)
    return await this.conProyectos(colectivoGuardado)
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
    const proyectos = await this.proyectoRepository.findByColectivoId(id)
    if (proyectos.length > 0) {
      throw new EntityInUse(
        "No se puede eliminar un colectivo con proyectos; eliminá sus proyectos primero",
      )
    }
    await this.colectivoRepository.delete(id)
  }
}
