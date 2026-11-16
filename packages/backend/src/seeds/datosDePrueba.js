import { hashear } from "../auth/contrasenas.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
import { TipoMedioContacto } from "../domain/enums/TipoMedioContacto.js"
import { EstadoEnvio } from "../domain/enums/EstadoEnvio.js"
import { EstadoPostulacion } from "../domain/enums/EstadoPostulacion.js"
import { OrigenBaja } from "../domain/enums/OrigenBaja.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import ColectivoModel from "../schemas/colectivoSchema.js"
import HabilidadModel from "../schemas/habilidadSchema.js"
import NotificacionModel from "../schemas/notificacionSchema.js"
import PaisModel from "../schemas/paisSchema.js"
import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"
import PostulacionModel from "../schemas/postulacionSchema.js"
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

const ENLACES = ["enlaceSistemaEnFuncionamiento", "enlaceCodigoFuente"]

const PERSONAS_CON_USUARIO = [
  "anag",
  "lucho_dev",
  "sol.datos",
  "anon123",
  "Nube",
  "Pampa",
  "Ceibo",
  "Hornero",
  "Yacaré",
  "Calden",
  "Tero",
  "Zorzal",
]

// "Yacaré" inicia sesión como yacare@persona.test: el mail va sin tildes.
const emailDe = (nombreFantasia) =>
  `${nombreFantasia
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()}@persona.test`

const COLECTIVOS_CON_USUARIO = {
  "huerta@colectivo.test": "Huerta Comunitaria Sur",
  "codigoabierto@colectivo.test": "Fundación Código Abierto",
  "litoral@colectivo.test": "Asamblea Ambiental del Litoral",
  "redsolidariasur@colectivo.test": "Red Solidaria Sur",
  "losceibos@colectivo.test": "Asamblea Barrial Los Ceibos",
  "raices@colectivo.test": "Fundación Raíces",
}

// Lo que identifica a los datos de prueba: reiniciar:demo borra los colectivos,
// personas y proyectos que no figuran acá.
export const EMAILS_DE_PRUEBA = [
  ...Object.keys(COLECTIVOS_CON_USUARIO),
  ...PERSONAS_CON_USUARIO.map(emailDe),
]
export const PROYECTOS_DE_PRUEBA = [
  "Sitio web de la huerta",
  "API de donaciones",
  "Mapa de humedales",
  "Rediseño de la app de voluntariado",
  "Mapa de comedores comunitarios",
  "Sistema de reservas del salón comunitario",
  "Portal de voluntariados",
]

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
      {
        nombre: "Red Solidaria Sur",
        descripcion: "Red de comedores comunitarios del sur del conurbano",
        tipo: "ONG",
        pais: paises["Argentina"],
        provincia: provincias["Buenos Aires"],
        ciudad: "Quilmes",
      },
      {
        nombre: "Asamblea Barrial Los Ceibos",
        descripcion: "Vecinas y vecinos que gestionan el salón del barrio",
        tipo: "Asamblea",
        pais: paises["Argentina"],
        provincia: provincias["Buenos Aires"],
        ciudad: "Lomas de Zamora",
      },
      {
        nombre: "Fundación Raíces",
        descripcion: "Voluntariado en escuelas y centros comunitarios",
        tipo: "Fundación",
        pais: paises["Argentina"],
        provincia: provincias["Córdoba"],
        ciudad: "Río Cuarto",
      },
    ],
  )
  const colectivos = await idsPor(ColectivoModel, "nombre")

  const proyectos = [
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
    {
      titulo: "Mapa de comedores comunitarios",
      descripcion: "Ubicar los comedores de la red y sus días de atención",
      estado: EstadoProyecto.PUBLICADO,
      fechaAlta: new Date("2026-10-15T00:00:00.000Z"),
      colectivo: colectivos["Red Solidaria Sur"],
      perfiles: [
        {
          nombre: "Tester",
          descripcion: "Probar el mapa de punta a punta antes de cada entrega",
          unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
          cantidadHoras: 5,
          modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
          habilidadesRequeridas: [habilidades["testing_e2e_con_cypress"]],
          habilidadesOpcionales: [habilidades["uso_de_soap_ui"]],
          limiteColaboraciones: 1,
        },
        {
          nombre: "Analista de Datos",
          descripcion: "Analizar la demanda de cada comedor de la red",
          unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
          cantidadHoras: 15,
          modalidadesColaboracion: [
            ModalidadColaboracion.CON_INCENTIVO_ECONOMICO,
          ],
          habilidadesRequeridas: [
            habilidades["conocimientos_de_pandas"],
            habilidades["estadistica_descriptiva"],
          ],
          habilidadesOpcionales: [habilidades["visualizacion_de_datos"]],
        },
      ],
      hitos: [
        {
          fecha: new Date("2026-11-05T00:00:00.000Z"),
          porcentajeConcrecion: 25,
          descripcion: "Relevamiento de los comedores de la red",
        },
        {
          fecha: new Date("2026-11-12T00:00:00.000Z"),
          porcentajeConcrecion: 60,
          descripcion: "Primera versión del mapa publicada",
        },
      ],
      enlaceSistemaEnFuncionamiento: "https://mapa-comedores.example.org",
      enlaceCodigoFuente:
        "https://git.example.org/red-solidaria-sur/mapa-comedores",
    },
    // Los dos que siguen se dieron de alta antes que el mapa de comedores: así
    // el mapa queda primero al ordenar por los más recientes.
    {
      titulo: "Sistema de reservas del salón comunitario",
      descripcion: "Reservar turnos del salón para talleres y reuniones",
      estado: EstadoProyecto.PUBLICADO,
      fechaAlta: new Date("2026-10-10T00:00:00.000Z"),
      colectivo: colectivos["Asamblea Barrial Los Ceibos"],
      perfiles: [
        {
          nombre: "Desarrollador/a Web",
          descripcion: "Construir la pantalla de reservas y su API",
          unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES,
          cantidadHoras: 10,
          modalidadesColaboracion: [
            ModalidadColaboracion.GRATUITA,
            ModalidadColaboracion.CON_POSIBILIDAD_CONTRATACION,
          ],
          habilidadesRequeridas: [habilidades["react"], habilidades["node_js"]],
          habilidadesOpcionales: [habilidades["typescript"]],
        },
      ],
      hitos: [
        {
          fecha: new Date("2026-10-30T00:00:00.000Z"),
          porcentajeConcrecion: 10,
          descripcion: "Reglas de uso del salón acordadas en asamblea",
        },
      ],
    },
    {
      titulo: "Portal de voluntariados",
      descripcion: "Publicar las convocatorias y anotar a quienes se suman",
      estado: EstadoProyecto.PUBLICADO,
      fechaAlta: new Date("2026-10-05T00:00:00.000Z"),
      colectivo: colectivos["Fundación Raíces"],
      perfiles: [
        {
          nombre: "QA Automation",
          descripcion: "Automatizar las pruebas del alta de voluntariados",
          unidadCompromiso: UnidadCompromiso.HORAS_TOTALES,
          cantidadHoras: 20,
          modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
          habilidadesRequeridas: [habilidades["testing_e2e_con_cypress"]],
          habilidadesOpcionales: [habilidades["uso_de_soap_ui"]],
          limiteColaboraciones: 3,
        },
        {
          nombre: "Desarrollo frontend",
          descripcion: "Maquetar el listado de convocatorias",
          unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES,
          cantidadHoras: 6,
          modalidadesColaboracion: [
            ModalidadColaboracion.CON_INCENTIVO_ECONOMICO,
          ],
          habilidadesRequeridas: [habilidades["react"]],
          habilidadesOpcionales: [habilidades["typescript"]],
        },
      ],
      hitos: [
        {
          fecha: new Date("2026-10-28T00:00:00.000Z"),
          porcentajeConcrecion: 40,
          descripcion: "Alta de convocatorias funcionando",
        },
      ],
    },
  ]
  const titulos = proyectos.map(({ titulo }) => titulo)
  if (titulos.toSorted().join() !== PROYECTOS_DE_PRUEBA.toSorted().join()) {
    throw new Error(
      "PROYECTOS_DE_PRUEBA tiene que listar los mismos títulos que los proyectos del seed.",
    )
  }
  await sembrar(ProyectoModel, ["titulo"], proyectos)
  // Un proyecto que ya existía no se vuelve a insertar: si le falta alguno de
  // los perfiles de prueba (por nombre), se le agrega sin tocar los demás.
  for (const { titulo, perfiles } of proyectos) {
    for (const perfil of perfiles) {
      await ProyectoModel.updateOne(
        { titulo, "perfiles.nombre": { $ne: perfil.nombre } },
        { $push: { perfiles: perfil } },
        { runValidators: true, timestamps: false },
      )
    }
  }
  // Lo mismo con los enlaces: se completan solo si el proyecto no tiene.
  for (const proyecto of proyectos) {
    for (const enlace of ENLACES) {
      if (proyecto[enlace]) {
        await ProyectoModel.updateOne(
          { titulo: proyecto.titulo, [enlace]: null },
          { $set: { [enlace]: proyecto[enlace] } },
          { timestamps: false },
        )
      }
    }
  }

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
      {
        nombreFantasia: "Nube",
        presentacion: "Testing de aplicaciones web y desarrollo con React",
        habilidades: [
          habilidades["testing_e2e_con_cypress"],
          habilidades["react"],
        ],
        aceptaMensajeriaInterna: true,
        mediosDeContacto: [
          { tipo: TipoMedioContacto.EMAIL, valor: "nube@example.com" },
          { tipo: TipoMedioContacto.WHATSAPP, valor: "+54 9 11 5555-0123" },
        ],
      },
      {
        nombreFantasia: "Pampa",
        presentacion: "Pruebas automatizadas de interfaces web",
        habilidades: [habilidades["testing_e2e_con_cypress"]],
        mediosDeContacto: [
          { tipo: TipoMedioContacto.EMAIL, valor: "pampa@example.com" },
        ],
      },
      // Ya colaboran en el perfil QA Automation del portal de voluntariados.
      {
        nombreFantasia: "Ceibo",
        presentacion: "Automatización de pruebas de regresión",
        habilidades: [habilidades["testing_e2e_con_cypress"]],
      },
      {
        nombreFantasia: "Hornero",
        presentacion: "Pruebas de punta a punta y de servicios",
        habilidades: [
          habilidades["testing_e2e_con_cypress"],
          habilidades["uso_de_soap_ui"],
        ],
      },
      // Las cuatro que el colectivo encuentra, o no, para Analista de Datos.
      {
        nombreFantasia: "Yacaré",
        presentacion: "Análisis y visualización de datos sociales",
        habilidades: [
          habilidades["conocimientos_de_pandas"],
          habilidades["estadistica_descriptiva"],
          habilidades["visualizacion_de_datos"],
        ],
        aceptaMensajeriaInterna: true,
        mediosDeContacto: [
          { tipo: TipoMedioContacto.EMAIL, valor: "yacare@example.com" },
          { tipo: TipoMedioContacto.WHATSAPP, valor: "+54 9 11 5555-0145" },
        ],
      },
      {
        nombreFantasia: "Calden",
        presentacion: "Estadística aplicada a organizaciones sociales",
        habilidades: [
          habilidades["conocimientos_de_pandas"],
          habilidades["estadistica_descriptiva"],
        ],
        aceptaMensajeriaInterna: true,
      },
      {
        nombreFantasia: "Tero",
        presentacion: "Limpieza y procesamiento de datos con Pandas",
        habilidades: [habilidades["conocimientos_de_pandas"]],
        aceptaMensajeriaInterna: false,
      },
      {
        nombreFantasia: "Zorzal",
        presentacion: "Tableros y gráficos para comunicar datos",
        habilidades: [habilidades["visualizacion_de_datos"]],
        aceptaMensajeriaInterna: true,
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

  // Las colaboraciones de prueba son postulaciones ya aceptadas a un perfil.
  const perfilDe = async (titulo, nombre) =>
    (await ProyectoModel.findOne({ titulo })).perfiles.find(
      (perfil) => perfil.nombre === nombre,
    )._id
  const aceptadas = [
    {
      fecha: "2026-09-12",
      persona: "anag",
      perfil: await perfilDe("Sitio web de la huerta", "Desarrollo frontend"),
    },
    {
      fecha: "2026-09-14",
      persona: "lucho_dev",
      perfil: await perfilDe("API de donaciones", "Desarrollo backend"),
    },
    {
      fecha: "2026-09-16",
      persona: "sol.datos",
      perfil: await perfilDe("Mapa de humedales", "Análisis de datos"),
      esAnonima: true,
    },
    // QA Automation tiene límite 3: con estas dos le queda un cupo.
    {
      fecha: "2026-10-12",
      persona: "Ceibo",
      perfil: await perfilDe("Portal de voluntariados", "QA Automation"),
    },
    {
      fecha: "2026-10-14",
      persona: "Hornero",
      perfil: await perfilDe("Portal de voluntariados", "QA Automation"),
      esAnonima: true,
    },
  ]
  await sembrar(
    PostulacionModel,
    ["personaColaboradora", "perfil"],
    aceptadas.map(({ fecha, persona, perfil, esAnonima = false }) => ({
      fechaPostulacion: new Date(`${fecha}T00:00:00.000Z`),
      fechaRevision: new Date(`${fecha}T12:00:00.000Z`),
      estado: EstadoPostulacion.ACEPTADA,
      esAnonima,
      personaColaboradora: personas[persona],
      perfil,
    })),
  )
  // Cada perfil anota sus postulaciones aceptadas ($addToSet: no duplica).
  for (const { persona, perfil } of aceptadas) {
    const postulacion = await PostulacionModel.findOne({
      personaColaboradora: personas[persona],
      perfil,
    })
    await ProyectoModel.updateOne(
      { "perfiles._id": perfil },
      { $addToSet: { "perfiles.$.postulacionesAceptadas": postulacion._id } },
    )
  }
  // Una colaboración que terminó: el colectivo desanotó a anag del mapa.
  // Ya no ocupa lugar en el perfil, así que no va en postulacionesAceptadas.
  await sembrar(
    PostulacionModel,
    ["personaColaboradora", "perfil"],
    [
      {
        fechaPostulacion: new Date("2026-09-18T00:00:00.000Z"),
        fechaRevision: new Date("2026-09-19T12:00:00.000Z"),
        estado: EstadoPostulacion.BAJA,
        esAnonima: false,
        fechaBaja: new Date("2026-10-05T12:00:00.000Z"),
        origenBaja: OrigenBaja.COLECTIVO,
        personaColaboradora: personas["anag"],
        perfil: await perfilDe("Mapa de humedales", "Desarrollo del mapa"),
      },
    ],
  )
  // Pampa ya se postuló al perfil Tester y espera revisión. Nube no: se
  // postula en la demo.
  await sembrar(
    PostulacionModel,
    ["personaColaboradora", "perfil"],
    [
      {
        fechaPostulacion: new Date("2026-11-08T00:00:00.000Z"),
        fechaRevision: null,
        estado: EstadoPostulacion.PENDIENTE,
        esAnonima: false,
        personaColaboradora: personas["Pampa"],
        perfil: await perfilDe("Mapa de comedores comunitarios", "Tester"),
      },
    ],
  )

  await sembrar(
    UsuarioModel,
    ["email"],
    await Promise.all([
      ...Object.entries(COLECTIVOS_CON_USUARIO).map(([email, nombre]) =>
        usuario(email, RolUsuario.COLECTIVO, colectivos[nombre]),
      ),
      ...PERSONAS_CON_USUARIO.map((nombreFantasia) =>
        usuario(
          emailDe(nombreFantasia),
          RolUsuario.PERSONA_COLABORADORA,
          personas[nombreFantasia],
        ),
      ),
    ]),
  )
}
