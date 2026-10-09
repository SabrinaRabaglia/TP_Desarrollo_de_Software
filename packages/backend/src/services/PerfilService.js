import Perfil from "../domain/Perfil.js";
import { EntityNotFound, InvalidReference } from "../errors/ApplicationErrors.js";

export default class PerfilService {
    constructor(proyectoService, habilidadService) {
        this.proyectoService = proyectoService;
        this.habilidadService = habilidadService;
    }

    buscarHabilidades = async (ids) => {
        try {
            return await Promise.all(
            (ids ?? []).map((id) => this.habilidadService.getById(id))
            )
        } catch (error) {
            if (error instanceof EntityNotFound) {
                throw new InvalidReference(error.message)
            }
            throw error
        }
    }

    create = async (nuevo, proyectoId) => {
        const proyecto = await this.proyectoService.getById(proyectoId);
        const habilidadesRequeridas = await this.buscarHabilidades(nuevo.habilidadesRequeridas);
        const habilidadesOpcionales = await this.buscarHabilidades(nuevo.habilidadesOpcionales);
        const perfil = new Perfil(
            nuevo.nombre,
            nuevo.descripcion,
            nuevo.unidadCompromiso,
            nuevo.cantidadHoras,
            nuevo.modalidadesColaboracion,
            habilidadesRequeridas,
            habilidadesOpcionales,
            proyecto
            );
        return await this.proyectoService.crearPerfil(proyectoId, perfil);
    }

    delete = async (proyectoId, perfilId) => {
        const proyecto = await this.proyectoService.getById(proyectoId);
        const perfil = proyecto.perfiles.find((p) => p.id === perfilId);
        if (!perfil) {
            throw new EntityNotFound("Perfil no encontrado");
        }
        await this.proyectoService.eliminarPerfil(proyectoId, perfilId);
    }
}

