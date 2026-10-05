import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import mongoose from "mongoose"
import { once } from "node:events"
import app from "../../src/app.js"
import Colectivo from "../../src/domain/Colectivo.js"
import Habilidad from "../../src/domain/Habilidad.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import HabilidadRepository from "../../src/repositories/HabilidadRepository.js"
import PaisModel from "../../src/schemas/paisSchema.js"
import ProvinciaModel from "../../src/schemas/provinciaSchema.js"
import sembrarCatalogos from "../../src/seeds/catalogos.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base

beforeAll(async () => {
  await conectar("persistencia")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

const leerDocumentos = async () =>
  Object.fromEntries(
    await Promise.all(
      mongoose
        .modelNames()
        .map(async (nombre) => [
          nombre,
          await mongoose.model(nombre).find().sort({ _id: 1 }).lean(),
        ]),
    ),
  )

describe("persistencia en MongoDB", () => {
  test("un colectivo guardado se lee desde otra instancia del repositorio con su ubicación", async () => {
    const argentina = await PaisModel.findOne({ nombre: "Argentina" })
    const salta = await ProvinciaModel.findOne({ nombre: "Salta" })
    const guardado = await new ColectivoRepository().save(
      new Colectivo(
        "Red Salteña",
        "Descripción",
        "ONG",
        argentina,
        salta,
        "Salta",
      ),
    )

    const leido = await new ColectivoRepository().findById(guardado.id)

    expect(leido).not.toBe(guardado)
    expect(leido.toJSON()).toMatchObject({
      id: guardado.id,
      nombre: "Red Salteña",
      pais: { id: argentina.id, nombre: "Argentina" },
      provincia: { id: salta.id, nombre: "Salta" },
      ciudad: "Salta",
    })
  })

  test("el índice único rechaza un código de habilidad duplicado", async () => {
    const repositorio = new HabilidadRepository()
    await repositorio.save(new Habilidad("Go", "go", "Desarrollo con Go"))

    await expect(
      repositorio.save(new Habilidad("Go", "go", "Otra descripción")),
    ).rejects.toMatchObject({ code: 11000 })
  })

  test("altas concurrentes con el mismo código guardan una sola habilidad y el resto recibe 409", async () => {
    const alta = () =>
      fetch(`${base}/habilidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: "Kotlin",
          codigo: "kotlin",
          descripcion: "Desarrollo con Kotlin",
        }),
      })

    const respuestas = await Promise.all([alta(), alta(), alta(), alta()])

    expect(respuestas.map((r) => r.status).sort()).toEqual([201, 409, 409, 409])
    expect(
      await mongoose.model("Habilidad").countDocuments({ codigo: "kotlin" }),
    ).toBe(1)
  })

  test("un id con formato inválido en la URL responde 400", async () => {
    const respuesta = await fetch(`${base}/proyectos/123`)

    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toEqual({
      message: "El id '123' no es válido",
      details: [],
    })
  })

  test("sembrar los catálogos de nuevo no duplica ni modifica documentos", async () => {
    const antes = await leerDocumentos()

    await sembrarCatalogos()

    expect(await leerDocumentos()).toEqual(antes)
    expect(antes.Pais).toHaveLength(1)
    expect(antes.Provincia).toHaveLength(24)
    expect(antes.TipoColectivo).toHaveLength(4)
  })
})

test("GET /paises y GET /provincias listan los catálogos ordenados por nombre", async () => {
  const paises = await (await fetch(`${base}/paises`)).json()
  expect(paises).toEqual([expect.objectContaining({ nombre: "Argentina" })])

  const respuesta = await fetch(`${base}/provincias`)
  expect(respuesta.status).toBe(200)
  const provincias = await respuesta.json()
  expect(provincias).toHaveLength(24)
  const nombres = provincias.map((provincia) => provincia.nombre)
  expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b)))
  for (const provincia of provincias) {
    expect(provincia.id).toMatch(/^[0-9a-f]{24}$/)
    expect(provincia).not.toHaveProperty("_id")
  }
})
