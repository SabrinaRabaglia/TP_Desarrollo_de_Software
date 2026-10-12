import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
import { TipoMedioContacto } from "../domain/enums/TipoMedioContacto.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import ColaboracionModel from "../schemas/colaboracionSchema.js"
import ColectivoModel from "../schemas/colectivoSchema.js"
import HabilidadModel from "../schemas/habilidadSchema.js"
import PaisModel from "../schemas/paisSchema.js"
import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"
import ProvinciaModel from "../schemas/provinciaSchema.js"
import ProyectoModel from "../schemas/proyectoSchema.js"
import { sembrar } from "./catalogos.js"

const idsPor = async (model, campo) => {
  const documentos = await model.find()
  return Object.fromEntries(
    documentos.map((documento) => [documento[campo], documento._id]),
  )
}

export default async function sembrarDatosDePrueba() {
  const paises = await idsPor(PaisModel, "nombre")
  const provincias = await idsPor(ProvinciaModel, "nombre")
  const habilidades = await idsPor(HabilidadModel, "codigo")

  await sembrar(
    ColectivoModel,
    ["nombre"],
    [
      {
        nombre: "Huerta Comunitaria Sur",
        descripcion: "Huertas urbanas y talleres de alimentación saludable",
        tipo: "Asociación barrial",
        pais: paises["Argentina"],
        provincia: provincias["Buenos Aires"],
        ciudad: "Lanús",
      },
      {
        nombre: "Fundación Código Abierto",
        descripcion: "Software libre para organizaciones sociales",
        tipo: "Fundación",
        pais: paises["Argentina"],
        provincia: provincias["Córdoba"],
        ciudad: "Córdoba",
      },
      {
        nombre: "Asamblea Ambiental del Litoral",
        descripcion: "Monitoreo ciudadano de humedales",
        tipo: "Asamblea",
        pais: paises["Argentina"],
        provincia: provincias["Santa Fe"],
        ciudad: "Rosario",
      },
    ],
  )
  const colectivos = await idsPor(ColectivoModel, "nombre")

  await sembrar(
    ProyectoModel,
    ["titulo"],
    [
      {
        titulo: "Sitio web de la huerta",
        descripcion: "Publicar el calendario de talleres y cosechas",
        unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES,
        cantHoras: 4,
        modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
        estado: EstadoProyecto.PUBLICADO,
        fechaAlta: new Date("2026-09-01T00:00:00.000Z"),
        colectivo: colectivos["Huerta Comunitaria Sur"],
        habilidadesRequeridas: [
          habilidades["javascript"],
          habilidades["react"],
        ],
      },
      {
        titulo: "API de donaciones",
        descripcion: "Registrar donaciones y emitir comprobantes",
        unidadCompromiso: UnidadCompromiso.HORAS_TOTALES,
        cantHoras: 80,
        modalidadesColaboracion: [
          ModalidadColaboracion.GRATUITA,
          ModalidadColaboracion.CON_INCENTIVO_ECONOMICO,
        ],
        estado: EstadoProyecto.PUBLICADO,
        fechaAlta: new Date("2026-09-05T00:00:00.000Z"),
        colectivo: colectivos["Fundación Código Abierto"],
        habilidadesRequeridas: [habilidades["node_js"], habilidades["mongodb"]],
      },
      {
        titulo: "Mapa de humedales",
        descripcion: "Visualizar los puntos de monitoreo en un mapa",
        unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
        cantHoras: 10,
        modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
        estado: EstadoProyecto.PUBLICADO,
        fechaAlta: new Date("2026-09-10T00:00:00.000Z"),
        colectivo: colectivos["Asamblea Ambiental del Litoral"],
        habilidadesRequeridas: [habilidades["python"]],
      },
      {
        titulo: "Rediseño de la app de voluntariado",
        descripcion: "Mejorar la experiencia de inscripción",
        unidadCompromiso: UnidadCompromiso.HORAS_TOTALES,
        cantHoras: 40,
        modalidadesColaboracion: [
          ModalidadColaboracion.CON_POSIBILIDAD_CONTRATACION,
        ],
        estado: EstadoProyecto.CERRADO,
        fechaAlta: new Date("2026-08-01T00:00:00.000Z"),
        fechaCierre: new Date("2026-09-15T00:00:00.000Z"),
        colectivo: colectivos["Fundación Código Abierto"],
        habilidadesRequeridas: [habilidades["diseno_ux_ui"]],
      },
    ],
  )
  const proyectos = await idsPor(ProyectoModel, "titulo")

  await sembrar(
    PersonaColaboradoraModel,
    ["nombreFantasia"],
    [
      {
        nombreFantasia: "anag",
        nombre: "Ana",
        apellido: "Gómez",
        pronombres: ["ella"],
        presentacion: "Desarrolladora frontend",
        cuentas: [{ nombreUsuario: "anagomez", tipo: TipoCuenta.GITHUB }],
        habilidades: [habilidades["javascript"], habilidades["react"]],
        aceptaMensajeriaInterna: true,
        mediosDeContacto: [
          { tipo: TipoMedioContacto.EMAIL, valor: "ana.gomez@example.com" },
          { tipo: TipoMedioContacto.WHATSAPP, valor: "+54 9 11 2345-6789" },
        ],
      },
      {
        nombreFantasia: "lucho_dev",
        nombre: "Luis",
        apellido: "Pérez",
        pronombres: ["él"],
        presentacion: "Backend con Node y MongoDB",
        cuentas: [{ nombreUsuario: "luchoperez", tipo: TipoCuenta.GITLAB }],
        habilidades: [habilidades["node_js"], habilidades["mongodb"]],
      },
      {
        nombreFantasia: "sol.datos",
        nombre: "Sol",
        apellido: "Martínez",
        pronombres: ["elle"],
        presentacion: "Análisis de datos ambientales",
        cuentas: [
          { nombreUsuario: "solmartinez", tipo: TipoCuenta.GITHUB },
          { nombreUsuario: "solm", tipo: TipoCuenta.GITLAB },
        ],
        habilidades: [habilidades["python"], habilidades["sql"]],
        aceptaMensajeriaInterna: true,
        mediosDeContacto: [
          { tipo: TipoMedioContacto.SMS, valor: "+54 9 341 456-7890" },
        ],
      },
      {
        nombreFantasia: "anon123",
        habilidades: [habilidades["diseno_ux_ui"]],
      },
    ],
  )
  const personas = await idsPor(PersonaColaboradoraModel, "nombreFantasia")

  await sembrar(
    ColaboracionModel,
    ["personaColaboradora", "proyecto"],
    [
      {
        fechaInscripcion: new Date("2026-09-12T00:00:00.000Z"),
        personaColaboradora: personas["anag"],
        proyecto: proyectos["Sitio web de la huerta"],
      },
      {
        fechaInscripcion: new Date("2026-09-14T00:00:00.000Z"),
        personaColaboradora: personas["lucho_dev"],
        proyecto: proyectos["API de donaciones"],
      },
      {
        fechaInscripcion: new Date("2026-09-16T00:00:00.000Z"),
        esAnonima: true,
        personaColaboradora: personas["sol.datos"],
        proyecto: proyectos["Mapa de humedales"],
      },
    ],
  )
}
