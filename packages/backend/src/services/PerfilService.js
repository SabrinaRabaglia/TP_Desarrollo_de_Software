import Perfil from "../domain/Perfil.js"
import {
  ConcurrentModification,
  EntityNotFound,
} from "../errors/ApplicationErrors.js"

const MAXIMO_DE_INTENTOS = 3

export default class PerfilService {
  constructor(
    proyectoService,
    proyectoRepository,
    habilidadService,
    personaColaboradoraService,
    colaboracionRepository,
  ) {
    this.proyectoService = proyectoService
    this.proyectoRepository = proyectoRepository
    this.habilidadService = habilidadService
    this.personaColaboradoraService = personaColaboradoraService
    this.colaboracionRepository = colaboracionRepository
  }

  buscarPerfil = (proyecto, perfilId) => {
    const perfil = proyecto.buscarPerfil(perfilId)
    if (!perfil) {
      throw new EntityNotFound("Perfil no encontrado")
    }
    return perfil
  }

  resolverHabilidades = async (datos) => ({
    ...datos,
    habilidadesRequeridas: await this.habilidadService.buscarReferenciadas(
      datos.habilidadesRequeridas,
    ),
    habilidadesOpcionales: await this.habilidadService.buscarReferenciadas(
      datos.habilidadesOpcionales,
    ),
  })

  // Los perfiles viven dentro del documento del proyecto: si otro pedido lo
  // guarda entre nuestra lectura y nuestro guardado, se vuelve a leer y aplicar.
  modificarProyecto = async (proyectoId, modificacion) => {
    for (let intento = 1; ; intento++) {
      try {
        const proyecto = await this.proyectoService.getById(proyectoId)
        const resultado = await modificacion(proyecto)
        await this.proyectoRepository.save(proyecto)
        return resultado
      } catch (error) {
        if (
          !(error instanceof ConcurrentModification) ||
          intento === MAXIMO_DE_INTENTOS
        ) {
          throw error
        }
      }
    }
  }

  create = async (proyectoId, datos) => {
    const perfil = await this.modificarProyecto(proyectoId, async (proyecto) =>
      proyecto.agregarPerfil(new Perfil(await this.resolverHabilidades(datos))),
    )
    return await this.getById(proyectoId, perfil.id)
  }

  update = async (proyectoId, perfilId, datos) => {
    await this.modificarProyecto(proyectoId, async (proyecto) =>
      proyecto.actualizarPerfil(
        this.buscarPerfil(proyecto, perfilId),
        await this.resolverHabilidades(datos),
      ),
    )
    return await this.getById(proyectoId, perfilId)
  }

  delete = async (proyectoId, perfilId) => {
    await this.modificarProyecto(proyectoId, async (proyecto) => {
      this.buscarPerfil(proyecto, perfilId)
      proyecto.eliminarPerfil(perfilId)
    })
  }

  buscarEnProyecto = async (proyectoId, perfilId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    return { proyecto, perfil: this.buscarPerfil(proyecto, perfilId) }
  }

  getById = async (proyectoId, perfilId) => {
    const { perfil } = await this.buscarEnProyecto(proyectoId, perfilId)
    return perfil
  }

  buscarColaboradores = async (proyectoId, perfilId) => {
    const { proyecto, perfil } = await this.buscarEnProyecto(
      proyectoId,
      perfilId,
    )
    proyecto.assertPuedeBuscarColaboradores()
    const personas = await this.personaColaboradoraService.getAllConHabilidades(
      perfil.habilidadesRequeridas,
    )
    const inscriptas = new Set(
      await this.colaboracionRepository.findPersonasInscriptasEn(proyectoId),
    )
    return personas
      .filter((persona) => !inscriptas.has(String(persona.id)))
      .toSorted(
        (una, otra) =>
          perfil.cantidadDeHabilidadesOpcionalesDe(otra) -
          perfil.cantidadDeHabilidadesOpcionalesDe(una),
      )
  }

  getAllByProyectoId = async (proyectoId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    return proyecto.perfiles
  }
}
