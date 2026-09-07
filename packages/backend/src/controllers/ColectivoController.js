import {z} from 'zod'
import { BadRequestError } from '../errors/AppError';
import ColectivoService from '../services/ColectivoService';

const colectivoSchema = z.object({
    nombre: z.string(),
    descripcion: z.string().min(2).max(15),
    tipo: z.string(),
    pais: z.string().nullable().optional(),
    provincia: z.string().nullable().optional(),
    ciudad: z.string().nullable().optional()
}).strict();
export default class ColectivoController {
    constructor(colectivoService = new ColectivoService()){
        this.colectivoService = colectivoService;
    }

    getAll = (req, res) => {
    res.status(200).json(this.colectivoService.getAll())
    }
    getById = (req, res) =>{
        const {id} = req.params;
        res.status(200).json(this.colectivoService.getById(id));
    }
    create = (req,res)=>{
        const body = req.body
        const resultado = colectivoSchema.safeParse(body)
        if(resultado.error){
            throw new BadRequestError("Datos inválidos",resultado.error.issues)
        }
        const nuevo = resultado.data
        this.colectivoService.create(nuevo)
        res.status(201).json(nuevo)
    } 
    put = (req, res) => {
        const body = req.body;
        const resultado = colectivoSchema.safeParse(body);
        if(resultado.error){
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }
        const update = resultado.data;
        const id = req.params.id;
        if (this.colectivoService.update(id, update)) {
            res.status(200).json(update);
        }
    }
    patch = (req, res) => {
        const { id } = req.params;
        const resultado = colectivoSchema.partial().safeParse(req.body);
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues);
        }
        const colectivoActualizado = this.colectivoService.update(id, resultado.data);
        res.status(200).json(colectivoActualizado);
    };

    delete = (req, res) => {
        const { id } = req.params;
        this.colectivoService.delete(id);
        res.status(204).send();
    };
    
}
