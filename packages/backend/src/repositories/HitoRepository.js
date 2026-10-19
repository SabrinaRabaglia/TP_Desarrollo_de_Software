export default class HitoRepository {
  static hitos = [];

  async findById(id) {
    return HitoRepository.hitos.find((h) => h.id === id);
  }

  async findByProyectoId(proyectoId) {
    return HitoRepository.hitos.filter((h) => h.proyecto === proyectoId);
  }

  async save(hito) {
    const indice = HitoRepository.hitos.findIndex((h) => h.id === hito.id);
    if (indice === -1) {
      HitoRepository.hitos.push(hito);
    } else {
      HitoRepository.hitos[indice] = hito;
    }
    return hito;
  }

  async delete(id) {
    HitoRepository.hitos = HitoRepository.hitos.filter((h) => h.id !== id);
  }
}