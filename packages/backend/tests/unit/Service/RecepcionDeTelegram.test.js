import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import RecepcionDeTelegram from "../../../src/services/RecepcionDeTelegram.js"

const mensajePrivado = (update_id, texto, chatId = 42) => ({
  update_id,
  message: { chat: { id: chatId, type: "private" }, text: texto },
})

describe("RecepcionDeTelegram", () => {
  let telegram
  let conexion
  let pausar
  let recepcion

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    telegram = {
      obtenerNovedades: jest.fn(async () => []),
      enviarMensaje: jest.fn(async () => {}),
    }
    conexion = {
      atenderMensaje: jest.fn(async ({ texto }) => `Respuesta a ${texto}`),
    }
    pausar = jest.fn(async () => {})
    recepcion = new RecepcionDeTelegram(telegram, conexion, {
      esperaSeg: 25,
      pausaTrasErrorMs: 5000,
      pausar,
    })
  })

  const desdeDeLaUltimaConsulta = () =>
    telegram.obtenerNovedades.mock.lastCall[0].desde

  test("responde cada mensaje privado en su chat", async () => {
    telegram.obtenerNovedades.mockResolvedValueOnce([
      mensajePrivado(10, "/start abc", 42),
      mensajePrivado(11, "hola", 43),
    ])

    await recepcion.procesarTanda()

    expect(conexion.atenderMensaje).toHaveBeenCalledWith({
      chatId: 42,
      texto: "/start abc",
    })
    expect(telegram.enviarMensaje.mock.calls).toEqual([
      [42, "Respuesta a /start abc"],
      [43, "Respuesta a hola"],
    ])
  })

  test("la próxima tanda pide desde la novedad siguiente a la última", async () => {
    telegram.obtenerNovedades.mockResolvedValueOnce([
      mensajePrivado(10, "a"),
      mensajePrivado(11, "b"),
    ])

    await recepcion.procesarTanda()
    expect(desdeDeLaUltimaConsulta()).toBeUndefined()
    await recepcion.procesarTanda()

    expect(desdeDeLaUltimaConsulta()).toBe(12)
    expect(telegram.obtenerNovedades.mock.lastCall[0].esperaSeg).toBe(25)
  })

  test("una novedad que falla al atenderse no se vuelve a pedir ni frena a las demás", async () => {
    conexion.atenderMensaje.mockRejectedValueOnce(new Error("Mongo caído"))
    telegram.obtenerNovedades.mockResolvedValueOnce([
      mensajePrivado(10, "a"),
      mensajePrivado(11, "b"),
    ])

    await recepcion.procesarTanda()
    await recepcion.procesarTanda()

    expect(telegram.enviarMensaje).toHaveBeenCalledWith(42, "Respuesta a b")
    expect(desdeDeLaUltimaConsulta()).toBe(12)
  })

  test("si Telegram no responde, lo registra y espera antes de reintentar", async () => {
    telegram.obtenerNovedades.mockRejectedValueOnce(
      new Error("Telegram respondió 409: Conflict"),
    )

    await expect(recepcion.procesarTanda()).resolves.toBeUndefined()

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Telegram respondió 409: Conflict"),
    )
    expect(pausar).toHaveBeenCalledWith(5000)
  })

  test.each([
    [
      "un grupo",
      { message: { chat: { id: -5, type: "group" }, text: "/start abc" } },
    ],
    [
      "un mensaje sin texto",
      { message: { chat: { id: 42, type: "private" }, sticker: {} } },
    ],
    ["una novedad que no es un mensaje", { edited_message: {} }],
  ])("ignora %s pero avanza igual", async (_caso, novedad) => {
    telegram.obtenerNovedades.mockResolvedValueOnce([
      { update_id: 10, ...novedad },
    ])

    await recepcion.procesarTanda()
    await recepcion.procesarTanda()

    expect(conexion.atenderMensaje).not.toHaveBeenCalled()
    expect(telegram.enviarMensaje).not.toHaveBeenCalled()
    expect(desdeDeLaUltimaConsulta()).toBe(11)
  })

  test("iniciar escucha sin bloquear y detener corta el loop", async () => {
    let tandas = 0
    telegram.obtenerNovedades.mockImplementation(async () => {
      tandas += 1
      if (tandas === 3) {
        recepcion.detener()
      }
      return []
    })

    recepcion.iniciar()
    expect(tandas).toBe(1)
    await recepcion.escuchando

    expect(tandas).toBe(3)
  })
})
