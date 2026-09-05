export default class Habilidad {
    constructor(titulo, codigo, descripcion) {
        if (!titulo || !codigo || !descripcion) {
            throw new Error("Todos los campos son requeridos");
        }
        this.titulo = titulo;
        this.codigo = codigo;
        this.descripcion = descripcion;
    }
}
