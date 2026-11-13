import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import {
  actualizarColectivo,
  crearColectivo,
  obtenerColectivo,
  obtenerPaises,
  obtenerProvincias,
} from "../../service/colectivoService"
import FormularioColectivo from "./FormularioColectivo"

jest.mock("../../service/colectivoService", () => {
  const service = jest.requireActual("../../service/colectivoService")
  return {
    ...service,
    actualizarColectivo: jest.fn(),
    crearColectivo: jest.fn(),
    obtenerColectivo: jest.fn(),
    obtenerPaises: jest.fn(),
    obtenerProvincias: jest.fn(),
  }
})

const paises = [{ id: "pais-1", nombre: "Argentina" }]
const provincias = [{ id: "provincia-1", nombre: "Buenos Aires" }]

const renderizarFormulario = (ruta) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/colectivos/nuevo" element={<FormularioColectivo />} />
        <Route
          path="/colectivos/:id/editar"
          element={<FormularioColectivo />}
        />
        <Route
          path="/colectivos/:id"
          element={<h1>Detalle de organización</h1>}
        />
        <Route path="/" element={<h1>Inicio</h1>} />
      </Routes>
    </MemoryRouter>,
  )

const cargarCatalogos = () => {
  obtenerPaises.mockResolvedValue(paises)
  obtenerProvincias.mockResolvedValue(provincias)
}

const elegirOpcion = async (etiqueta, opcion) => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: etiqueta }))
  fireEvent.click(await screen.findByRole("option", { name: opcion }))
}

beforeEach(() => {
  jest.clearAllMocks()
  cargarCatalogos()
})

describe("FormularioColectivo", () => {
  test("registra una organización y navega a su detalle", async () => {
    crearColectivo.mockResolvedValue({ id: "colectivo-1" })

    renderizarFormulario("/colectivos/nuevo")

    fireEvent.change(
      await screen.findByRole("textbox", { name: "Nombre de la organización" }),
      { target: { value: "Huerta Comunitaria" } },
    )
    await elegirOpcion("Tipo de organización", "Fundación")
    fireEvent.change(screen.getByRole("textbox", { name: "Descripción" }), {
      target: { value: "Acompañamos a nuestra comunidad." },
    })
    await elegirOpcion("País", "Argentina")
    await elegirOpcion("Provincia", "Buenos Aires")
    fireEvent.change(screen.getByLabelText("Ciudad o localidad"), {
      target: { value: "La Plata" },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Registrar organización" }),
    )

    expect(
      await screen.findByRole("heading", { name: "Detalle de organización" }),
    ).toBeInTheDocument()
    expect(crearColectivo).toHaveBeenCalledWith({
      nombre: "Huerta Comunitaria",
      descripcion: "Acompañamos a nuestra comunidad.",
      tipo: "Fundación",
      pais: "pais-1",
      provincia: "provincia-1",
      ciudad: "La Plata",
    })
    expect(obtenerColectivo).not.toHaveBeenCalled()
  })

  test("carga y actualiza la organización existente", async () => {
    obtenerColectivo.mockResolvedValue({
      id: "colectivo-1",
      nombre: "Huerta Comunitaria",
      descripcion: "Descripción anterior",
      tipo: "Asamblea",
      pais: { id: "pais-1", nombre: "Argentina" },
      provincia: { id: "provincia-1", nombre: "Buenos Aires" },
      ciudad: "La Plata",
    })
    actualizarColectivo.mockResolvedValue({ id: "colectivo-1" })

    renderizarFormulario("/colectivos/colectivo-1/editar")

    expect(
      await screen.findByRole("heading", { name: "Editar organización" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "País" })).toHaveTextContent(
      "Argentina",
    )
    expect(
      screen.getByRole("combobox", { name: "Provincia" }),
    ).toHaveTextContent("Buenos Aires")

    fireEvent.change(screen.getByRole("textbox", { name: "Descripción" }), {
      target: { value: "Descripción actualizada" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))

    expect(
      await screen.findByRole("heading", { name: "Detalle de organización" }),
    ).toBeInTheDocument()
    expect(actualizarColectivo).toHaveBeenCalledWith("colectivo-1", {
      nombre: "Huerta Comunitaria",
      descripcion: "Descripción actualizada",
      tipo: "Asamblea",
      pais: "pais-1",
      provincia: "provincia-1",
      ciudad: "La Plata",
    })
  })

  test("muestra el error del servidor sin borrar los datos del formulario", async () => {
    crearColectivo.mockRejectedValue({
      response: {
        data: { message: "Ya existe una organización con ese nombre" },
      },
    })

    renderizarFormulario("/colectivos/nuevo")
    fireEvent.change(
      await screen.findByRole("textbox", { name: "Nombre de la organización" }),
      { target: { value: "Organización repetida" } },
    )
    await elegirOpcion("Tipo de organización", "ONG")
    fireEvent.change(screen.getByRole("textbox", { name: "Descripción" }), {
      target: { value: "Descripción de la organización." },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Registrar organización" }),
    )

    expect(
      await screen.findByText("Ya existe una organización con ese nombre"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: "Nombre de la organización" }),
    ).toHaveValue("Organización repetida")
    expect(
      screen.getByRole("button", { name: "Registrar organización" }),
    ).toBeEnabled()
  })

  test("permite reintentar la carga de países y provincias", async () => {
    obtenerPaises
      .mockRejectedValueOnce(new Error("backend no disponible"))
      .mockResolvedValueOnce(paises)

    renderizarFormulario("/colectivos/nuevo")

    expect(
      await screen.findByText(
        "No se pudieron cargar los catálogos. Verificá que el backend esté iniciado y reintentá.",
      ),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))

    await screen.findByRole("combobox", { name: "País" })
    await elegirOpcion("País", "Argentina")
    expect(screen.getByRole("combobox", { name: "País" })).toHaveTextContent(
      "Argentina",
    )
  })
})
