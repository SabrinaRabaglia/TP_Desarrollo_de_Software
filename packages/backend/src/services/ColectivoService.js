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
  // Devuelve el colectivo junto con sus proyectos, que se guardan del lado
  // del proyecto (proyecto.colectivo) y no dentro del colectivo.
  conProyectos = async (colectivo) => ({
    colectivo,
    proyectos: await this.proyectoRepository.findByColectivoId(colectivo.id),
  })

  getAll = async () => {
    const colectivos = await this.colectivoRepository.findAll()
    return await Promise.all(colectivos.map(this.conProyectos))
  }

  buscarExistente = async (id) => {
    const colectivo = await this.colectivoRepository.findById(id)
    if (!colectivo) {
      throw new EntityNotFound("Colectivo no encontrado")
    }
    return colectivo
  }

  getById = async (id) => {
    return await this.conProyectos(await this.buscarExistente(id))
  }

  validarTipo = async (tipo) => {
    if (!(await this.tipoColectivoRepository.findByNombre(tipo))) {
      throw new InvalidReference(
        "El tipo de colectivo no pertenece al catálogo",
      )
    }
  }

  validarNombreDisponible = async (nombre, id = null) => {
    const otro = await this.colectivoRepository.findByNombre(nombre)
    if (otro && otro.id !== id) {
      throw new AlreadyExists("Ya existe un colectivo con ese nombre")
    }
  }

  buscarReferencia = async (repository, id, mensaje) => {
    if (!id) return null
    const encontrado = await repository.findById(id)
    if (!encontrado) throw new InvalidReference(mensaje)
    return encontrado
  }

  resolverUbicacion = async ({ pais, provincia }) => ({
    pais: await this.buscarReferencia(
      this.paisRepository,
      pais,
      "País no encontrado",
    ),
    provincia: await this.buscarReferencia(
      this.provinciaRepository,
      provincia,
      "Provincia no encontrada",
    ),
  })

  create = async (nuevo) => {
    const colectivo = new Colectivo(
      nuevo.nombre,
      nuevo.descripcion,
      nuevo.tipo,
      null,
      null,
      nuevo.ciudad,
    )
    await this.validarTipo(colectivo.tipo)
    Object.assign(colectivo, await this.resolverUbicacion(nuevo))
    await this.validarNombreDisponible(colectivo.nombre)

    return {
      colectivo: await this.colectivoRepository.save(colectivo),
      proyectos: [],
    }
  }

  aplicarCambios = async (existente, datos) => {
    Colectivo.validarDatos(datos)
    await this.validarTipo(datos.tipo)
    const { pais, provincia } = await this.resolverUbicacion(datos)
    await this.validarNombreDisponible(datos.nombre, existente.id)

    existente.nombre = datos.nombre
    existente.descripcion = datos.descripcion
    existente.tipo = datos.tipo
    existente.pais = pais
    existente.provincia = provincia
    existente.ciudad = datos.ciudad || null

    return await this.conProyectos(
      await this.colectivoRepository.save(existente),
    )
  }

  update = async (id, datos) => {
    return await this.aplicarCambios(await this.buscarExistente(id), datos)
  }

  patch = async (id, cambios) => {
    const existente = await this.buscarExistente(id)
    return await this.aplicarCambios(existente, {
      nombre: existente.nombre,
      descripcion: existente.descripcion,
      tipo: existente.tipo,
      pais: existente.pais?.id ?? null,
      provincia: existente.provincia?.id ?? null,
      ciudad: existente.ciudad,
      ...cambios,
    })
  }

  delete = async (id) => {
    await this.buscarExistente(id)
    const proyectos = await this.proyectoRepository.findByColectivoId(id)
    if (proyectos.length > 0) {
      throw new EntityInUse(
        "No se puede eliminar un colectivo con proyectos; eliminá sus proyectos primero",
      )
    }
    await this.colectivoRepository.deleteById(id)
  }
}
