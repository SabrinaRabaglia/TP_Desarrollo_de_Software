import { UnidadCompromiso } from "./enums/UnidadCompromiso.js";
import { DomainValidationError } from "./errors/DomainErrors.js";

export default class Perfil {
  constructor(
    nombre = null,
    descripcion = null,
    unidadCompromiso = null,
    cantidadHoras = null,
    modalidadesColaboracion = [],
    habilidadesRequeridas,
    habilidadesOpcionales,
    proyecto
  ) {
    Perfil.validarDatos({ descripcion, unidadCompromiso, habilidadesRequeridas, habilidadesOpcionales, proyecto });
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.unidadCompromiso = unidadCompromiso;
    this.cantidadHoras = cantidadHoras;
    this.modalidadesColaboracion = modalidadesColaboracion;
    this.habilidadesRequeridas = habilidadesRequeridas;
    this.habilidadesOpcionales = habilidadesOpcionales;
    this.proyecto = proyecto;
  }

  static validarDatos({ descripcion, unidadCompromiso, habilidadesRequeridas, habilidadesOpcionales, proyecto }) {
    if (!descripcion || !habilidadesRequeridas || !habilidadesOpcionales || !proyecto) {
      throw new DomainValidationError("Descripción, habilidades requeridas, habilidades opcionales y proyecto son campos obligatorios.");
    }
    if (unidadCompromiso != null && !Object.values(UnidadCompromiso).includes(unidadCompromiso)) {
      throw new DomainValidationError("Unidad de compromiso inválida.");
    }
  }
}
