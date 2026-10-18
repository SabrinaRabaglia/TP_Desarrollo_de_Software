import { afterEach, describe, expect, jest, test } from "@jest/globals"
import NotificadorExterno from "../../../src/services/NotificadorExterno.js"
import { canalesSimulados } from "../../../src/canales/canalesSimulados.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import MedioDeContacto from "../../../src/domain/MedioDeContacto.js"

const crearPersona = (mediosDeContacto) =>
  new PersonaColaboradora(
    "Ana",
    null,
    null,
    [],
    null,
    [],
    [],
    true,
    mediosDeContacto,
  )

const crearCanales = () => ({
  EMAIL: { enviar: jest.fn(async () => {}) },
  WHATSAPP: { enviar: jest.fn(async () => {}) },
  SMS: { enviar: jest.fn(async () => {}) },
})

describe("NotificadorExterno", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("envía el contenido por cada medio de contacto y devuelve los utilizados", async () => {
    const canales = crearCanales()
    const email = new MedioDeContacto("EMAIL", "ana@example.com")
    const whatsapp = new MedioDeContacto("WHATSAPP", "+54 11 1234-5678")
    const persona = crearPersona([email, whatsapp])

    const utilizados = await new NotificadorExterno(canales).notificar(
      persona,
      "Hay un proyecto para vos",
    )

    expect(utilizados).toEqual([email, whatsapp])
    expect(canales.EMAIL.enviar).toHaveBeenCalledWith(
      "ana@example.com",
      "Hay un proyecto para vos",
    )
    expect(canales.WHATSAPP.enviar).toHaveBeenCalledWith(
      "+54 11 1234-5678",
      "Hay un proyecto para vos",
    )
    expect(canales.SMS.enviar).not.toHaveBeenCalled()
  })

  test("una persona sin medios de contacto no recibe envíos", async () => {
    const canales = crearCanales()

    const utilizados = await new NotificadorExterno(canales).notificar(
      crearPersona([]),
      "Hay un proyecto para vos",
    )

    expect(utilizados).toEqual([])
    for (const canal of Object.values(canales)) {
      expect(canal.enviar).not.toHaveBeenCalled()
    }
  })

  test("si un canal falla, envía por los demás y devuelve solo los que salieron bien", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {})
    const canales = crearCanales()
    canales.WHATSAPP.enviar.mockRejectedValue(new Error("WhatsApp caído"))
    const email = new MedioDeContacto("EMAIL", "ana@example.com")
    const whatsapp = new MedioDeContacto("WHATSAPP", "+54 11 1234-5678")
    const sms = new MedioDeContacto("SMS", "+54 11 8765-4321")

    const utilizados = await new NotificadorExterno(canales).notificar(
      crearPersona([email, whatsapp, sms]),
      "Hola",
    )

    expect(utilizados).toEqual([email, sms])
    expect(canales.EMAIL.enviar).toHaveBeenCalled()
    expect(canales.SMS.enviar).toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(
      "[WHATSAPP] No se pudo enviar la notificación: WhatsApp caído",
    )
  })

  test("los canales simulados registran el envío con el tipo y el destino", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {})

    await new NotificadorExterno().notificar(
      crearPersona([new MedioDeContacto("SMS", "+54 11 1234-5678")]),
      "Hola",
    )

    expect(log).toHaveBeenCalledWith(
      "[SMS] Notificación a +54 11 1234-5678: Hola",
    )
    expect(Object.keys(canalesSimulados)).toEqual(["EMAIL", "WHATSAPP", "SMS"])
  })
})
