import { z } from "zod";
import HitoService from "../services/HitoService.js";
import HitoRepository from "../repositories/HitoRepository.js";
import ProyectoService from "../services/ProyectoService.js";
import { BadRequestError } from "../errors/AppError.js";

// Esquema Zod para validar la entrada
const hitoSchema = z.object({
  fecha: z.coerce.date(),
  porcentajeConcrecion: z.number().int().min(0).max(100),
  descripcion: z.string()
}).strict();

export default class HitoController {
  constructor(
    hitoService = new HitoService(new HitoRepository(), new ProyectoService())
  ) {
    this.hitoService = hitoService;
  }

  create = async (req, res, next) => {
    try {
      const { proyectoId } = req.params; 
      const resultado = hitoSchema.safeParse(req.body);
      
      if (resultado.error) {
        // Lanzamos el error HTTP para que lo atrape el catch y vaya al middleware
        throw new BadRequestError("Datos inválidos", resultado.error.issues);
      }
      
      const nuevoHito = await this.hitoService.create(proyectoId, resultado.data);
      res.status(201).json(nuevoHito);
    } catch (error) {
      // Delegamos el error al middleware traductor
      next(error); 
    }
  };

 // Obtener todos los hitos de un proyecto
  getByProyectoId = async (req, res, next) => {
    try {
      // Extraemos el proyectoId de los parámetros de la ruta (ej: /proyectos/:proyectoId/hitos)
      const { proyectoId } = req.params;
      
      const hitos = await this.hitoService.getByProyectoId(proyectoId);
      
      res.status(200).json(hitos);
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Usamos .partial() en el esquema Zod porque en un update (PATCH) 
      // el usuario podría enviar solo la descripción o solo el porcentaje, sin enviar todo.
      const resultado = hitoSchema.partial().safeParse(req.body);
      
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues);
      }
      
      const hitoActualizado = await this.hitoService.update(id, resultado.data);
      
      res.status(200).json(hitoActualizado);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      await this.hitoService.delete(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }; 
}

