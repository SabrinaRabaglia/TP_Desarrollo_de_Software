import { EstadoProyecto } from "./enums/EstadoProyecto.js";

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
            this.id = crypto.randomUUID();
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
    agregarColaboracion(colaboracion) {
    this.colaboraciones.push(colaboracion);
  }

    poseeHabilidadNecesaria(personaColaboradora){
        return this.habilidadesRequeridas.some(hReq=>personaColaboradora.habilidades.includes(hReq))
    }

    proyectoCerrado(){
        return this.estado === EstadoProyecto.CERRADO;
    }
}
