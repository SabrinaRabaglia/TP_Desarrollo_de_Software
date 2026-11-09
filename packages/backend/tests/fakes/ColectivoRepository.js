import { randomUUID } from "node:crypto"
import ProyectoRepository from "./ProyectoRepository.js"

const conProyectos = (colectivo) => {
  if (colectivo) {
    colectivo.proyectos = ProyectoRepository.proyectos.filter(
      (proyecto) => proyecto.colectivo === colectivo.id,
    )
  }
  return colectivo
}

export default class ColectivoRepository {
  static colectivos = []

  async findAll() {
    return ColectivoRepository.colectivos.map(conProyectos)
  }

  async findById(id) {
    return conProyectos(ColectivoRepository.colectivos.find((c) => c.id === id))
  }

  async findByNombre(nombre) {
    return ColectivoRepository.colectivos.find((c) => c.nombre === nombre)
  }

  async save(nuevo) {
    nuevo.id ??= randomUUID()
    const indice = ColectivoRepository.colectivos.findIndex(
      (c) => c.id === nuevo.id,
    )
    if (indice === -1) {
      ColectivoRepository.colectivos.push(nuevo)
    } else {
      ColectivoRepository.colectivos[indice] = nuevo
    }
    return conProyectos(nuevo)
  }

  async deleteById(id) {
    ColectivoRepository.colectivos = ColectivoRepository.colectivos.filter(
      (c) => c.id !== id,
    )
  }

  deleteAll() {
    ColectivoRepository.colectivos.length = 0
  }
}
