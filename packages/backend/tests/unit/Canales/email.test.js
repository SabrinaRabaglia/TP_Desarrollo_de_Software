import { describe, expect, jest, test } from "@jest/globals"
import {
  ASUNTO,
  canalEmail,
  canalEmailSMTP,
  opcionesSMTP,
} from "../../../src/canales/email.js"

describe("configuración del transporte SMTP", () => {
  const base = { SMTP_HOST: "smtp.example.com", SMTP_USER: "u", SMTP_PASS: "p" }

  test("en el 587 exige STARTTLS y en el 465 usa TLS implícito", () => {
    expect(opcionesSMTP({ ...base, SMTP_PORT: "587" })).toMatchObject({
      port: 587,
      secure: false,
      requireTLS: true,
    })
    expect(opcionesSMTP({ ...base, SMTP_PORT: "465" })).toMatchObject({
      port: 465,
      secure: true,
      requireTLS: false,
    })
  })

  test("sin puerto usa el 587 y sin usuario no manda credenciales", () => {
    const opciones = opcionesSMTP({ SMTP_HOST: "smtp.example.com" })

    expect(opciones.port).toBe(587)
    expect(opciones.auth).toBeUndefined()
  })

  test("acota cada etapa de la conexión con un timeout", () => {
    expect(opcionesSMTP(base)).toMatchObject({
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })
  })

  test("un usuario sin contraseña falla al configurar, no en el primer envío", () => {
    expect(() => opcionesSMTP({ SMTP_HOST: "h", SMTP_USER: "u" })).toThrow(
      "SMTP_USER está definido pero falta SMTP_PASS",
    )
  })

  test("el remitente es EMAIL_FROM y, si falta, el usuario SMTP", async () => {
    const transporte = { sendMail: jest.fn().mockResolvedValue({}) }
    const crearTransporte = jest.fn().mockReturnValue(transporte)

    await canalEmailSMTP(base, crearTransporte).enviar("a@b.c", "Hola")

    expect(crearTransporte).toHaveBeenCalledWith(opcionesSMTP(base))
    expect(transporte.sendMail.mock.calls[0][0].from).toBe("u")
  })
})

describe("canal de email", () => {
  test("manda un correo de texto al destinatario con el remitente configurado", async () => {
    const transporte = { sendMail: jest.fn().mockResolvedValue({}) }

    await canalEmail(transporte, "avisos@codigoavoluntad.org").enviar(
      "ana@example.com",
      "Tu perfil encaja con un proyecto",
    )

    expect(transporte.sendMail).toHaveBeenCalledWith({
      from: "avisos@codigoavoluntad.org",
      to: "ana@example.com",
      subject: ASUNTO,
      text: "Tu perfil encaja con un proyecto",
    })
  })

  test("propaga el error del transporte", async () => {
    const transporte = {
      sendMail: jest.fn().mockRejectedValue(new Error("SMTP caído")),
    }

    await expect(
      canalEmail(transporte, "avisos@example.com").enviar("a@b.c", "Hola"),
    ).rejects.toThrow("SMTP caído")
  })
})
