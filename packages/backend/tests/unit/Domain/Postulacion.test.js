import { expect, test } from "@jest/globals"
import mongoose from "mongoose"
import Postulacion from "../../../src/domain/Postulacion.js"
import Perfil from "../../../src/domain/Perfil.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import { EstadoPostulacion } from "../../../src/domain/enums/EstadoPostulacion.js"
import { OrigenBaja } from "../../../src/domain/enums/OrigenBaja.js"
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

test.each(Object.values(OrigenBaja))(
  "dar de baja una postulación aceptada registra la fecha y el origen %s",
  (origen) => {
    const postulacion = new Postulacion(personaConHabilidad(), perfilValido())
    postulacion.aceptar()
    const antes = Date.now()

    postulacion.darDeBaja(origen)

    expect(postulacion.estado).toBe(EstadoPostulacion.BAJA)
    expect(postulacion.origenBaja).toBe(origen)
    expect(postulacion.fechaBaja.getTime()).toBeGreaterThanOrEqual(antes)
    expect(postulacion.fechaBaja.getTime()).toBeLessThanOrEqual(Date.now())
  },
)

test("solo se da de baja una postulación aceptada, y una sola vez", () => {
  const persona = personaConHabilidad()
  const perfil = perfilValido()
  const pendiente = new Postulacion(persona, perfil)
  const rechazada = new Postulacion(persona, perfil)
  rechazada.rechazar()
  const dadaDeBaja = new Postulacion(persona, perfil)
  dadaDeBaja.aceptar()
  dadaDeBaja.darDeBaja(OrigenBaja.COLECTIVO)

  for (const postulacion of [pendiente, rechazada, dadaDeBaja]) {
    expect(() =>
      postulacion.darDeBaja(OrigenBaja.PERSONA_COLABORADORA),
    ).toThrow(DomainRuleError)
  }
  expect(pendiente.fechaBaja).toBeNull()
  expect(dadaDeBaja.origenBaja).toBe(OrigenBaja.COLECTIVO)
  // La baja es permanente: no se puede volver a aceptar.
  expect(() => dadaDeBaja.aceptar()).toThrow(DomainRuleError)
})

test("rechaza un origen de baja inválido sin cambiar la postulación", () => {
  const postulacion = new Postulacion(personaConHabilidad(), perfilValido())
  postulacion.aceptar()

  expect(() => postulacion.darDeBaja("ADMIN")).toThrow(DomainValidationError)
  expect(postulacion.estado).toBe(EstadoPostulacion.ACEPTADA)
  expect(postulacion.fechaBaja).toBeNull()
})

test("es de la persona con el mismo id, venga como ObjectId o como texto", () => {
  const postulacion = new Postulacion(personaConHabilidad(), perfilValido())
  const personaId = new mongoose.Types.ObjectId()
  // Como queda al leerla de Mongo: solo el id de la persona.
  postulacion.personaColaboradora = personaId

  expect(postulacion.esDe(personaId)).toBe(true)
  expect(postulacion.esDe(personaId.toString())).toBe(true)
  expect(postulacion.esDe(new mongoose.Types.ObjectId(personaId))).toBe(true)
  expect(postulacion.esDe(new mongoose.Types.ObjectId())).toBe(false)
})
