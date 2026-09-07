import Colectivo from "../domain/Colectivo";
import { ConflictError } from "../errors/AppError";

export default class ColectivoService {
    constructor(colectivoRepository = new ColectivoRepository()){
        this.colectivoRepository = colectivoRepository;
    }
    getAll = () => {
        return this.colectivoRepository.findAll();
    };

    getById = (id) => {
        const colectivo = this.colectivoRepository.findById(id);
        if (!colectivo) {
            throw new NotFoundError("COLECTIVO NO ENCONTRADO!");
        }
        return colectivo;
    };
    create = (nuevo) => {
        // Validamos por nombre para evitar duplicados
        const colectivoExistente = this.colectivoRepository.findByNombre(nuevo.nombre);
        if (colectivoExistente) {
            throw new ConflictError("COLECTIVO EXISTENTE!");
        }

        const colectivo = new Colectivo(
            nuevo.nombre,
            nuevo.descripcion,
            nuevo.tipo,
            nuevo.pais,
            nuevo.provincia,
            nuevo.ciudad
        );

        return this.colectivoRepository.save(colectivo);
    };
     update = (id, colectivoActualizado) => {
        const colectivoExistente = this.productoRepository.findById(id)

        if(!colectivoExistente) throw new NotFoundError("Producto no encontrado")
        if (this.colectivoRepository.findByNombre(colectivoActualizado.nombre)) throw new ConflictError("COLECTIVO EXISTENTE!")
        
        colectivoExistente.nombre = colectivoActualizado.nombre;
        colectivoExistente.descripcion = colectivoActualizado.descripcion;
        colectivoExistente.tipo = colectivoActualizado.tipo;
        colectivoExistente.pais = colectivoActualizado.pais || null;
        colectivoExistente.provincia = colectivoActualizado.provincia || null;
        colectivoExistente.ciudad = colectivoActualizado.ciudad || null;

        return this.colectivoRepository.save(colectivoExistente)
    }
    delete = (id) => {
        this.getById(id);
        this.colectivoRepository.delete(id);
    };

}
