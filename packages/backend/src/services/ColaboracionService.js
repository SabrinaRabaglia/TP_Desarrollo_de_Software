import Colaboracion from "../domain/Colaboracion.js"
import { AlreadyExists, InvalidReference } from "../errors/ApplicationErrors.js"
import { DomainRuleError } from "../domain/errors/DomainErrors.js"

export default class ColaboracionService {
  constructor(colaboracionRepository, proyectoRepository, personaRepository) {
    this.colaboracionRepository = colaboracionRepository
    this.proyectoRepository = proyectoRepository
    this.personaRepository = personaRepository
  }

  create = async ({
    proyectoId,
    personaColaboradoraId,
    perfilId,
    esAnonima,
  }) => {
    const proyecto = await this.proyectoRepository.findById(proyectoId)
    if (!proyecto) {
      throw new InvalidReference("Proyecto no encontrado")
    }
    proyecto.assertPuedeBuscarColaboradores()
    const persona = await this.personaRepository.findById(personaColaboradoraId)
    if (!persona) {
      throw new InvalidReference("Persona colaboradora no encontrada")
    }
    if (
      await this.colaboracionRepository.findByPersonaAndProyecto(
        personaColaboradoraId,
        proyectoId,
      )
    ) {
      throw new AlreadyExists("La persona ya colabora en este proyecto")
    }

    const perfiles = proyecto.perfiles ?? []
    const perfilSolicitado = perfilId ? proyecto.buscarPerfil(perfilId) : null
    if (perfilId && !perfilSolicitado) {
      throw new InvalidReference("Perfil no encontrado en el proyecto")
    }

    const perfilesCompatibles = perfiles.filter((perfil) =>
      perfil.habilidadesRequeridas.some((idRequerido) =>
        persona.habilidades.some(
          (habilidad) =>
            String(habilidad._id ?? habilidad.id ?? habilidad) ===
            String(idRequerido),
        ),
      ),
    )
    if (perfilSolicitado && !perfilesCompatibles.includes(perfilSolicitado)) {
      throw new DomainRuleError(
        "La persona no posee una habilidad requerida para ese perfil.",
      )
    }
    const candidatos = perfilSolicitado
      ? [perfilSolicitado]
      : perfilesCompatibles
    let perfilDisponible = null
    for (const perfil of candidatos) {
      const cantidad =
        await this.colaboracionRepository.countByProyectoAndPerfil(
          proyectoId,
          perfil.id,
        )
      if (perfil.admiteMasColaboraciones(cantidad)) {
        perfilDisponible = perfil
        break
      }
    }
    if (!perfilDisponible) {
      if (candidatos.length === 0) {
        throw new DomainRuleError(
          "La persona debe poseer al menos una habilidad requerida.",
        )
      }
      throw new DomainRuleError(
        "Se alcanzó el límite de colaboraciones para el perfil.",
      )
    }

    return await this.colaboracionRepository.save(
      new Colaboracion(persona, proyecto, esAnonima, perfilDisponible.id),
    )
  }

  getAll = async () => await this.colaboracionRepository.findAll()
}
