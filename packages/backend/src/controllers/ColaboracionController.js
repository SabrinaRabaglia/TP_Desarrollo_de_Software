import { z } from 'zod'
import ColaboracionService from '../services/ColaboracionService.js'
import { BadRequestError } from '../errors/AppError.js'

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
        const colaboracion = this.colaboracionService.create(colaboracionDTO);
        const respuestaPostman = {
        id: colaboracion.id,
        fechaInscripcion: colaboracion.fechaInscripcion,
        personaColaboradora: {
            id: colaboracion.personaColaboradora.id,
            nombreFantasia: colaboracion.personaColaboradora.nombreFantasia
        },
        proyecto: {
            id: colaboracion.proyecto.id,
            titulo: colaboracion.proyecto.titulo
        }
    };
        res.status(201).json(respuestaPostman)
    }

    getAll = (req, res) => {
    res.status(200).json(this.colaboracionService.getAll())
    }
}
