import { render, screen } from "@testing-library/react"
import EstadoChip from "./EstadoChip"

describe("EstadoChip", () => {
  test.each([
    ["PUBLICADO", "Publicado"],
    ["CERRADO", "Cerrado"],
    ["PENDIENTE", "Pendiente"],
    ["ACEPTADA", "Aceptada"],
    ["RECHAZADA", "Rechazada"],
    ["BAJA", "Baja"],
  ])("muestra %s como %s y con un ícono", (estado, etiqueta) => {
    const { container } = render(<EstadoChip estado={estado} />)

    expect(screen.getByText(etiqueta)).toBeInTheDocument()
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  test("un estado que no conoce lo muestra tal cual y sin ícono", () => {
    const { container } = render(<EstadoChip estado="EN_REVISION" />)

    expect(screen.getByText("EN_REVISION")).toBeInTheDocument()
    expect(container.querySelector("svg")).not.toBeInTheDocument()
  })
})
