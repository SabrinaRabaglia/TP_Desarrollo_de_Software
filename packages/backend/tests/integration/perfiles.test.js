import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import { firmar } from "../../src/auth/tokens.js"
import ProyectoModel from "../../src/schemas/proyectoSchema.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base
let colectivo
let token
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
  token = tokenDe("COLECTIVO", colectivo.id)
  datos = {
    nombre: "Tester",
    descripcion: "Testing E2E con Cypress",
    unidadCompromiso: "HORAS_MENSUALES",
    cantidadHoras: 5,
    modalidadesColaboracion: ["GRATUITA"],
    habilidadesRequeridas: [habilidades.cypress.id],
    habilidadesOpcionales: [habilidades.soapUi.id],
  }
}, 30000)

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

const tokenDe = (rol, entidad) =>
  firmar({ id: "64f1a2b3c4d5e6f7a8b9c0aa", rol, entidad })

// Los pedidos van como el colectivo dueño de los proyectos, salvo que se
// indique otro token (null: sin sesión).
const enviar = (method, path, body, como = token) =>
  fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(como ? { Authorization: `Bearer ${como}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const request = async (method, path, body, status = 200) => {
  const response = await enviar(method, path, body)
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
    expect(perfil).toEqual({
      id: expect.any(String),
      ...datos,
      limiteColaboraciones: null,
      postulacionesAceptadas: [],
      busquedaAbierta: true,
      busquedaAbiertaHasta: null,
    })
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
    expect(editado).toEqual({
      id: perfil.id,
      ...cambios,
      limiteColaboraciones: null,
      postulacionesAceptadas: [],
      busquedaAbierta: true,
      busquedaAbiertaHasta: null,
    })
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

  test("editar un perfil con colaboraciones no las pierde ni deja bajar el límite", async () => {
    const proyecto = await crearProyecto("Proyecto con colaboraciones")
    const perfiles = `/proyectos/${proyecto.id}/perfiles`
    const perfil = await request(
      "POST",
      perfiles,
      { ...datos, limiteColaboraciones: 2 },
      201,
    )
    const aceptadas = ["64f1a2b3c4d5e6f7a8b9c001", "64f1a2b3c4d5e6f7a8b9c002"]
    await ProyectoModel.updateOne(
      { "perfiles._id": perfil.id },
      { $set: { "perfiles.$.postulacionesAceptadas": aceptadas } },
    )

    const rechazo = await request(
      "PATCH",
      `${perfiles}/${perfil.id}`,
      { limiteColaboraciones: 1 },
      409,
    )
    expect(rechazo.message).toBe(
      "El límite no puede ser menor a las colaboraciones ya aceptadas (2).",
    )

    const editado = await request("PATCH", `${perfiles}/${perfil.id}`, {
      descripcion: "Con más lugar",
      limiteColaboraciones: 3,
    })
    expect(editado).toEqual({
      ...perfil,
      descripcion: "Con más lugar",
      limiteColaboraciones: 3,
      postulacionesAceptadas: aceptadas,
    })

    const reemplazado = await request("PUT", `${perfiles}/${perfil.id}`, {
      ...datos,
      limiteColaboraciones: 2,
    })
    expect(reemplazado.postulacionesAceptadas).toEqual(aceptadas)
  })

  test("cerrar la búsqueda de un perfil y ponerle fecha límite", async () => {
    const proyecto = await crearProyecto("Proyecto con búsqueda")
    const ruta = `/proyectos/${proyecto.id}/perfiles`
    const perfil = await request("POST", ruta, datos, 201)

    const cerrado = await request("PATCH", `${ruta}/${perfil.id}`, {
      busquedaAbierta: false,
    })
    expect(cerrado).toEqual({ ...perfil, busquedaAbierta: false })

    const conFecha = await request("PATCH", `${ruta}/${perfil.id}`, {
      busquedaAbierta: true,
      busquedaAbiertaHasta: "2999-12-31",
    })
    expect(conFecha.busquedaAbiertaHasta).toBe("2999-12-31T00:00:00.000Z")
  })

  test("rechaza límites, horas y fechas inválidas con un mensaje que lo explica", async () => {
    const proyecto = await crearProyecto("Proyecto datos inválidos")
    const ruta = `/proyectos/${proyecto.id}/perfiles`

    const invalido = async (cambios, status) =>
      (await request("POST", ruta, { ...datos, ...cambios }, status)).message

    expect(await invalido({ limiteColaboraciones: -1 }, 422)).toBe(
      "El límite de colaboraciones debe ser un entero positivo.",
    )
    expect(await invalido({ cantidadHoras: -5 }, 422)).toBe(
      "La cantidad de horas debe ser un entero positivo.",
    )
    expect(await invalido({ habilidadesRequeridas: [] }, 422)).toBe(
      "El perfil debe tener al menos una habilidad requerida.",
    )
    expect(await invalido({ busquedaAbiertaHasta: "2020-01-01" }, 422)).toBe(
      "La fecha límite de búsqueda no puede ser anterior a la actual.",
    )
    expect(await invalido({ limiteColaboraciones: "dos" }, 400)).toBe(
      "Datos inválidos",
    )
    expect(await invalido({ busquedaAbiertaHasta: "mañana" }, 400)).toBe(
      "Datos inválidos",
    )
    expect(await request("GET", ruta)).toEqual([])
  })

  test("solo el colectivo dueño del proyecto escribe sus perfiles", async () => {
    const proyecto = await crearProyecto("Proyecto con dueño")
    const ruta = `/proyectos/${proyecto.id}/perfiles`
    const perfil = await request("POST", ruta, datos, 201)
    const otroColectivo = tokenDe("COLECTIVO", "64f1a2b3c4d5e6f7a8b9c0bb")
    const persona = tokenDe("PERSONA_COLABORADORA", "64f1a2b3c4d5e6f7a8b9c0cc")
    const cambios = { descripcion: "Cambiado por otro" }

    const intentos = (como) =>
      Promise.all([
        enviar("POST", ruta, datos, como),
        enviar("PUT", `${ruta}/${perfil.id}`, { ...datos, ...cambios }, como),
        enviar("PATCH", `${ruta}/${perfil.id}`, cambios, como),
        enviar("DELETE", `${ruta}/${perfil.id}`, undefined, como),
      ]).then((respuestas) => respuestas.map((respuesta) => respuesta.status))

    expect(await intentos(null)).toEqual([401, 401, 401, 401])
    expect(await intentos(persona)).toEqual([403, 403, 403, 403])
    expect(await intentos(otroColectivo)).toEqual([403, 403, 403, 403])
    expect(await request("GET", ruta)).toEqual([perfil])
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
        {
          ...datos,
          id: segundo.id,
          descripcion: "Editado",
          limiteColaboraciones: null,
          postulacionesAceptadas: [],
          busquedaAbierta: true,
          busquedaAbiertaHasta: null,
        },
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
