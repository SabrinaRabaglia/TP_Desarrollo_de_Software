import api from "./api"
import { obtenerHabilidades } from "./habilidadesService"
import { buscarProyectos } from "./proyectosService"

jest.mock("./api", () => ({ __esModule: true, default: { get: jest.fn() } }))
jest.mock("./habilidadesService", () => ({ obtenerHabilidades: jest.fn() }))

const respuestas = {
  "/proyectos": [
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
  "/colectivos": [{ id: "colectivo-1", nombre: "Huerta Comunitaria Sur" }],
}

beforeEach(() => {
  api.get.mockImplementation(async (url) => ({ data: respuestas[url] }))
  obtenerHabilidades.mockResolvedValue([
    { id: "habilidad-1", titulo: "JavaScript" },
  ])
})

test("lista los proyectos aunque un perfil tenga campos en null", async () => {
  const [proyecto] = await buscarProyectos()

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
      limiteColaboraciones: undefined,
    },
  ])
})
