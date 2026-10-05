import ProvinciaModel from "../schemas/provinciaSchema.js"

export default class ProvinciaRepository {
  constructor() {
    this.model = ProvinciaModel
  }

  async findById(id) {
    return await this.model.findById(id)
  }
}
