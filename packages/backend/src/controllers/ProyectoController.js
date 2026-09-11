import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js";
import { z } from "zod";
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js";
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js";
import ProyectoService from "../services/ProyectoService.js";
import { BadRequestError } from "../errors/AppError.js";

const proyectoSchema = z.object({
    titulo: z.string(),
    descripcion: z.string(),
    unidadCompromiso: z.nativeEnum(UnidadCompromiso),
    cantHoras: z.number().int(),
    colectivo: z.string(),
    modalidadesColaboracion: z.array(z.nativeEnum(ModalidadColaboracion)),
    habilidadesRequeridas: z.array(z.string()),
    estado: z.nativeEnum(EstadoProyecto),
    fechaAlta: z.coerce.date(),
    fechaCierre: z.coerce.date().nullable() 
}).strict();

export default class ProyectoController {
    constructor(proyectoService = new ProyectoService()){
        this.proyectoService = proyectoService;
    }
    
    getAll = (req, res) => {
        res.status(200).json(this.proyectoService.getAll());
    }

    getById = (req, res) => {
        const { id } = req.params;
        res.status(200).json(this.proyectoService.getById(id));
    }

    create = (req, res) => {
        const body = req.body;
        const resultado = proyectoSchema.safeParse(body);
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues);
        }
        const nuevo = resultado.data;
        this.proyectoService.create(nuevo);
        res.status(201).json(nuevo);
    } 

    put = (req, res) => {
        const body = req.body;
        const resultado = proyectoSchema.safeParse(body);
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues);
        }
        const update = resultado.data;
        const id = req.params.id;
        if (this.proyectoService.update(id, update)) {
            res.status(200).json(update);
        }
    }

    patch = (req, res) => {
        const { id } = req.params;
        const resultado = proyectoSchema.partial().safeParse(req.body);
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues);
        }
        const proyectoActualizado = this.proyectoService.update(id, resultado.data);
        res.status(200).json(proyectoActualizado);
    };
    
    delete = (req, res) => {
        const { id } = req.params;
        this.proyectoService.delete(id);
        res.status(204).send();
    };
}
