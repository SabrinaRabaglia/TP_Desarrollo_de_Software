import {
  afterAll,
  beforeAll,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import { envioDeNotificaciones } from "../../src/dependencias.js"
import NotificacionModel from "../../src/schemas/notificacionSchema.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base
let colectivo
let proyecto
let perfil
let ana
let anon

const request = async (method, path, body, status = 200) => {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  expect(response.status).toBe(status)
  return response.status === 204 ? null : response.json()
}

const crearProyectoConPerfil = async (titulo) => {
  const creado = await request(
    "POST",
    "/proyectos",
    {
      titulo,
      descripcion: `Proyecto ${titulo}`,
      colectivo: colectivo.id,
      estado: "PUBLICADO",
      fechaAlta: "2026-10-01T00:00:00.000Z",
      fechaCierre: null,
    },
    201,
  )
  const habilidad = await request(
    "POST",
    "/habilidades",
    {
      titulo: `Habilidad ${titulo}`,
      codigo: `habilidad_${titulo.toLowerCase()}`,
      descripcion: "Habilidad de prueba",
    },
    201,
  )
  const perfilCreado = await request(
    "POST",
    `/proyectos/${creado.id}/perfiles`,
    {
      descripcion: "Desarrollo frontend",
      unidadCompromiso: "HORAS_SEMANALES",
      cantidadHoras: 4,
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: [habilidad.id],
      habilidadesOpcionales: [habilidad.id],
    },
    201,
  )
  return { proyecto: creado, perfil: perfilCreado }
}

const notificaciones = (proyectoId, perfilId) =>
  `/proyectos/${proyectoId}/perfiles/${perfilId}/notificaciones`

beforeAll(async () => {
  jest.spyOn(console, "log").mockImplementation(() => {})
  await conectar("notificaciones")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  colectivo = await request(
    "POST",
    "/colectivos",
    { nombre: "Huerta", descripcion: "Huertas urbanas", tipo: "ONG" },
    201,
  )
  ;({ proyecto, perfil } = await crearProyectoConPerfil("Web"))
  ana = await request(
    "POST",
    "/personas-colaboradoras",
    {
      nombreFantasia: "anag",
      aceptaMensajeriaInterna: true,
      mediosDeContacto: [
        { tipo: "EMAIL", valor: "ana@example.com" },
        { tipo: "WHATSAPP", valor: "+54 9 11 2345-6789" },
      ],
    },
    201,
  )
  anon = await request(
    "POST",
    "/personas-colaboradoras",
    { nombreFantasia: "anon" },
    201,
  )
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
  jest.restoreAllMocks()
})

describe("notificaciones", () => {
  test("el colectivo contacta a una persona y le queda en su bandeja, sin sus datos de contacto", async () => {
    const notificacion = await request(
      "POST",
      notificaciones(proyecto.id, perfil.id),
      { personaColaboradora: ana.id, contenido: "Tu perfil encaja" },
      201,
    )

    expect(notificacion).toEqual({
      id: expect.any(String),
      fecha: expect.any(String),
      contenido: "Tu perfil encaja",
      colectivo: colectivo.id,
      personaColaboradora: ana.id,
      perfil: perfil.id,
      pendienteDeEnvio: true,
      mediosExternosUtilizados: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(JSON.stringify(notificacion)).not.toContain("ana@example.com")

    await envioDeNotificaciones.procesarPendientes()

    const [enviada] = await request(
      "GET",
      `/personas-colaboradoras/${ana.id}/notificaciones`,
    )
    expect(enviada).toEqual({
      ...notificacion,
      pendienteDeEnvio: false,
      mediosExternosUtilizados: ["EMAIL", "WHATSAPP"],
      updatedAt: expect.any(String),
    })
    expect(JSON.stringify(enviada)).not.toContain("ana@example.com")
    expect(
      await NotificacionModel.findById(notificacion.id).then((documento) =>
        documento.envios.map(({ medio, estado, intentos }) => ({
          tipo: medio.tipo,
          valor: medio.valor,
          estado,
          intentos,
        })),
      ),
    ).toEqual([
      {
        tipo: "EMAIL",
        valor: "ana@example.com",
        estado: "ENVIADO",
        intentos: 1,
      },
      {
        tipo: "WHATSAPP",
        valor: "+54 9 11 2345-6789",
        estado: "ENVIADO",
        intentos: 1,
      },
    ])
    expect(
      await request("GET", `/personas-colaboradoras/${anon.id}/notificaciones`),
    ).toEqual([])
    expect(
      await request("GET", `/personas-colaboradoras/${ana.id}`),
    ).not.toHaveProperty("notificacionesRecibidas")
    expect(
      await request("GET", `/colectivos/${colectivo.id}`),
    ).not.toHaveProperty("notificacionesEnviadas")
  })

  test("rechaza contactar a quien no acepta mensajería interna", async () => {
    await request(
      "POST",
      notificaciones(proyecto.id, perfil.id),
      { personaColaboradora: anon.id, contenido: "Hola" },
      409,
    )
  })

  test("valida el pedido y las referencias", async () => {
    const otro = await crearProyectoConPerfil("Otro")
    const ruta = notificaciones(proyecto.id, perfil.id)

    await request(
      "POST",
      ruta,
      {
        personaColaboradora: ana.id,
        contenido: "Hola",
        colectivo: colectivo.id,
      },
      400,
    )
    await request(
      "POST",
      ruta,
      { personaColaboradora: ana.id, contenido: " " },
      422,
    )
    await request(
      "POST",
      ruta,
      { personaColaboradora: "64f1a2b3c4d5e6f7a8b9c0ff", contenido: "Hola" },
      404,
    )
    await request(
      "POST",
      notificaciones(proyecto.id, otro.perfil.id),
      { personaColaboradora: ana.id, contenido: "Hola" },
      404,
    )
    await request(
      "GET",
      "/personas-colaboradoras/64f1a2b3c4d5e6f7a8b9c0ff/notificaciones",
      undefined,
      404,
    )
  })

  test("un proyecto cerrado no puede contactar personas", async () => {
    const cerrado = await crearProyectoConPerfil("Cerrado")
    await request("PATCH", `/proyectos/${cerrado.proyecto.id}`, {
      estado: "CERRADO",
    })

    await request(
      "POST",
      notificaciones(cerrado.proyecto.id, cerrado.perfil.id),
      { personaColaboradora: ana.id, contenido: "Hola" },
      409,
    )
  })
})
