import {
  AlreadyExists,
  EntityNotFound,
  InvalidReference,
} from "../errors/ApplicationErrors.js"
import Proyecto from "../domain/Proyecto.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"

// Un documento de Mongoose no se puede esparcir con "...": sus campos son getters del prototipo.
const datosDelProyecto = ({
  titulo,
  descripcion,
  colectivo,
  estado,
  fechaAlta,
  fechaCierre,
}) => ({
  titulo,
  descripcion,
  colectivo,
  estado,
  fechaAlta,
  fechaCierre,
})

export default class ProyectoService {
  constructor(proyectoRepository, colectivoRepository) {
    this.proyectoRepository = proyectoRepository
    this.colectivoRepository = colectivoRepository
  }

  getAll = async () => {
    return await this.proyectoRepository.findAll()
  }

  async getById(id) {
    const proyecto = await this.proyectoRepository.findById(id)
    if (!proyecto) {
      throw new EntityNotFound("Proyecto no encontrado")
    }

    return proyecto
  }

  getAllByHabilidades = async (habilidadesIds) => {
    // La consulta trae los candidatos y el dominio decide: mismo criterio que
    // la búsqueda de colaboradores (tener todas las requeridas de un perfil).
    const proyectosCandidatos =
      await this.proyectoRepository.findByEstadoYAlgunaHabilidadRequerida(
        EstadoProyecto.PUBLICADO,
        habilidadesIds,
      )
    return proyectosCandidatos.filter((proyecto) =>
      proyecto.perfiles.some((perfil) =>
        perfil.estaCubiertoPor(habilidadesIds),
      ),
    )
  }

  validarColectivo = async (colectivoId) => {
    if (!(await this.colectivoRepository.findById(colectivoId))) {
      throw new InvalidReference("Colectivo no encontrado")
    }
  }

  validarTituloDisponible = async (titulo) => {
    if (await this.proyectoRepository.findByTitulo(titulo)) {
      throw new AlreadyExists("Ya existe un proyecto con ese título")
    }
  }

  create = async (nuevo) => {
    const proyecto = new Proyecto(
      nuevo.titulo,
      nuevo.descripcion,
      nuevo.colectivo,
      nuevo.estado,
      new Date(),
      nuevo.fechaCierre,
      nuevo.enlaceSistemaEnFuncionamiento,
      nuevo.enlaceCodigoFuente,
    )

    await this.validarColectivo(proyecto.colectivo)
    await this.validarTituloDisponible(proyecto.titulo)

    return await this.proyectoRepository.save(proyecto)
  }

  update = async (id, proyectoActualizado) => {
    const proyectoExistente = await this.getById(id)

    proyectoExistente.assertPuedeActualizarEstado(proyectoActualizado.estado)

    const datosActualizados = {
      ...datosDelProyecto(proyectoExistente),
      ...proyectoActualizado,
    }
    Proyecto.validarDatos(datosActualizados)
    await this.validarColectivo(datosActualizados.colectivo)
    if (datosActualizados.titulo !== proyectoExistente.titulo) {
      await this.validarTituloDisponible(datosActualizados.titulo)
    }

    const { estado, ...resto } = proyectoActualizado
    Object.assign(proyectoExistente, resto)
    if (estado === EstadoProyecto.CERRADO) {
      proyectoExistente.cerrar()
    }

    return await this.proyectoRepository.save(proyectoExistente)
  }

  delete = async (id) => {
    await this.getById(id)
    await this.proyectoRepository.deleteById(id)
  }
}
