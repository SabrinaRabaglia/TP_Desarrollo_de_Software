import { UnprocessableEntityError } from "../errors/AppError";

export default class Colectivo {
    constructor(nombre,descripcion,tipo,pais =null,provincia =null, ciudad=null){
        if (!nombre || !descripcion || !tipo) {
            throw new UnprocessableEntityError("Nombre, descripción y tipo son obligatorios.");
        }
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipo = TipoColectivo;
        this.pais = pais;
        this.provincia = provincia;
        this.ciudad = ciudad;
        this.proyectos = [];
    }
    agregarProyecto(proyecto){
        this.proyectos.push(proyecto);
    }
}
