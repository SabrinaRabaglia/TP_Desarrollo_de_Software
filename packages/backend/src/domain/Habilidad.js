import { UnprocessableEntityError } from "../errors/AppError.js";

export default class Habilidad {
    constructor(titulo, codigo, descripcion) {
        if (!titulo || !codigo || !descripcion) {
            throw new UnprocessableEntityError("Todos los campos son requeridos");
        }
        Habilidad.validarCodigo(titulo, codigo);
        this.id = crypto.randomUUID()
        this.titulo = titulo;
        this.codigo = codigo;
        this.descripcion = descripcion;
    }

    static validarCodigo(titulo, codigo) {
        const esperado = typeof titulo === "string"
            ? titulo.normalize("NFD")
                .replace(/\p{M}/gu, "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
            : "";

        if (!esperado || codigo !== esperado) {
            throw new UnprocessableEntityError(
                "El código debe coincidir con el título normalizado en snake_case, en minúsculas y sin tildes"
            );
        }
    }
}
