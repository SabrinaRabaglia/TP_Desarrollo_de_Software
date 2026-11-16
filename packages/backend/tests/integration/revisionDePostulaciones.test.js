import { afterAll, beforeAll, describe, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import AuthService from "../../src/services/AuthService.js"
import ColectivoRepository from "../../src/repositories/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../src/repositories/UsuarioRepository.js"
import { conectar, desconectar } from "./mongo.js"
import { tokenDeColectivo } from "./tokens.js"

// Contra Mongo real: la postulación guarda el perfil como ObjectId, cosa que
// los repositorios falsos no reproducen del todo.
let server
let base
let perfil
let proyecto
const tokens = {}

const enviar = async (method, path, body, token) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, body: await response.json() }
}

const iniciarSesion = async (email) =>
  (await enviar("POST", "/auth/login", { email, contrasena: "secreto123" }))
    .body.token

const crearColectivoConUsuario = async (nombre, email) => {
  const { body: colectivo } = await enviar("POST", "/colectivos", {
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

const postularse = (email, esAnonima = false) =>
  enviar(
    "POST",
    `/proyectos/${proyecto.id}/perfiles/${perfil.id}/postulaciones`,
    { esAnonima },
    tokens[email],
  )

beforeAll(async () => {
  await conectar("revisionDePostulaciones")
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
  for (const [email, nombreFantasia] of [
    ["ana@persona.test", "anag"],
    ["lucho@persona.test", "lucho_dev"],
    ["caro@persona.test", "caro"],
  ]) {
    await enviar("POST", "/auth/registro/persona-colaboradora", {
      email,
      contrasena: "secreto123",
      persona: { nombreFantasia, habilidades: [habilidad.id] },
    })
  }

  proyecto = (
    await enviar("POST", "/proyectos", {
      titulo: "Sitio web de la huerta",
      descripcion: "Calendario de talleres",
      colectivo: huerta.id,
      estado: "PUBLICADO",
      fechaCierre: null,
    })
  ).body
  perfil = (
    await enviar(
      "POST",
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
  ).body

  for (const email of [
    "huerta@colectivo.test",
    "otro@colectivo.test",
    "ana@persona.test",
    "lucho@persona.test",
    "caro@persona.test",
  ]) {
    tokens[email] = await iniciarSesion(email)
  }
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await desconectar()
})

describe("revisión de postulaciones", () => {
  test("la persona ve sus postulaciones con el proyecto y el perfil", async () => {
    await postularse("ana@persona.test")

    const respuesta = await enviar(
      "GET",
      "/postulaciones",
      undefined,
      tokens["ana@persona.test"],
    )

    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual([
      expect.objectContaining({
        estado: "PENDIENTE",
        proyecto: { id: proyecto.id, titulo: "Sitio web de la huerta" },
        perfil: { id: perfil.id, nombre: "Frontend" },
      }),
    ])
  })

  test("solo el colectivo dueño del proyecto acepta o rechaza", async () => {
    const { body: postulacion } = await postularse("lucho@persona.test")

    for (const accion of ["aceptar", "rechazar"]) {
      const ajeno = await enviar(
        "PATCH",
        `/postulaciones/${postulacion.id}/${accion}`,
        undefined,
        tokens["otro@colectivo.test"],
      )
      expect(ajeno.status).toBe(403)
    }

    const aceptada = await enviar(
      "PATCH",
      `/postulaciones/${postulacion.id}/aceptar`,
      undefined,
      tokens["huerta@colectivo.test"],
    )
    expect(aceptada.status).toBe(200)
    expect(aceptada.body.estado).toBe("ACEPTADA")

    const { body: colaboradores } = await enviar(
      "GET",
      `/proyectos/${proyecto.id}/perfiles/${perfil.id}/colaboradores`,
    )
    expect(colaboradores).toEqual([
      expect.objectContaining({ nombreFantasia: "lucho_dev" }),
    ])
  })

  test("el colectivo dueño puede rechazar una postulación pendiente", async () => {
    const { body: mias } = await enviar(
      "GET",
      "/postulaciones",
      undefined,
      tokens["ana@persona.test"],
    )

    const rechazada = await enviar(
      "PATCH",
      `/postulaciones/${mias[0]._id ?? mias[0].id}/rechazar`,
      undefined,
      tokens["huerta@colectivo.test"],
    )

    expect(rechazada.status).toBe(200)
    expect(rechazada.body.estado).toBe("RECHAZADA")
  })

  test("el colectivo ve a quien se postuló de forma anónima y sabe que lo es", async () => {
    await postularse("caro@persona.test", true)

    const { status, body } = await enviar(
      "GET",
      `/proyectos/${proyecto.id}/perfiles/${perfil.id}/postulaciones`,
      undefined,
      tokens["huerta@colectivo.test"],
    )

    expect(status).toBe(200)
    const anonimaDe = Object.fromEntries(
      body.map((postulacion) => [
        postulacion.personaColaboradora.nombreFantasia,
        postulacion.esAnonima,
      ]),
    )
    expect(anonimaDe).toEqual({ anag: false, lucho_dev: false, caro: true })
  })
})
