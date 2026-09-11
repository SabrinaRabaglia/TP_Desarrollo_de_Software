export default class ProyectoRepository {
  constructor() {
    this.proyectos = [];
  }

  findAll() {
    return this.proyectos;
  }

  findById(id) {
    return this.proyectos.find((c) => c.id === id);
  }

  findByTitulo(titulo) {
    return this.proyectos.find((c) => c.titulo === titulo);
  }

  save(nuevo) {
    const indice = this.proyectos.findIndex((p) => p.id === nuevo.id);
    if (indice === -1) {
      this.proyectos.push(nuevo);
      return nuevo;
    }
    this.proyectos[indice] = nuevo;
    return nuevo;
  }

  delete(id) {
    this.proyectos = this.proyectos.filter((c) => c.id !== id);
  }
}

export { ProyectoRepository };