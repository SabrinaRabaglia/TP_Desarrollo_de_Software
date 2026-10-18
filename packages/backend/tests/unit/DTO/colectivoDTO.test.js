import { describe, expect, test } from "@jest/globals"
import { colectivoDTO } from "../../../src/dtos/colectivoDTO.js"
import { proyectoDTO } from "../../../src/dtos/proyectoDTO.js"

const fecha = new Date("2026-09-12T00:00:00.000Z")
const perfil = {
  id: "perfil-1",
  nombre: "Tester",
  descripcion: "Testing E2E",
  unidadCompromiso: "HORAS_MENSUALES",
  cantidadHoras: 5,
  modalidadesColaboracion: ["GRATUITA"],
  habilidadesRequeridas: ["cypress"],
  habilidadesOpcionales: ["soap_ui"],
}
const proyecto = {
  id: "proyecto-1",
  titulo: "Mapa de humedales",
  descripcion: "Visualizar los puntos de monitoreo",
  estado: "PUBLICADO",
  fechaAlta: fecha,
  fechaCierre: null,
  colectivo: "colectivo-1",
  perfiles: [perfil],
  createdAt: fecha,
  updatedAt: fecha,
}

describe("proyectoDTO", () => {
  test("expone los datos del proyecto con sus perfiles", () => {
    expect(proyectoDTO(proyecto)).toEqual(proyecto)
  })

  test("no expone datos que el dominio no persiste", () => {
    expect(
      proyectoDTO({ ...proyecto, colaboraciones: ["colaboracion-1"] }),
    ).not.toHaveProperty("colaboraciones")
  })
})

describe("colectivoDTO", () => {
  const colectivo = {
    id: "colectivo-1",
    nombre: "Asamblea Ambiental",
    descripcion: "Protección de humedales",
    tipo: "Asamblea",
    pais: {
      id: "pais-1",
      nombre: "Argentina",
      createdAt: fecha,
      updatedAt: fecha,
    },
    provincia: null,
    ciudad: "Lanús",
  }

  test("expone el colectivo con sus proyectos y su ubicación", () => {
    expect(colectivoDTO({ colectivo, proyectos: [proyecto] })).toEqual({
      ...colectivo,
      proyectos: [proyecto],
    })
  })
})
