import {BadRequestError} from "../errors/AppError.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js";
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js";
import { z } from 'zod'
import { objectIdSchema } from "../validations/objectId.js";

const perfilSchema = z
    .object({
        nombre: z.string().optional(),
        descripcion: z.string().min(1),
        unidadCompromiso: z.enum(UnidadCompromiso).optional(),
        cantidadHoras: z.number().positive().optional(),
        modalidadesColaboracion: z.array(z.enum(ModalidadColaboracion)).optional(),
        habilidadesRequeridas: z.array(objectIdSchema).min(1),
        habilidadesOpcionales: z.array(objectIdSchema).min(1),
    })
    .strict()

export default class PerfilController {
    constructor(perfilService) {
        this.perfilService = perfilService
    }

    create = async (req, res, next) => {
        try {
            const resultado = perfilSchema.safeParse(req.body)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            const perfil = await this.perfilService.create(resultado.data, req.params.id)
            res.status(201).json(perfil)
        } catch (error) {
            next(error)
        }
    }

    delete = async (req, res, next) => {
        try {
            await this.perfilService.delete(req.params.id, req.params.perfilId)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}