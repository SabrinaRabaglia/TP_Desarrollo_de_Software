import Habilidad from "../domain/Habilidad.js"
import HabilidadModel from "../schemas/habilidadSchema.js"
import PaisModel from "../schemas/paisSchema.js"
import ProvinciaModel from "../schemas/provinciaSchema.js"
import TipoColectivoModel from "../schemas/tipoColectivoSchema.js"

const PAISES = ["Argentina"]

const PROVINCIAS = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires (CABA)",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "Tucumán",
]

const TIPOS_COLECTIVO = ["Fundación", "Asociación barrial", "ONG", "Asamblea"]

const HABILIDADES = [
  new Habilidad("JavaScript", "javascript", "Desarrollo con JavaScript"),
  new Habilidad("TypeScript", "typescript", "Desarrollo con TypeScript"),
  new Habilidad("Node.js", "node_js", "Desarrollo backend con Node.js"),
  new Habilidad("React", "react", "Desarrollo de interfaces con React"),
  new Habilidad("Python", "python", "Desarrollo con Python"),
  new Habilidad("Java", "java", "Desarrollo con Java"),
  new Habilidad("SQL", "sql", "Modelado y consultas en bases relacionales"),
  new Habilidad("MongoDB", "mongodb", "Modelado y consultas en MongoDB"),
  new Habilidad("Docker", "docker", "Contenedores y despliegue con Docker"),
  new Habilidad(
    "Diseño UX/UI",
    "diseno_ux_ui",
    "Diseño de experiencia e interfaces",
  ),
  new Habilidad(
    "Testing E2E con Cypress",
    "testing_e2e_con_cypress",
    "Pruebas de punta a punta de aplicaciones web con Cypress",
  ),
  new Habilidad(
    "Uso de Soap UI",
    "uso_de_soap_ui",
    "Pruebas de servicios web con SoapUI",
  ),
  new Habilidad(
    "Conocimientos de Pandas",
    "conocimientos_de_pandas",
    "Procesamiento de datos tabulares con Pandas",
  ),
  new Habilidad(
    "Estadística descriptiva",
    "estadistica_descriptiva",
    "Resumen e interpretación de conjuntos de datos",
  ),
  new Habilidad(
    "Visualización de datos",
    "visualizacion_de_datos",
    "Gráficos y tableros para comunicar datos",
  ),
]

export const sembrar = (model, claves, documentos) => {
  const ahora = new Date()
  return Promise.all(
    documentos.map((documento) =>
      model.updateOne(
        Object.fromEntries(claves.map((clave) => [clave, documento[clave]])),
        { $setOnInsert: { ...documento, createdAt: ahora, updatedAt: ahora } },
        // Sin esto Mongoose agrega $set de updatedAt y re-sembrar modifica los existentes.
        { upsert: true, runValidators: true, timestamps: false },
      ),
    ),
  )
}

const conNombre = (nombre) => ({ nombre })

export default async function sembrarCatalogos() {
  await Promise.all([
    sembrar(PaisModel, ["nombre"], PAISES.map(conNombre)),
    sembrar(ProvinciaModel, ["nombre"], PROVINCIAS.map(conNombre)),
    sembrar(TipoColectivoModel, ["nombre"], TIPOS_COLECTIVO.map(conNombre)),
    sembrar(
      HabilidadModel,
      ["codigo"],
      HABILIDADES.map((habilidad) => ({ ...habilidad })),
    ),
  ])
}
