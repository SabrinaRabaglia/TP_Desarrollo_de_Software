import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base
let colectivo
let habilidades
let datos

beforeAll(async () => {
  await conectar("perfiles")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  habilidades = {
    cypress: await request(
      "POST",
      "/habilidades",
      { titulo: "Cypress", codigo: "cypress", descripcion: "Testing E2E" },
      201,
    ),
    soapUi: await request(
      "POST",
      "/habilidades",
      { titulo: "Soap UI", codigo: "soap_ui", descripcion: "Testing de APIs" },
      201,
    ),
  }
  colectivo = await request(
    "POST",
    "/colectivos",
    { nombre: "Colectivo", descripcion: "Desarrollo comunitario", tipo: "ONG" },
    201,
  )
  datos = {
    nombre: "Tester",
    descripcion: "Testing E2E con Cypress",
    unidadCompromiso: "HORAS_MENSUALES",
    cantidadHoras: 5,
    modalidadesColaboracion: ["GRATUITA"],
    habilidadesRequeridas: [habilidades.cypress.id],
    habilidadesOpcionales: [habilidades.soapUi.id],
  }
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
  return response.status === 204 ? null : response.json()
}

const crearProyecto = (titulo) =>
  request(
    "POST",
    "/proyectos",
    {
      titulo,
      descripcion: "Proyecto con perfiles",
      colectivo: colectivo.id,
      estado: "PUBLICADO",
      fechaAlta: "2026-10-01T00:00:00.000Z",
      fechaCierre: null,
    },
    201,
  )

describe("perfiles de un proyecto", () => {
  test("alta, consulta, edición y baja devuelven el perfil", async () => {
    const proyecto = await crearProyecto("Proyecto CRUD")
    const perfiles = `/proyectos/${proyecto.id}/perfiles`

    const perfil = await request("POST", perfiles, datos, 201)
    expect(perfil).toEqual({ id: expect.any(String), ...datos })
    expect(await request("GET", perfiles)).toEqual([perfil])
    expect(await request("GET", `${perfiles}/${perfil.id}`)).toEqual(perfil)
    expect(
      (await request("GET", `/proyectos/${proyecto.id}`)).perfiles,
    ).toEqual([perfil])

    const cambios = {
      ...datos,
      descripcion: "Analista de datos",
      cantidadHoras: 15,
      modalidadesColaboracion: ["CON_INCENTIVO_ECONOMICO"],
    }
    const editado = await request("PUT", `${perfiles}/${perfil.id}`, cambios)
    expect(editado).toEqual({ id: perfil.id, ...cambios })
    expect(await request("GET", perfiles)).toEqual([editado])

    await request("DELETE", `${perfiles}/${perfil.id}`, undefined, 204)
    expect(await request("GET", perfiles)).toEqual([])
  })

  test("rechaza un perfil inválido o con referencias inexistentes", async () => {
    const proyecto = await crearProyecto("Proyecto validaciones")
    const otro = await crearProyecto("Otro proyecto")
    const perfiles = `/proyectos/${proyecto.id}/perfiles`
    const ajeno = await request(
      "POST",
      `/proyectos/${otro.id}/perfiles`,
      datos,
      201,
    )

    await request(
      "POST",
      perfiles,
      { ...datos, habilidadesOpcionales: [] },
      422,
    )
    await request(
      "POST",
      perfiles,
      { ...datos, habilidadesRequeridas: ["64f1a2b3c4d5e6f7a8b9c0ff"] },
      404,
    )
    await request("GET", `${perfiles}/${ajeno.id}`, undefined, 404)
    await request("PUT", `${perfiles}/${ajeno.id}`, datos, 404)
    await request("DELETE", `${perfiles}/${ajeno.id}`, undefined, 404)
    expect(await request("GET", perfiles)).toEqual([])
    expect(await request("GET", `/proyectos/${otro.id}/perfiles`)).toEqual([
      ajeno,
    ])
  })

  test("un proyecto cerrado no admite cambios en sus perfiles", async () => {
    const proyecto = await crearProyecto("Proyecto cerrado")
    const perfiles = `/proyectos/${proyecto.id}/perfiles`
    const perfil = await request("POST", perfiles, datos, 201)
    await request("PATCH", `/proyectos/${proyecto.id}`, { estado: "CERRADO" })

    await request("POST", perfiles, datos, 409)
    await request(
      "PUT",
      `${perfiles}/${perfil.id}`,
      { ...datos, cantidadHoras: 20 },
      409,
    )
    await request("DELETE", `${perfiles}/${perfil.id}`, undefined, 409)
    expect(await request("GET", perfiles)).toEqual([perfil])
  })
})
