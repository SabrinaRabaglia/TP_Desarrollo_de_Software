import { DomainRuleError } from "../domain/errors/DomainErrors.js"
import Notificacion from "../domain/notificacion.js"
import { InvalidReference } from "../errors/ApplicationErrors.js"

export default class NotificacionService{
    constructor(notificacionRepository, colaboradorRepository, colectivoRepository, proyectoRepository,
        notificador
    ){
        this.notificacionRepository = notificacionRepository
        this.colaboradorRepository = colaboradorRepository
        this.colectivoRepository = colectivoRepository
        this.proyectoRepository = proyectoRepository
        this.notificador = notificador
    }

    create = async (notificacionNueva) => {
        const colaborador = await this.colaboradorRepository.findById(
            notificacionNueva.personaColaboradora)
        if(!colaborador){
            throw new InvalidReference("Colaborador no encontrado")
        }

        const colectivo = await this.colectivoRepository.findById(notificacionNueva.colectivo)
        if(!colectivo){
            throw new InvalidReference("Colectivo no encontrado")
        }

        const perfil = await this.proyectoRepository.findPerfilById(notificacionNueva.perfil)
        if(!perfil){
            throw new InvalidReference("perfil no encontrado")
        }

        if(!colaborador.aceptaMensajeriaInterna){
            throw new DomainRuleError("El colaborador no acepta mensajeria interna")
        }
        const notificacion = new Notificacion(notificacionNueva.contenido, colectivo, colaborador, perfil)

        this.notificador.notificar(colaborador, notificacion.contenido)
        notificacion.agregarMediosExternos(colaborador.mediosDeContacto)

        const guardado = await this.notificacionRepository.save(notificacion)

        colaborador.agregarNotificacion(guardado._id)
        colectivo.agregarNotificacion(guardado._id)

        await this.colaboradorRepository.save(colaborador);
        await this.colectivoRepository.save(colectivo);
        
        return guardado
    }

    getAll = async () => {
        return await this.notificacionRepository.getAll()
    }
}