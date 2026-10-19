import HitoModel from "../schemas/proyectoSchema.js"
import guardar from "./guardar.js"

export default class HitoRepository {
  constructor() {
      this.model = HitoModel
    }

  async findById(id) {
    return await this.model.findById(id);
  }

  async findByProyectoId(proyectoId) {
    return await this.model.find({ proyecto: proyectoId }  );
  }

  async save(hito) {
    return await guardar(this.model, hito)
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id);
    
  }
}