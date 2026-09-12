import { z } from 'zod'
import Proyecto from '../domain/Proyecto'
import PersonaColaboradora from '../domain/PersonaColaboradora'
import ColaboracionService from '../services/ColaboracionService'
import { BadRequestError } from '../errors/AppError'

const colaboracionsSchema = z.object({
    personaColaboradoraId: z.string(),
    proyectoId: z.string()
}).strict()

export default class ColaboracionController {

    constructor(colaboracionService = new ColaboracionService()){
        this.colaboracionService = colaboracionService;
    }

    create = (req, res) => {
        const body = req.body
        const resultado = colaboracionsSchema.safeParse(body)
        if(resultado.error){
            throw new BadRequestError("Datos invalidos",resultado.error.issues)
        }
        const colaboracionDTO = resultado.data
        const colaboracion = this.colaboracionService.create(colaboracionDTO)
        res.status(201).json(colaboracion)
    }

    getAll = (req, res) => {
    res.status(200).json(this.colaboracionService.getAll())
    }
}
