import { describe, expect, jest, test } from "@jest/globals"
import { canalTelegram } from "../../../src/canales/telegram.js"

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
})

describe("canal de Telegram", () => {
  test("manda el mensaje al chat por la Bot API con el token", async () => {
    const http = jest.fn().mockResolvedValue(respuesta(200, { ok: true }))

    await canalTelegram("123:abc", http).enviar("987654321", "Hola Ana")

    expect(http).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123:abc/sendMessage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "987654321", text: "Hola Ana" }),
        signal: expect.any(AbortSignal),
      },
    )
  })

  test("convierte una respuesta de error de Telegram en una excepción con su detalle", async () => {
    const http = jest.fn().mockResolvedValue(
      respuesta(400, {
        ok: false,
        description: "Bad Request: chat not found",
      }),
    )

    await expect(
      canalTelegram("123:abc", http).enviar("1", "Hola"),
    ).rejects.toThrow("Telegram respondió 400: Bad Request: chat not found")
  })

  test("falla también si el cuerpo no es JSON", async () => {
    const http = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("no es JSON")
      },
    })

    await expect(
      canalTelegram("123:abc", http).enviar("1", "Hola"),
    ).rejects.toThrow("Telegram respondió 502: sin detalle")
  })
})
