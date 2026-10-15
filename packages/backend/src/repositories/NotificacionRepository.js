import NotificacionModel from "../schemas/notificacionSchema.js"
import guardar from "./guardar.js"

export default class NotificacionRepository{
    constructor(){
        this.model = NotificacionModel
    }

    async getAll(){
        return await this.model.find()
    }

    async save(notificacion){
        return await guardar(this.model, notificacion)
    }
}