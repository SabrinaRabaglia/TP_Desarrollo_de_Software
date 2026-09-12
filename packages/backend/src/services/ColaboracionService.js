import Colaboracion from "../domain/Colaboracion";
import { BadRequestError, UnprocessableEntityError } from "../errors/AppError";
import ColaboracionRepository from "../repositories/ColaboracionRepository";
import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository";
import ProyectoRepository from "../repositories/ProyectoRepository";
export default class ColaboracionService {
    constructor(colaboracionRepository = new ColaboracionRepository(),
    proyectoRepository = new ProyectoRepository(),
    personaColaboradoraRepository = new PersonaColaboradoraRepository())
    {
        this.colaboracionRepository = colaboracionRepository;
        this.proyectoRepository = proyectoRepository;
        this.personaColaboradoraRepository = personaColaboradoraRepository;
    }
    create = (colaboracionDTO) => {
        const proyectoExistente = this.proyectoRepository.findById(colaboracionDTO.proyectoId);
        if(!proyectoExistente){
            throw new BadRequestError("proyecto no existente")
        }
        const personaColaboradoraExistente = this.personaColaboradoraRepository.findById(colaboracionDTO.personaColaboradoraId);
        if(!personaColaboradoraExistente){
            throw new BadRequestError("personaColaboradora no existente")
        }
        const colaboracionExistente =
        this.colaboracionRepository.findByPersonaAndProyecto(
            colaboracionDTO.personaColaboradoraId,
            colaboracionDTO.proyectoId
        );

        if (colaboracionExistente) {
            throw new BadRequestError("La persona ya colabora en este proyecto");
        }
        if (!proyectoExistente.poseeHabilidadNecesaria(personaColaboradoraExistente)){
            throw new BadRequestError("La persona no posee las habilidades requeridas");
        }
        if(proyectoExistente.proyectoCerrado()){
            throw new UnprocessableEntityError("El proyecto no acepta nuevos colaboradores");
        }
        const colaboracion = new Colaboracion(personaColaboradoraExistente,proyectoExistente);
        personaColaboradoraExistente.agregarColaboracion(colaboracion);
        proyectoExistente.agregarColaboracion(colaboracion);
        return this.colaboracionRepository.save(colaboracion);
    }
}
