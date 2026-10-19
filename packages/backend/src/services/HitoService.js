import { Hito } from "../domain/Hito.js";
import { NotFoundError } from "../errors/AppError.js";

export default class HitoService {
  constructor(hitoRepository, proyectoService) {
    this.hitoRepository = hitoRepository;
    this.proyectoService = proyectoService;
  }

  getByProyectoId = async (proyectoId) => {
    await this.proyectoService.getById(proyectoId); // Valida que el proyecto exista
    return await this.hitoRepository.findByProyectoId(proyectoId);
  };

  create = async (proyectoId, nuevoHito) => {
    const proyecto = await this.proyectoService.getById(proyectoId);

    const hito = new Hito(
      nuevoHito.fecha,
      nuevoHito.porcentajeConcrecion,
      nuevoHito.descripcion,
      proyecto
    );

    const hitoGuardado = await this.hitoRepository.save(hito);

    // Opcional en memoria: Actualizar el array interno del proyecto si tu diseño lo requiere
    proyecto.hitos.push(hitoGuardado);
    await this.proyectoService.update(proyecto.id, proyecto);

    return hitoGuardado;
  };

  update = async (id, hitoActualizado) => {
    const hitoExistente = await this.hitoRepository.findById(id);
    if (!hitoExistente) {
      throw new NotFoundError("HITO NO ENCONTRADO!");
    }

    // Actualización parcial
    if (hitoActualizado.fecha) hitoExistente.fecha = new Date(hitoActualizado.fecha);
    if (hitoActualizado.porcentajeConcrecion !== undefined) hitoExistente.porcentajeConcrecion = hitoActualizado.porcentajeConcrecion;
    if (hitoActualizado.descripcion) hitoExistente.descripcion = hitoActualizado.descripcion;

    return await this.hitoRepository.save(hitoExistente);
  };

  delete = async (id) => {
    const hito = await this.hitoRepository.findById(id);
    if (!hito) {
      throw new NotFoundError("HITO NO ENCONTRADO!");
    }
    await this.hitoRepository.delete(id);
  };
}