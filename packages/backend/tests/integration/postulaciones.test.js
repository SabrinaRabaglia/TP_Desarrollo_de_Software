import { afterAll, beforeAll, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import PostulacionModel from "../../src/schemas/postulacionSchema.js"
import ProvinciaModel from "../../src/schemas/provinciaSchema.js"
import { conectar, desconectar } from "./mongo.js"
import { tokenDeColectivo } from "./tokens.js"

beforeAll(() => conectar("postulaciones"), 30000)
afterAll(desconectar)

test("postularse permite consultar y actualizar las entidades persistidas", async () => {
  const server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  const base = `http://127.0.0.1:${server.address().port}`
  const request = async (method, path, body, status = 200, headers = {}) => {
    const response = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    expect(response.status).toBe(status)
    return response.json()
  }

  try {
    const habilidad = await request(
      "POST",
      "/habilidades",
      {
        titulo: "Rust",
        codigo: "rust",
        descripcion: "Desarrollo de sistemas",
      },
      201,
    )
    const cordoba = await ProvinciaModel.findOne({ nombre: "Córdoba" })
    const colectivoDatos = {
      nombre: "Colectivo HTTP",
      descripcion: "Desarrollo comunitario",
      tipo: "ONG",
      provincia: cordoba.id,
    }
    const colectivo = await request("POST", "/colectivos", colectivoDatos, 201)
    const personaDatos = {
      nombreFantasia: "Ana HTTP",
      habilidades: [habilidad.id],
    }
    const credenciales = { email: "ana@persona.test", contrasena: "secreto123" }
    const usuarioDePersona = await request(
      "POST",
      "/auth/registro/persona-colaboradora",
      { ...credenciales, persona: personaDatos },
      201,
    )
    const persona = await request(
      "GET",
      `/personas-colaboradoras/${usuarioDePersona.entidad.id}`,
    )
    const { token } = await request("POST", "/auth/login", credenciales)
    const proyectoDatos = {
      titulo: "Proyecto HTTP",
      descripcion: "Desarrollo web",
      colectivo: colectivo.id,
      estado: "PUBLICADO",
      fechaCierre: null,
    }
    let proyecto = await request("POST", "/proyectos", proyectoDatos, 201)
    const perfil = await request(
      "POST",
      `/proyectos/${proyecto.id}/perfiles`,
      {
        descripcion: "Desarrollador/a Rust",
        unidadCompromiso: "HORAS_TOTALES",
        cantidadHoras: 5,
        modalidadesColaboracion: ["GRATUITA"],
        habilidadesRequeridas: [habilidad.id],
        habilidadesOpcionales: [habilidad.id],
      },
      201,
      { Authorization: `Bearer ${tokenDeColectivo(colectivo.id)}` },
    )
    proyecto = await request("GET", `/proyectos/${proyecto.id}`)
    const postulacion = await request(
      "POST",
      `/proyectos/${proyecto.id}/perfiles/${perfil.id}/postulaciones`,
      { esAnonima: false },
      201,
      { Authorization: `Bearer ${token}` },
    )
    expect(postulacion).toEqual({
      id: expect.any(String),
      fechaPostulacion: expect.any(String),
      fechaRevision: null,
      estado: "PENDIENTE",
      fechaBaja: null,
      origenBaja: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      esAnonima: false,
      personaColaboradora: {
        id: persona.id,
        nombreFantasia: persona.nombreFantasia,
      },
      perfil: perfil.id,
    })
    const credencialesAnonima = {
      email: "anonima@persona.test",
      contrasena: "secreto123",
    }
    const usuarioAnonimo = await request(
      "POST",
      "/auth/registro/persona-colaboradora",
      {
        ...credencialesAnonima,
        persona: { ...personaDatos, nombreFantasia: "Persona anónima" },
      },
      201,
    )
    const { token: tokenAnonimo } = await request(
      "POST",
      "/auth/login",
      credencialesAnonima,
    )
    const anonima = await request(
      "POST",
      `/proyectos/${proyecto.id}/perfiles/${perfil.id}/postulaciones`,
      { esAnonima: true },
      201,
      { Authorization: `Bearer ${tokenAnonimo}` },
    )
    expect(anonima).toEqual({
      ...postulacion,
      id: expect.any(String),
      fechaPostulacion: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      esAnonima: true,
      personaColaboradora: null,
    })
    const guardada = await PostulacionModel.findById(anonima.id)
    expect(guardada.personaColaboradora.toString()).toBe(
      usuarioAnonimo.entidad.id,
    )
    const misPostulaciones = await request(
      "GET",
      "/postulaciones",
      undefined,
      200,
      { Authorization: `Bearer ${token}` },
    )
    expect(misPostulaciones).toHaveLength(1)
    expect(misPostulaciones[0]._id).toBe(postulacion.id)

    for (const ruta of [
      `/proyectos/${proyecto.id}`,
      `/personas-colaboradoras/${persona.id}`,
    ]) {
      expect(await request("GET", ruta)).not.toHaveProperty("postulaciones")
    }

    const detalleColectivo = await request("GET", `/colectivos/${colectivo.id}`)
    expect(detalleColectivo.provincia).toEqual({
      id: cordoba.id,
      nombre: "Córdoba",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(detalleColectivo.proyectos).toEqual([proyecto])

    for (const [ruta, id, datos, headers] of [
      ["proyectos", proyecto.id, proyectoDatos],
      [
        "personas-colaboradoras",
        persona.id,
        personaDatos,
        { Authorization: `Bearer ${token}` },
      ],
      ["colectivos", colectivo.id, colectivoDatos],
    ]) {
      const actualizado = await request(
        "PUT",
        `/${ruta}/${id}`,
        datos,
        200,
        headers,
      )
      expect(actualizado.id).toBe(id)
    }
    await request("PATCH", `/colectivos/${colectivo.id}`, {
      descripcion: "Descripción actualizada",
    })

    const cerrado = await request("PATCH", `/proyectos/${proyecto.id}`, {
      estado: "CERRADO",
    })
    expect(cerrado.estado).toBe("CERRADO")
    expect(cerrado.fechaCierre).toEqual(expect.any(String))
    await request(
      "PATCH",
      `/proyectos/${proyecto.id}`,
      { estado: "CERRADO" },
      409,
    )
    await request("PUT", `/proyectos/${proyecto.id}`, proyectoDatos, 409)
    const despues = await request("GET", `/proyectos/${proyecto.id}`)
    expect(despues.estado).toBe("CERRADO")
    expect(despues.fechaCierre).toBe(cerrado.fechaCierre)

    const credencialesOtra = {
      email: "otra@persona.test",
      contrasena: "secreto123",
    }
    await request(
      "POST",
      "/auth/registro/persona-colaboradora",
      {
        ...credencialesOtra,
        persona: { ...personaDatos, nombreFantasia: "Otra persona" },
      },
      201,
    )
    const { token: tokenOtra } = await request(
      "POST",
      "/auth/login",
      credencialesOtra,
    )
    await request(
      "POST",
      `/proyectos/${proyecto.id}/perfiles/${perfil.id}/postulaciones`,
      { esAnonima: false },
      409,
      { Authorization: `Bearer ${tokenOtra}` },
    )

    const borrado = await fetch(`${base}/proyectos/${proyecto.id}`, {
      method: "DELETE",
    })
    expect(borrado.status).toBe(204)
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})
