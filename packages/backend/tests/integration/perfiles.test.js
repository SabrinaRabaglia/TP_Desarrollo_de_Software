import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import ProyectoModel from "../../src/schemas/proyectoSchema.js"
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
},30000)

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

const datosProyecto = (titulo) => ({
  titulo,
  descripcion: "Proyecto con perfiles",
  colectivo: colectivo.id,
  estado: "PUBLICADO",
  fechaCierre: null,
})

const crearProyecto = (titulo) =>
  request("POST", "/proyectos", datosProyecto(titulo), 201)

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

  test("con dos perfiles idénticos, editar uno no toca al otro", async () => {
    const proyecto = await crearProyecto("Perfiles gemelos")
    const perfiles = `/proyectos/${proyecto.id}/perfiles`
    const gemelo = await request("POST", perfiles, datos, 201)
    const perfil = await request("POST", perfiles, datos, 201)

    await request("PUT", `${perfiles}/${perfil.id}`, {
      ...datos,
      descripcion: "Editado",
    })

    expect(await request("GET", perfiles)).toEqual([
      gemelo,
      { ...perfil, descripcion: "Editado" },
    ])
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

describe("cambios simultáneos sobre los perfiles de un proyecto", () => {
  const REPETICIONES = 5
  const enviar = (method, path, body) =>
    fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  const descripciones = async (perfiles) =>
    (await request("GET", perfiles)).map((perfil) => perfil.descripcion).sort()

  test("altas simultáneas guardan todos los perfiles", async () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const proyecto = await crearProyecto(`Altas simultáneas ${i}`)
      const perfiles = `/proyectos/${proyecto.id}/perfiles`
      const nombres = ["A", "B", "C", "D"]

      const respuestas = await Promise.all(
        nombres.map((descripcion) =>
          enviar("POST", perfiles, { ...datos, descripcion }),
        ),
      )

      expect(respuestas.map((r) => r.status)).toEqual([201, 201, 201, 201])
      expect(await descripciones(perfiles)).toEqual(nombres)
    }
  })

  test("un alta y una baja simultáneas aplican las dos", async () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const proyecto = await crearProyecto(`Alta y baja ${i}`)
      const perfiles = `/proyectos/${proyecto.id}/perfiles`
      const aBorrar = await request(
        "POST",
        perfiles,
        { ...datos, descripcion: "Se borra" },
        201,
      )

      const respuestas = await Promise.all([
        enviar("DELETE", `${perfiles}/${aBorrar.id}`),
        enviar("POST", perfiles, { ...datos, descripcion: "Nuevo" }),
      ])

      expect(respuestas.map((r) => r.status)).toEqual([204, 201])
      expect(await descripciones(perfiles)).toEqual(["Nuevo"])
    }
  })

  test("editar un perfil mientras se borra otro modifica el correcto", async () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const proyecto = await crearProyecto(`Edición y baja ${i}`)
      const perfiles = `/proyectos/${proyecto.id}/perfiles`
      const primero = await request(
        "POST",
        perfiles,
        { ...datos, descripcion: "Se borra" },
        201,
      )
      const segundo = await request(
        "POST",
        perfiles,
        { ...datos, descripcion: "Se edita" },
        201,
      )

      const respuestas = await Promise.all([
        enviar("DELETE", `${perfiles}/${primero.id}`),
        enviar("PUT", `${perfiles}/${segundo.id}`, {
          ...datos,
          descripcion: "Editado",
        }),
      ])

      expect(respuestas.map((r) => r.status)).toEqual([204, 200])
      expect(await request("GET", perfiles)).toEqual([
        { ...datos, id: segundo.id, descripcion: "Editado" },
      ])
    }
  })

  test("ediciones simultáneas de perfiles distintos aplican las dos", async () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const proyecto = await crearProyecto(`Ediciones ${i}`)
      const perfiles = `/proyectos/${proyecto.id}/perfiles`
      const uno = await request("POST", perfiles, datos, 201)
      const otro = await request("POST", perfiles, datos, 201)

      const respuestas = await Promise.all([
        enviar("PUT", `${perfiles}/${uno.id}`, {
          ...datos,
          descripcion: "Uno",
        }),
        enviar("PUT", `${perfiles}/${otro.id}`, {
          ...datos,
          descripcion: "Otro",
        }),
      ])

      expect(respuestas.map((r) => r.status)).toEqual([200, 200])
      expect(await descripciones(perfiles)).toEqual(["Otro", "Uno"])
    }
  })
})

describe("perfiles al modificar o borrar el proyecto", () => {
  const crearConPerfiles = async (titulo) => {
    const proyecto = await crearProyecto(titulo)
    const perfiles = `/proyectos/${proyecto.id}/perfiles`
    await request("POST", perfiles, datos, 201)
    await request(
      "POST",
      perfiles,
      { ...datos, descripcion: "Analista de datos" },
      201,
    )
    return { proyecto, perfiles, antes: await request("GET", perfiles) }
  }

  test("PUT y PATCH del proyecto conservan sus perfiles", async () => {
    const { proyecto, perfiles, antes } = await crearConPerfiles("A editar")

    const reemplazado = await request("PUT", `/proyectos/${proyecto.id}`, {
      ...datosProyecto("Editado con PUT"),
      descripcion: "Otra descripción",
    })
    expect(reemplazado.perfiles).toEqual(antes)

    await request("PATCH", `/proyectos/${proyecto.id}`, {
      titulo: "Editado con PATCH",
    })
    expect(await request("GET", perfiles)).toEqual(antes)
  })

  test("el body del proyecto no puede reemplazar sus perfiles", async () => {
    const { proyecto, perfiles, antes } = await crearConPerfiles("Body ajeno")

    await request(
      "PUT",
      `/proyectos/${proyecto.id}`,
      { ...datosProyecto("Body ajeno"), perfiles: [] },
      400,
    )
    await request("PATCH", `/proyectos/${proyecto.id}`, { perfiles: [] }, 400)
    expect(await request("GET", perfiles)).toEqual(antes)
  })

  test("cerrar el proyecto conserva sus perfiles", async () => {
    const { proyecto, perfiles, antes } = await crearConPerfiles("A cerrar")

    await request("PATCH", `/proyectos/${proyecto.id}`, { estado: "CERRADO" })

    expect(await request("GET", perfiles)).toEqual(antes)
  })

  test("borrar el proyecto borra sus perfiles y no toca los de otros", async () => {
    const borrado = await crearConPerfiles("A borrar")
    const otro = await crearConPerfiles("Se queda")
    const [perfil] = borrado.antes

    await request("DELETE", `/proyectos/${borrado.proyecto.id}`, undefined, 204)

    await request("GET", borrado.perfiles, undefined, 404)
    await request("GET", `${borrado.perfiles}/${perfil.id}`, undefined, 404)
    expect(await ProyectoModel.exists({ "perfiles._id": perfil.id })).toBeNull()
    expect(await request("GET", otro.perfiles)).toEqual(otro.antes)
  })
})
