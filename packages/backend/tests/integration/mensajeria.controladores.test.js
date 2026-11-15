import { beforeAll, beforeEach, describe, expect, test } from "@jest/globals"
import request from "supertest"
import { firmar } from "../../src/auth/tokens.js"
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js"
import { UnidadCompromiso } from "../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../src/domain/enums/ModalidadColaboracion.js"
import buildApp from "./utils/buildApp.js"

let app
let vaciarRepositorios
let services
let colectivo
let otroColectivo
let proyecto
let perfil
let ana
let anon

// Token real, firmado igual que en el login.
const tokenDe = (rol, entidad) =>
  `Bearer ${firmar({ id: "usuario", rol, entidad })}`

const tokenColectivo = () => tokenDe(RolUsuario.COLECTIVO, colectivo.id)
const tokenAna = () => tokenDe(RolUsuario.PERSONA_COLABORADORA, ana.id)

const rutaContacto = () =>
  `/proyectos/${proyecto.id}/perfiles/${perfil.id}/notificaciones`
const rutaBandeja = (personaId) =>
  `/personas-colaboradoras/${personaId}/notificaciones`
const rutaEnviados = (colectivoId) =>
  `/colectivos/${colectivoId}/notificaciones`

const contactar = (body, token = tokenColectivo()) =>
  request(app).post(rutaContacto()).set("Authorization", token).send(body)

beforeAll(async () => {
  ;({ app, vaciarRepositorios, services } = await buildApp())
})

beforeEach(async () => {
  vaciarRepositorios()
  colectivo = await services.colectivoService.create({
    nombre: "Huerta",
    descripcion: "Huertas urbanas",
    tipo: "Asociación barrial",
  })
  otroColectivo = await services.colectivoService.create({
    nombre: "Ajeno",
    descripcion: "Otro colectivo",
    tipo: "Asociación barrial",
  })
  proyecto = await services.proyectoService.create({
    titulo: "Web",
    descripcion: "Sitio de la huerta",
    colectivo: colectivo.id,
  })
  const javascript = await services.habilidadService.create({
    titulo: "JavaScript",
    codigo: "javascript",
    descripcion: "Desarrollo con JavaScript",
  })
  perfil = await services.perfilService.create(proyecto.id, {
    nombre: "Frontend",
    descripcion: "Desarrollo frontend",
    unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES,
    cantidadHoras: 4,
    modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
    habilidadesRequeridas: [javascript.id],
    habilidadesOpcionales: [javascript.id],
  })
  ana = await services.personaColaboradoraService.create({
    nombreFantasia: "anag",
    aceptaMensajeriaInterna: true,
    mediosDeContacto: [{ tipo: "EMAIL", valor: "ana@example.com" }],
  })
  anon = await services.personaColaboradoraService.create({
    nombreFantasia: "anon",
  })
})

describe("controladores de mensajería", () => {
  test("POST contacto: el colectivo dueño del proyecto contacta a una persona (201)", async () => {
    const respuesta = await contactar({
      personaColaboradora: ana.id,
      contenido: "Tu perfil encaja",
    })

    expect(respuesta.status).toBe(201)
    expect(respuesta.body).toMatchObject({
      id: expect.any(String),
      contenido: "Tu perfil encaja",
      colectivo: colectivo.id,
      perfil: perfil.id,
    })
  })

  test("GET bandeja: la persona ve sus mensajes con los nombres (200)", async () => {
    await contactar({ personaColaboradora: ana.id, contenido: "Hola Ana" })

    const respuesta = await request(app)
      .get(rutaBandeja(ana.id))
      .set("Authorization", tokenAna())

    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual([
      expect.objectContaining({
        contenido: "Hola Ana",
        colectivo: { id: colectivo.id, nombre: "Huerta" },
        proyecto: { id: proyecto.id, titulo: "Web" },
        perfil: { id: perfil.id, nombre: "Frontend" },
      }),
    ])
  })

  test("GET enviados: el colectivo ve sus mensajes con el nombre de la destinataria y sin sus medios de contacto (200)", async () => {
    await contactar({ personaColaboradora: ana.id, contenido: "Hola Ana" })

    const respuesta = await request(app)
      .get(rutaEnviados(colectivo.id))
      .set("Authorization", tokenColectivo())

    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual([
      expect.objectContaining({
        contenido: "Hola Ana",
        personaColaboradora: { id: ana.id, nombreFantasia: "anag" },
        proyecto: { id: proyecto.id, titulo: "Web" },
        perfil: { id: perfil.id, nombre: "Frontend" },
      }),
    ])
    expect(JSON.stringify(respuesta.body)).not.toContain("ana@example.com")
  })

  test("sin token responde 401 en los tres endpoints", async () => {
    const respuestas = await Promise.all([
      request(app)
        .post(rutaContacto())
        .send({ personaColaboradora: ana.id, contenido: "Hola" }),
      request(app).get(rutaBandeja(ana.id)),
      request(app).get(rutaEnviados(colectivo.id)),
    ])

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([
      401, 401, 401,
    ])
  })

  test("responde 403 si el usuario no tiene permiso", async () => {
    const respuestas = await Promise.all([
      // una persona no puede contactar
      contactar({ personaColaboradora: ana.id, contenido: "Hola" }, tokenAna()),
      // otro colectivo no puede contactar desde este proyecto
      contactar(
        { personaColaboradora: ana.id, contenido: "Hola" },
        tokenDe(RolUsuario.COLECTIVO, otroColectivo.id),
      ),
      // nadie más lee la bandeja de la persona
      request(app)
        .get(rutaBandeja(ana.id))
        .set("Authorization", tokenColectivo()),
      // ni los enviados de otro colectivo
      request(app)
        .get(rutaEnviados(colectivo.id))
        .set("Authorization", tokenDe(RolUsuario.COLECTIVO, otroColectivo.id)),
    ])

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([
      403, 403, 403, 403,
    ])
  })

  test.each([
    ["falta el contenido", () => ({ personaColaboradora: ana.id })],
    [
      "la persona no es un id válido",
      () => ({ personaColaboradora: "ana", contenido: "Hola" }),
    ],
    [
      "manda un campo de más",
      () => ({
        personaColaboradora: ana.id,
        contenido: "Hola",
        colectivo: colectivo.id,
      }),
    ],
  ])("POST contacto responde 400 si %s", async (_caso, body) => {
    const respuesta = await contactar(body())

    expect(respuesta.status).toBe(400)
  })

  test("POST contacto responde 409 si la persona no acepta mensajería interna", async () => {
    const respuesta = await contactar({
      personaColaboradora: anon.id,
      contenido: "Hola",
    })

    expect(respuesta.status).toBe(409)
    expect(respuesta.body.message).toEqual(expect.any(String))
    expect(
      (
        await request(app)
          .get(rutaEnviados(colectivo.id))
          .set("Authorization", tokenColectivo())
      ).body,
    ).toEqual([])
  })
})
