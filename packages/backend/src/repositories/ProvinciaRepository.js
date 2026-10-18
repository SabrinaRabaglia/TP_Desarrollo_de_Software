import ProvinciaModel from "../schemas/provinciaSchema.js"

export default class ProvinciaRepository {
  constructor() {
    this.model = ProvinciaModel
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
