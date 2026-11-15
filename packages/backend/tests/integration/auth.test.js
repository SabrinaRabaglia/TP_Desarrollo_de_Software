import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import AuthService from "../../src/services/AuthService.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../src/repositories/UsuarioRepository.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base
let colectivo

beforeAll(async () => {
  await conectar("auth")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  colectivo = await (
    await enviar("POST", "/colectivos", {
      nombre: "Huerta Comunitaria Sur",
      descripcion: "Huertas urbanas",
      tipo: "ONG",
    })
  ).json()
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
}, 30000)

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

const enviar = (method, path, body, headers = {}) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const login = (email, contrasena) =>
  enviar("POST", "/auth/login", { email, contrasena })

const me = (authorization) =>
  enviar(
    "GET",
    "/auth/me",
    undefined,
    authorization ? { Authorization: authorization } : {},
  )

describe("autenticación", () => {
  test("el login correcto devuelve un token y el usuario público", async () => {
    const respuesta = await login("huerta@colectivo.test", "secreto123")

    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({
      token: expect.any(String),
      usuario: {
        id: expect.any(String),
        email: "huerta@colectivo.test",
        rol: "COLECTIVO",
        entidad: { id: colectivo.id, nombre: "Huerta Comunitaria Sur" },
      },
    })
  })

  test("una contraseña incorrecta y un email inexistente responden 401 con el mismo mensaje", async () => {
    const incorrecta = await login("huerta@colectivo.test", "secreto124")
    const inexistente = await login("nadie@colectivo.test", "secreto123")

    expect(incorrecta.status).toBe(401)
    expect(inexistente.status).toBe(401)
    expect((await incorrecta.json()).message).toBe(
      (await inexistente.json()).message,
    )
  })

  test("un body inválido responde 400", async () => {
    const respuesta = await enviar("POST", "/auth/login", {
      email: "huerta@colectivo.test",
    })

    expect(respuesta.status).toBe(400)
  })

  test("/auth/me con el token devuelve el mismo usuario del login", async () => {
    const { token, usuario } = await (
      await login("huerta@colectivo.test", "secreto123")
    ).json()

    const respuesta = await me(`Bearer ${token}`)

    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual(usuario)
  })

  test.each([
    ["sin token", undefined],
    ["con un token basura", "Bearer no-es-un-token"],
  ])("/auth/me %s responde 401", async (_caso, authorization) => {
    const respuesta = await me(authorization)

    expect(respuesta.status).toBe(401)
    expect(await respuesta.json()).toEqual({
      message: expect.any(String),
      details: [],
    })
  })
})

describe("registro de una persona colaboradora", () => {
  const registrar = (body) =>
    enviar("POST", "/auth/registro/persona-colaboradora", body)

  const cantidadDePersonas = async () =>
    (await (await enviar("GET", "/personas-colaboradoras")).json()).length

  const registroDeLucia = async () => {
    const [react] = await (await enviar("GET", "/habilidades")).json()
    return {
      email: "lucia@persona.test",
      contrasena: "secreto123",
      persona: {
        nombreFantasia: "lucia.dev",
        habilidades: [react.id],
        cuentas: [{ nombreUsuario: "lucia-dev", tipo: "GITHUB" }],
        mediosDeContacto: [{ tipo: "EMAIL", valor: "lucia@example.com" }],
      },
    }
  }

  test("crea la persona y su usuario, que después puede iniciar sesión", async () => {
    const respuesta = await registrar(await registroDeLucia())

    expect(respuesta.status).toBe(201)
    const usuario = await respuesta.json()
    expect(usuario).toEqual({
      id: expect.any(String),
      email: "lucia@persona.test",
      rol: "PERSONA_COLABORADORA",
      entidad: { id: expect.any(String), nombre: "lucia.dev" },
    })

    const sesion = await login("lucia@persona.test", "secreto123")
    expect(sesion.status).toBe(200)
    const { token } = await sesion.json()
    expect(await (await me(`Bearer ${token}`)).json()).toEqual(usuario)

    const persona = await (
      await enviar("GET", `/personas-colaboradoras/${usuario.entidad.id}`)
    ).json()
    expect(persona.nombreFantasia).toBe("lucia.dev")
  })

  test("con un email ya usado responde 409 sin crear otra persona", async () => {
    const antes = await cantidadDePersonas()

    const respuesta = await registrar({
      ...(await registroDeLucia()),
      email: "huerta@colectivo.test",
    })

    expect(respuesta.status).toBe(409)
    expect(await cantidadDePersonas()).toBe(antes)
  })

  test("un body inválido responde 400", async () => {
    const { persona } = await registroDeLucia()

    const respuesta = await registrar({
      email: "sin-contrasena@persona.test",
      persona,
    })

    expect(respuesta.status).toBe(400)
  })

  test("un teléfono de WhatsApp inválido responde 422 sin dejar persona ni usuario", async () => {
    const antes = await cantidadDePersonas()
    const registro = await registroDeLucia()

    const respuesta = await registrar({
      ...registro,
      email: "whatsapp@persona.test",
      persona: {
        ...registro.persona,
        mediosDeContacto: [{ tipo: "WHATSAPP", valor: "abc" }],
      },
    })

    expect(respuesta.status).toBe(422)
    expect(await cantidadDePersonas()).toBe(antes)
    expect((await login("whatsapp@persona.test", "secreto123")).status).toBe(
      401,
    )
  })
})
