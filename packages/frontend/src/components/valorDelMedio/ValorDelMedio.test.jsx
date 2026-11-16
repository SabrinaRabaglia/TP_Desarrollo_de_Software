import { render, screen } from "@testing-library/react"
import ValorDelMedio from "./ValorDelMedio"

describe("ValorDelMedio", () => {
  test("de Telegram no muestra el id del chat", () => {
    render(<ValorDelMedio medio={{ tipo: "TELEGRAM", valor: "987654321" }} />)

    expect(
      screen.getByText("Solo para avisos de la plataforma"),
    ).toBeInTheDocument()
    expect(screen.queryByText("987654321")).not.toBeInTheDocument()
  })

  test("el email se puede abrir en el correo", () => {
    render(
      <ValorDelMedio medio={{ tipo: "EMAIL", valor: "ana@example.com" }} />,
    )

    expect(
      screen.getByRole("link", { name: "ana@example.com" }),
    ).toHaveAttribute("href", "mailto:ana@example.com")
  })

  test("el resto muestra el valor tal cual", () => {
    render(
      <ValorDelMedio medio={{ tipo: "WHATSAPP", valor: "+54 9 11 5555" }} />,
    )

    expect(screen.getByText("+54 9 11 5555")).toBeInTheDocument()
  })
})
