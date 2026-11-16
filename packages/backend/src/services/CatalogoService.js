export default class CatalogoService {
  constructor(paisRepository, provinciaRepository, tipoColectivoRepository) {
    this.paisRepository = paisRepository
    this.provinciaRepository = provinciaRepository
    this.tipoColectivoRepository = tipoColectivoRepository
  }

  getPaises = async () => await this.paisRepository.findAll()

  getProvincias = async () => await this.provinciaRepository.findAll()

  getTiposDeColectivo = async () => await this.tipoColectivoRepository.findAll()
}
