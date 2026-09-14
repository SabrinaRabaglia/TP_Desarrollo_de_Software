import { EstadoProyecto } from "./enums/EstadoProyecto.js";
import { UnprocessableEntityError } from "../errors/AppError.js";

export default class Proyecto {
    constructor(
        titulo,
        descripcion,
        unidadCompromiso,
        cantHoras,
        colectivo,
        modalidadesColaboracion = [],
        estado = EstadoProyecto.PUBLICADO,
        fechaAlta = new Date(),
        fechaCierre = null,
        habilidadesRequeridas = []){
            if (!titulo || !descripcion || !unidadCompromiso || !cantHoras || !colectivo) {
          throw new UnprocessableEntityError("Titulo, descripción, unidadCompromiso, cantHoras y colectivo son obligatorios.");
        }
            this.titulo = titulo;
            this.descripcion = descripcion;
            this.unidadCompromiso = unidadCompromiso;
            this.cantHoras = cantHoras;
            this.modalidadesColaboracion = modalidadesColaboracion;
            this.estado = estado;
            this.fechaAlta = fechaAlta;
            this.fechaCierre = fechaCierre;
            this.colectivo = colectivo;
            this.habilidadesRequeridas = habilidadesRequeridas;
            this.colaboraciones=[];
        }

        cerrar(){
            this.estado=EstadoProyecto.CERRADO;
            this.fechaCierre= new Date();
        }

}

export { Proyecto };