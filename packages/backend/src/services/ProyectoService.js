import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { Proyecto } from "../domain/Proyecto.js";

export default class ProyectoService {
    constructor(proyectoRepository) {
        this.proyectoRepository = proyectoRepository;
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

    create = (nuevo) => {
        if (nuevo.id && this.proyectoRepository.findById(nuevo.id)) {
            throw new ConflictError("PROYECTO EXISTENTE!");
        }
        if (nuevo.titulo && this.proyectoRepository.findByTitulo?.(nuevo.titulo)) {
            throw new ConflictError("PROYECTO EXISTENTE!");
        }

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
        proyecto.id = nuevo.id || Date.now().toString();

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

        Object.assign(proyectoExistente, proyectoActualizado);

        return this.proyectoRepository.save(proyectoExistente);
    };

    delete = (id) => {
        this.getById(id);
        this.proyectoRepository.delete(id);
    };
}
