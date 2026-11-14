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
import AuthService from "../../src/services/AuthService.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../src/repositories/UsuarioRepository.js"
import NotificacionModel from "../../src/schemas/notificacionSchema.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base
let colectivo
let proyecto
let perfil
let ana
let anon
const tokens = {}

const request = async (method, path, body, status = 200, token) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  expect(response.status).toBe(status)
  return response.status === 204 ? null : response.json()
}

// Le crea un usuario a una entidad que ya existe y devuelve su token.
const iniciarSesionDe = async (email, rol, entidad) => {
  await new AuthService(
    new UsuarioRepository(),
    new ColectivoRepository(),
    new PersonaColaboradoraRepository(),
  ).registrar({ email, contrasena: "secreto123", rol, entidad })
  const { token } = await request("POST", "/auth/login", {
    email,
    contrasena: "secreto123",
  })
  return token
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

const bandeja = (personaId) =>
  `/personas-colaboradoras/${personaId}/notificaciones`

const enviados = (colectivoId) => `/colectivos/${colectivoId}/notificaciones`

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

  tokens.colectivo = await iniciarSesionDe(
    "huerta@colectivo.test",
    "COLECTIVO",
    colectivo.id,
  )
  tokens.ana = await iniciarSesionDe(
    "ana@persona.test",
    "PERSONA_COLABORADORA",
    ana.id,
  )
  tokens.anon = await iniciarSesionDe(
    "anon@persona.test",
    "PERSONA_COLABORADORA",
    anon.id,
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
      tokens.colectivo,
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
      bandeja(ana.id),
      undefined,
      200,
      tokens.ana,
    )
    expect(enviada).toEqual({
      id: notificacion.id,
      fecha: notificacion.fecha,
      contenido: "Tu perfil encaja",
      colectivo: { id: colectivo.id, nombre: "Huerta" },
      proyecto: { id: proyecto.id, titulo: "Web" },
      perfil: { id: perfil.id, nombre: null },
      pendienteDeEnvio: false,
      mediosExternosUtilizados: ["EMAIL", "WHATSAPP"],
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
      await request("GET", bandeja(anon.id), undefined, 200, tokens.anon),
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
      tokens.colectivo,
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
      tokens.colectivo,
    )
    await request(
      "POST",
      ruta,
      { personaColaboradora: ana.id, contenido: " " },
      422,
      tokens.colectivo,
    )
    await request(
      "POST",
      ruta,
      { personaColaboradora: "64f1a2b3c4d5e6f7a8b9c0ff", contenido: "Hola" },
      404,
      tokens.colectivo,
    )
    await request(
      "POST",
      notificaciones(proyecto.id, otro.perfil.id),
      { personaColaboradora: ana.id, contenido: "Hola" },
      404,
      tokens.colectivo,
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
      tokens.colectivo,
    )
  })

  test("sin token no se puede contactar ni leer una bandeja", async () => {
    await request(
      "POST",
      notificaciones(proyecto.id, perfil.id),
      { personaColaboradora: ana.id, contenido: "Hola" },
      401,
    )
    await request("GET", bandeja(ana.id), undefined, 401)
  })

  test("una persona colaboradora no puede contactar a otra", async () => {
    await request(
      "POST",
      notificaciones(proyecto.id, perfil.id),
      { personaColaboradora: ana.id, contenido: "Hola" },
      403,
      tokens.anon,
    )
  })

  test("si se borra el perfil, el mensaje se sigue listando sin perfil ni proyecto", async () => {
    const borrado = await crearProyectoConPerfil("Borrado")
    await request(
      "POST",
      notificaciones(borrado.proyecto.id, borrado.perfil.id),
      { personaColaboradora: ana.id, contenido: "Perfil que se borra" },
      201,
      tokens.colectivo,
    )
    await request(
      "DELETE",
      `/proyectos/${borrado.proyecto.id}/perfiles/${borrado.perfil.id}`,
      undefined,
      204,
    )

    const mensajes = await request(
      "GET",
      bandeja(ana.id),
      undefined,
      200,
      tokens.ana,
    )
    const mensaje = mensajes.find(
      ({ contenido }) => contenido === "Perfil que se borra",
    )

    expect(mensaje.perfil).toBeNull()
    expect(mensaje.proyecto).toBeNull()
    expect(mensaje.colectivo).toEqual({ id: colectivo.id, nombre: "Huerta" })
  })

  test("un colectivo no puede contactar desde el proyecto de otro", async () => {
    const otroColectivo = await request(
      "POST",
      "/colectivos",
      { nombre: "Otro", descripcion: "Otro colectivo", tipo: "ONG" },
      201,
    )
    const tokenDelOtro = await iniciarSesionDe(
      "otro@colectivo.test",
      "COLECTIVO",
      otroColectivo.id,
    )

    await request(
      "POST",
      notificaciones(proyecto.id, perfil.id),
      { personaColaboradora: ana.id, contenido: "Hola" },
      403,
      tokenDelOtro,
    )
  })

  test("solo la propia persona puede leer su bandeja", async () => {
    await request("GET", bandeja(ana.id), undefined, 403, tokens.anon)
    await request("GET", bandeja(ana.id), undefined, 403, tokens.colectivo)
  })

  test("el colectivo lista sus mensajes enviados con el nombre de la destinataria, sin sus datos de contacto", async () => {
    const enviada = await request(
      "POST",
      notificaciones(proyecto.id, perfil.id),
      { personaColaboradora: ana.id, contenido: "Mensaje enviado" },
      201,
      tokens.colectivo,
    )
    await envioDeNotificaciones.procesarPendientes()

    const mensajes = await request(
      "GET",
      enviados(colectivo.id),
      undefined,
      200,
      tokens.colectivo,
    )

    expect(mensajes[0]).toEqual({
      id: enviada.id,
      fecha: enviada.fecha,
      contenido: "Mensaje enviado",
      colectivo: { id: colectivo.id, nombre: "Huerta" },
      personaColaboradora: { id: ana.id, nombreFantasia: "anag" },
      proyecto: { id: proyecto.id, titulo: "Web" },
      perfil: { id: perfil.id, nombre: null },
      pendienteDeEnvio: false,
      mediosExternosUtilizados: ["EMAIL", "WHATSAPP"],
    })
    expect(JSON.stringify(mensajes)).not.toContain("ana@example.com")
    expect(JSON.stringify(mensajes)).not.toContain("mediosDeContacto")
  })

  test("solo el propio colectivo puede listar sus enviados", async () => {
    const otroColectivo = await request(
      "POST",
      "/colectivos",
      { nombre: "Ajeno", descripcion: "Colectivo ajeno", tipo: "ONG" },
      201,
    )
    const tokenDelOtro = await iniciarSesionDe(
      "ajeno@colectivo.test",
      "COLECTIVO",
      otroColectivo.id,
    )

    await request("GET", enviados(colectivo.id), undefined, 401)
    await request("GET", enviados(colectivo.id), undefined, 403, tokenDelOtro)
    await request("GET", enviados(colectivo.id), undefined, 403, tokens.ana)
    expect(
      await request(
        "GET",
        enviados(otroColectivo.id),
        undefined,
        200,
        tokenDelOtro,
      ),
    ).toEqual([])
  })
})
