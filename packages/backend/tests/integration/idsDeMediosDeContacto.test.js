import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import mongoose from "mongoose"
import app from "../../src/app.js"
import AuthService from "../../src/services/AuthService.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../src/repositories/UsuarioRepository.js"
import asignarIdsAMediosDeContacto from "../../src/migraciones/asignarIdsAMediosDeContacto.js"
import PersonaColaboradoraModel from "../../src/schemas/personaColaboradoraSchema.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base

beforeAll(async () => {
  await conectar("idsDeMediosDeContacto")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`
}, 30000)

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

const request = async (method, path, status = 200, token) => {
  const response = await fetch(base + path, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  expect(response.status).toBe(status)
  return response.status === 204 ? null : response.json()
}

const iniciarSesionComo = async (personaId) => {
  const email = `persona-${personaId}@persona.test`
  await new AuthService(
    new UsuarioRepository(),
    new ColectivoRepository(),
    new PersonaColaboradoraRepository(),
  ).registrar({
    email,
    contrasena: "secreto123",
    rol: "PERSONA_COLABORADORA",
    entidad: personaId,
  })
  const response = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena: "secreto123" }),
  })
  return (await response.json()).token
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

const mediosGuardados = async (personaId) =>
  (
    await PersonaColaboradoraModel.collection.findOne({
      _id: new mongoose.Types.ObjectId(personaId),
    })
  ).mediosDeContacto

describe("ids de los medios de contacto guardados sin _id", () => {
  test("después de la migración se conservan entre lecturas y permiten borrar un medio", async () => {
    const personaId = await guardarComoAntes("vieja", [
      { tipo: "EMAIL", valor: "vieja@example.com" },
      { tipo: "SMS", valor: "+54 9 11 5555-0000" },
    ])

    expect(await asignarIdsAMediosDeContacto()).toBe(2)
    const ids = await idsDeMedios(personaId)

    expect(new Set(ids).size).toBe(2)
    expect(await idsDeMedios(personaId)).toEqual(ids)
    await request(
      "DELETE",
      `/personas-colaboradoras/${personaId}/medios-de-contacto/${ids[0]}`,
      204,
      await iniciarSesionComo(personaId),
    )
    expect(await idsDeMedios(personaId)).toEqual([ids[1]])
  })

  test("la migración conserva el tipo y el valor de cada medio", async () => {
    const medios = [
      { tipo: "EMAIL", valor: "otra@example.com" },
      { tipo: "WHATSAPP", valor: "+54 9 11 4444-0000" },
    ]
    const personaId = await guardarComoAntes("otra vieja", medios)

    await asignarIdsAMediosDeContacto()

    expect(
      (await mediosGuardados(personaId)).map(({ tipo, valor }) => ({
        tipo,
        valor,
      })),
    ).toEqual(medios)
  })

  test("no toca los medios que ya tienen id y correrla de nuevo no cambia nada", async () => {
    const response = await fetch(base + "/personas-colaboradoras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreFantasia: "nueva",
        mediosDeContacto: [{ tipo: "EMAIL", valor: "nueva@example.com" }],
      }),
    })
    const nueva = await response.json()
    const vieja = await guardarComoAntes("tercera vieja", [
      { tipo: "SMS", valor: "+54 9 11 3333-0000" },
    ])
    const antes = await idsDeMedios(nueva.id)

    expect(await asignarIdsAMediosDeContacto()).toBe(1)
    const idsDeLaVieja = await idsDeMedios(vieja)

    expect(await asignarIdsAMediosDeContacto()).toBe(0)
    expect(await idsDeMedios(nueva.id)).toEqual(antes)
    expect(await idsDeMedios(vieja)).toEqual(idsDeLaVieja)
  })
})
