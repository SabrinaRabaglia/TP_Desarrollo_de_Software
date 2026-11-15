import { describe, expect, jest, test } from "@jest/globals"
import {
  canalTelegram,
  clienteTelegram,
} from "../../../src/canales/telegram.js"

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

describe("cliente de Telegram", () => {
  const llamada = (http) => {
    const [url, opciones] = http.mock.calls[0]
    return { url, metodo: opciones.method, cuerpo: JSON.parse(opciones.body) }
  }

  test("pide las novedades desde un offset, esperando en el servidor de Telegram", async () => {
    const novedades = [{ update_id: 7, message: { text: "hola" } }]
    const http = jest
      .fn()
      .mockResolvedValue(respuesta(200, { ok: true, result: novedades }))

    const resultado = await clienteTelegram("123:abc", http).obtenerNovedades({
      desde: 7,
      esperaSeg: 25,
    })

    expect(resultado).toEqual(novedades)
    expect(llamada(http)).toEqual({
      url: "https://api.telegram.org/bot123:abc/getUpdates",
      metodo: "POST",
      cuerpo: { offset: 7, timeout: 25, allowed_updates: ["message"] },
    })
  })

  test("no corta el pedido de novedades antes de que Telegram termine de esperar", async () => {
    const timeout = jest.spyOn(AbortSignal, "timeout")
    const http = jest
      .fn()
      .mockResolvedValue(respuesta(200, { ok: true, result: [] }))

    await clienteTelegram("123:abc", http).obtenerNovedades({ esperaSeg: 25 })

    expect(timeout.mock.calls[0][0]).toBeGreaterThan(25_000)
    timeout.mockRestore()
  })

  test("sin offset pide desde el principio", async () => {
    const http = jest
      .fn()
      .mockResolvedValue(respuesta(200, { ok: true, result: [] }))

    await clienteTelegram("123:abc", http).obtenerNovedades({ esperaSeg: 25 })

    expect(llamada(http).cuerpo).toEqual({
      timeout: 25,
      allowed_updates: ["message"],
    })
  })

  test("consulta los datos del bot", async () => {
    const http = jest.fn().mockResolvedValue(
      respuesta(200, {
        ok: true,
        result: { id: 1, is_bot: true, username: "CodigoAVoluntadBot" },
      }),
    )

    const bot = await clienteTelegram("123:abc", http).obtenerBot()

    expect(bot.username).toBe("CodigoAVoluntadBot")
    expect(llamada(http)).toMatchObject({
      url: "https://api.telegram.org/bot123:abc/getMe",
      metodo: "POST",
    })
  })

  test("manda un mensaje a un chat", async () => {
    const http = jest.fn().mockResolvedValue(respuesta(200, { ok: true }))

    await clienteTelegram("123:abc", http).enviarMensaje(42, "Listo")

    expect(llamada(http)).toEqual({
      url: "https://api.telegram.org/bot123:abc/sendMessage",
      metodo: "POST",
      cuerpo: { chat_id: 42, text: "Listo" },
    })
  })

  test("un error de la API se convierte en una excepción con su detalle", async () => {
    const http = jest.fn().mockResolvedValue(
      respuesta(409, {
        ok: false,
        description: "Conflict: terminated by other getUpdates request",
      }),
    )

    await expect(
      clienteTelegram("123:abc", http).obtenerNovedades({ esperaSeg: 25 }),
    ).rejects.toThrow(
      "Telegram respondió 409: Conflict: terminated by other getUpdates request",
    )
  })
})
