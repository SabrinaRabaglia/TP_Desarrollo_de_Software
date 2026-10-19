import { describe, expect, test } from "@jest/globals";
import { Hito } from "../../../src/domain/Hito.js";

describe("Hito (Dominio)", () => {
  const datosValidos = {
    fecha: "2026-10-15",
    porcentajeConcrecion: 50,
    descripcion: "Se completó la mitad del desarrollo",
    proyecto: "proyecto-id-123"
  };

  test("Crea una instancia de Hito correctamente con datos válidos", () => {
    const hito = new Hito(
      datosValidos.fecha, 
      datosValidos.porcentajeConcrecion, 
      datosValidos.descripcion, 
      datosValidos.proyecto
    );

    expect(hito.porcentajeConcrecion).toBe(50);
    expect(hito.descripcion).toBe(datosValidos.descripcion);
    expect(hito.proyecto).toBe(datosValidos.proyecto);
    expect(hito.fecha).toBeInstanceOf(Date);
  });

  test("Lanza un error si el porcentaje de concreción es menor a 0", () => {
    const crearHitoInvalido = () => new Hito(
      datosValidos.fecha, 
      -10, // Inválido
      datosValidos.descripcion, 
      datosValidos.proyecto
    );

    expect(crearHitoInvalido).toThrow(); // Puedes especificar DomainValidationError si lo implementaste en la clase
  });

  test("Lanza un error si el porcentaje de concreción es mayor a 100", () => {
    const crearHitoInvalido = () => new Hito(
      datosValidos.fecha, 
      110, // Inválido
      datosValidos.descripcion, 
      datosValidos.proyecto
    );

    expect(crearHitoInvalido).toThrow();
  });
});