import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import EnvioDeNotificaciones from "../../../src/services/EnvioDeNotificaciones.js"
import Notificacion from "../../../src/domain/Notificacion.js"
import MedioDeContacto from "../../../src/domain/MedioDeContacto.js"
import { EstadoEnvio } from "../../../src/domain/enums/EstadoEnvio.js"
import NotificacionRepository from "../../fakes/NotificacionRepository.js"

describe("EnvioDeNotificaciones", () => {
  let repositorio
  let canales
  let reloj
  let servicio

  const crearNotificacion = async (medios, contenido = "Hola") =>
    await repositorio.save(
      new Notificacion({
        contenido,
        colectivo: { id: "colectivo-1" },
        personaColaboradora: { id: "persona-1" },
        perfil: { id: "perfil-1" },
        mediosDeContacto: medios,
      }),
    )

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    repositorio = new NotificacionRepository()
    canales = {
      EMAIL: { enviar: jest.fn(async () => {}) },
      SMS: { enviar: jest.fn(async () => {}) },
    }
    reloj = new Date("2026-11-08T12:00:00.000Z")
    servicio = new EnvioDeNotificaciones(repositorio, canales, {
      maximoDeIntentos: 3,
      esperaEntreIntentosMs: 30_000,
      bloqueoMs: 5 * 60_000,
      ahora: () => reloj,
    })
  })

  const avanzar = (ms) => {
    reloj = new Date(reloj.getTime() + ms)
  }

  test("envía los pendientes por cada medio y los marca enviados", async () => {
    const notificacion = await crearNotificacion([
      new MedioDeContacto("EMAIL", "ana@example.com"),
      new MedioDeContacto("SMS", "+54 9 11 2345-6789"),
    ])

    expect(await servicio.procesarPendientes()).toBe(1)

    expect(canales.EMAIL.enviar).toHaveBeenCalledWith("ana@example.com", "Hola")
    expect(canales.SMS.enviar).toHaveBeenCalledWith(
      "+54 9 11 2345-6789",
      "Hola",
    )
    expect(notificacion.pendienteDeEnvio).toBe(false)
    expect(notificacion.mediosExternosUtilizados).toEqual(["EMAIL", "SMS"])
    expect(notificacion.envios[0].enviadoEn).toEqual(reloj)
    expect(notificacion.procesandoDesde).toBeNull()
    expect(await servicio.procesarPendientes()).toBe(0)
  })

  test("un canal que falla no frena a los demás y se reintenta en la próxima pasada", async () => {
    canales.SMS.enviar.mockRejectedValueOnce(new Error("SMS caído"))
    const notificacion = await crearNotificacion([
      new MedioDeContacto("EMAIL", "ana@example.com"),
      new MedioDeContacto("SMS", "+54 9 11 2345-6789"),
    ])

    await servicio.procesarPendientes()

    expect(notificacion.mediosExternosUtilizados).toEqual(["EMAIL"])
    expect(notificacion.envios[1]).toMatchObject({
      estado: EstadoEnvio.PENDIENTE,
      intentos: 1,
      ultimoError: "SMS caído",
    })
    expect(notificacion.reintentarDesde).toEqual(
      new Date("2026-11-08T12:00:30.000Z"),
    )

    expect(await servicio.procesarPendientes()).toBe(0)
    expect(canales.SMS.enviar).toHaveBeenCalledTimes(1)

    avanzar(30_000)
    expect(await servicio.procesarPendientes()).toBe(1)
    expect(canales.SMS.enviar).toHaveBeenCalledTimes(2)
    expect(canales.EMAIL.enviar).toHaveBeenCalledTimes(1)
    expect(notificacion.mediosExternosUtilizados).toEqual(["EMAIL", "SMS"])
  })

  test("al agotar los intentos el envío queda fallido y no se vuelve a intentar", async () => {
    canales.EMAIL.enviar.mockRejectedValue(new Error("SMTP caído"))
    const notificacion = await crearNotificacion([
      new MedioDeContacto("EMAIL", "ana@example.com"),
    ])

    for (let intento = 1; intento <= 3; intento++) {
      expect(await servicio.procesarPendientes()).toBe(1)
      avanzar(30_000)
    }

    expect(notificacion.envios[0]).toMatchObject({
      estado: EstadoEnvio.FALLIDO,
      intentos: 3,
      ultimoError: "SMTP caído",
    })
    expect(notificacion.pendienteDeEnvio).toBe(false)
    expect(await servicio.procesarPendientes()).toBe(0)
    expect(canales.EMAIL.enviar).toHaveBeenCalledTimes(3)
  })

  test("no toca una notificación que otro proceso reclamó hace poco, y retoma una trabada hace mucho", async () => {
    const notificacion = await crearNotificacion([
      new MedioDeContacto("EMAIL", "ana@example.com"),
    ])
    notificacion.procesandoDesde = new Date(reloj.getTime() - 60_000)

    expect(await servicio.procesarPendientes()).toBe(0)

    avanzar(5 * 60_000)
    expect(await servicio.procesarPendientes()).toBe(1)
    expect(notificacion.mediosExternosUtilizados).toEqual(["EMAIL"])
  })

  test("procesa las notificaciones de la más vieja a la más nueva, una sola pasada a la vez", async () => {
    const nueva = await crearNotificacion(
      [new MedioDeContacto("EMAIL", "nueva@example.com")],
      "Nueva",
    )
    const vieja = await crearNotificacion(
      [new MedioDeContacto("EMAIL", "vieja@example.com")],
      "Vieja",
    )
    vieja.fecha = new Date(reloj.getTime() - 60_000)

    const primera = servicio.procesarPendientes()
    const segunda = servicio.procesarPendientes()

    expect(segunda).toBe(primera)
    expect(await primera).toBe(2)
    expect(
      canales.EMAIL.enviar.mock.calls.map(([, contenido]) => contenido),
    ).toEqual(["Vieja", "Nueva"])
    expect(nueva.pendienteDeEnvio).toBe(false)
  })

  test("un proceso que se demoró más que el bloqueo no pisa el resultado de quien la retomó", async () => {
    let resolverEnvioLento
    canales.EMAIL.enviar
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolverEnvioLento = resolve)),
      )
      .mockResolvedValue(undefined)
    const notificacion = await crearNotificacion([
      new MedioDeContacto("EMAIL", "ana@example.com"),
    ])

    const lento = servicio.procesarPendientes()
    await new Promise((resolve) => setImmediate(resolve))
    avanzar(6 * 60_000)
    const rapido = new EnvioDeNotificaciones(repositorio, canales, {
      ahora: () => reloj,
    })
    expect(await rapido.procesarPendientes()).toBe(1)
    const reclamoDelRapido = repositorio.reclamos.get(notificacion.id)
    resolverEnvioLento()
    await lento

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("fue retomada por otro proceso"),
    )
    expect(reclamoDelRapido).toBeUndefined()
    expect(notificacion.mediosExternosUtilizados).toEqual(["EMAIL"])
  })

  test("el reintento se cuenta desde el reclamo, no desde el final del envío", async () => {
    canales.EMAIL.enviar.mockImplementationOnce(async () => {
      avanzar(20_000)
      throw new Error("SMTP lento y caído")
    })
    const notificacion = await crearNotificacion([
      new MedioDeContacto("EMAIL", "ana@example.com"),
    ])

    await servicio.procesarPendientes()

    expect(notificacion.reintentarDesde).toEqual(
      new Date("2026-11-08T12:00:30.000Z"),
    )
  })

  test("un canal que rechaza con algo que no es un Error también se registra", async () => {
    canales.EMAIL.enviar.mockRejectedValueOnce("se cayó")
    const notificacion = await crearNotificacion([
      new MedioDeContacto("EMAIL", "ana@example.com"),
    ])

    await servicio.procesarPendientes()

    expect(notificacion.envios[0]).toMatchObject({
      intentos: 1,
      ultimoError: "se cayó",
    })
    expect(notificacion.procesandoDesde).toBeNull()
  })

  test("despertar procesa en segundo plano sin bloquear", async () => {
    const notificacion = await crearNotificacion([
      new MedioDeContacto("EMAIL", "ana@example.com"),
    ])

    servicio.despertar()
    expect(notificacion.pendienteDeEnvio).toBe(true)

    await new Promise((resolve) => setImmediate(resolve))
    await servicio.procesarPendientes()
    expect(notificacion.pendienteDeEnvio).toBe(false)
  })
})
