import Perfil from "../domain/Perfil.js";
import { EntityNotFound, InvalidReference } from "../errors/ApplicationErrors.js";
import { DomainValidationError } from "../domain/errors/DomainErrors.js";

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

    validarCamposObligatorios = ({ descripcion, habilidadesRequeridas, habilidadesOpcionales }) => {
        if (!descripcion) {
            throw new DomainValidationError("La descripción es obligatoria.")
        }
        if (habilidadesRequeridas.length === 0) {
            throw new DomainValidationError("Debe haber al menos una habilidad requerida.")
        }
        if (habilidadesOpcionales.length === 0) {
            throw new DomainValidationError("Debe haber al menos una habilidad opcional.")
        }
    }

    create = async (nuevo, proyectoId) => {
        const proyecto = await this.proyectoService.getById(proyectoId);
        const habilidadesRequeridas = await this.buscarHabilidades(nuevo.habilidadesRequeridas);
        const habilidadesOpcionales = await this.buscarHabilidades(nuevo.habilidadesOpcionales);
        this.validarCamposObligatorios({
            descripcion: nuevo.descripcion,
            habilidadesRequeridas,
            habilidadesOpcionales,
        });
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

    update = async (proyectoId, perfilId, actualizada) => {
        const proyecto = await this.proyectoService.getById(proyectoId);
        const perfilExistente = proyecto.perfiles.find((p) => p.id === perfilId);
        if (!perfilExistente) {
            throw new EntityNotFound("Perfil no encontrado");
        }

        const habilidadesRequeridas = await this.buscarHabilidades(actualizada.habilidadesRequeridas);
        const habilidadesOpcionales = await this.buscarHabilidades(actualizada.habilidadesOpcionales);
        this.validarCamposObligatorios({
            descripcion: actualizada.descripcion,
            habilidadesRequeridas,
            habilidadesOpcionales,
        });

        perfilExistente.nombre = actualizada.nombre ?? null;
        perfilExistente.descripcion = actualizada.descripcion;
        perfilExistente.unidadCompromiso = actualizada.unidadCompromiso ?? null;
        perfilExistente.cantidadHoras = actualizada.cantidadHoras ?? null;
        perfilExistente.modalidadesColaboracion = actualizada.modalidadesColaboracion ?? null;
        perfilExistente.habilidadesRequeridas = habilidadesRequeridas;
        perfilExistente.habilidadesOpcionales = habilidadesOpcionales;

        return await this.proyectoService.guardar(proyecto);
    }

    getById = async (proyectoId, perfilId) => {
        const proyecto = await this.proyectoService.getById(proyectoId);
        const perfil = proyecto.perfiles.find((p) => p.id === perfilId);
        if (!perfil) {
            throw new EntityNotFound("Perfil no encontrado");
        }
        return perfil;
    }

    getAllByProyectoId = async (proyectoId) => {
        const proyecto = await this.proyectoService.getById(proyectoId);
        return proyecto.perfiles;
    }

    getAll = async () => {
        const proyectos = await this.proyectoService.getAll();
        return proyectos.flatMap((proyecto) => proyecto.perfiles);
    }
}