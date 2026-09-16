import { randomUUID } from "node:crypto"
import { ConflictError, NotFoundError } from "../errors/AppError.js"
import { Proyecto } from "../domain/Proyecto.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "../domain/enum/ModalidadColaboracion.js"
import {  UnprocessableEntityError } from "../errors/AppError.js"


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
      throw new NotFoundError("PROYECTO NO ENCONTRADO!")
    }
    return proyecto
  }

  validarReferencias = async (datos) => {
    await this.colectivoService.getById(datos.colectivo)
    for (const id of datos.habilidadesRequeridas ?? []) {
      await this.habilidadService.getById(id)
    }
  }

  validarDatos(modalidadesColaboracion) {
    if (
      modalidadesColaboracion.some(
        (modalidad) =>
          !Object.values(ModalidadColaboracion).includes(modalidad),
      )
    ) {
      throw new UnprocessableEntityError(
        "La modalidad de colaboración es inválida.",
      )
    }
  }

  create = async (nuevo) => {
    if (nuevo.titulo && this.proyectoRepository.findByTitulo?.(nuevo.titulo)) {
      throw new ConflictError("PROYECTO EXISTENTE!")
    }

    this.validarReferencias(nuevo)

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
    proyecto.id = randomUUID()

    return await this.proyectoRepository.save(proyecto)
  }

  update = async (id, proyectoActualizado) => {
    const proyectoExistente = await  this.getById(id)

    if (
      proyectoExistente.proyectoCerrado() &&
      proyectoActualizado.estado !== undefined &&
      proyectoActualizado.estado !== EstadoProyecto.CERRADO
    ) {
      throw new ConflictError("No se puede reabrir un proyecto cerrado")
    }

    if (
      proyectoActualizado.titulo &&
      proyectoActualizado.titulo !== proyectoExistente.titulo &&
      this.proyectoRepository.findByTitulo?.(proyectoActualizado.titulo)
    ) {
      throw new ConflictError("PROYECTO EXISTENTE!")
    }

    const datosActualizados = {
      ...proyectoExistente,
      ...proyectoActualizado,
    }
    Proyecto.validarDatos(datosActualizados)
    this.validarReferencias(datosActualizados)

    Object.assign(proyectoExistente, proyectoActualizado)

    return await this.proyectoRepository.save(proyectoExistente)
  }

  cerrarProyecto = async (id) => {
    const proyecto = await this.getById(id)
    proyecto.cerrar()
    return await this.proyectoRepository.save(proyecto)
  }

  delete = async (id) => {
    await this.getById(id)
    await this.proyectoRepository.delete(id)
  }
}
