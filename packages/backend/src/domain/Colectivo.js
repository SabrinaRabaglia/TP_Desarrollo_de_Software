import { UnprocessableEntityError } from "../errors/AppError.js";

export default class Colectivo {
    constructor(nombre,descripcion,tipo,pais =null,provincia =null, ciudad=null){
        Colectivo.validarDatos({ nombre, descripcion, tipo });
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipo = tipo;
        this.pais = pais;
        this.provincia = provincia;
        this.ciudad = ciudad;
        this.proyectos = [];
    }
    static validarDatos({ nombre, descripcion, tipo }) {
        if (!nombre || !descripcion || !tipo) {
            throw new UnprocessableEntityError("Nombre, descripción y tipo son obligatorios.");
        }
    }

    agregarProyecto(proyecto){
        this.proyectos.push(proyecto);
    }
}
