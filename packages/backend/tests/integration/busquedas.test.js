import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base
let habilidades
let proyectos
let personas

const request = async (method, path, body, status = 200) => {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  expect(response.status).toBe(status)
  return response.status === 204 ? null : response.json()
}

const crearProyectoConPerfil = async (titulo, colectivo, requeridas) => {
  const proyecto = await request(
    "POST",
    "/proyectos",
    {
      titulo,
      descripcion: `Proyecto ${titulo}`,
      colectivo: colectivo.id,
      estado: "PUBLICADO",
      fechaAlta: "2026-10-01T00:00:00.000Z",
      fechaCierre: null,
    },
    201,
  )
  const perfil = await request(
    "POST",
    `/proyectos/${proyecto.id}/perfiles`,
    {
      descripcion: `Perfil de ${titulo}`,
      unidadCompromiso: "HORAS_MENSUALES",
      cantidadHoras: 10,
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: requeridas.map((habilidad) => habilidad.id),
      habilidadesOpcionales: [habilidades.sql.id],
    },
    201,
  )
  return { ...proyecto, perfil }
}

const crearPersona = (nombreFantasia, conHabilidades) =>
  request(
    "POST",
    "/personas-colaboradoras",
    {
      nombreFantasia,
      habilidades: conHabilidades.map((habilidad) => habilidad.id),
      mediosDeContacto: [
        { tipo: "EMAIL", valor: `${nombreFantasia}@example.com` },
      ],
    },
    201,
  )

const titulos = (lista) => lista.map((proyecto) => proyecto.titulo).sort()

beforeAll(async () => {
  await conectar("busquedas")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  habilidades = Object.fromEntries(
    (await request("GET", "/habilidades")).map((habilidad) => [
      habilidad.codigo,
      habilidad,
    ]),
  )
  const colectivo = await request(
    "POST",
    "/colectivos",
    { nombre: "Colectivo", descripcion: "Desarrollo comunitario", tipo: "ONG" },
    201,
  )
  proyectos = {
    web: await crearProyectoConPerfil("Sitio web", colectivo, [
      habilidades.javascript,
      habilidades.react,
    ]),
    mapa: await crearProyectoConPerfil("Mapa", colectivo, [
      habilidades.javascript,
    ]),
    analisis: await crearProyectoConPerfil("Análisis", colectivo, [
      habilidades.python,
    ]),
    cerrado: await crearProyectoConPerfil("Cerrado", colectivo, [
      habilidades.javascript,
    ]),
  }
  await request("PATCH", `/proyectos/${proyectos.cerrado.id}`, {
    estado: "CERRADO",
  })
  personas = {
    ana: await crearPersona("anag", [
      habilidades.javascript,
      habilidades.react,
    ]),
    lucho: await crearPersona("lucho", [habilidades.javascript]),
    sol: await crearPersona("sol", [habilidades.python, habilidades.sql]),
  }
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

describe("búsqueda de proyectos según habilidades", () => {
  test("devuelve los proyectos publicados con algún perfil que requiera al menos una", async () => {
    const { javascript, react, python, sql } = habilidades

    expect(
      titulos(await request("GET", `/proyectos?habilidades=${javascript.id}`)),
    ).toEqual(["Mapa", "Sitio web"])
    expect(
      titulos(
        await request(
          "GET",
          `/proyectos?habilidades=${react.id}&habilidades=${python.id}`,
        ),
      ),
    ).toEqual(["Análisis", "Sitio web"])
    expect(await request("GET", `/proyectos?habilidades=${sql.id}`)).toEqual([])
  })

  test("sin habilidades lista todos los proyectos", async () => {
    expect(titulos(await request("GET", "/proyectos"))).toEqual([
      "Análisis",
      "Cerrado",
      "Mapa",
      "Sitio web",
    ])
  })

  test("rechaza una habilidad que no es un id", async () => {
    await request("GET", "/proyectos?habilidades=hola", undefined, 400)
  })
})

describe("búsqueda de colaboradores según un perfil", () => {
  const colaboradores = (proyecto) =>
    request(
      "GET",
      `/proyectos/${proyecto.id}/perfiles/${proyecto.perfil.id}/colaboradores`,
    )

  test("devuelve las personas con todas las habilidades requeridas, sin sus medios de contacto", async () => {
    const encontradas = await colaboradores(proyectos.web)

    expect(encontradas).toEqual([
      expect.objectContaining({
        id: personas.ana.id,
        habilidades: [habilidades.javascript, habilidades.react],
      }),
    ])
    expect(encontradas[0]).not.toHaveProperty("mediosDeContacto")
    expect(
      (await colaboradores(proyectos.mapa)).map((persona) => persona.id),
    ).toEqual([personas.ana.id, personas.lucho.id])
  })

  test("responde 404 si el perfil es de otro proyecto", async () => {
    await request(
      "GET",
      `/proyectos/${proyectos.web.id}/perfiles/${proyectos.mapa.perfil.id}/colaboradores`,
      undefined,
      404,
    )
  })
})
