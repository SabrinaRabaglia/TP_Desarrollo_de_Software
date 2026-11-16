import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import { iniciarSesion } from "../../service/authService"
import {
  obtenerCatalogosDeColectivo,
  registrarColectivo,
} from "../../service/colectivosService"
import RegistroColectivo from "./RegistroColectivo"

jest.mock("../../service/authService")
jest.mock("../../service/colectivosService")

const catalogos = {
  tipos: [
    { id: "t1", nombre: "ONG" },
    { id: "t2", nombre: "Asamblea" },
  ],
  paises: [{ id: "pais-1", nombre: "Argentina" }],
  provincias: [
    { id: "prov-1", nombre: "Buenos Aires" },
    { id: "prov-2", nombre: "Córdoba" },
  ],
}

const renderizarRegistro = () =>
  render(
    <AuthProvider>
      <ProveedorDeAvisos>
        <MemoryRouter initialEntries={["/colectivos/nuevo"]}>
          <Routes>
            <Route path="/colectivos/nuevo" element={<RegistroColectivo />} />
            <Route
              path="/colectivos/c1"
              element={<h1>Página de Huerta del Sur</h1>}
            />
            <Route path="/mi-cuenta" element={<h1>Mi cuenta</h1>} />
          </Routes>
        </MemoryRouter>
      </ProveedorDeAvisos>
    </AuthProvider>,
  )

const elegir = (campo, opcion) => {
  userEvent.click(screen.getByRole("combobox", { name: campo }))
  userEvent.click(
    within(screen.getByRole("listbox")).getByRole("option", { name: opcion }),
  )
}

const completarLoObligatorio = () => {
  userEvent.paste(screen.getByLabelText(/^email/i), "huerta@colectivo.test")
  userEvent.paste(screen.getByLabelText(/^contraseña/i), "secreto123")
  userEvent.paste(
    screen.getByLabelText(/^nombre del colectivo/i),
    "Huerta del Sur",
  )
  elegir(/^tipo de colectivo/i, "ONG")
  userEvent.paste(
    screen.getByLabelText(/^descripción/i),
    "Huerta comunitaria del barrio",
  )
}

const crearCuenta = () =>
  userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }))

beforeEach(() => {
  obtenerCatalogosDeColectivo.mockResolvedValue(catalogos)
})

afterEach(() => {
  localStorage.clear()
})

describe("RegistroColectivo", () => {
  test("registra el colectivo, inicia sesión, lo lleva a su página y lo confirma", async () => {
    registrarColectivo.mockResolvedValue({})
    iniciarSesion.mockResolvedValue({
      token: "token",
      usuario: {
        id: "u1",
        email: "huerta@colectivo.test",
        rol: "COLECTIVO",
        entidad: { id: "c1", nombre: "Huerta del Sur" },
        nombre: "Huerta del Sur",
      },
    })

    renderizarRegistro()
    await screen.findByLabelText(/^nombre del colectivo/i)
    completarLoObligatorio()
    elegir(/^país/i, "Argentina")
    elegir(/^provincia/i, "Córdoba")
    userEvent.paste(screen.getByLabelText(/^ciudad o localidad/i), "Río Cuarto")
    crearCuenta()

    expect(
      await screen.findByRole("heading", { name: "Página de Huerta del Sur" }),
    ).toBeInTheDocument()
    expect(registrarColectivo).toHaveBeenCalledWith({
      email: "huerta@colectivo.test",
      contrasena: "secreto123",
      colectivo: {
        nombre: "Huerta del Sur",
        descripcion: "Huerta comunitaria del barrio",
        tipo: "ONG",
        pais: "pais-1",
        provincia: "prov-2",
        ciudad: "Río Cuarto",
      },
    })
    expect(iniciarSesion).toHaveBeenCalledWith(
      "huerta@colectivo.test",
      "secreto123",
    )
    expect(screen.getByRole("status")).toHaveTextContent(
      "Creamos la cuenta de tu colectivo",
    )
  })

  test("la ubicación es opcional: sin completarla también registra", async () => {
    registrarColectivo.mockResolvedValue({})
    iniciarSesion.mockReturnValue(new Promise(() => {}))

    renderizarRegistro()
    await screen.findByLabelText(/^nombre del colectivo/i)
    expect(
      screen.getByRole("combobox", { name: /^provincia/i }),
    ).toHaveAttribute("aria-disabled", "true")
    completarLoObligatorio()
    crearCuenta()

    await screen.findByRole("button", { name: "Guardando..." })
    expect(registrarColectivo.mock.calls[0][0].colectivo).toMatchObject({
      pais: "",
      provincia: "",
      ciudad: "",
    })
  })

  test("muestra el mensaje del backend si no puede registrarla y conserva lo tipeado", async () => {
    registrarColectivo.mockRejectedValue({
      response: { data: { message: "Ya existe un colectivo con ese nombre" } },
    })

    renderizarRegistro()
    await screen.findByLabelText(/^nombre del colectivo/i)
    completarLoObligatorio()
    crearCuenta()

    expect(
      await screen.findByText("Ya existe un colectivo con ese nombre"),
    ).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveFocus()
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeEnabled()
    expect(screen.getByLabelText(/^nombre del colectivo/i)).toHaveValue(
      "Huerta del Sur",
    )
    expect(iniciarSesion).not.toHaveBeenCalled()
  })

  test("si no puede cargar los catálogos lo avisa y deja reintentar", async () => {
    obtenerCatalogosDeColectivo
      .mockReset()
      .mockRejectedValueOnce({ isAxiosError: true })
      .mockResolvedValueOnce(catalogos)

    renderizarRegistro()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos conectarnos con el servidor",
    )
    userEvent.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(
      await screen.findByLabelText(/^nombre del colectivo/i),
    ).toBeInTheDocument()
  })

  test("con una sesión de persona colaboradora no muestra el registro", async () => {
    localStorage.setItem(
      "sesion",
      JSON.stringify({
        token: "token",
        usuario: {
          id: "u2",
          rol: "PERSONA_COLABORADORA",
          entidad: { id: "p1", nombre: "anag" },
        },
      }),
    )

    renderizarRegistro()

    expect(
      await screen.findByRole("heading", { name: "Mi cuenta" }),
    ).toBeInTheDocument()
  })
})
