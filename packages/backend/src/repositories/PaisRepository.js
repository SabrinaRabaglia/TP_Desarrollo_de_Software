import PaisModel from "../schemas/paisSchema.js"

export default class PaisRepository {
  constructor() {
    this.model = PaisModel
  }

  async findById(id) {
    return await this.model.findById(id)
  }
}
