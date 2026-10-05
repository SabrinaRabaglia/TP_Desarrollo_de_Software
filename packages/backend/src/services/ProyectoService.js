import { AlreadyExists, EntityNotFound, InvalidReference } from "../errors/ApplicationErrors.js"
import { Proyecto } from "../domain/Proyecto.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"

// Un documento de Mongoose no se puede esparcir con "...": sus campos son getters del prototipo.
const datosDelProyecto = ({
  titulo,
  descripcion,
  unidadCompromiso,
  cantHoras,
  colectivo,
  modalidadesColaboracion,
  estado,
  fechaAlta,
  fechaCierre,
  habilidadesRequeridas,
}) => ({
  titulo,
  descripcion,
  unidadCompromiso,
  cantHoras,
  colectivo,
  modalidadesColaboracion,
  estado,
  fechaAlta,
  fechaCierre,
  habilidadesRequeridas,
})

export default class ProyectoService {
  constructor(proyectoRepository, colectivoService, habilidadService) {
    this.proyectoRepository = proyectoRepository
    this.colectivoService = colectivoService
    this.habilidadService = habilidadService

  }

  getAll = async () => {
    return await this.proyectoRepository.findAll()
  }

  getById = async (id) => {
    const proyecto = await this.proyectoRepository.findById(id)
    if (!proyecto) {
      throw new EntityNotFound("Proyecto no encontrado")
    }
    return proyecto
  }

  validarReferencias = async (datos) => {
    try {
      await this.colectivoService.getById(datos.colectivo)
    } catch (error) {
      if (error instanceof EntityNotFound) {
        throw new InvalidReference("Colectivo no encontrado")
      }
      throw error
    }
    for (const id of datos.habilidadesRequeridas ?? []) {
      try {
        await this.habilidadService.getById(id)
      } catch (error) {
        if (error instanceof EntityNotFound) {
          throw new InvalidReference("Habilidad no encontrada")
        }
        throw error
      }
    }
  }

  create = async (nuevo) => {
    const proyecto = new Proyecto(
      nuevo.titulo,
      nuevo.descripcion,
      nuevo.unidadCompromiso,
      nuevo.cantHoras ?? nuevo.cantidadHoras,
      nuevo.colectivo,
      nuevo.modalidadesColaboracion,
      nuevo.estado,
      nuevo.fechaAlta,
      nuevo.fechaCierre,
      nuevo.habilidadesRequeridas,
    )

    await this.validarReferencias(nuevo)

    if (await this.proyectoRepository.findByTitulo?.(proyecto.titulo)) {
      throw new AlreadyExists("Ya existe un proyecto con ese título")
    }

    return await this.proyectoRepository.save(proyecto)
  }

  update = async (id, proyectoActualizado) => {
    const proyectoExistente = await  this.getById(id)

    proyectoExistente.assertPuedeActualizarEstado(proyectoActualizado.estado)

    const datosActualizados = {
      ...datosDelProyecto(proyectoExistente),
      ...proyectoActualizado,
    }
    Proyecto.validarDatos(datosActualizados)
    await this.validarReferencias(datosActualizados)

    const existenteConMismoTitulo = await this.proyectoRepository.findByTitulo?.(proyectoActualizado.titulo)
    if (
      proyectoActualizado.titulo &&
      proyectoActualizado.titulo !== proyectoExistente.titulo &&
      existenteConMismoTitulo &&
      existenteConMismoTitulo.id !== id
    ) {
      throw new AlreadyExists("Ya existe un proyecto con ese título")
    }

    const { estado, ...resto } = proyectoActualizado
    Object.assign(proyectoExistente, resto)
    if (estado === EstadoProyecto.CERRADO) {
      proyectoExistente.cerrar()
    }

    return await this.proyectoRepository.save(proyectoExistente)
  }

  delete = async (id) => {
    await this.getById(id)
    await this.proyectoRepository.delete(id)
  }
}
