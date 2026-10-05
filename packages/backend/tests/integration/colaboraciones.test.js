import { afterAll, beforeAll, expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"
import ProvinciaModel from "../../src/schemas/provinciaSchema.js"
import { conectar, desconectar } from "./mongo.js"

beforeAll(() => conectar("colaboraciones"))
afterAll(desconectar)

test("inscribir permite consultar y actualizar las entidades persistidas", async () => {
  const server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  const base = `http://127.0.0.1:${server.address().port}`
  const request = async (method, path, body, status = 200) => {
    const response = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
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
    const persona = await request(
      "POST",
      "/personas-colaboradoras",
      personaDatos,
      201,
    )
    const proyectoDatos = {
      titulo: "Proyecto HTTP",
      descripcion: "Desarrollo web",
      unidadCompromiso: "HORAS_TOTALES",
      cantHoras: 5,
      colectivo: colectivo.id,
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: [habilidad.id],
      estado: "PUBLICADO",
      fechaAlta: "2026-09-14T00:00:00.000Z",
      fechaCierre: null,
    }
    const proyecto = await request("POST", "/proyectos", proyectoDatos, 201)
    const colaboracion = await request(
      "POST",
      "/colaboraciones",
      {
        proyectoId: proyecto.id,
        personaColaboradoraId: persona.id,
      },
      201,
    )
    expect(colaboracion).toEqual({
      id: expect.any(String),
      fechaInscripcion: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      personaColaboradora: {
        id: persona.id,
        nombreFantasia: persona.nombreFantasia,
      },
      proyecto: { id: proyecto.id, titulo: proyecto.titulo },
    })
    expect(await request("GET", "/colaboraciones")).toEqual([colaboracion])

    const detalleColectivo = await request("GET", `/colectivos/${colectivo.id}`)
    expect(detalleColectivo.provincia).toEqual({
      id: cordoba.id,
      nombre: "Córdoba",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(detalleColectivo.proyectos).toEqual([proyecto])

    for (const [ruta, id, datos] of [
      ["proyectos", proyecto.id, proyectoDatos],
      ["personas-colaboradoras", persona.id, personaDatos],
      ["colectivos", colectivo.id, colectivoDatos],
    ]) {
      const actualizado = await request("PUT", `/${ruta}/${id}`, datos)
      expect(actualizado.id).toBe(id)
    }
    await request("PATCH", `/colectivos/${colectivo.id}`, {
      descripcion: "Descripción actualizada",
    })
    const otraPersona = await request(
      "POST",
      "/personas-colaboradoras",
      {
        ...personaDatos,
        nombreFantasia: "Otra persona",
      },
      201,
    )
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
    await request(
      "POST",
      "/colaboraciones",
      {
        proyectoId: proyecto.id,
        personaColaboradoraId: otraPersona.id,
      },
      409,
    )
    expect(await request("GET", "/colaboraciones")).toEqual([colaboracion])
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})
