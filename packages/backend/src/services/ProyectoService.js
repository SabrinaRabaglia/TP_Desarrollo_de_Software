import {ProyectoRepository} from "../repositories/ProyectoRepository";
import { ConflictError } from "../errors/AppError";
import {Proyecto} from "../domain/Proyecto";
export default class ProyectoService {
     constructor(proyectoRepository = new ProyectoRepository()){
            this.proyectoRepository = proyectoRepository;
        }
    getAll = () => {
        return this.proyectoRepository.findAll();
    };

    getById = (id) => {
        const colectivo = this.proyectoRepository.findById(id);
        if (!colectivo) {
            throw new NotFoundError("PROYECTO NO ENCONTRADO!");
        }
        return colectivo;
    };
    create = (nuevo) => {
            const proyectoExistente = this.proyectoRepository.findById(nuevo.id)
            if(proyectoExistente){
                throw new ConflictError("PROYECTO EXISTENTE!")
            }
            const proyecto = new Proyecto(
            nuevo.titulo,
            nuevo.descripcion,
            nuevo.unidadCompromiso,
            nuevo.cantidadHoras,
            nuevo.colectivo,
            nuevo.modalidadesColaboracion,
            nuevo.estado,
            nuevo.fechaAlta,
            nuevo.fechaCierre,
            nuevo.habilidadesRequeridas
        );
            return this.proyectoRepository.save(proyecto);
    }

    update = (id, proyectoActualizado) => {
        const proyectoExistente = this.productoRepository.findById(id)

        if(!proyectoExistente) throw new NotFoundError("Producto no encontrado")
        if (this.proyectoRepository.findByNombre(proyectoActualizado.nombre)) throw new ConflictError("PROYECTO EXISTENTE!")
        
        proyectoExistente.titulo = proyectoActualizado.titulo;
        proyectoExistente.descripcion = proyectoActualizado.descripcion;
        proyectoExistente.unidadCompromiso = proyectoActualizado.unidadCompromiso;
        proyectoExistente.cantidadHoras = proyectoActualizado.cantidadHoras;
        proyectoExistente.modalidadesColaboracion = proyectoActualizado.modalidadesColaboracion;
        proyectoExistente.habilidadesRequeridas = proyectoActualizado.habilidadesRequeridas || [];
        proyectoExistente.estado = proyectoActualizado.estado;
        proyectoExistente.fechaCierre = proyectoActualizado.fechaCierre || null;

        return this.proyectoRepository.save(proyectoExistente)
    }
    delete = (id) => {
        this.getById(id);
        this.proyectoRepository.delete(id);
    };

}
