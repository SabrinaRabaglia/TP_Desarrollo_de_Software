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
  const colaboradores = (...perfiles) => {
    const query = new URLSearchParams()

    perfiles.forEach((perfil) => {
      query.append("perfiles", perfil.id)
    })

    return request("GET", `/personas-colaboradoras?${query}`)
  }

  test("devuelve las personas con todas las habilidades requeridas, sin sus medios de contacto", async () => {
    const encontradas = await colaboradores(proyectos.web.perfil)

    expect(encontradas).toEqual([
      expect.objectContaining({
        id: personas.ana.id,
        habilidades: [habilidades.javascript, habilidades.react],
      }),
    ])
    expect(encontradas[0]).not.toHaveProperty("mediosDeContacto")
    expect(
      (await colaboradores(proyectos.mapa.perfil)).map((persona) => persona.id),
    ).toEqual([personas.ana.id, personas.lucho.id])
  })

  test("no sugiere a quienes ya están inscriptos en el proyecto", async () => {
    await request(
      "POST",
      "/colaboraciones",
      {
        personaColaboradoraId: personas.lucho.id,
        proyectoId: proyectos.mapa.id,
      },
      201,
    )

    expect(
      (await colaboradores(proyectos.mapa.perfil)).map((persona) => persona.id),
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

describe("inscripción según la consigna", () => {
  test("alcanza con tener al menos una de las habilidades requeridas, aunque la búsqueda no la sugiera", async () => {
    await request(
      "POST",
      "/colaboraciones",
      {
        personaColaboradoraId: personas.lucho.id,
        proyectoId: proyectos.web.id,
      },
      201,
    )
  })
})
