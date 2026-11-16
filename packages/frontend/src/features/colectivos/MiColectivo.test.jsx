import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import Layout from "../layout/Layout"
import { obtenerUsuarioActual } from "../../service/authService"
import {
  actualizarColectivo,
  obtenerCatalogosDeColectivo,
  obtenerColectivoPropio,
} from "../../service/colectivosService"
import MiColectivo from "./MiColectivo"

jest.mock("../../service/authService")
jest.mock("../../service/colectivosService")

const usuario = {
  id: "u1",
  email: "huerta@colectivo.test",
  rol: "COLECTIVO",
  entidad: { id: "c1", nombre: "Huerta del Sur" },
  nombre: "Huerta del Sur",
}

const colectivo = {
  nombre: "Huerta del Sur",
  descripcion: "Huerta comunitaria del barrio",
  tipo: "Asamblea",
  pais: "pais-1",
  provincia: "prov-1",
  ciudad: "Lanús",
}

const renderizarMiColectivo = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/mi-colectivo"]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/mi-colectivo" element={<MiColectivo />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const nombre = () => screen.getByLabelText(/^nombre del colectivo/i)
const descripcion = () => screen.getByLabelText(/^descripción/i)
const desplegable = (campo) => screen.getByRole("combobox", { name: campo })

const elegir = (campo, opcion) => {
  userEvent.click(desplegable(campo))
  userEvent.click(
    within(screen.getByRole("listbox")).getByRole("option", { name: opcion }),
  )
}

const guardar = () =>
  userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))

beforeEach(() => {
  localStorage.setItem("sesion", JSON.stringify({ token: "token", usuario }))
  obtenerCatalogosDeColectivo.mockResolvedValue({
    tipos: [
      { id: "t1", nombre: "ONG" },
      { id: "t2", nombre: "Asamblea" },
    ],
    paises: [
      { id: "pais-1", nombre: "Argentina" },
      { id: "pais-2", nombre: "Uruguay" },
    ],
    provincias: [
      { id: "prov-1", nombre: "Buenos Aires" },
      { id: "prov-2", nombre: "Córdoba" },
    ],
  })
  obtenerColectivoPropio.mockResolvedValue(colectivo)
  actualizarColectivo.mockResolvedValue()
})

afterEach(() => {
  localStorage.clear()
})

describe("MiColectivo", () => {
  test("carga los datos del colectivo, guarda los cambios y actualiza el nombre de la navbar", async () => {
    obtenerUsuarioActual.mockResolvedValue({
      ...usuario,
      entidad: { id: "c1", nombre: "Huerta Sur" },
      nombre: "Huerta Sur",
    })

    renderizarMiColectivo()

    await screen.findByLabelText(/^nombre del colectivo/i)
    expect(nombre()).toHaveValue("Huerta del Sur")
    expect(descripcion()).toHaveValue("Huerta comunitaria del barrio")
    expect(desplegable(/^tipo de colectivo/i)).toHaveTextContent("Asamblea")
    expect(desplegable(/^país/i)).toHaveTextContent("Argentina")
    expect(desplegable(/^provincia/i)).toHaveTextContent("Buenos Aires")
    expect(screen.getByLabelText(/^ciudad o localidad/i)).toHaveValue("Lanús")
    expect(screen.queryByLabelText(/^email/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^contraseña/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Ver la página pública" }),
    ).toHaveAttribute("href", "/colectivos/c1")
    expect(obtenerColectivoPropio).toHaveBeenCalledWith("c1")

    userEvent.clear(nombre())
    userEvent.type(nombre(), "Huerta Sur")
    elegir(/^tipo de colectivo/i, "ONG")
    elegir(/^provincia/i, "Córdoba")
    guardar()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Guardamos tus cambios",
    )
    expect(screen.getByRole("alert")).toHaveFocus()
    expect(actualizarColectivo).toHaveBeenCalledTimes(1)
    expect(actualizarColectivo).toHaveBeenCalledWith("c1", {
      nombre: "Huerta Sur",
      descripcion: "Huerta comunitaria del barrio",
      tipo: "ONG",
      pais: "pais-1",
      provincia: "prov-2",
      ciudad: "Lanús",
    })
    expect(
      within(screen.getByRole("navigation", { name: "Principal" })).getByText(
        "Huerta Sur",
      ),
    ).toBeInTheDocument()
  })

  test("si el backend rechaza los cambios muestra su mensaje y conserva lo tipeado", async () => {
    actualizarColectivo.mockRejectedValue({
      response: { data: { message: "Ya existe un colectivo con ese nombre" } },
    })

    renderizarMiColectivo()
    await screen.findByLabelText(/^nombre del colectivo/i)
    userEvent.clear(nombre())
    userEvent.type(nombre(), "Red Solidaria")
    guardar()

    expect(
      await screen.findByText("Ya existe un colectivo con ese nombre"),
    ).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveFocus()
    expect(nombre()).toHaveValue("Red Solidaria")
    expect(screen.queryByText("Guardamos tus cambios")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeEnabled()
  })

  test("al cambiar el país, la provincia elegida se borra", async () => {
    obtenerUsuarioActual.mockResolvedValue(usuario)

    renderizarMiColectivo()
    await screen.findByLabelText(/^nombre del colectivo/i)
    elegir(/^país/i, "Uruguay")
    guardar()

    await screen.findByText("Guardamos tus cambios")
    expect(actualizarColectivo.mock.calls[0][1]).toMatchObject({
      pais: "pais-2",
      provincia: "",
    })
  })

  test("si no puede cargar el colectivo muestra el error del backend", async () => {
    obtenerColectivoPropio.mockRejectedValue({
      response: { data: { message: "Colectivo no encontrado" } },
    })

    renderizarMiColectivo()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Colectivo no encontrado",
    )
    expect(
      screen.queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument()
  })
})
