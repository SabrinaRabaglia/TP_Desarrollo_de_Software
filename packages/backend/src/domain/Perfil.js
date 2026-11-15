import { ModalidadColaboracion } from "./enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "./enums/UnidadCompromiso.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "./errors/DomainErrors.js"

const esListaNoVacia = (valor) => Array.isArray(valor) && valor.length > 0
const idDe = (habilidad) => String(habilidad._id ?? habilidad.id ?? habilidad)

export default class Perfil {
  constructor(datos) {
    Perfil.validarDatos(datos)
    this.asignar(datos)
  }

  estaCubiertoPor(habilidades) {
    const disponibles = new Set(habilidades.map(idDe))
    return this.habilidadesRequeridas.every((habilidad) =>
      disponibles.has(idDe(habilidad)),
    )
  }

  tieneAlgunaRequeridaEntre(habilidades) {
    const disponibles = new Set(habilidades.map(idDe))
    return this.habilidadesRequeridas.some((habilidad) =>
      disponibles.has(idDe(habilidad)),
    )
  }

  cantidadDeHabilidadesOpcionalesDe(personaColaboradora) {
    const suyas = new Set(personaColaboradora.habilidades.map(idDe))
    return this.habilidadesOpcionales.filter((habilidad) =>
      suyas.has(idDe(habilidad)),
    ).length
  }

  assertPuedeAceptarPostulaciones() {
    if (
      this.limiteColaboraciones !== null &&
      this.postulacionesAceptadas.length >= this.limiteColaboraciones
    ) {
      throw new DomainValidationError(
        "Se alcanzó el límite de colaboradores para este perfil",
      )
    }
  }

  // La búsqueda se cierra a mano o cuando pasa su fecha límite.
  tieneBusquedaAbierta(ahora = new Date()) {
    if (this.busquedaAbierta === false) {
      return false
    }
    return !this.busquedaAbiertaHasta || this.busquedaAbiertaHasta >= ahora
  }

  assertBusquedaAbierta(ahora = new Date()) {
    if (!this.tieneBusquedaAbierta(ahora)) {
      throw new DomainRuleError(
        "La búsqueda de colaboraciones para este perfil está cerrada.",
      )
    }
  }

  // Una fecha límite nueva tiene que ser futura. La que ya estaba guardada
  // puede haber pasado: es una búsqueda que venció.
  assertFechaLimiteFutura(ahora = new Date()) {
    if (this.busquedaAbiertaHasta && this.busquedaAbiertaHasta < ahora) {
      throw new DomainValidationError(
        "La fecha límite de búsqueda no puede ser anterior a la actual.",
      )
    }
  }

  // Los datos del perfil se reemplazan; quiénes lo ocupan no cambia. Por eso
  // el límite nuevo tiene que alcanzar para las colaboraciones ya aceptadas.
  reemplazarDatos(datos, ahora = new Date()) {
    const nuevo = new Perfil({
      ...datos,
      postulacionesAceptadas: this.postulacionesAceptadas,
    })
    const aceptadas = nuevo.postulacionesAceptadas.length
    if (
      nuevo.limiteColaboraciones !== null &&
      nuevo.limiteColaboraciones < aceptadas
    ) {
      throw new DomainRuleError(
        `El límite no puede ser menor a las colaboraciones ya aceptadas (${aceptadas}).`,
      )
    }
    const mismaFecha =
      (nuevo.busquedaAbiertaHasta?.getTime() ?? null) ===
      (this.busquedaAbiertaHasta?.getTime() ?? null)
    if (!mismaFecha) {
      nuevo.assertFechaLimiteFutura(ahora)
    }
    return nuevo
  }

  // Lo que el colectivo puede editar de un perfil.
  datosEditables() {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      unidadCompromiso: this.unidadCompromiso,
      cantidadHoras: this.cantidadHoras,
      modalidadesColaboracion: this.modalidadesColaboracion,
      habilidadesRequeridas: this.habilidadesRequeridas,
      habilidadesOpcionales: this.habilidadesOpcionales,
      limiteColaboraciones: this.limiteColaboraciones,
      busquedaAbierta: this.busquedaAbierta,
      busquedaAbiertaHasta: this.busquedaAbiertaHasta,
    }
  }

  agregarPostulacion(postulacionId) {
    const yaExiste = this.postulacionesAceptadas.some(
      (id) => id.toString() === postulacionId.toString(),
    )

    if (!yaExiste) {
      this.postulacionesAceptadas.push(postulacionId)
    }
  }

  // Al darse de baja, la postulación deja de ocupar un lugar en el perfil.
  quitarPostulacion(postulacionId) {
    this.postulacionesAceptadas = this.postulacionesAceptadas.filter(
      (id) => id.toString() !== postulacionId.toString(),
    )
  }

  asignar({
    nombre = null,
    descripcion,
    unidadCompromiso,
    cantidadHoras,
    modalidadesColaboracion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    postulacionesAceptadas = [],
    limiteColaboraciones = null,
    busquedaAbierta = true,
    busquedaAbiertaHasta = null,
  }) {
    this.nombre = nombre
    this.descripcion = descripcion
    this.unidadCompromiso = unidadCompromiso
    this.cantidadHoras = cantidadHoras
    this.modalidadesColaboracion = modalidadesColaboracion
    this.habilidadesRequeridas = habilidadesRequeridas
    this.habilidadesOpcionales = habilidadesOpcionales
    this.postulacionesAceptadas = postulacionesAceptadas
    this.limiteColaboraciones =
      limiteColaboraciones != null ? Number(limiteColaboraciones) : null
    this.busquedaAbierta = busquedaAbierta ?? true
    this.busquedaAbiertaHasta =
      busquedaAbiertaHasta != null ? new Date(busquedaAbiertaHasta) : null
  }

  static validarDatos({
    descripcion,
    unidadCompromiso,
    cantidadHoras,
    modalidadesColaboracion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    limiteColaboraciones,
    busquedaAbierta,
    busquedaAbiertaHasta,
  }) {
    if (!descripcion) {
      throw new DomainValidationError(
        "La descripción del perfil es obligatoria.",
      )
    }
    if (!Object.values(UnidadCompromiso).includes(unidadCompromiso)) {
      throw new DomainValidationError("La unidad de compromiso es inválida.")
    }
    if (!Number.isInteger(cantidadHoras) || cantidadHoras <= 0) {
      throw new DomainValidationError(
        "La cantidad de horas debe ser un entero positivo.",
      )
    }
    if (
      !esListaNoVacia(modalidadesColaboracion) ||
      !modalidadesColaboracion.every((modalidad) =>
        Object.values(ModalidadColaboracion).includes(modalidad),
      )
    ) {
      throw new DomainValidationError(
        "El perfil debe tener al menos una modalidad de colaboración válida.",
      )
    }
    if (!esListaNoVacia(habilidadesRequeridas)) {
      throw new DomainValidationError(
        "El perfil debe tener al menos una habilidad requerida.",
      )
    }
    if (!esListaNoVacia(habilidadesOpcionales)) {
      throw new DomainValidationError(
        "El perfil debe tener al menos una habilidad opcional.",
      )
    }
    if (
      limiteColaboraciones != null &&
      (!Number.isInteger(Number(limiteColaboraciones)) ||
        Number(limiteColaboraciones) <= 0)
    ) {
      throw new DomainValidationError(
        "El límite de colaboraciones debe ser un entero positivo.",
      )
    }
    if (busquedaAbierta != null && typeof busquedaAbierta !== "boolean") {
      throw new DomainValidationError(
        "La búsqueda abierta debe ser verdadero o falso.",
      )
    }
    if (
      busquedaAbiertaHasta != null &&
      Number.isNaN(new Date(busquedaAbiertaHasta).getTime())
    ) {
      throw new DomainValidationError(
        "La fecha límite de búsqueda es inválida.",
      )
    }
  }
}
