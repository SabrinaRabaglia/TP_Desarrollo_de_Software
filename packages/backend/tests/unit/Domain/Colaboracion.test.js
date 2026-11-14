import { expect, test } from "@jest/globals"
import Postulacion from "../../../src/domain/Postulacion.js"
import Perfil from "../../../src/domain/Perfil.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import { EstadoPostulacion } from "../../../src/domain/enums/EstadoPostulacion.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../../src/domain/errors/DomainErrors.js"

const habilidadConId = () => {
  const habilidad = new Habilidad("JavaScript", "javascript", "Desarrollo web")
  habilidad.id = "hab-1"
  return habilidad
}

const personaConHabilidad = () => {
  const persona = new PersonaColaboradora("Ana")
  persona.agregarHabilidad(habilidadConId())
  return persona
}

const perfilValido = (habilidadesRequeridas = ["hab-1"]) =>
  new Perfil({
    descripcion: "Desarrollo web",
    unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
    cantidadHoras: 5,
    modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
    habilidadesRequeridas,
    habilidadesOpcionales: ["hab-1"],
  })

test("la postulación exige ambas entidades y registra la fecha de postulación", () => {
  const persona = personaConHabilidad()
  const perfil = perfilValido()
  const antes = Date.now()
  const postulacion = new Postulacion(persona, perfil)

  expect(postulacion.personaColaboradora).toBe(persona)
  expect(postulacion.perfil).toBe(perfil)
  expect(postulacion.esAnonima).toBe(false)
  expect(postulacion.estado).toBe(EstadoPostulacion.PENDIENTE)
  expect(postulacion.fechaRevision).toBeNull()
  expect(postulacion.fechaPostulacion.getTime()).toBeGreaterThanOrEqual(antes)
  expect(postulacion.fechaPostulacion.getTime()).toBeLessThanOrEqual(Date.now())

  const postulacionAnonima = new Postulacion(persona, perfil, true)
  expect(postulacionAnonima.esAnonima).toBe(true)

  expect(() => new Postulacion(null, perfil)).toThrow(DomainValidationError)
  expect(() => new Postulacion(persona, null)).toThrow(DomainValidationError)
})

test("rechaza postularse sin una habilidad requerida", () => {
  const persona = new PersonaColaboradora("Ana")
  const perfil = perfilValido()

  expect(() => new Postulacion(persona, perfil)).toThrow(DomainRuleError)
})

test("aceptar y rechazar cambian el estado y registran la fecha de revisión", () => {
  const persona = personaConHabilidad()
  const perfil = perfilValido()
  const postulacion = new Postulacion(persona, perfil)

  postulacion.aceptar()
  expect(postulacion.estado).toBe(EstadoPostulacion.ACEPTADA)
  expect(postulacion.fechaRevision).toBeInstanceOf(Date)
  expect(() => postulacion.aceptar()).toThrow(DomainRuleError)
  expect(() => postulacion.rechazar()).toThrow(DomainRuleError)

  const otra = new Postulacion(persona, perfil)
  otra.rechazar()
  expect(otra.estado).toBe(EstadoPostulacion.RECHAZADA)
  expect(otra.fechaRevision).toBeInstanceOf(Date)
  expect(() => otra.rechazar()).toThrow(DomainRuleError)
})
