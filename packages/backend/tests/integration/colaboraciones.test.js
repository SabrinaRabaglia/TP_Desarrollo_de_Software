import { expect, test } from "@jest/globals"
import { once } from "node:events"
import app from "../../src/app.js"

test("inscribir permite consultar y actualizar las entidades sin ciclos en el JSON", async () => {
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
        titulo: "JavaScript",
        codigo: "javascript",
        descripcion: "Desarrollo web",
      },
      201,
    )
    const colectivoDatos = {
      nombre: "Colectivo HTTP",
      descripcion: "Desarrollo comunitario",
      tipo: "ONG",
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
      fechaInscripcion: expect.any(String),
      personaColaboradora: {
        id: persona.id,
        nombreFantasia: persona.nombreFantasia,
      },
      proyecto: { id: proyecto.id, titulo: proyecto.titulo },
    })
    expect(await request("GET", "/colaboraciones")).toEqual([colaboracion])

    for (const [ruta, entidad] of [
      ["proyectos", proyecto],
      ["personas-colaboradoras", persona],
    ]) {
      const detalle = await request("GET", `/${ruta}/${entidad.id}`)
      expect(detalle.colaboraciones).toEqual([colaboracion])
      const lista = await request("GET", `/${ruta}`)
      expect(
        lista.find((item) => item.id === entidad.id).colaboraciones,
      ).toEqual([colaboracion])
    }
    const detalleColectivo = await request("GET", `/colectivos/${colectivo.id}`)
    expect(detalleColectivo.proyectos[0].colaboraciones).toEqual([colaboracion])
    const colectivos = await request("GET", "/colectivos")
    expect(colectivos[0].proyectos[0].colaboraciones).toEqual([colaboracion])

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
    await request("PUT", `/proyectos/${proyecto.id}`, {
      ...proyectoDatos,
      estado: "CERRADO",
      fechaCierre: "2026-09-15T00:00:00.000Z",
    })
    await request(
      "POST",
      "/colaboraciones",
      {
        proyectoId: proyecto.id,
        personaColaboradoraId: otraPersona.id,
      },
      422,
    )
    expect(await request("GET", "/colaboraciones")).toEqual([colaboracion])
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})
