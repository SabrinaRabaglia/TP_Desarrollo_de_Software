import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import PersonaColaboradoraModel from "../../src/schemas/personaColaboradoraSchema.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base

beforeAll(async () => {
  await conectar("personasColaboradoras")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

const request = async (method, path, body, status = 200) => {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  expect(response.status).toBe(status)
  return response.json()
}

const mediosGuardados = async (id) =>
  (await PersonaColaboradoraModel.findById(id)).toObject().mediosDeContacto

describe("medios de contacto de las personas colaboradoras", () => {
  const mediosDeContacto = [
    { tipo: "EMAIL", valor: "ana@example.com" },
    { tipo: "WHATSAPP", valor: "+54 9 11 1234-5678" },
  ]

  test("se guardan pero ninguna respuesta los devuelve", async () => {
    const persona = await request(
      "POST",
      "/personas-colaboradoras",
      {
        nombreFantasia: "anag",
        aceptaMensajeriaInterna: true,
        mediosDeContacto,
      },
      201,
    )

    expect(persona.aceptaMensajeriaInterna).toBe(true)
    expect(persona).not.toHaveProperty("mediosDeContacto")
    expect(
      await request("GET", `/personas-colaboradoras/${persona.id}`),
    ).not.toHaveProperty("mediosDeContacto")
    for (const listada of await request("GET", "/personas-colaboradoras")) {
      expect(listada).not.toHaveProperty("mediosDeContacto")
    }
    expect(await mediosGuardados(persona.id)).toEqual(mediosDeContacto)
  })

  test("un PUT sin medios los conserva y uno con una lista vacía los borra", async () => {
    const persona = await request(
      "POST",
      "/personas-colaboradoras",
      { nombreFantasia: "lucho", mediosDeContacto },
      201,
    )

    const actualizada = await request(
      "PUT",
      `/personas-colaboradoras/${persona.id}`,
      { nombreFantasia: "lucho", presentacion: "Backend" },
    )
    expect(actualizada.presentacion).toBe("Backend")
    expect(await mediosGuardados(persona.id)).toEqual(mediosDeContacto)

    await request("PUT", `/personas-colaboradoras/${persona.id}`, {
      nombreFantasia: "lucho",
      mediosDeContacto: [],
    })
    expect(await mediosGuardados(persona.id)).toEqual([])
  })

  test("un medio con formato inválido responde 422 y no modifica la persona", async () => {
    const persona = await request(
      "POST",
      "/personas-colaboradoras",
      { nombreFantasia: "sol", mediosDeContacto },
      201,
    )

    await request(
      "PUT",
      `/personas-colaboradoras/${persona.id}`,
      {
        nombreFantasia: "sol",
        mediosDeContacto: [{ tipo: "SMS", valor: "123" }],
      },
      422,
    )
    expect(await mediosGuardados(persona.id)).toEqual(mediosDeContacto)
  })
})
