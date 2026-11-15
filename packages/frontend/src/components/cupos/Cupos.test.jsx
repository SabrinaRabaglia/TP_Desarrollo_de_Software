import { render, screen } from "@testing-library/react"
import Cupos from "./Cupos"

describe("Cupos", () => {
  test("sin límite lo dice, tenga las aceptadas que tenga", () => {
    render(<Cupos limite={null} aceptadas={2} />)

    expect(screen.getByText("Sin límite de cupos")).toBeInTheDocument()
  })

  test("con lugar, dice cuántos cupos quedan", () => {
    render(<Cupos limite={3} aceptadas={1} />)

    expect(screen.getByText("2 cupos disponibles de 3")).toBeInTheDocument()
  })

  test("con un solo lugar libre lo dice en singular", () => {
    render(<Cupos limite={3} aceptadas={2} />)

    expect(screen.getByText("1 cupo disponible de 3")).toBeInTheDocument()
  })

  test("sin aceptadas, están todos los cupos disponibles", () => {
    render(<Cupos limite={1} />)

    expect(screen.getByText("1 cupo disponible de 1")).toBeInTheDocument()
  })

  test("con el límite alcanzado, muestra el cupo completo", () => {
    render(<Cupos limite={1} aceptadas={1} />)

    expect(screen.getByText("Cupo completo (1 de 1)")).toBeInTheDocument()
  })
})
