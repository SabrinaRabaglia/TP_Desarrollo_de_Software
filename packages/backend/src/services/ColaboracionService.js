import Colaboracion from "../domain/Colaboracion.js";
import { BadRequestError, UnprocessableEntityError } from "../errors/AppError.js";
import colaboracionRepository from "../repositories/ColaboracionRepository.js";
import personaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js";
import proyectoRepository from "../repositories/ProyectoRepository.js";
export default class ColaboracionService {
    constructor(colaboracionRepo = colaboracionRepository,
    proyectoRepo = proyectoRepository,
    personaColaboradoraRepo = personaColaboradoraRepository)
    {
        this.colaboracionRepository = colaboracionRepo;
        this.proyectoRepository = proyectoRepo;
        this.personaColaboradoraRepository = personaColaboradoraRepo;
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
        if (!proyectoExistente.poseeHabilidadNecesaria(personaColaboradoraExistente)&&proyectoExistente.proyectoRequiereHabilidades()){
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

    getAll = () => {
        return this.colaboracionRepository.getAll();
    }
}
