export default class CatalogoService {
  constructor(paisRepository, provinciaRepository) {
    this.paisRepository = paisRepository
    this.provinciaRepository = provinciaRepository
  }

  getPaises = async () => await this.paisRepository.findAll()

  getProvincias = async () => await this.provinciaRepository.findAll()
}
