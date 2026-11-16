import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError } from "axios"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import api from "../../service/api"
import BuscarProyectos from "./BuscarProyectos"

// Test de integración: la pantalla, la sesión, los servicios y el cliente HTTP
// son los reales. Lo único simulado es el backend, reemplazando el adaptador
// de axios, que es quien manda el pedido por la red.

const habilidad = (id, titulo) => ({
  id,
  titulo,
  codigo: id,
  descripcion: titulo,
})

const CYPRESS = habilidad("h1", "Testing E2E con Cypress")
const REACT = habilidad("h2", "React")
const NODE = habilidad("h3", "Node.js")

const NUBE = {
  id: "p1",
  nombreFantasia: "Nube",
  nombre: null,
  apellido: null,
  pronombres: [],
  presentacion: "Testing de aplicaciones web y desarrollo con React",
  habilidades: [CYPRESS, REACT],
  cuentas: [],
  aceptaMensajeriaInterna: true,
}

const PERFILES_ENCONTRADOS = {
  metadata: { page: 1, limit: 50, total: 2 },
  data: [
    {
      proyecto: {
        id: "pr1",
        titulo: "Mapa de comedores comunitarios",
        fechaAlta: "2026-10-15T00:00:00.000Z",
        colectivo: { id: "c1", nombre: "Red Solidaria Sur" },
      },
      perfil: {
        id: "pf1",
        nombre: "Tester",
        cantidadHoras: 5,
        unidadCompromiso: "HORAS_MENSUALES",
        modalidadesColaboracion: ["GRATUITA"],
        limiteColaboraciones: 1,
        cuposDisponibles: 1,
      },
      coincidencia: "TOTAL",
      habilidadesRequeridasFaltantes: [],
    },
    {
      proyecto: {
        id: "pr2",
        titulo: "Sistema de reservas del salón comunitario",
        fechaAlta: "2026-10-10T00:00:00.000Z",
        colectivo: { id: "c2", nombre: "Asamblea Barrial Los Ceibos" },
      },
      perfil: {
        id: "pf2",
        nombre: "Desarrollador/a Web",
        cantidadHoras: 10,
        unidadCompromiso: "HORAS_SEMANALES",
        modalidadesColaboracion: ["GRATUITA", "CON_POSIBILIDAD_CONTRATACION"],
        limiteColaboraciones: null,
        cuposDisponibles: null,
      },
      coincidencia: "PARCIAL",
      habilidadesRequeridasFaltantes: [NODE],
    },
  ],
}

// Lo que responde el backend a cada GET. Guarda los pedidos que recibió.
const simularBackend = (respuestas) => {
  const pedidos = []
  api.defaults.adapter = async (config) => {
    pedidos.push(config)
    const responder = respuestas[config.url]
    if (!responder) {
      throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config)
    }
    return {
      data: responder,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }
  }
  return {
    pedidoA: (url) => pedidos.find((pedido) => pedido.url === url),
  }
}

const iniciarSesionComoNube = () =>
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token-de-nube",
      usuario: {
        id: "u1",
        rol: "PERSONA_COLABORADORA",
        nombre: "Nube",
        entidad: { id: "p1", nombre: "Nube" },
      },
    }),
  )

const abrirLaBusqueda = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/buscar"]}>
        <Routes>
          <Route path="/buscar" element={<BuscarProyectos />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const tarjetaDe = async (titulo) =>
  within(
    (await screen.findByRole("heading", { name: titulo })).closest("article"),
  )

const adaptadorReal = api.defaults.adapter

beforeEach(iniciarSesionComoNube)

afterEach(() => {
  api.defaults.adapter = adaptadorReal
  localStorage.clear()
})

describe("Buscar proyectos, de la pantalla al pedido HTTP", () => {
  test("busca con las habilidades de quien tiene la sesión y muestra lo que respondió el backend", async () => {
    const backend = simularBackend({
      "/habilidades": [CYPRESS, REACT, NODE],
      "/personas-colaboradoras/p1": NUBE,
      "/personas-colaboradoras/p1/medios-de-contacto": [],
      "/perfiles": PERFILES_ENCONTRADOS,
    })

    abrirLaBusqueda()

    // El filtro arranca con las habilidades del perfil que devolvió el backend.
    expect(
      await screen.findByRole("checkbox", { name: "Testing E2E con Cypress" }),
    ).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "React" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Node.js" })).not.toBeChecked()

    userEvent.click(screen.getByRole("button", { name: "Buscar" }))

    const tester = await tarjetaDe("Mapa de comedores comunitarios")
    expect(tester.getByText("Red Solidaria Sur")).toBeInTheDocument()
    expect(tester.getByText("5 horas por mes")).toBeInTheDocument()
    expect(tester.getByText("Coincidencia total")).toBeInTheDocument()
    expect(tester.getByText("1 cupo disponible de 1")).toBeInTheDocument()

    const web = await tarjetaDe("Sistema de reservas del salón comunitario")
    expect(web.getByText("10 horas por semana")).toBeInTheDocument()
    expect(web.getByText("Coincidencia parcial")).toBeInTheDocument()
    expect(web.getByText("Sin límite de cupos")).toBeInTheDocument()
    expect(web.getByText("Te falta: Node.js")).toBeInTheDocument()

    // El pedido salió con el token de la sesión y con los filtros elegidos.
    const pedido = backend.pedidoA("/perfiles")
    expect(pedido.method).toBe("get")
    expect(pedido.headers.get("Authorization")).toBe("Bearer token-de-nube")
    expect(pedido.params).toEqual({
      habilidades: ["h1", "h2"],
      orden: "recientes",
      limit: 50,
    })
  })

  test("si el backend no responde, avisa que no hay conexión y deja reintentar", async () => {
    simularBackend({
      "/habilidades": [CYPRESS, REACT, NODE],
      "/personas-colaboradoras/p1": NUBE,
      "/personas-colaboradoras/p1/medios-de-contacto": [],
    })

    abrirLaBusqueda()
    userEvent.click(await screen.findByRole("button", { name: "Buscar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos conectarnos con el servidor",
    )
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument()
  })
})
