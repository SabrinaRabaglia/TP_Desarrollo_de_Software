import PaisModel from "../schemas/paisSchema.js"

export default class PaisRepository {
  constructor() {
    this.model = PaisModel
  }

  async findAll() {
    return await this.model
      .find()
      .collation({ locale: "es" })
      .sort({ nombre: 1 })
  }

  async findById(id) {
    return await this.model.findById(id)
  }
}
