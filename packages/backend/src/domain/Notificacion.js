import { DomainValidationError } from "./errors/DomainErrors.js"

export default class Notificacion{
    constructor(contenido, colectivo, personaColaboradora, perfil){
        Notificacion.validarDatos(contenido,colectivo,personaColaboradora,perfil)
        this.fecha = new Date()
        this.contenido = contenido
        this.colectivo = colectivo
        this.personaColaboradora = personaColaboradora
        this.perfil = perfil
        this.mediosExternosUtilizados = []
    }

    static validarDatos(contenido, colectivo, colaborador, perfil){
        if(!contenido){
            throw new DomainValidationError("la notificacion debe poseer contenido")
        }
        if(!colectivo){
            throw new DomainValidationError("la notificacion debe poseer colectivo")
        }
        if(!colaborador){
            throw new DomainValidationError("la notificacion debe poseer colaborador")
        }
        if(!perfil){
            throw new DomainValidationError("la notificacion debe poseer perfil")
        }
    }

    agregarMediosExternos(medios){
        this.mediosExternosUtilizados.push(...medios)
    }
}