export default class Colectivo {
    constructor(nombre,descripcion,tipo,pais =null,provincia =null, ciudad=null){
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipo = tipo;
        this.pais = pais;
        this.provincia = provincia;
        this.ciudad = ciudad;
        this.proyectos = [];
    }
    agregarProyecto(proyecto){
        this.proyectos.push(proyecto);
    }
}
