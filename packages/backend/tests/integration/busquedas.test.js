import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import PostulacionModel from "../../src/schemas/postulacionSchema.js"
import { conectar, desconectar } from "./mongo.js"
import { tokenDeColectivo } from "./tokens.js"

let server
let base
let habilidades
let proyectos
let personas

const request = async (method, path, body, status = 200, token) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
    tokenDeColectivo(colectivo.id),
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

//const titulos = (lista) => lista.map((proyecto) => proyecto.titulo).sort()
const titulos = (respuesta) =>
  respuesta.data.map((proyecto) => proyecto.titulo).sort()

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
}, 30000)

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

describe("búsqueda de proyectos según habilidades", () => {
  test("devuelve los proyectos publicados con algún perfil cuyas requeridas estén todas cubiertas", async () => {
    const { javascript, react, python, sql } = habilidades

    expect(
      titulos(await request("GET", `/proyectos?habilidades=${javascript.id}`)),
    ).toEqual(["Mapa"])
    expect(
      titulos(
        await request(
          "GET",
          `/proyectos?habilidades=${javascript.id}&habilidades=${react.id}`,
        ),
      ),
    ).toEqual(["Mapa", "Sitio web"])
    expect(
      titulos(
        await request(
          "GET",
          `/proyectos?habilidades=${react.id}&habilidades=${python.id}`,
        ),
      ),
    ).toEqual(["Análisis"])
    expect(
      (await request("GET", `/proyectos?habilidades=${sql.id}`)).data,
    ).toEqual([])
  })

  test("sin habilidades lista todos los proyectos", async () => {
    expect(titulos(await request("GET", "/proyectos"))).toEqual([
      "Análisis",
      "Cerrado",
      "Mapa",
      "Sitio web",
    ])
  })

  test("pagina el listado y devuelve cada proyecto con su id, como el resto de la API", async () => {
    const pagina = await request("GET", "/proyectos?limit=3&page=2")

    expect(pagina.metadata).toEqual({ page: 2, limit: 3, total: 4 })
    expect(pagina.data).toHaveLength(1)
    const [proyecto] = pagina.data
    expect(Object.values(proyectos).map((p) => p.id)).toContain(proyecto.id)
    expect(proyecto).not.toHaveProperty("_id")
    expect(proyecto).not.toHaveProperty("__v")
  })

  test("rechaza una habilidad que no es un id", async () => {
    await request("GET", "/proyectos?habilidades=hola", undefined, 400)
  })
})

describe("búsqueda de colaboradores según un perfil", () => {
  const colaboradores = (...perfiles) => {
    const query = new URLSearchParams()

    perfiles.forEach((perfil) => {
      query.append("perfiles", perfil.id)
    })

    return request("GET", `/personas-colaboradoras?${query}`)
  }

  test("el listado paginado de personas devuelve cada una con su id y sin el valor de sus medios de contacto", async () => {
    const pagina = await request(
      "GET",
      `/personas-colaboradoras?habilidades=${habilidades.python.id}&limit=5`,
    )

    expect(pagina.metadata).toEqual({ page: 1, limit: 5, total: 1 })
    expect(pagina.data).toEqual([
      expect.objectContaining({
        id: personas.sol.id,
        mediosDeContacto: [{ id: expect.any(String), tipo: "EMAIL" }],
      }),
    ])
    expect(pagina.data[0]).not.toHaveProperty("_id")
    expect(pagina.data[0]).not.toHaveProperty("__v")
  })

  test("devuelve las personas con alguna habilidad requerida y su coincidencia, sin el valor de sus medios de contacto", async () => {
    const encontradas = (await colaboradores(proyectos.web.perfil)).data

    expect(encontradas).toEqual([
      expect.objectContaining({
        id: personas.ana.id,
        habilidades: [habilidades.javascript, habilidades.react],
        coincidencia: "TOTAL",
        habilidadesRequeridasFaltantes: [],
        habilidadesOpcionalesCubiertas: 0,
      }),
      expect.objectContaining({
        id: personas.lucho.id,
        coincidencia: "PARCIAL",
        habilidadesCoincidentes: [habilidades.javascript.id],
        habilidadesRequeridasFaltantes: [habilidades.react.id],
      }),
    ])
    expect(encontradas[0].mediosDeContacto).toEqual([
      { id: expect.any(String), tipo: "EMAIL" },
    ])
    expect(
      (await colaboradores(proyectos.mapa.perfil)).data.map(
        (persona) => persona.id,
      ),
    ).toEqual([personas.ana.id, personas.lucho.id])
  })

  test("no sugiere a quienes ya están inscriptos en el proyecto", async () => {
    await PostulacionModel.create({
      personaColaboradora: personas.lucho.id,
      perfil: proyectos.mapa.perfil.id,
      fechaPostulacion: new Date(),
    })

    expect(
      (await colaboradores(proyectos.mapa.perfil)).data.map(
        (persona) => persona.id,
      ),
    ).toEqual([personas.ana.id])
  })

  test("responde 409 si el proyecto está cerrado", async () => {
    await request(
      "GET",
      `/personas-colaboradoras?perfiles=${proyectos.cerrado.perfil.id}`,
      undefined,
      409,
    )
  })

  test("responde 404 si el perfil no existe", async () => {
    await request(
      "GET",
      "/personas-colaboradoras?perfiles=64f1a2b3c4d5e6f7a8b9cfff",
      undefined,
      404,
    )
  })

  test("responde 400 si el id del perfil es inválido", async () => {
    await request("GET", "/personas-colaboradoras?perfiles=abc", undefined, 400)
  })
})

describe("postulación a un perfil", () => {
  test("puede registrar una postulación a un perfil cubierto", async () => {
    const postulacion = await PostulacionModel.create({
      personaColaboradora: personas.ana.id,
      perfil: proyectos.mapa.perfil.id,
      fechaPostulacion: new Date(),
    })
    expect(postulacion).toBeDefined()
  })
})
