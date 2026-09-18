import { expect, test } from "@jest/globals"
import Colaboracion from "../../../src/domain/Colaboracion.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

test("la colaboración exige ambas entidades y registra la fecha de inscripción", () => {
  const persona = { id: "persona-1" }
  const proyecto = { id: "proyecto-1" }
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
