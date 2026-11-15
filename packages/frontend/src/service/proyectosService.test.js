import api from "./api"
import { obtenerHabilidades } from "./habilidadesService"
import { buscarProyectos } from "./proyectosService"

jest.mock("./api", () => ({ __esModule: true, default: { get: jest.fn() } }))
jest.mock("./habilidadesService", () => ({ obtenerHabilidades: jest.fn() }))

const respuestas = {
  "/proyectos": {
    metadata: { page: 1, limit: 10, total: 1 },
    data: [
      {
        id: "proyecto-1",
        titulo: "Sitio web de la huerta",
        descripcion: "Calendario de talleres",
        estado: "PUBLICADO",
        colectivo: "colectivo-1",
        perfiles: [
          {
            id: "perfil-1",
            nombre: null,
            descripcion: "Perfil cargado antes de las validaciones",
            unidadCompromiso: null,
            cantidadHoras: null,
            modalidadesColaboracion: null,
            habilidadesRequeridas: ["habilidad-1"],
            habilidadesOpcionales: null,
          },
        ],
      },
    ],
  },
  "/colectivos": [{ id: "colectivo-1", nombre: "Huerta Comunitaria Sur" }],
}

beforeEach(() => {
  api.get.mockImplementation(async (url) => ({ data: respuestas[url] }))
  obtenerHabilidades.mockResolvedValue([
    { id: "habilidad-1", titulo: "JavaScript" },
  ])
})

test("lista los proyectos aunque un perfil tenga campos en null", async () => {
  const {
    proyectos: [proyecto],
  } = await buscarProyectos()

  expect(proyecto.colectivo).toEqual({
    id: "colectivo-1",
    nombre: "Huerta Comunitaria Sur",
  })
  expect(proyecto.perfiles).toEqual([
    {
      id: "perfil-1",
      nombre: "Perfil sin nombre",
      descripcion: "Perfil cargado antes de las validaciones",
      compromiso: "Sin especificar",
      modalidades: [],
      habilidadesRequeridas: ["JavaScript"],
      habilidadesOpcionales: [],
      postulacionesAceptadas: [],
      limiteColaboraciones: undefined,
    },
  ])
})

test("pide la página indicada y calcula cuántas páginas hay", async () => {
  api.get.mockImplementation(async (url) =>
    url === "/proyectos"
      ? {
          data: {
            metadata: { page: 3, limit: 10, total: 21 },
            data: respuestas["/proyectos"].data,
          },
        }
      : { data: respuestas[url] },
  )

  const { proyectos, pagina, totalPaginas } = await buscarProyectos({
    pagina: 3,
  })

  expect(api.get).toHaveBeenCalledWith("/proyectos", {
    params: { habilidades: undefined, page: 3 },
  })
  expect(proyectos).toHaveLength(1)
  expect(pagina).toBe(3)
  expect(totalPaginas).toBe(3)
})

test("sin proyectos hay una sola página", async () => {
  api.get.mockImplementation(async (url) =>
    url === "/proyectos"
      ? { data: { metadata: { page: 1, limit: 0, total: 0 }, data: [] } }
      : { data: respuestas[url] },
  )

  expect(await buscarProyectos()).toEqual({
    proyectos: [],
    pagina: 1,
    totalPaginas: 1,
  })
})
