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

  async getAll(queryParams = {}) {
    const { page=1, limit=10,orden, ...criterios } = queryParams
    const condiciones = [];

    if (criterios.estado) {
      condiciones.push({ estado: criterios.estado });
    }

    // 2. Filtro de Búsqueda Abierta (fecha límite no existe o es futura)
    if (String(criterios.busquedaAbierta) === "true") {
      condiciones.push({
        $or: [
          { busquedaAbiertaHasta: { $exists: false } },
          { busquedaAbiertaHasta: { $gte: new Date() } },
        ]
      });
    }
    if (criterios.q) {
      condiciones.push({
        $or: [
          { titulo: { $regex: criterios.q, $options: "i" } },
          { descripcion: { $regex: criterios.q, $options: "i" } },
        ]
      });
    }
    const filtroPerfil = {};

    if (criterios.habilidades && criterios.habilidades.length > 0) {
      filtroPerfil.habilidadesRequeridas = { $in: criterios.habilidades };
    }

    if (criterios.modalidad) {
      filtroPerfil.modalidadesColaboracion = criterios.modalidad; 
    }

    if (Object.keys(filtroPerfil).length > 0) {
      condiciones.push({ perfiles: { $elemMatch: filtroPerfil } });
    }
        const query = condiciones.length > 0 ? { $and: condiciones } : {};


    let sortConfig = { createdAt: -1 } // Por defecto: más recientes primero 
    if (orden === "antiguos") {
      sortConfig = { createdAt: 1 }
    }

    const skip = (page - 1) * limit
    const { proyectos, total } = await this.proyectoRepository.findAll(
      query,
      skip,
      limit,
      sortConfig
    )

    const proyectosMapeados = proyectos.map(p => {
      // Si es un documento de Mongoose, lo pasamos a JSON normal
      const proyectoObj = p.toJSON ? p.toJSON() : p;
      return {
        ...proyectoObj,
        id: proyectoObj.id || proyectoObj._id // Aseguramos que exista 'id'
      };
    });

    return {
      metadata: { page, limit, total },
      data: proyectosMapeados,
    }
  }
}
