import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import HitoService from "../../../src/services/HitoService.js";
import { Hito } from "../../../src/domain/Hito.js";
import { EntityNotFound} from "../../../src/errors/ApplicationErrors.js";
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js";

describe("HitoService (Modelo Embebido)", () => {
  let hitoService;
  let proyectoServiceMock;
  let proyectoMock;

  beforeEach(() => {
    // Simulamos un proyecto con el array de hitos embebido
    proyectoMock = {
      id: "proyecto-123",
      titulo: "Proyecto Colaborativo",
      hitos: [],
    };

    // Mockeamos el servicio de proyectos
    proyectoServiceMock = {
      getById: jest.fn().mockResolvedValue(proyectoMock),
      update: jest.fn().mockResolvedValue(proyectoMock),
      findByHitoId: jest.fn().mockResolvedValue(proyectoMock),
    };

    hitoService = new HitoService(proyectoServiceMock);
  });

  test("crea y agrega un hito al proyecto correctamente", async () => {
    const dto = {
      fecha: "2026-10-01",
      porcentajeConcrecion: 50,
      descripcion: "Avance de la fase 1",
    };

    const resultado = await hitoService.create("proyecto-123", dto);

    expect(resultado).toBeInstanceOf(Hito);
    expect(resultado.porcentajeConcrecion).toBe(50);
    expect(resultado.descripcion).toBe("Avance de la fase 1");
    expect(proyectoMock.hitos).toHaveLength(1);
    expect(proyectoServiceMock.update).toHaveBeenCalledWith("proyecto-123", { hitos: proyectoMock.hitos });
  });

  test("rechaza un hito con porcentaje de concreción inválido (> 100)", async () => {
    const dto = {
      fecha: "2026-10-01",
      porcentajeConcrecion: 150, // Inválido
      descripcion: "Error",
    };

    await expect(
      hitoService.create("proyecto-123", dto)
    ).rejects.toThrow(DomainValidationError);

    expect(proyectoMock.hitos).toHaveLength(0);
  });

  test("devuelve la lista de hitos de un proyecto existente", async () => {
    proyectoMock.hitos = [new Hito(new Date(), 25, "Hito previo")];

    const hitos = await hitoService.getByProyectoId("proyecto-123");

    expect(hitos).toHaveLength(1);
    expect(hitos[0].porcentajeConcrecion).toBe(25);
  });

  test("lanza EntityNotFound si intenta actualizar un hito que no pertenece a ningún proyecto", async () => {
    proyectoServiceMock.findByHitoId.mockResolvedValue(null);

    await expect(
      hitoService.update("hito-falso", { descripcion: "Cambio" })
    ).rejects.toThrow(EntityNotFound);
  });
});