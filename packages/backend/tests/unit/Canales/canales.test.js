import { describe, expect, test } from "@jest/globals"
import { crearCanales } from "../../../src/canales/canales.js"
import { canalesSimulados } from "../../../src/canales/canalesSimulados.js"

describe("elección de canales según el entorno", () => {
  test("sin configuración todos los medios quedan simulados", () => {
    const { canales, simulados } = crearCanales({})

    expect(simulados).toEqual(["EMAIL", "WHATSAPP", "SMS", "TELEGRAM"])
    expect(canales).toEqual(canalesSimulados)
  })

  test("con SMTP y token de Telegram, email y Telegram son reales y el resto sigue simulado", () => {
    const { canales, simulados } = crearCanales({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "avisos@example.com",
      SMTP_PASS: "secreto",
      TELEGRAM_BOT_TOKEN: "123:abc",
    })

    expect(simulados).toEqual(["WHATSAPP", "SMS"])
    expect(canales.EMAIL).not.toBe(canalesSimulados.EMAIL)
    expect(canales.TELEGRAM).not.toBe(canalesSimulados.TELEGRAM)
    expect(canales.WHATSAPP).toBe(canalesSimulados.WHATSAPP)
    expect(canales.SMS).toBe(canalesSimulados.SMS)
    expect(typeof canales.EMAIL.enviar).toBe("function")
    expect(typeof canales.TELEGRAM.enviar).toBe("function")
  })

  test("con solo el token de Telegram el email sigue simulado", () => {
    const { simulados } = crearCanales({ TELEGRAM_BOT_TOKEN: "123:abc" })

    expect(simulados).toEqual(["EMAIL", "WHATSAPP", "SMS"])
  })

  test("un host SMTP sin remitente ni usuario no alcanza para el canal real", () => {
    const { simulados } = crearCanales({ SMTP_HOST: "smtp.example.com" })

    expect(simulados).toContain("EMAIL")
  })

  test("una configuración SMTP a medias hace fallar el arranque", () => {
    expect(() =>
      crearCanales({ SMTP_HOST: "smtp.example.com", SMTP_USER: "u" }),
    ).toThrow("SMTP_USER está definido pero falta SMTP_PASS")
  })
})
