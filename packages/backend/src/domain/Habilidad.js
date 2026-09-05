import { UnprocessableEntityError } from "../errors/AppError";

export default class Habilidad {
    constructor(titulo, codigo, descripcion) {
        if (!titulo || !codigo || !descripcion) {
            throw new UnprocessableEntityError("Todos los campos son requeridos");
        }
        this.id = crypto.randomUUID()
        this.titulo = titulo;
        this.codigo = codigo;
        this.descripcion = descripcion;
    }
}
