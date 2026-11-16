import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { obtenerPerfilPropio } from "../../service/colaboradorasService"
import { obtenerHabilidades } from "../../service/habilidadesService"
import { buscarPerfiles } from "../../service/perfilesService"
import BuscarProyectos from "./BuscarProyectos"

jest.mock("../../service/colaboradorasService")
jest.mock("../../service/habilidadesService")
jest.mock("../../service/perfilesService", () => ({
  ...jest.requireActual("../../service/perfilesService"),
  buscarPerfiles: jest.fn(),
}))
jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    usuario: { rol: "PERSONA_COLABORADORA", entidad: { id: "p1" } },
  }),
}))

const resultado = (extras = {}) => ({
  proyecto: {
    id: "pr1",
    titulo: "Mapa de comedores comunitarios",
    colectivo: "Red Solidaria Sur",
  },
  perfil: {
    id: "pf1",
    nombre: "Tester",
    compromiso: "5 horas por mes",
    modalidades: ["Gratuita"],
    limite: 1,
    aceptadas: 0,
  },
  coincidencia: "TOTAL",
  faltantes: [],
  ...extras,
})

const parcial = resultado({
  proyecto: {
    id: "pr2",
    titulo: "Sistema de reservas del salón comunitario",
    colectivo: "Asamblea Barrial Los Ceibos",
  },
  perfil: {
    id: "pf2",
    nombre: "Desarrollador/a Web",
    compromiso: "10 horas por semana",
    modalidades: ["Gratuita", "Con posibilidad de contratación"],
    limite: null,
    aceptadas: 0,
  },
  coincidencia: "PARCIAL",
  faltantes: ["Node.js"],
})

const renderizar = (ruta = "/buscar") =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/buscar" element={<BuscarProyectos />} />
      </Routes>
    </MemoryRouter>,
  )

const buscar = async () =>
  userEvent.click(await screen.findByRole("button", { name: "Buscar" }))

const tarjetaDe = async (titulo) =>
  (await screen.findByRole("heading", { name: titulo })).closest("article")

beforeEach(() => {
  obtenerHabilidades.mockResolvedValue([
    { id: "h1", titulo: "Testing E2E con Cypress" },
    { id: "h2", titulo: "React" },
    { id: "h3", titulo: "Node.js" },
  ])
  obtenerPerfilPropio.mockResolvedValue({ habilidades: ["h1", "h2"] })
  buscarPerfiles.mockResolvedValue([resultado(), parcial])
})

describe("BuscarProyectos", () => {
  test("arranca con las habilidades del perfil y no busca hasta que se lo piden", async () => {
    renderizar()

    expect(
      await screen.findByRole("checkbox", { name: "Testing E2E con Cypress" }),
    ).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "React" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Node.js" })).not.toBeChecked()
    expect(obtenerPerfilPropio).toHaveBeenCalledWith("p1")
    expect(buscarPerfiles).not.toHaveBeenCalled()
    expect(
      screen.getByText(/elegí los filtros y tocá buscar/i),
    ).toBeInTheDocument()
  })

  test("busca con los filtros y muestra cada perfil con su coincidencia, lo que falta y sus cupos", async () => {
    renderizar()

    await buscar()

    const tester = within(await tarjetaDe("Mapa de comedores comunitarios"))
    expect(buscarPerfiles).toHaveBeenCalledWith({
      habilidades: ["h1", "h2"],
      modalidad: "",
      orden: "recientes",
    })
    expect(tester.getByText("Red Solidaria Sur")).toBeInTheDocument()
    expect(tester.getByText("Perfil Tester")).toBeInTheDocument()
    expect(tester.getByText("5 horas por mes")).toBeInTheDocument()
    expect(tester.getByText("Coincidencia total")).toBeInTheDocument()
    expect(tester.getByText("1 cupo disponible de 1")).toBeInTheDocument()
    expect(tester.queryByText(/te falta/i)).not.toBeInTheDocument()
    expect(tester.getByRole("link", { name: "Ver proyecto" })).toHaveAttribute(
      "href",
      "/proyectos/pr1",
    )

    const web = within(
      await tarjetaDe("Sistema de reservas del salón comunitario"),
    )
    expect(web.getByText("Coincidencia parcial")).toBeInTheDocument()
    expect(web.getByText("Te falta: Node.js")).toBeInTheDocument()
    expect(web.getByText("Sin límite de cupos")).toBeInTheDocument()
    expect(
      web.getByText("Gratuita, Con posibilidad de contratación"),
    ).toBeInTheDocument()
    expect(screen.getByText("2 perfiles encontrados")).toBeInTheDocument()
  })

  test("sin ninguna habilidad elegida lo avisa y no busca", async () => {
    obtenerPerfilPropio.mockResolvedValue({ habilidades: [] })
    renderizar()

    await buscar()

    expect(
      await screen.findByText("Elegí al menos una habilidad para buscar."),
    ).toBeInTheDocument()
    expect(buscarPerfiles).not.toHaveBeenCalled()
  })

  test("una combinación sin resultados lo dice en lugar de mostrar una lista vacía", async () => {
    buscarPerfiles.mockResolvedValue([])
    renderizar()

    await buscar()

    expect(
      await screen.findByText("No encontramos perfiles con esos filtros"),
    ).toBeInTheDocument()
  })

  test("si el back rechaza los filtros muestra su mensaje", async () => {
    buscarPerfiles.mockRejectedValue({
      response: { data: { message: "Datos inválidos" } },
    })
    renderizar("/buscar?habilidades=hola")

    expect(await screen.findByText("Datos inválidos")).toBeInTheDocument()
  })

  test("al volver con la búsqueda en la URL la repite con esos filtros, sin pisarlos con el perfil", async () => {
    renderizar("/buscar?habilidades=h3&modalidad=GRATUITA&orden=antiguos")

    expect(
      await screen.findByRole("heading", {
        name: "Mapa de comedores comunitarios",
      }),
    ).toBeInTheDocument()
    expect(buscarPerfiles).toHaveBeenCalledWith({
      habilidades: ["h3"],
      modalidad: "GRATUITA",
      orden: "antiguos",
    })
    expect(obtenerPerfilPropio).not.toHaveBeenCalled()
    expect(screen.getByRole("checkbox", { name: "Node.js" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "React" })).not.toBeChecked()
  })
})
