import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { Proyecto } from "../domain/Proyecto.js";

export default class ProyectoService {
    constructor(proyectoRepository, colectivoService, habilidadService) {
        this.proyectoRepository = proyectoRepository;
        this.colectivoService = colectivoService;
        this.habilidadService = habilidadService;
    }

    getAll = () => {
        return this.proyectoRepository.findAll();
    };

    getById = (id) => {
        const proyecto = this.proyectoRepository.findById(id);
        if (!proyecto) {
            throw new NotFoundError("PROYECTO NO ENCONTRADO!");
        }
        return proyecto;
    };

    validarReferencias = (datos) => {
        this.colectivoService.getById(datos.colectivo);
        for (const id of datos.habilidadesRequeridas ?? []) {
            this.habilidadService.getById(id);
        }
    };

    create = (nuevo) => {
        if (nuevo.titulo && this.proyectoRepository.findByTitulo?.(nuevo.titulo)) {
            throw new ConflictError("PROYECTO EXISTENTE!");
        }

        this.validarReferencias(nuevo);

        const proyecto = new Proyecto(
            nuevo.titulo,
            nuevo.descripcion,
            nuevo.unidadCompromiso,
            nuevo.cantHoras || nuevo.cantidadHoras,
            nuevo.colectivo,
            nuevo.modalidadesColaboracion,
            nuevo.estado,
            nuevo.fechaAlta,
            nuevo.fechaCierre,
            nuevo.habilidadesRequeridas
        );
        proyecto.id = randomUUID();

        return this.proyectoRepository.save(proyecto);
    };

    update = (id, proyectoActualizado) => {
        const proyectoExistente = this.getById(id);

        if (
            proyectoActualizado.titulo &&
            proyectoActualizado.titulo !== proyectoExistente.titulo &&
            this.proyectoRepository.findByTitulo?.(proyectoActualizado.titulo)
        ) {
            throw new ConflictError("PROYECTO EXISTENTE!");
        }

        this.validarReferencias({
            ...proyectoExistente,
            ...proyectoActualizado,
        });

        Object.assign(proyectoExistente, proyectoActualizado);

        return this.proyectoRepository.save(proyectoExistente);
    };

    delete = (id) => {
        this.getById(id);
        this.proyectoRepository.delete(id);
    };
}
