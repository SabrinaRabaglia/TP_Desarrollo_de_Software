import { hashear } from "../auth/contrasenas.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
import { TipoMedioContacto } from "../domain/enums/TipoMedioContacto.js"
import { EstadoEnvio } from "../domain/enums/EstadoEnvio.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import ColaboracionModel from "../schemas/colaboracionSchema.js"
import ColectivoModel from "../schemas/colectivoSchema.js"
import HabilidadModel from "../schemas/habilidadSchema.js"
import NotificacionModel from "../schemas/notificacionSchema.js"
import PaisModel from "../schemas/paisSchema.js"
import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"
import ProvinciaModel from "../schemas/provinciaSchema.js"
import ProyectoModel from "../schemas/proyectoSchema.js"
import UsuarioModel from "../schemas/usuarioSchema.js"
import { sembrar } from "./catalogos.js"

const idsPor = async (model, campo) => {
  const documentos = await model.find()
  return Object.fromEntries(
    documentos.map((documento) => [documento[campo], documento._id]),
  )
}

const CONTRASENA_DE_PRUEBA = "secreto123"

const usuario = async (email, rol, entidad) => ({
  email,
  hashContrasena: await hashear(CONTRASENA_DE_PRUEBA),
  rol,
  entidad,
})

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
        perfiles: [
          {
            nombre: "Desarrollo frontend",
            descripcion: "Maquetar y mantener el sitio con el calendario",
            unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES,
            cantidadHoras: 4,
            modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
            habilidadesRequeridas: [
              habilidades["javascript"],
              habilidades["react"],
            ],
            habilidadesOpcionales: [habilidades["typescript"]],
          },
        ],
        hitos: [
          {
            fecha: new Date("2026-09-20T00:00:00.000Z"),
            porcentajeConcrecion: 20,
            descripcion: "Maqueta aprobada por el colectivo",
          },
          {
            fecha: new Date("2026-10-10T00:00:00.000Z"),
            porcentajeConcrecion: 50,
            descripcion: "Calendario de talleres publicado",
          },
        ],
      },
      {
        titulo: "API de donaciones",
        descripcion: "Registrar donaciones y emitir comprobantes",
        estado: EstadoProyecto.PUBLICADO,
        fechaAlta: new Date("2026-09-05T00:00:00.000Z"),
        colectivo: colectivos["Fundación Código Abierto"],
        perfiles: [
          {
            nombre: "Desarrollo backend",
            descripcion: "Diseñar la API y el modelo de datos de donaciones",
            unidadCompromiso: UnidadCompromiso.HORAS_TOTALES,
            cantidadHoras: 80,
            modalidadesColaboracion: [
              ModalidadColaboracion.GRATUITA,
              ModalidadColaboracion.CON_INCENTIVO_ECONOMICO,
            ],
            habilidadesRequeridas: [
              habilidades["node_js"],
              habilidades["mongodb"],
            ],
            habilidadesOpcionales: [habilidades["docker"]],
          },
        ],
        hitos: [
          {
            fecha: new Date("2026-10-01T00:00:00.000Z"),
            porcentajeConcrecion: 15,
            descripcion: "Modelo de datos de donaciones definido",
          },
        ],
      },
      {
        titulo: "Mapa de humedales",
        descripcion: "Visualizar los puntos de monitoreo en un mapa",
        estado: EstadoProyecto.PUBLICADO,
        fechaAlta: new Date("2026-09-10T00:00:00.000Z"),
        colectivo: colectivos["Asamblea Ambiental del Litoral"],
        perfiles: [
          {
            nombre: "Análisis de datos",
            descripcion: "Procesar las mediciones de los puntos de monitoreo",
            unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
            cantidadHoras: 10,
            modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
            habilidadesRequeridas: [habilidades["python"]],
            habilidadesOpcionales: [habilidades["sql"]],
          },
          {
            nombre: "Desarrollo del mapa",
            descripcion: "Construir el mapa interactivo",
            unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
            cantidadHoras: 15,
            modalidadesColaboracion: [
              ModalidadColaboracion.CON_INCENTIVO_ECONOMICO,
            ],
            habilidadesRequeridas: [habilidades["javascript"]],
            habilidadesOpcionales: [habilidades["react"]],
          },
        ],
      },
      {
        titulo: "Rediseño de la app de voluntariado",
        descripcion: "Mejorar la experiencia de inscripción",
        estado: EstadoProyecto.CERRADO,
        fechaAlta: new Date("2026-08-01T00:00:00.000Z"),
        fechaCierre: new Date("2026-09-15T00:00:00.000Z"),
        colectivo: colectivos["Fundación Código Abierto"],
        perfiles: [
          {
            nombre: "Diseño UX/UI",
            descripcion: "Rediseñar el flujo de inscripción",
            unidadCompromiso: UnidadCompromiso.HORAS_TOTALES,
            cantidadHoras: 40,
            modalidadesColaboracion: [
              ModalidadColaboracion.CON_POSIBILIDAD_CONTRATACION,
            ],
            habilidadesRequeridas: [habilidades["diseno_ux_ui"]],
            habilidadesOpcionales: [habilidades["react"]],
          },
        ],
        hitos: [
          {
            fecha: new Date("2026-08-15T00:00:00.000Z"),
            porcentajeConcrecion: 30,
            descripcion: "Entrevistas a personas voluntarias",
          },
          {
            fecha: new Date("2026-09-01T00:00:00.000Z"),
            porcentajeConcrecion: 70,
            descripcion: "Prototipo navegable del nuevo flujo",
          },
          {
            fecha: new Date("2026-09-15T00:00:00.000Z"),
            porcentajeConcrecion: 100,
            descripcion: "Rediseño entregado",
          },
        ],
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
  const sitioWeb = await ProyectoModel.findOne({
    titulo: "Sitio web de la huerta",
  })

  await sembrar(
    NotificacionModel,
    ["personaColaboradora", "perfil"],
    [
      {
        fecha: new Date("2026-09-10T00:00:00.000Z"),
        contenido:
          "Hola! Tu perfil encaja con el sitio de la huerta, ¿te gustaría sumarte?",
        colectivo: colectivos["Huerta Comunitaria Sur"],
        personaColaboradora: personas["anag"],
        perfil: sitioWeb.perfiles[0]._id,
        envios: [
          {
            medio: {
              tipo: TipoMedioContacto.EMAIL,
              valor: "ana.gomez@example.com",
            },
            estado: EstadoEnvio.ENVIADO,
            intentos: 1,
            enviadoEn: new Date("2026-09-10T00:00:05.000Z"),
          },
          {
            medio: {
              tipo: TipoMedioContacto.WHATSAPP,
              valor: "+54 9 11 2345-6789",
            },
            estado: EstadoEnvio.ENVIADO,
            intentos: 1,
            enviadoEn: new Date("2026-09-10T00:00:05.000Z"),
          },
        ],
      },
    ],
  )

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

  await sembrar(
    UsuarioModel,
    ["email"],
    await Promise.all([
      usuario(
        "huerta@colectivo.test",
        RolUsuario.COLECTIVO,
        colectivos["Huerta Comunitaria Sur"],
      ),
      usuario(
        "codigoabierto@colectivo.test",
        RolUsuario.COLECTIVO,
        colectivos["Fundación Código Abierto"],
      ),
      usuario(
        "litoral@colectivo.test",
        RolUsuario.COLECTIVO,
        colectivos["Asamblea Ambiental del Litoral"],
      ),
      ...["anag", "lucho_dev", "sol.datos", "anon123"].map((nombreFantasia) =>
        usuario(
          `${nombreFantasia}@persona.test`,
          RolUsuario.PERSONA_COLABORADORA,
          personas[nombreFantasia],
        ),
      ),
    ]),
  )
}
