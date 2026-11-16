import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import AuthService from "../../src/services/AuthService.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../src/repositories/UsuarioRepository.js"
import PostulacionModel from "../../src/schemas/postulacionSchema.js"
import { conectar, desconectar } from "./mongo.js"
import { tokenDeColectivo } from "./tokens.js"

let server
let base
let ana
let lucho
let proyecto
let perfil
const tokens = {}

const mediosDeAna = [
  { tipo: "EMAIL", valor: "ana@example.com" },
  { tipo: "WHATSAPP", valor: "+54 9 11 1234-5678" },
]

const enviar = async (method, path, body, token) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, body: await response.json() }
}

const iniciarSesion = async (email) =>
  (await enviar("POST", "/auth/login", { email, contrasena: "secreto123" }))
    .body.token

const crearColectivoConUsuario = async (nombre, email) => {
  const { body: colectivo } = await enviar("POST", "/colectivos", {
    nombre,
    descripcion: "Colectivo de prueba",
    tipo: "ONG",
  })
  await new AuthService(
    new UsuarioRepository(),
    new ColectivoRepository(),
    new PersonaColaboradoraRepository(),
  ).registrar({
    email,
    contrasena: "secreto123",
    rol: "COLECTIVO",
    entidad: colectivo.id,
  })
  return colectivo
}

const registrarPersona = async (email, persona) =>
  (
    await enviar("POST", "/auth/registro/persona-colaboradora", {
      email,
      contrasena: "secreto123",
      persona,
    })
  ).body.entidad

const mediosDeContacto = (personaId, token) =>
  enviar(
    "GET",
    `/personas-colaboradoras/${personaId}/medios-de-contacto`,
    undefined,
    token,
  )

beforeAll(async () => {
  await conectar("mediosDeContacto")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  const {
    body: [habilidad],
  } = await enviar("GET", "/habilidades")
  const huerta = await crearColectivoConUsuario(
    "Huerta Comunitaria Sur",
    "huerta@colectivo.test",
  )
  await crearColectivoConUsuario("Otro colectivo", "otro@colectivo.test")

  ana = await registrarPersona("ana@persona.test", {
    nombreFantasia: "anag",
    habilidades: [habilidad.id],
    mediosDeContacto: mediosDeAna,
  })
  lucho = await registrarPersona("lucho@persona.test", {
    nombreFantasia: "lucho_dev",
  })

  proyecto = (
    await enviar(
      "POST",
      "/proyectos",
      {
        titulo: "Sitio web de la huerta",
        descripcion: "Calendario de talleres",
        colectivo: huerta.id,
        estado: "PUBLICADO",
        fechaCierre: null,
      },
      tokenDeColectivo(huerta.id),
    )
  ).body
  const { body: perfilCreado } = await enviar(
    "POST",
    `/proyectos/${proyecto.id}/perfiles`,
    {
      descripcion: "Desarrollo web",
      unidadCompromiso: "HORAS_TOTALES",
      cantidadHoras: 5,
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: [habilidad.id],
      habilidadesOpcionales: [habilidad.id],
    },
    tokenDeColectivo(huerta.id),
  )
  perfil = perfilCreado
  // Ana colabora (aceptada); Lucho solo se postuló (pendiente).
  await PostulacionModel.create({
    personaColaboradora: ana.id,
    perfil: perfil.id,
    fechaPostulacion: new Date(),
    estado: "ACEPTADA",
  })
  await PostulacionModel.create({
    personaColaboradora: lucho.id,
    perfil: perfil.id,
    fechaPostulacion: new Date(),
  })

  for (const email of [
    "huerta@colectivo.test",
    "otro@colectivo.test",
    "ana@persona.test",
    "lucho@persona.test",
  ]) {
    tokens[email] = await iniciarSesion(email)
  }
}, 30000)

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

describe("GET /personas-colaboradoras/:id/medios-de-contacto", () => {
  test("sin token responde 401", async () => {
    const respuesta = await mediosDeContacto(ana.id)

    expect(respuesta.status).toBe(401)
  })

  test("la propia persona ve sus medios con el valor", async () => {
    const respuesta = await mediosDeContacto(ana.id, tokens["ana@persona.test"])

    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual(
      mediosDeAna.map((medio) => ({ id: expect.any(String), ...medio })),
    )
  })

  test("los ids son los mismos que expone el perfil público", async () => {
    const { body: persona } = await enviar(
      "GET",
      `/personas-colaboradoras/${ana.id}`,
    )
    const { body: medios } = await mediosDeContacto(
      ana.id,
      tokens["ana@persona.test"],
    )

    expect(medios.map(({ id }) => id)).toEqual(
      persona.mediosDeContacto.map(({ id }) => id),
    )
  })

  test("otra persona colaboradora recibe 403", async () => {
    const respuesta = await mediosDeContacto(
      ana.id,
      tokens["lucho@persona.test"],
    )

    expect(respuesta.status).toBe(403)
    expect(respuesta.body.message).toBe(
      "No tenés acceso a los datos de contacto de esta persona",
    )
  })

  test("el colectivo de un proyecto en el que colabora la persona los ve", async () => {
    const respuesta = await mediosDeContacto(
      ana.id,
      tokens["huerta@colectivo.test"],
    )

    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual(
      mediosDeAna.map((medio) => ({ id: expect.any(String), ...medio })),
    )
  })

  test("el colectivo de un proyecto en el que la persona solo se postuló recibe 403", async () => {
    const respuesta = await mediosDeContacto(
      lucho.id,
      tokens["huerta@colectivo.test"],
    )

    expect(respuesta.status).toBe(403)
  })

  test("un colectivo con el que la persona no colabora recibe 403", async () => {
    const respuesta = await mediosDeContacto(
      ana.id,
      tokens["otro@colectivo.test"],
    )

    expect(respuesta.status).toBe(403)
  })

  test("una persona inexistente responde 404", async () => {
    const respuesta = await mediosDeContacto(
      "64b000000000000000000000",
      tokens["huerta@colectivo.test"],
    )

    expect(respuesta.status).toBe(404)
  })

  test("el perfil público sigue sin exponer el valor de los medios", async () => {
    const { body: persona } = await enviar(
      "GET",
      `/personas-colaboradoras/${ana.id}`,
    )

    expect(persona.mediosDeContacto).toEqual([
      { id: expect.any(String), tipo: "EMAIL" },
      { id: expect.any(String), tipo: "WHATSAPP" },
    ])
  })
})

describe("GET /proyectos/:id/perfiles/:perfilId/postulaciones", () => {
  test("el colectivo ve el contacto solo de las postulaciones aceptadas", async () => {
    const respuesta = await enviar(
      "GET",
      `/proyectos/${proyecto.id}/perfiles/${perfil.id}/postulaciones`,
      undefined,
      tokens["huerta@colectivo.test"],
    )

    expect(respuesta.status).toBe(200)
    const medios = Object.fromEntries(
      respuesta.body.map((postulacion) => [
        postulacion.personaColaboradora.nombreFantasia,
        postulacion.personaColaboradora.mediosDeContacto,
      ]),
    )
    expect(medios).toEqual({
      anag: mediosDeAna.map((medio) => ({ id: expect.any(String), ...medio })),
      lucho_dev: [],
    })
  })
})
