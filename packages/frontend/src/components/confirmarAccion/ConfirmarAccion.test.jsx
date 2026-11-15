import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ConfirmarAccion from "./ConfirmarAccion"

// jsdom no calcula media queries: simulamos el ancho de la pantalla.
// "(max-width:767.95px)" es lo que pide theme.breakpoints.down("md").
const simularAncho = (ancho) => {
  window.matchMedia = (consulta) => {
    const maximo = Number(consulta.match(/max-width:\s*([\d.]+)px/)?.[1])
    return {
      matches: Number.isNaN(maximo) ? false : ancho <= maximo,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }
  }
}

const renderizar = (props = {}) =>
  render(
    <ConfirmarAccion
      abierto
      titulo="Darme de baja"
      mensaje="La baja es permanente y no se puede deshacer."
      textoConfirmar="Sí, darme de baja"
      alConfirmar={jest.fn()}
      alCancelar={jest.fn()}
      {...props}
    />,
  )

const original = window.matchMedia

afterEach(() => {
  window.matchMedia = original
})

describe("ConfirmarAccion", () => {
  test("en el celular ocupa toda la pantalla", () => {
    simularAncho(375)

    renderizar()

    expect(screen.getByRole("dialog", { name: "Darme de baja" })).toHaveClass(
      "MuiDialog-paperFullScreen",
    )
  })

  test("desde tablet se muestra como ventana", () => {
    simularAncho(1024)

    renderizar()

    expect(
      screen.getByRole("dialog", { name: "Darme de baja" }),
    ).not.toHaveClass("MuiDialog-paperFullScreen")
  })

  test("confirma o cancela según el botón", async () => {
    const alConfirmar = jest.fn()
    const alCancelar = jest.fn()
    renderizar({ alConfirmar, alCancelar })

    await userEvent.click(
      screen.getByRole("button", { name: "Sí, darme de baja" }),
    )
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(alConfirmar).toHaveBeenCalledTimes(1)
    expect(alCancelar).toHaveBeenCalledTimes(1)
  })
})
