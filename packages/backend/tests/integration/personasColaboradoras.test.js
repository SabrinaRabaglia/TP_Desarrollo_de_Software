import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import AuthService from "../../src/services/AuthService.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../src/repositories/UsuarioRepository.js"
import PersonaColaboradoraModel from "../../src/schemas/personaColaboradoraSchema.js"
import { conectar, desconectar } from "./mongo.js"

let server
let base

beforeAll(async () => {
  await conectar("personasColaboradoras")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`
}, 30000)

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

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

const login = (email) =>
  request("POST", "/auth/login", { email, contrasena: "secreto123" })

const registrarConSesion = async (email, persona) => {
  const usuario = await request(
    "POST",
    "/auth/registro/persona-colaboradora",
    { email, contrasena: "secreto123", persona },
    201,
  )
  return {
    persona: await request(
      "GET",
      `/personas-colaboradoras/${usuario.entidad.id}`,
    ),
    token: (await login(email)).token,
  }
}

const mediosGuardados = async (id) =>
  (await PersonaColaboradoraModel.findById(id))
    .toObject()
    .mediosDeContacto.map(({ tipo, valor }) => ({ tipo, valor }))

const sinValores = (persona) => {
  expect(persona.mediosDeContacto).toEqual(
    persona.mediosDeContacto.map(({ id, tipo }) => ({ id, tipo })),
  )
}

describe("medios de contacto de las personas colaboradoras", () => {
  const mediosDeContacto = [
    { tipo: "EMAIL", valor: "ana@example.com" },
    { tipo: "WHATSAPP", valor: "+54 9 11 1234-5678" },
  ]

  test("se guardan y las respuestas solo exponen su id y tipo, nunca el valor", async () => {
    const persona = await request(
      "POST",
      "/personas-colaboradoras",
      {
        nombreFantasia: "anag",
        aceptaMensajeriaInterna: true,
        mediosDeContacto,
      },
      201,
    )

    expect(persona.aceptaMensajeriaInterna).toBe(true)
    expect(persona.mediosDeContacto).toEqual([
      { id: expect.any(String), tipo: "EMAIL" },
      { id: expect.any(String), tipo: "WHATSAPP" },
    ])
    sinValores(await request("GET", `/personas-colaboradoras/${persona.id}`))

    for (const listada of (await request("GET", "/personas-colaboradoras"))
      .data) {
      sinValores(listada)
    }
    expect(await mediosGuardados(persona.id)).toEqual(mediosDeContacto)
  })

  test("un PUT sin medios los conserva y uno con una lista vacía los borra", async () => {
    const { persona, token } = await registrarConSesion("lucho@persona.test", {
      nombreFantasia: "lucho",
      mediosDeContacto,
    })

    const actualizada = await request(
      "PUT",
      `/personas-colaboradoras/${persona.id}`,
      { nombreFantasia: "lucho", presentacion: "Backend" },
      200,
      token,
    )
    expect(actualizada.presentacion).toBe("Backend")
    expect(await mediosGuardados(persona.id)).toEqual(mediosDeContacto)

    await request(
      "PUT",
      `/personas-colaboradoras/${persona.id}`,
      { nombreFantasia: "lucho", mediosDeContacto: [] },
      200,
      token,
    )
    expect(await mediosGuardados(persona.id)).toEqual([])
  })

  test("un medio con formato inválido responde 422 y no modifica la persona", async () => {
    const { persona, token } = await registrarConSesion("sol@persona.test", {
      nombreFantasia: "sol",
      mediosDeContacto,
    })

    await request(
      "PUT",
      `/personas-colaboradoras/${persona.id}`,
      {
        nombreFantasia: "sol",
        mediosDeContacto: [{ tipo: "SMS", valor: "123" }],
      },
      422,
      token,
    )
    expect(await mediosGuardados(persona.id)).toEqual(mediosDeContacto)
  })

  test("la persona puede borrar un medio por su id, también dos a la vez, y los que no existen responden 404", async () => {
    const { persona, token } = await registrarConSesion("mar@persona.test", {
      nombreFantasia: "mar",
      mediosDeContacto: [
        ...mediosDeContacto,
        { tipo: "SMS", valor: "+54 9 341 456-7890" },
      ],
    })
    const [email, whatsapp, sms] = persona.mediosDeContacto
    const medios = `/personas-colaboradoras/${persona.id}/medios-de-contacto`
    const borrar = (medio, status) =>
      request("DELETE", `${medios}/${medio}`, undefined, status, token)

    await borrar(email.id, 204)
    expect(
      (await request("GET", `/personas-colaboradoras/${persona.id}`))
        .mediosDeContacto,
    ).toEqual([whatsapp, sms])

    await Promise.all([borrar(whatsapp.id, 204), borrar(sms.id, 204)])
    expect(await mediosGuardados(persona.id)).toEqual([])

    await borrar(email.id, 404)
    await borrar("abc", 400)
  })

  test("un medio TELEGRAM guarda el chat id y rechaza un usuario con arroba", async () => {
    const telegram = [{ tipo: "TELEGRAM", valor: "987654321" }]
    const persona = await request(
      "POST",
      "/personas-colaboradoras",
      { nombreFantasia: "tele", mediosDeContacto: telegram },
      201,
    )

    expect(persona.mediosDeContacto).toEqual([
      { id: expect.any(String), tipo: "TELEGRAM" },
    ])
    expect(await mediosGuardados(persona.id)).toEqual(telegram)
    await request(
      "POST",
      "/personas-colaboradoras",
      {
        nombreFantasia: "tele2",
        mediosDeContacto: [{ tipo: "TELEGRAM", valor: "@usuario" }],
      },
      422,
    )
  })
})

describe("edición y baja del propio perfil", () => {
  let ana
  let lucho
  let tokenDeHuerta

  const editar = (persona, cambios, status, token) =>
    request(
      "PUT",
      `/personas-colaboradoras/${persona.id}`,
      { nombreFantasia: persona.nombreFantasia, ...cambios },
      status,
      token,
    )

  const guardada = (persona) =>
    request("GET", `/personas-colaboradoras/${persona.id}`)

  beforeAll(async () => {
    ana = await registrarConSesion("ana@persona.test", {
      nombreFantasia: "anag",
      presentacion: "Frontend",
      mediosDeContacto: [{ tipo: "EMAIL", valor: "ana@example.com" }],
    })
    lucho = await registrarConSesion("lucho_dev@persona.test", {
      nombreFantasia: "lucho_dev",
      presentacion: "Backend",
      mediosDeContacto: [{ tipo: "EMAIL", valor: "lucho@example.com" }],
    })

    const colectivo = await request(
      "POST",
      "/colectivos",
      { nombre: "Huerta", descripcion: "Huertas urbanas", tipo: "ONG" },
      201,
    )
    await new AuthService(
      new UsuarioRepository(),
      new ColectivoRepository(),
      new PersonaColaboradoraRepository(),
    ).registrar({
      email: "huerta@colectivo.test",
      contrasena: "secreto123",
      rol: "COLECTIVO",
      entidad: colectivo.id,
    })
    tokenDeHuerta = (await login("huerta@colectivo.test")).token
  })

  test("la persona edita su perfil y el cambio queda guardado", async () => {
    const actualizada = await editar(
      ana.persona,
      { presentacion: "Frontend y accesibilidad" },
      200,
      ana.token,
    )

    expect(actualizada.presentacion).toBe("Frontend y accesibilidad")
    expect((await guardada(ana.persona)).presentacion).toBe(
      "Frontend y accesibilidad",
    )
  })

  test("al editar, un medio que viaja con su id lo conserva y uno nuevo recibe otro", async () => {
    const [existente] = (await guardada(lucho.persona)).mediosDeContacto

    const actualizada = await editar(
      lucho.persona,
      {
        mediosDeContacto: [
          { id: existente.id, tipo: "EMAIL", valor: "lucho@example.com" },
          { tipo: "TELEGRAM", valor: "987654321" },
        ],
      },
      200,
      lucho.token,
    )

    const [conservado, nuevo] = actualizada.mediosDeContacto
    expect(conservado).toEqual(existente)
    expect(nuevo).toEqual({ id: expect.any(String), tipo: "TELEGRAM" })
    expect(nuevo.id).not.toBe(existente.id)
    expect((await guardada(lucho.persona)).mediosDeContacto).toEqual([
      conservado,
      nuevo,
    ])
  })

  test("no puede editar a otra persona y la otra queda como estaba", async () => {
    const antes = await guardada(lucho.persona)

    await editar(lucho.persona, { presentacion: "Hackeado" }, 403, ana.token)

    expect(await guardada(lucho.persona)).toEqual(antes)
  })

  test("sin token no se puede editar", async () => {
    await editar(ana.persona, { presentacion: "Anónimo" }, 401)
  })

  test("un colectivo no puede editar a una persona", async () => {
    await editar(ana.persona, { presentacion: "Colectivo" }, 403, tokenDeHuerta)
  })

  test("la persona borra un medio propio pero no uno ajeno", async () => {
    const [deAna] = (await guardada(ana.persona)).mediosDeContacto
    const [deLucho] = (await guardada(lucho.persona)).mediosDeContacto
    const borrarMedio = (persona, medio, token, status) =>
      request(
        "DELETE",
        `/personas-colaboradoras/${persona.id}/medios-de-contacto/${medio.id}`,
        undefined,
        status,
        token,
      )

    await borrarMedio(lucho.persona, deLucho, ana.token, 403)
    await borrarMedio(ana.persona, deAna, ana.token, 204)

    expect((await guardada(ana.persona)).mediosDeContacto).toEqual([])
    expect((await guardada(lucho.persona)).mediosDeContacto).toContainEqual(
      deLucho,
    )
  })

  test("no puede borrar a otra persona, que sigue existiendo", async () => {
    await request(
      "DELETE",
      `/personas-colaboradoras/${lucho.persona.id}`,
      undefined,
      403,
      ana.token,
    )

    expect((await guardada(lucho.persona)).id).toBe(lucho.persona.id)
  })

  test("al borrarse a sí misma desaparecen su perfil y su usuario", async () => {
    await request(
      "DELETE",
      `/personas-colaboradoras/${ana.persona.id}`,
      undefined,
      204,
      ana.token,
    )

    await request(
      "POST",
      "/auth/login",
      { email: "ana@persona.test", contrasena: "secreto123" },
      401,
    )
    await request(
      "GET",
      `/personas-colaboradoras/${ana.persona.id}`,
      undefined,
      404,
    )
  })
})
