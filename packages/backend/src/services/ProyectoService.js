import { randomUUID } from "node:crypto"
import { ConflictError, NotFoundError } from "../errors/AppError.js"
import { Proyecto } from "../domain/Proyecto.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import {  UnprocessableEntityError } from "../errors/AppError.js"

import  ProyectoRepository  from "../repositories/ProyectoRepository.js"
import  ColectivoService  from "./ColectivoService.js"
import  HabilidadService  from "./HabilidadService.js"


export default class ProyectoService {
  constructor(proyectoRepository = new ProyectoRepository(),
    colectivoService = new ColectivoService(),
    habilidadService = new HabilidadService()) {
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
    if (nuevo.titulo && await this.proyectoRepository.findByTitulo?.(nuevo.titulo)) {
      throw new ConflictError("PROYECTO EXISTENTE!")
    }

    await this.validarReferencias(nuevo)

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
    const existenteConMismoTitulo = await this.proyectoRepository.findByTitulo?.(proyectoActualizado.titulo)
    if (
      proyectoActualizado.titulo &&
      proyectoActualizado.titulo !== proyectoExistente.titulo &&
      existenteConMismoTitulo &&
      existenteConMismoTitulo.id !== id
    ) {
      throw new ConflictError("PROYECTO EXISTENTE!")
    }

    const datosActualizados = {
      ...proyectoExistente,
      ...proyectoActualizado,
    }
    Proyecto.validarDatos(datosActualizados)
    await this.validarReferencias(datosActualizados)

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
