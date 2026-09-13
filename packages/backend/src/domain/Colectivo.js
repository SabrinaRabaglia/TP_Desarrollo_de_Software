import { UnprocessableEntityError } from "../errors/AppError.js";
import Provincia from "./Provincia.js";

export default class Colectivo {
    constructor(nombre,descripcion,tipo,pais =null,provincia =null, ciudad=null){
        Colectivo.validarDatos({ nombre, descripcion, tipo, provincia });
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipo = tipo;
        this.pais = pais;
        this.provincia = provincia;
        this.ciudad = ciudad;
        this.proyectos = [];
    }
    static validarDatos({ nombre, descripcion, tipo, provincia }) {
        if (!nombre || !descripcion || !tipo) {
            throw new UnprocessableEntityError("Nombre, descripción y tipo son obligatorios.");
        }
        if (provincia !== undefined && provincia !== null) {
            Provincia.validar(provincia instanceof Provincia ? provincia.nombre : provincia);
        }
    }

    agregarProyecto(proyecto){
        this.proyectos.push(proyecto);
    }
}
