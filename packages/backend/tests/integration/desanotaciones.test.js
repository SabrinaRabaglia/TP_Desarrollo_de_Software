import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import AuthService from "../../src/services/AuthService.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../src/repositories/UsuarioRepository.js"
import { conectar, desconectar } from "./mongo.js"
import { tokenDeColectivo } from "./tokens.js"

// Contra Mongo real: la postulación guarda la persona y el perfil como
// ObjectId, y la pertenencia se compara contra el id que trae el token.
let server
let base
let proyecto
let perfil
const sesiones = {}
const postulaciones = {}

const enviar = async (method, path, token) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: method === "POST" ? JSON.stringify({ esAnonima: false }) : undefined,
  })
  return { status: response.status, body: await response.json() }
}

const iniciarSesion = async (email) => {
  const response = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena: "secreto123" }),
  })
  const { token, usuario } = await response.json()
  return { token, entidadId: usuario.entidad.id }
}

const crearConJson = async (path, body, token) => {
  const response = await fetch(base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  return await response.json()
}

const crearColectivoConUsuario = async (nombre, email) => {
  const colectivo = await crearConJson("/colectivos", {
    nombre,
    descripcion: "Colectivo de prueba",
    tipo: "ONG",
  })
  await new AuthService(
    new UsuarioRepository(),
    new ColectivoRepository(),
    new PersonaColaboradoraRepository(),
  ).registrar({
    email,
    contrasena: "secreto123",
    rol: "COLECTIVO",
    entidad: colectivo.id,
  })
  return colectivo
}

const token = (quien) => sesiones[quien].token

const postularse = (quien) =>
  enviar(
    "POST",
    `/proyectos/${proyecto.id}/perfiles/${perfil.id}/postulaciones`,
    token(quien),
  )

const darDeBaja = (postulacion, quien) =>
  enviar("PATCH", `/postulaciones/${postulacion}/baja`, quien && token(quien))

const colaboradores = async () =>
  (
    await enviar(
      "GET",
      `/proyectos/${proyecto.id}/perfiles/${perfil.id}/colaboradores`,
    )
  ).body.map((colaboradora) => colaboradora.nombreFantasia)

const contactoDe = (quien) =>
  enviar(
    "GET",
    `/personas-colaboradoras/${sesiones[quien].entidadId}/medios-de-contacto`,
    token("huerta"),
  )

beforeAll(async () => {
  await conectar("desanotaciones")
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`

  const {
    body: [habilidad],
  } = await enviar("GET", "/habilidades")
  const huerta = await crearColectivoConUsuario(
    "Huerta Comunitaria Sur",
    "huerta@colectivo.test",
  )
  await crearColectivoConUsuario("Otro colectivo", "otro@colectivo.test")
  for (const nombreFantasia of ["ana", "lucho", "caro"]) {
    await crearConJson("/auth/registro/persona-colaboradora", {
      email: `${nombreFantasia}@persona.test`,
      contrasena: "secreto123",
      persona: { nombreFantasia, habilidades: [habilidad.id] },
    })
  }

  proyecto = await crearConJson(
    "/proyectos",
    {
      titulo: "Sitio web de la huerta",
      descripcion: "Calendario de talleres",
      colectivo: huerta.id,
      estado: "PUBLICADO",
      fechaCierre: null,
    },
    tokenDeColectivo(huerta.id),
  )
  perfil = await crearConJson(
    `/proyectos/${proyecto.id}/perfiles`,
    {
      nombre: "Frontend",
      descripcion: "Desarrollo web",
      unidadCompromiso: "HORAS_TOTALES",
      cantidadHoras: 5,
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: [habilidad.id],
      habilidadesOpcionales: [habilidad.id],
    },
    tokenDeColectivo(huerta.id),
  )

  for (const [quien, email] of [
    ["huerta", "huerta@colectivo.test"],
    ["otro", "otro@colectivo.test"],
    ["ana", "ana@persona.test"],
    ["lucho", "lucho@persona.test"],
    ["caro", "caro@persona.test"],
  ]) {
    sesiones[quien] = await iniciarSesion(email)
  }

  // Ana y Lucho colaboran (aceptadas); Caro queda pendiente.
  for (const quien of ["ana", "lucho", "caro"]) {
    postulaciones[quien] = (await postularse(quien)).body.id
  }
  for (const quien of ["ana", "lucho"]) {
    await enviar(
      "PATCH",
      `/postulaciones/${postulaciones[quien]}/aceptar`,
      token("huerta"),
    )
  }
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

describe("desanotaciones", () => {
  test("sin token no se puede dar de baja", async () => {
    expect((await darDeBaja(postulaciones.ana)).status).toBe(401)
  })

  test("otra persona u otro colectivo no pueden darla de baja", async () => {
    for (const quien of ["caro", "otro"]) {
      expect((await darDeBaja(postulaciones.ana, quien)).status).toBe(403)
    }
    expect(await colaboradores()).toEqual(["ana", "lucho"])
  })

  test("una postulación pendiente no se puede dar de baja", async () => {
    const respuesta = await darDeBaja(postulaciones.caro, "caro")

    expect(respuesta.status).toBe(409)
  })

  test("la persona se da de baja y el colectivo pierde acceso a su contacto", async () => {
    expect((await contactoDe("ana")).status).toBe(200)

    const respuesta = await darDeBaja(postulaciones.ana, "ana")

    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual(
      expect.objectContaining({
        estado: "BAJA",
        origenBaja: "PERSONA_COLABORADORA",
        fechaBaja: expect.any(String),
      }),
    )
    expect(await colaboradores()).toEqual(["lucho"])
    expect((await contactoDe("ana")).status).toBe(403)
  })

  test("el colectivo dueño desanota a una colaboradora", async () => {
    const respuesta = await darDeBaja(postulaciones.lucho, "huerta")

    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual(
      expect.objectContaining({ estado: "BAJA", origenBaja: "COLECTIVO" }),
    )
    expect(await colaboradores()).toEqual([])
    expect((await contactoDe("lucho")).status).toBe(403)
  })

  test("la baja es permanente", async () => {
    expect((await postularse("ana")).status).toBe(409)
    expect(
      (
        await enviar(
          "PATCH",
          `/postulaciones/${postulaciones.ana}/aceptar`,
          token("huerta"),
        )
      ).status,
    ).toBe(409)
    expect((await darDeBaja(postulaciones.ana, "ana")).status).toBe(409)
  })

  test("el colectivo ve en las postulaciones del perfil quién dio la baja y cuándo", async () => {
    const respuesta = await enviar(
      "GET",
      `/proyectos/${proyecto.id}/perfiles/${perfil.id}/postulaciones`,
      token("huerta"),
    )

    expect(respuesta.status).toBe(200)
    const dePersona = (quien) =>
      respuesta.body.find(
        (postulacion) => postulacion._id === postulaciones[quien],
      )
    expect(dePersona("ana")).toEqual(
      expect.objectContaining({
        estado: "BAJA",
        origenBaja: "PERSONA_COLABORADORA",
        fechaBaja: expect.any(String),
      }),
    )
    expect(dePersona("lucho")).toEqual(
      expect.objectContaining({
        estado: "BAJA",
        origenBaja: "COLECTIVO",
        fechaBaja: expect.any(String),
      }),
    )
    expect(dePersona("caro")).toEqual(
      expect.objectContaining({
        estado: "PENDIENTE",
        origenBaja: null,
        fechaBaja: null,
      }),
    )
  })
})
