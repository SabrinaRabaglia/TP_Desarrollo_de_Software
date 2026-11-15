import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { LuInbox } from "react-icons/lu"
import EstadoVacio from "./EstadoVacio"

const renderizar = (props) =>
  render(
    <MemoryRouter>
      <EstadoVacio {...props} />
    </MemoryRouter>,
  )

describe("EstadoVacio", () => {
  test("muestra el título, el texto y la acción que lleva a otra pantalla", () => {
    renderizar({
      icono: <LuInbox />,
      titulo: "Todavía no te postulaste",
      texto: "Explorá proyectos y sumate a los que te interesen.",
      accion: { etiqueta: "Ver proyectos", a: "/" },
    })

    expect(
      screen.getByRole("heading", { name: "Todavía no te postulaste" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Explorá proyectos y sumate a los que te interesen."),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ver proyectos" })).toHaveAttribute(
      "href",
      "/",
    )
  })

  test("sin texto ni acción muestra solo el título", () => {
    renderizar({ titulo: "Este perfil no tiene postulaciones" })

    expect(
      screen.getByRole("heading", {
        name: "Este perfil no tiene postulaciones",
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
