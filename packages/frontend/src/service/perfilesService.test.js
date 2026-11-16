import api from "./api"
import { buscarPerfiles } from "./perfilesService"

jest.mock("./api", () => ({ __esModule: true, default: { get: jest.fn() } }))

const resultadoDelBack = (perfil = {}) => ({
  proyecto: {
    id: "pr1",
    titulo: "Portal de voluntariados",
    fechaAlta: "2026-10-05T00:00:00.000Z",
    colectivo: { id: "c1", nombre: "Fundación Raíces" },
  },
  perfil: {
    id: "pf1",
    nombre: "QA Automation",
    descripcion: "Automatizar pruebas",
    unidadCompromiso: "HORAS_TOTALES",
    cantidadHoras: 20,
    modalidadesColaboracion: ["GRATUITA", "CON_POSIBILIDAD_CONTRATACION"],
    limiteColaboraciones: 3,
    cuposDisponibles: 1,
    ...perfil,
  },
  coincidencia: "PARCIAL",
  habilidadesRequeridasFaltantes: [{ id: "h9", titulo: "Node.js" }],
})

test("busca perfiles con los filtros y los deja listos para mostrar", async () => {
  api.get.mockResolvedValue({
    data: { metadata: { total: 1 }, data: [resultadoDelBack()] },
  })

  const resultados = await buscarPerfiles({
    habilidades: ["h1", "h2"],
    modalidad: "GRATUITA",
    orden: "recientes",
  })

  expect(api.get).toHaveBeenCalledWith("/perfiles", {
    params: {
      habilidades: ["h1", "h2"],
      modalidad: "GRATUITA",
      orden: "recientes",
      limit: 50,
    },
  })
  expect(resultados).toEqual([
    {
      proyecto: {
        id: "pr1",
        titulo: "Portal de voluntariados",
        colectivo: "Fundación Raíces",
      },
      perfil: {
        id: "pf1",
        nombre: "QA Automation",
        compromiso: "20 horas en total",
        modalidades: ["Gratuita", "Con posibilidad de contratación"],
        limite: 3,
        aceptadas: 2,
      },
      coincidencia: "PARCIAL",
      faltantes: ["Node.js"],
    },
  ])
})

test("sin modalidad no manda el filtro y un perfil sin límite no tiene aceptadas que restar", async () => {
  api.get.mockResolvedValue({
    data: {
      metadata: { total: 1 },
      data: [
        resultadoDelBack({
          limiteColaboraciones: null,
          cuposDisponibles: null,
        }),
      ],
    },
  })

  const [resultado] = await buscarPerfiles({
    habilidades: ["h1"],
    modalidad: "",
    orden: "antiguos",
  })

  expect(api.get.mock.calls[0][1].params.modalidad).toBeUndefined()
  expect(resultado.perfil.limite).toBeNull()
  expect(resultado.perfil.aceptadas).toBe(0)
})
