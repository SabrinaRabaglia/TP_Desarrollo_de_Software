import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProveedorDeAvisos, useAvisos } from "./AvisosContext"

const BotonQueAvisa = ({ texto, opciones }) => {
  const { mostrarAviso } = useAvisos()
  return (
    <button onClick={() => mostrarAviso(texto, opciones)}>
      Avisar {texto}
    </button>
  )
}

const renderizar = (...botones) =>
  render(<ProveedorDeAvisos>{botones}</ProveedorDeAvisos>)

describe("Avisos globales", () => {
  test("muestra el aviso como estado, sin interrumpir, y se cierra con el botón", async () => {
    renderizar(<BotonQueAvisa key="baja" texto="Te diste de baja" />)

    await userEvent.click(
      screen.getByRole("button", { name: "Avisar Te diste de baja" }),
    )

    const aviso = screen.getByRole("status")
    expect(aviso).toHaveTextContent("Te diste de baja")

    await userEvent.click(screen.getByRole("button", { name: "Close" }))

    await waitFor(() =>
      expect(screen.queryByText("Te diste de baja")).not.toBeInTheDocument(),
    )
  })

  test("un aviso nuevo reemplaza al anterior", async () => {
    renderizar(
      <BotonQueAvisa key="a" texto="Postulación aceptada" />,
      <BotonQueAvisa key="r" texto="Postulación rechazada" />,
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Avisar Postulación aceptada" }),
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Avisar Postulación rechazada" }),
    )

    await waitFor(() => expect(screen.getAllByRole("status")).toHaveLength(1))
    expect(screen.getByRole("status")).toHaveTextContent(
      "Postulación rechazada",
    )
  })

  test("se va solo después de unos segundos", async () => {
    jest.useFakeTimers()
    try {
      renderizar(<BotonQueAvisa key="e" texto="Tu postulación fue enviada" />)

      act(() => {
        screen
          .getByRole("button", { name: "Avisar Tu postulación fue enviada" })
          .click()
      })
      expect(screen.getByRole("status")).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(7000)
      })

      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument(),
      )
    } finally {
      jest.useRealTimers()
    }
  })
})
