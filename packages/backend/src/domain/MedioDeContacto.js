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
        
        if (tipo === "EMAIL") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(valor)) {
        throw new DomainValidationError("El formato del email es inválido")
            }
        }

        if (tipo === "WHATSAPP" || tipo === "SMS") {
            const phoneRegex = /^[\+]?[(]?[0-9]{2,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{4,6}$/
        if (!phoneRegex.test(valor)) {
        throw new DomainValidationError("El formato del teléfono es inválido")
            }
        }
    }
    
}