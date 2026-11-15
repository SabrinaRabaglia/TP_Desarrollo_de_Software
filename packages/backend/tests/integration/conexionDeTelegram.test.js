import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import AuthService from "../../src/services/AuthService.js"
import ConexionDeTelegram from "../../src/services/ConexionDeTelegram.js"
import { emitirCodigo } from "../../src/auth/codigoDeVinculacion.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../src/repositories/UsuarioRepository.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base
let ana
const tokens = {}

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

const registrarPersona = async (email, persona) =>
  (
    await enviar("POST", "/auth/registro/persona-colaboradora", {
      email,
      contrasena: "secreto123",
      persona,
    })
  ).body.entidad

const pedirEnlace = (personaId, token) =>
  enviar(
    "POST",
    `/personas-colaboradoras/${personaId}/telegram/enlace`,
    undefined,
    token,
  )

const mediosDeAna = async () =>
  (
    await enviar(
      "GET",
      `/personas-colaboradoras/${ana.id}/medios-de-contacto`,
      undefined,
      tokens.ana,
    )
  ).body

beforeAll(async () => {
  await conectar("conexionDeTelegram")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  const { body: colectivo } = await enviar("POST", "/colectivos", {
    nombre: "Huerta Comunitaria Sur",
    descripcion: "Colectivo de prueba",
    tipo: "ONG",
  })
  await new AuthService(
    new UsuarioRepository(),
    new ColectivoRepository(),
    new PersonaColaboradoraRepository(),
  ).registrar({
    email: "huerta@colectivo.test",
    contrasena: "secreto123",
    rol: "COLECTIVO",
    entidad: colectivo.id,
  })
  ana = await registrarPersona("ana@persona.test", {
    nombreFantasia: "anag",
    mediosDeContacto: [{ tipo: "EMAIL", valor: "ana@example.com" }],
  })
  await registrarPersona("lucho@persona.test", { nombreFantasia: "lucho_dev" })

  tokens.ana = await iniciarSesion("ana@persona.test")
  tokens.lucho = await iniciarSesion("lucho@persona.test")
  tokens.huerta = await iniciarSesion("huerta@colectivo.test")
})

afterAll(async () => {
  server.close()
  await desconectar()
})

describe("POST /personas-colaboradoras/:id/telegram/enlace", () => {
  test("sin token responde 401", async () => {
    expect((await pedirEnlace(ana.id)).status).toBe(401)
  })

  test.each([
    ["otra persona", "lucho"],
    ["un colectivo", "huerta"],
  ])("con el token de %s responde 403", async (_caso, quien) => {
    expect((await pedirEnlace(ana.id, tokens[quien])).status).toBe(403)
  })

  test("sin Telegram configurado responde 503", async () => {
    const { status, body } = await pedirEnlace(ana.id, tokens.ana)

    expect(status).toBe(503)
    expect(body.message).toBe("Telegram no está disponible en este servidor")
  })
})

describe("conectar Telegram con Mongo", () => {
  const conexion = new ConexionDeTelegram(
    null,
    new PersonaColaboradoraRepository(),
  )
  const iniciarConCodigo = (chatId) =>
    conexion.atenderMensaje({
      chatId,
      texto: `/start ${emitirCodigo(ana.id).codigo}`,
    })

  test("guarda el chat como medio de contacto, lo reemplaza al reconectar y conserva los demás", async () => {
    const [email] = await mediosDeAna()

    await iniciarConCodigo(111)
    await iniciarConCodigo(222)

    const medios = await mediosDeAna()
    expect(medios).toEqual([
      email,
      { id: expect.any(String), tipo: "TELEGRAM", valor: "222" },
    ])
  })
})
