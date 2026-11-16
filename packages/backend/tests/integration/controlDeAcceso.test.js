import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import { conectar, desconectar } from "./mongo.js"
import { tokenDePersona } from "./tokens.js"

let server
let base
let huerta
let otro
const persona = tokenDePersona("64f1a2b3c4d5e6f7a8b9c0cc")

const enviar = (method, path, body, token) =>
  fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const request = async (method, path, body, status = 200, token) => {
  const response = await enviar(method, path, body, token)
  expect(response.status).toBe(status)
  return response.status === 204 ? null : response.json()
}

const estados = async (pedidos) =>
  (await Promise.all(pedidos)).map((respuesta) => respuesta.status)

// Cada colectivo se registra y entra como lo hace desde el front.
const registrarColectivo = async (nombre, email) => {
  const credenciales = { email, contrasena: "secreto123" }
  const usuario = await request(
    "POST",
    "/auth/registro/colectivo",
    {
      ...credenciales,
      colectivo: { nombre, descripcion: "Colectivo de prueba", tipo: "ONG" },
    },
    201,
  )
  const { token } = await request("POST", "/auth/login", credenciales)
  return { id: usuario.entidad.id, token, credenciales }
}

const datosDeProyecto = (titulo, colectivo = huerta) => ({
  titulo,
  descripcion: "Proyecto de prueba",
  colectivo: colectivo.id,
  estado: "PUBLICADO",
  fechaCierre: null,
})

const crearProyecto = (titulo) =>
  request("POST", "/proyectos", datosDeProyecto(titulo), 201, huerta.token)

beforeAll(async () => {
  await conectar("controlDeAcceso")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  huerta = await registrarColectivo(
    "Huerta Comunitaria Sur",
    "huerta@colectivo.test",
  )
  otro = await registrarColectivo("Otro colectivo", "otro@colectivo.test")
}, 30000)

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

describe("colectivos", () => {
  const datos = {
    nombre: "Huerta Comunitaria Sur",
    descripcion: "Huertas urbanas en el sur",
    tipo: "ONG",
  }

  test("sin sesión, una persona u otro colectivo no lo editan ni lo borran", async () => {
    const ruta = `/colectivos/${huerta.id}`
    const antes = await request("GET", ruta)

    const intentos = (como) =>
      estados([
        enviar("PUT", ruta, datos, como),
        enviar("PATCH", ruta, { ciudad: "Lanús" }, como),
        enviar("DELETE", ruta, undefined, como),
      ])

    expect(await intentos(null)).toEqual([401, 401, 401])
    expect(await intentos(persona)).toEqual([403, 403, 403])
    expect(await intentos(otro.token)).toEqual([403, 403, 403])
    expect(await request("GET", ruta)).toEqual(antes)
  })

  test("el propio colectivo edita sus datos y cualquiera los lee", async () => {
    const ruta = `/colectivos/${huerta.id}`

    const reemplazado = await request("PUT", ruta, datos, 200, huerta.token)
    expect(reemplazado.descripcion).toBe("Huertas urbanas en el sur")
    const modificado = await request(
      "PATCH",
      ruta,
      { ciudad: "Lanús" },
      200,
      huerta.token,
    )
    expect(modificado.ciudad).toBe("Lanús")

    expect(await request("GET", ruta)).toMatchObject({
      descripcion: "Huertas urbanas en el sur",
      ciudad: "Lanús",
    })
  })

  test("el propio colectivo se borra y su usuario deja de poder entrar", async () => {
    const efimero = await registrarColectivo(
      "Colectivo efímero",
      "efimero@colectivo.test",
    )

    await request(
      "DELETE",
      `/colectivos/${efimero.id}`,
      undefined,
      204,
      efimero.token,
    )

    await request("GET", `/colectivos/${efimero.id}`, undefined, 404)
    await request("POST", "/auth/login", efimero.credenciales, 401)
  })
})

describe("proyectos", () => {
  test("solo un colectivo con sesión crea proyectos, y solo a su nombre", async () => {
    const rechazados = [
      ["Sin sesión", huerta, null, 401],
      ["De una persona", huerta, persona, 403],
      ["A nombre de otro", huerta, otro.token, 403],
      ["Para otro", otro, huerta.token, 403],
    ]

    expect(
      await estados(
        rechazados.map(([titulo, colectivo, como]) =>
          enviar(
            "POST",
            "/proyectos",
            datosDeProyecto(titulo, colectivo),
            como,
          ),
        ),
      ),
    ).toEqual(rechazados.map(([, , , status]) => status))
    const creado = await crearProyecto("Sitio de la huerta")

    const titulos = (await request("GET", "/proyectos?limit=50")).data.map(
      (proyecto) => proyecto.titulo,
    )
    expect(titulos).toContain("Sitio de la huerta")
    for (const [titulo] of rechazados) {
      expect(titulos).not.toContain(titulo)
    }
    expect(creado.colectivo).toBe(huerta.id)
  })

  test("sin sesión, una persona u otro colectivo no lo editan ni lo borran", async () => {
    const proyecto = await crearProyecto("Proyecto con dueño")
    const ruta = `/proyectos/${proyecto.id}`

    const intentos = (como) =>
      estados([
        enviar("PUT", ruta, datosDeProyecto("Tomado"), como),
        enviar("PATCH", ruta, { titulo: "Tomado" }, como),
        enviar("DELETE", ruta, undefined, como),
      ])

    expect(await intentos(null)).toEqual([401, 401, 401])
    expect(await intentos(persona)).toEqual([403, 403, 403])
    expect(await intentos(otro.token)).toEqual([403, 403, 403])
    expect(await request("GET", ruta)).toEqual(proyecto)
  })

  test("otro colectivo no se lo queda poniéndolo a su nombre, ni el dueño se lo pasa", async () => {
    const proyecto = await crearProyecto("Proyecto codiciado")
    const ruta = `/proyectos/${proyecto.id}`
    const aNombreDeOtro = datosDeProyecto("Proyecto codiciado", otro)

    expect(
      await estados([
        enviar("PUT", ruta, aNombreDeOtro, otro.token),
        enviar("PATCH", ruta, { colectivo: otro.id }, otro.token),
        enviar("PUT", ruta, aNombreDeOtro, huerta.token),
        enviar("PATCH", ruta, { colectivo: otro.id }, huerta.token),
      ]),
    ).toEqual([403, 403, 403, 403])
    expect(await request("GET", ruta)).toEqual(proyecto)
  })

  test("el colectivo dueño lo edita y lo borra", async () => {
    const proyecto = await crearProyecto("Proyecto propio")
    const ruta = `/proyectos/${proyecto.id}`

    const modificado = await request(
      "PATCH",
      ruta,
      { descripcion: "Con otra descripción" },
      200,
      huerta.token,
    )
    expect(modificado.descripcion).toBe("Con otra descripción")
    const reemplazado = await request(
      "PUT",
      ruta,
      datosDeProyecto("Proyecto propio renombrado"),
      200,
      huerta.token,
    )
    expect(reemplazado.titulo).toBe("Proyecto propio renombrado")
    expect(await request("GET", ruta)).toEqual(reemplazado)

    await request("DELETE", ruta, undefined, 204, huerta.token)
    await request("GET", ruta, undefined, 404)
  })
})

describe("hitos", () => {
  const datos = {
    fecha: new Date().toISOString().slice(0, 10),
    porcentajeConcrecion: 40,
    descripcion: "Primera entrega",
  }

  test("sin sesión, una persona u otro colectivo no los escriben, pero cualquiera los lee", async () => {
    const proyecto = await crearProyecto("Proyecto con hitos")
    const ruta = `/proyectos/${proyecto.id}/hitos`
    const hito = await request("POST", ruta, datos, 201, huerta.token)

    const intentos = (como) =>
      estados([
        enviar("POST", ruta, datos, como),
        enviar(
          "PATCH",
          `/hitos/${hito.id}`,
          { porcentajeConcrecion: 90 },
          como,
        ),
        enviar("DELETE", `/hitos/${hito.id}`, undefined, como),
      ])

    expect(await intentos(null)).toEqual([401, 401, 401])
    expect(await intentos(persona)).toEqual([403, 403, 403])
    expect(await intentos(otro.token)).toEqual([403, 403, 403])
    expect(await request("GET", ruta)).toEqual([hito])
  })

  test("el colectivo dueño del proyecto los edita y los borra", async () => {
    const proyecto = await crearProyecto("Proyecto con avances")
    const ruta = `/proyectos/${proyecto.id}/hitos`
    const hito = await request("POST", ruta, datos, 201, huerta.token)

    const editado = await request(
      "PATCH",
      `/hitos/${hito.id}`,
      { porcentajeConcrecion: 90 },
      200,
      huerta.token,
    )
    expect(editado.porcentajeConcrecion).toBe(90)
    expect(await request("GET", ruta)).toEqual([editado])

    await request("DELETE", `/hitos/${hito.id}`, undefined, 204, huerta.token)
    expect(await request("GET", ruta)).toEqual([])
  })
})
