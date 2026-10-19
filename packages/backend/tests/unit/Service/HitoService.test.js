import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import HitoService from "../../../src/services/HitoService.js";
import HitoRepository from "../../../src/repositories/HitoRepository.js";
import { NotFoundError } from "../../../src/errors/AppError.js";

describe("HitoService", () => {
  let hitoService;
  let mockProyectoService;
  let mockHitoRepository;

  const proyectoId = "proyecto-1";
  const hitoDto = {
    fecha: "2026-10-15",
    porcentajeConcrecion: 25,
    descripcion: "Fase inicial"
  };

  beforeEach(() => {
    // Limpiamos el array estático para evitar colisiones entre tests (Universos Paralelos)
    HitoRepository.hitos = [];
    
    // Instanciamos los repositorios y servicios reales/simulados
    mockHitoRepository = new HitoRepository();
    
    // Simulamos ProyectoService para que valide la existencia del proyecto sin depender de su base de datos
    mockProyectoService = {
      getById: jest.fn().mockResolvedValue({ id: proyectoId, hitos: [] }),
      update: jest.fn().mockResolvedValue(true)
    };

    hitoService = new HitoService(mockHitoRepository, mockProyectoService);
  });

  describe("create", () => {
    test("crea y guarda un hito asociado a un proyecto existente", async () => {
      const nuevoHito = await hitoService.create(proyectoId, hitoDto);

      expect(nuevoHito).toBeDefined();
      expect(nuevoHito.porcentajeConcrecion).toBe(25);
      expect(nuevoHito.proyecto).toBe(proyectoId);
      
      const hitosGuardados = await mockHitoRepository.findByProyectoId(proyectoId);
      expect(hitosGuardados).toHaveLength(1);
    });

    test("rechaza la creación y lanza NotFoundError si el proyecto no existe", async () => {
      // Forzamos al mock a simular que el proyecto no fue encontrado
      mockProyectoService.getById.mockRejectedValue(new NotFoundError("PROYECTO NO ENCONTRADO!"));

      await expect(hitoService.create("id-inexistente", hitoDto)).rejects.toThrow(NotFoundError);
      
      const hitosGuardados = await mockHitoRepository.findByProyectoId("id-inexistente");
      expect(hitosGuardados).toEqual([]); // Se verifica con asincronismo para evitar el error de Promise[cite: 1]
    });
  });

  describe("getByProyectoId", () => {
    test("devuelve los hitos de un proyecto", async () => {
      await hitoService.create(proyectoId, hitoDto);
      
      const hitos = await hitoService.getByProyectoId(proyectoId);
      
      expect(hitos).toHaveLength(1);
      expect(hitos[0].descripcion).toBe("Fase inicial");
    });
  });

  describe("update", () => {
    test("actualiza parcialmente los datos de un hito existente", async () => {
      const hitoCreado = await hitoService.create(proyectoId, hitoDto);
      
      const actualizado = await hitoService.update(hitoCreado.id, {
        porcentajeConcrecion: 50,
        descripcion: "Mitad del proyecto"
      });

      expect(actualizado.porcentajeConcrecion).toBe(50);
      expect(actualizado.descripcion).toBe("Mitad del proyecto");
      // La fecha debería mantenerse intacta si no se pasó en el objeto parcial
    });

    test("lanza NotFoundError si se intenta actualizar un hito inexistente", async () => {
      await expect(
        hitoService.update("hito-inexistente", { porcentajeConcrecion: 100 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    test("elimina un hito correctamente si existe", async () => {
      const hitoCreado = await hitoService.create(proyectoId, hitoDto);
      
      await hitoService.delete(hitoCreado.id);
      
      const hitosRestantes = await mockHitoRepository.findByProyectoId(proyectoId);
      expect(hitosRestantes).toHaveLength(0);
    });

    test("lanza NotFoundError si intenta eliminar un hito inexistente", async () => {
      await expect(
        hitoService.delete("hito-inexistente")
      ).rejects.toThrow(NotFoundError);
    });
  });
});