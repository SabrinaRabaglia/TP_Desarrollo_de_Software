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
})

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
