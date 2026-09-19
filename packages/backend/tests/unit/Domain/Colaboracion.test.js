import { expect, test } from "@jest/globals"
import Colaboracion from "../../../src/domain/Colaboracion.js"
import Proyecto from "../../../src/domain/Proyecto.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
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

const proyectoAbierto = (habilidadesRequeridas = ["hab-1"]) => {
  const proyecto = new Proyecto(
    "Plataforma",
    "Desarrollo web",
    UnidadCompromiso.HORAS_TOTALES,
    5,
    "colectivo-1",
    [ModalidadColaboracion.GRATUITA],
  )
  proyecto.habilidadesRequeridas = habilidadesRequeridas
  return proyecto
}

test("la colaboración exige ambas entidades y registra la fecha de inscripción", () => {
  const persona = personaConHabilidad()
  const proyecto = proyectoAbierto()
  const antes = Date.now()
  const colaboracion = new Colaboracion(persona, proyecto)

  expect(colaboracion.personaColaboradora).toBe(persona)
  expect(colaboracion.proyecto).toBe(proyecto)
  expect(colaboracion.fechaInscripcion.getTime()).toBeGreaterThanOrEqual(antes)
  expect(colaboracion.fechaInscripcion.getTime()).toBeLessThanOrEqual(
    Date.now(),
  )
  expect(() => new Colaboracion(null, proyecto)).toThrow(
    DomainValidationError,
  )
  expect(() => new Colaboracion(persona, null)).toThrow(
    DomainValidationError,
  )
})

test("rechaza colaborar en un proyecto cerrado", () => {
  const persona = personaConHabilidad()
  const proyecto = proyectoAbierto()
  proyecto.cerrar()

  expect(() => new Colaboracion(persona, proyecto)).toThrow(DomainRuleError)
})

test("rechaza colaborar sin una habilidad requerida", () => {
  const persona = new PersonaColaboradora("Ana")
  const proyecto = proyectoAbierto()

  expect(() => new Colaboracion(persona, proyecto)).toThrow(DomainRuleError)
})
