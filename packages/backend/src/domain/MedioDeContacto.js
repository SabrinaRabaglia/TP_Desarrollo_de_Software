import { DomainValidationError } from "./errors/DomainErrors.js"

export default class MedioDeContacto{
    constructor(tipo,valor){
        MedioDeContacto.validarDatos({tipo, valor})
        this.tipo = tipo
        this.valor = valor
    }
    static validarDatos({tipo,valor}){
        if(!tipo){
            throw new DomainValidationError("El tipo de medio de contacto es obligatorio")
        }
        if(!valor){
            throw new DomainValidationError ("El valor del medio de contacto es obligatorio")
        }
    }
}