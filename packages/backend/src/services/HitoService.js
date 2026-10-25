import { EntityNotFound } from "../errors/ApplicationErrors.js";
import { Hito } from "../domain/Hito.js";

export default class HitoService {
  constructor(proyectoService) {
    this.proyectoService = proyectoService; // Inyectamos el servicio de proyectos
  }

  async getByProyectoId(proyectoId) {
    const proyecto = await this.proyectoService.getById(proyectoId);
    return proyecto.hitos || [];
  }

  async create(proyectoId, hitoDto) {
    const proyecto = await this.proyectoService.getById(proyectoId);
    
    
    const nuevoHito = new Hito(
      hitoDto.fecha,
      hitoDto.porcentajeConcrecion,
      hitoDto.descripcion
    );

    // Lo agregamos al array embebido del proyecto
    proyecto.hitos.push(nuevoHito);

    // Guardamos el proyecto completo en la base de datos
    await this.proyectoService.update(proyectoId, { hitos: proyecto.hitos });
    
    // Devolvemos el hito recién creado (que Mongoose ya le asignó su _id/id)
    return proyecto.hitos[proyecto.hitos.length - 1];
  }

  async update(hitoId, hitoActualizadoDto) {
    
    const proyecto = await this.proyectoService.findByHitoId(hitoId); 
    if (!proyecto) throw new EntityNotFound("Hito no encontrado");

    const hito = proyecto.hitos.id(hitoId); 

    if (hitoActualizadoDto.fecha) hito.fecha = new Date(hitoActualizadoDto.fecha);
    if (hitoActualizadoDto.porcentajeConcrecion !== undefined) {
      hito.porcentajeConcrecion = hitoActualizadoDto.porcentajeConcrecion;
    }
    if (hitoActualizadoDto.descripcion) hito.descripcion = hitoActualizadoDto.descripcion;

    await this.proyectoService.update(proyecto.id, { hitos: proyecto.hitos });
    return hito;
  }

  async delete(hitoId) {
    const proyecto = await this.proyectoService.findByHitoId(hitoId);
    if (!proyecto) throw new EntityNotFound("Hito no encontrado");

    proyecto.hitos.pull(hitoId); // Método nativo de Mongoose para remover subdocs
    await this.proyectoService.update(proyecto.id, { hitos: proyecto.hitos });
  }
}