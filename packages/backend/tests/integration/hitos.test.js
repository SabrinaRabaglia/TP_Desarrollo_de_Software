import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base
let colectivo
let habilidad

beforeAll(async () => {
  await conectar("hitos")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  habilidad = await request(
    "POST",
    "/habilidades",
    { titulo: "Cypress", codigo: "cypress", descripcion: "Testing E2E" },
    201,
  )
  colectivo = await request(
    "POST",
    "/colectivos",
    { nombre: "Colectivo", descripcion: "Desarrollo comunitario", tipo: "ONG" },
    201,
  )
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

const enviar = (method, path, body) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const request = async (method, path, body, status = 200) => {
  const response = await enviar(method, path, body)
  expect(response.status).toBe(status)
  return response.status === 204 ? null : response.json()
}

const crearProyecto = (titulo, fechaAlta = "2026-10-01T00:00:00.000Z") =>
  request(
    "POST",
    "/proyectos",
    {
      titulo,
      descripcion: "Proyecto con hitos",
      colectivo: colectivo.id,
      estado: "PUBLICADO",
      fechaAlta,
      fechaCierre: null,
    },
    201,
  )

const datos = {
  fecha: "2026-10-15T00:00:00.000Z",
  porcentajeConcrecion: 40,
  descripcion: "Primera entrega",
}

const perfil = {
  descripcion: "Tester",
  unidadCompromiso: "HORAS_MENSUALES",
  cantidadHoras: 5,
  modalidadesColaboracion: ["GRATUITA"],
  habilidadesRequeridas: [],
  habilidadesOpcionales: [],
}

describe("hitos de un proyecto", () => {
  test("alta, consulta, edición y baja devuelven el hito", async () => {
    const proyecto = await crearProyecto("Proyecto CRUD")
    const hitos = `/proyectos/${proyecto.id}/hitos`

    const hito = await request("POST", hitos, datos, 201)
    expect(hito).toEqual(
      expect.objectContaining({ id: expect.any(String), ...datos }),
    )
    expect(await request("GET", hitos)).toEqual([hito])

    const editado = await request("PATCH", `/hitos/${hito.id}`, {
      porcentajeConcrecion: 80,
    })
    expect(editado).toEqual({
      ...hito,
      porcentajeConcrecion: 80,
      updatedAt: expect.any(String),
    })
    expect(await request("GET", hitos)).toEqual([editado])

    await request("DELETE", `/hitos/${hito.id}`, undefined, 204)
    expect(await request("GET", hitos)).toEqual([])
  })

  test("rechaza datos inválidos y referencias inexistentes", async () => {
    const proyecto = await crearProyecto("Proyecto validaciones")
    const hitos = `/proyectos/${proyecto.id}/hitos`
    const inexistente = "64f1a2b3c4d5e6f7a8b9c0ff"

    await request("POST", hitos, { ...datos, porcentajeConcrecion: 101 }, 400)
    await request("POST", hitos, { ...datos, descripcion: "  " }, 400)
    await request("POST", hitos, { ...datos, fecha: "2999-01-01" }, 400)
    await request("POST", hitos, { ...datos, fecha: null }, 400)
    await request("POST", hitos, { ...datos, proyecto: inexistente }, 400)
    await request("POST", `/proyectos/${inexistente}/hitos`, datos, 404)
    await request("GET", `/proyectos/${inexistente}/hitos`, undefined, 404)
    await request("PATCH", `/hitos/${inexistente}`, { descripcion: "x" }, 404)
    await request("DELETE", `/hitos/${inexistente}`, undefined, 404)
    expect(await request("GET", hitos)).toEqual([])
  })

  test("la fecha de alta se compara por día aunque tenga hora", async () => {
    const proyecto = await crearProyecto(
      "Alta con hora",
      "2026-10-01T15:00:00.000Z",
    )
    const hitos = `/proyectos/${proyecto.id}/hitos`

    await request("POST", hitos, { ...datos, fecha: "2026-10-01" }, 201)
    await request(
      "POST",
      hitos,
      { ...datos, fecha: "2026-09-30T23:00:00.000Z" },
      422,
    )
    expect(await request("GET", hitos)).toHaveLength(1)
  })

  test("un hito no puede ser anterior al alta del proyecto, ni al crearlo ni al editarlo", async () => {
    const proyecto = await crearProyecto("Proyecto con alta")
    const hitos = `/proyectos/${proyecto.id}/hitos`
    const anterior = { ...datos, fecha: "2026-09-30T00:00:00.000Z" }

    const respuesta = await request("POST", hitos, anterior, 422)
    expect(respuesta.message).toBe(
      "La fecha del hito no puede ser anterior al alta del proyecto.",
    )
    const enElAlta = await request(
      "POST",
      hitos,
      { ...datos, fecha: "2026-10-01T00:00:00.000Z" },
      201,
    )

    await request(
      "PATCH",
      `/hitos/${enElAlta.id}`,
      { fecha: "2026-09-30T00:00:00.000Z" },
      422,
    )
    await request("PATCH", `/hitos/${enElAlta.id}`, { descripcion: "" }, 400)
    await request(
      "PATCH",
      `/hitos/${enElAlta.id}`,
      { fecha: "2999-01-01" },
      400,
    )
    expect(await request("GET", hitos)).toEqual([enElAlta])
  })
})

describe("cambios simultáneos sobre hitos y perfiles de un proyecto", () => {
  const REPETICIONES = 5

  test("altas simultáneas de hitos guardan todos", async () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const proyecto = await crearProyecto(`Altas simultáneas ${i}`)
      const hitos = `/proyectos/${proyecto.id}/hitos`
      const descripciones = ["A", "B", "C", "D"]

      const respuestas = await Promise.all(
        descripciones.map((descripcion) =>
          enviar("POST", hitos, { ...datos, descripcion }),
        ),
      )

      expect(respuestas.map((r) => r.status)).toEqual([201, 201, 201, 201])
      expect(
        (await request("GET", hitos)).map((hito) => hito.descripcion).sort(),
      ).toEqual(descripciones)
    }
  })

  test("un alta de hito y un alta de perfil simultáneas aplican las dos", async () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const proyecto = await crearProyecto(`Hito y perfil ${i}`)

      const respuestas = await Promise.all([
        enviar("POST", `/proyectos/${proyecto.id}/hitos`, datos),
        enviar("POST", `/proyectos/${proyecto.id}/perfiles`, {
          ...perfil,
          habilidadesRequeridas: [habilidad.id],
          habilidadesOpcionales: [habilidad.id],
        }),
      ])

      expect(respuestas.map((r) => r.status)).toEqual([201, 201])
      expect(
        await request("GET", `/proyectos/${proyecto.id}/hitos`),
      ).toHaveLength(1)
      expect(
        await request("GET", `/proyectos/${proyecto.id}/perfiles`),
      ).toHaveLength(1)
    }
  })
})
