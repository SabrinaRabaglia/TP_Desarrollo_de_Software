import Colectivo from "../domain/Colectivo.js";
import { ConflictError, NotFoundError } from "../errors/AppError.js";

export default class ColectivoService {
    constructor(colectivoRepository){
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
        colectivo.id = nuevo.id || Date.now().toString();
        console.log("OBJETO ANTES DE GUARDAR:", colectivo);
        return this.colectivoRepository.save(colectivo);
    };
     update = (id, colectivoActualizado) => {
        const colectivoExistente = this.colectivoRepository.findById(id)

        if(!colectivoExistente) throw new NotFoundError("Colectivo no encontrado")

        const otro = this.colectivoRepository.findByNombre(colectivoActualizado.nombre);

        if (otro && otro.id !== colectivoExistente.id) throw new ConflictError("COLECTIVO EXISTENTE!")

        colectivoExistente.nombre = colectivoActualizado.nombre;
        colectivoExistente.descripcion = colectivoActualizado.descripcion;
        colectivoExistente.tipo = colectivoActualizado.tipo;
        colectivoExistente.pais = colectivoActualizado.pais || null;
        colectivoExistente.provincia = colectivoActualizado.provincia || null;
        colectivoExistente.ciudad = colectivoActualizado.ciudad || null;

        return this.colectivoRepository.save(colectivoExistente)
    }
    patch = (id, cambios) => {
    const existente = this.getById(id);

    return this.update(id, {
        nombre: existente.nombre,
        descripcion: existente.descripcion,
        tipo: existente.tipo,
        pais: existente.pais,
        provincia: existente.provincia,
        ciudad: existente.ciudad,
        ...cambios,
    });
    };
    delete = (id) => {
        this.getById(id);
        this.colectivoRepository.delete(id);
    };

}
