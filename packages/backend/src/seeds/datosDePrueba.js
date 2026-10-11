import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
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
        estado: EstadoProyecto.PUBLICADO,
        fechaAlta: new Date("2026-09-01T00:00:00.000Z"),
        colectivo: colectivos["Huerta Comunitaria Sur"],
      },
      {
        titulo: "API de donaciones",
        descripcion: "Registrar donaciones y emitir comprobantes",
        estado: EstadoProyecto.PUBLICADO,
        fechaAlta: new Date("2026-09-05T00:00:00.000Z"),
        colectivo: colectivos["Fundación Código Abierto"],
      },
      {
        titulo: "Mapa de humedales",
        descripcion: "Visualizar los puntos de monitoreo en un mapa",
        estado: EstadoProyecto.PUBLICADO,
        fechaAlta: new Date("2026-09-10T00:00:00.000Z"),
        colectivo: colectivos["Asamblea Ambiental del Litoral"],
      },
      {
        titulo: "Rediseño de la app de voluntariado",
        descripcion: "Mejorar la experiencia de inscripción",
        estado: EstadoProyecto.CERRADO,
        fechaAlta: new Date("2026-08-01T00:00:00.000Z"),
        fechaCierre: new Date("2026-09-15T00:00:00.000Z"),
        colectivo: colectivos["Fundación Código Abierto"],
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
    ],
  )
}
