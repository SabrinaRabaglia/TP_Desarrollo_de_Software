import { render, screen } from "@testing-library/react"
import Coincidencia from "./Coincidencia"

test.each([
  ["TOTAL", "Coincidencia total"],
  ["PARCIAL", "Coincidencia parcial"],
])("el nivel %s se lee como %s", (nivel, etiqueta) => {
  render(<Coincidencia nivel={nivel} />)

  expect(screen.getByText(etiqueta)).toBeInTheDocument()
})
