import { beforeEach, describe, expect, test } from "@jest/globals"
import Notificacion from "../../../src/domain/Notificacion.js"
import MedioDeContacto from "../../../src/domain/MedioDeContacto.js"
import { EstadoEnvio } from "../../../src/domain/enums/EstadoEnvio.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("Notificacion", () => {
  let datos
  const medios = [
    new MedioDeContacto("EMAIL", "ana@example.com"),
    new MedioDeContacto("SMS", "+54 9 11 2345-6789"),
  ]

  beforeEach(() => {
    datos = {
      contenido: "Tu perfil encaja con nuestro proyecto",
      colectivo: { nombre: "Huerta Comunitaria Sur" },
      personaColaboradora: { nombreFantasia: "anag" },
      perfil: { descripcion: "Desarrollo frontend" },
    }
  })

  test("se construye con sus datos, la fecha actual y un envío pendiente por cada medio", () => {
    const antes = new Date()

    const notificacion = new Notificacion({
      ...datos,
      mediosDeContacto: medios,
    })

    expect(notificacion).toMatchObject({
      ...datos,
      fecha: expect.any(Date),
      procesandoDesde: null,
      reintentarDesde: null,
      leidaEn: null,
    })
    expect(notificacion.leida).toBe(false)
    expect(notificacion.fecha.getTime()).toBeGreaterThanOrEqual(antes.getTime())
    expect(notificacion.envios).toEqual([
      {
        medio: { tipo: "EMAIL", valor: "ana@example.com" },
        estado: EstadoEnvio.PENDIENTE,
        intentos: 0,
        ultimoError: null,
        enviadoEn: null,
      },
      {
        medio: { tipo: "SMS", valor: "+54 9 11 2345-6789" },
        estado: EstadoEnvio.PENDIENTE,
        intentos: 0,
        ultimoError: null,
        enviadoEn: null,
      },
    ])
    expect(notificacion.pendienteDeEnvio).toBe(true)
    expect(notificacion.mediosExternosUtilizados).toEqual([])
  })

  test("sin medios de contacto no tiene nada pendiente", () => {
    const notificacion = new Notificacion(datos)

    expect(notificacion.envios).toEqual([])
    expect(notificacion.pendienteDeEnvio).toBe(false)
  })

  test.each([
    ["sin contenido", { contenido: undefined }],
    ["con contenido en blanco", { contenido: "   " }],
    ["sin colectivo", { colectivo: undefined }],
    ["sin persona colaboradora", { personaColaboradora: undefined }],
    ["sin perfil", { perfil: undefined }],
  ])("lanza DomainValidationError %s", (_caso, cambio) => {
    expect(() => new Notificacion({ ...datos, ...cambio })).toThrow(
      DomainValidationError,
    )
  })

  test("un envío exitoso deja de estar pendiente y cuenta como medio utilizado", () => {
    const notificacion = new Notificacion({
      ...datos,
      mediosDeContacto: medios,
    })
    const [email, sms] = notificacion.envios
    const fecha = new Date("2026-11-08T12:00:00.000Z")

    notificacion.registrarEnvioExitoso(email, fecha)

    expect(email).toMatchObject({
      estado: EstadoEnvio.ENVIADO,
      intentos: 1,
      enviadoEn: fecha,
    })
    expect(notificacion.enviosPendientes()).toEqual([sms])
    expect(notificacion.mediosExternosUtilizados).toEqual(["EMAIL"])
    expect(notificacion.pendienteDeEnvio).toBe(true)
  })

  test("un envío fallido sigue pendiente hasta agotar los intentos", () => {
    const notificacion = new Notificacion({
      ...datos,
      mediosDeContacto: medios,
    })
    const [email] = notificacion.envios

    notificacion.registrarEnvioFallido(email, "SMTP caído", 3)
    notificacion.registrarEnvioFallido(email, "SMTP caído otra vez", 3)

    expect(email).toMatchObject({
      estado: EstadoEnvio.PENDIENTE,
      intentos: 2,
      ultimoError: "SMTP caído otra vez",
    })

    notificacion.registrarEnvioFallido(email, "SMTP sigue caído", 3)

    expect(email.estado).toBe(EstadoEnvio.FALLIDO)
    expect(notificacion.mediosExternosUtilizados).toEqual([])
  })

  test("liberar suelta el bloqueo y programa el reintento solo si queda algo pendiente", () => {
    const notificacion = new Notificacion({
      ...datos,
      mediosDeContacto: medios,
    })
    const [email, sms] = notificacion.envios
    const reintento = new Date("2026-11-08T12:00:30.000Z")
    notificacion.procesandoDesde = new Date()

    notificacion.registrarEnvioExitoso(email, new Date())
    notificacion.liberar(reintento)
    expect(notificacion.procesandoDesde).toBeNull()
    expect(notificacion.reintentarDesde).toEqual(reintento)

    notificacion.registrarEnvioExitoso(sms, new Date())
    notificacion.liberar(reintento)
    expect(notificacion.reintentarDesde).toBeNull()
  })
})
