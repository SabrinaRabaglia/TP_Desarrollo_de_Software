import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import PersonaColaboradoraModel from "../../src/schemas/personaColaboradoraSchema.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base

beforeAll(async () => {
  await conectar("idsDeMediosDeContacto")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

const request = async (method, path, status = 200) => {
  const response = await fetch(base + path, { method })
  expect(response.status).toBe(status)
  return response.status === 204 ? null : response.json()
}

// Hasta el 8/11/2026 los medios de contacto se guardaban sin _id. Así quedó
// en la base toda persona creada antes de esa fecha.
const guardarComoAntes = async (nombreFantasia, mediosDeContacto) => {
  const { insertedId } = await PersonaColaboradoraModel.collection.insertOne({
    nombreFantasia,
    pronombres: [],
    cuentas: [],
    habilidades: [],
    aceptaMensajeriaInterna: false,
    mediosDeContacto,
  })
  return String(insertedId)
}

const idsDeMedios = async (personaId) =>
  (
    await request("GET", `/personas-colaboradoras/${personaId}`)
  ).mediosDeContacto.map((medio) => medio.id)

describe("ids de los medios de contacto guardados sin _id", () => {
  test("se conservan entre lecturas y permiten borrar un medio", async () => {
    const personaId = await guardarComoAntes("vieja", [
      { tipo: "EMAIL", valor: "vieja@example.com" },
      { tipo: "SMS", valor: "+54 9 11 5555-0000" },
    ])

    const ids = await idsDeMedios(personaId)

    expect(await idsDeMedios(personaId)).toEqual(ids)
    await request(
      "DELETE",
      `/personas-colaboradoras/${personaId}/medios-de-contacto/${ids[0]}`,
      204,
    )
    expect(await idsDeMedios(personaId)).toEqual([ids[1]])
  })
})
