import { describe, expect, test } from "@jest/globals";
import ProyectoService from "../../../src/services/ProyectoService.js";
import ProyectoRepository from "../../../src/repositories/ProyectoRepository.js";
import { ConflictError, NotFoundError } from "../../../src/errors/AppError.js";
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js";
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js";
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js";

describe("ProyectoService", () => {
  const dtoProyectoValido = {
    titulo: "Plataforma de Colaboración",
    descripcion: "Plataforma para conectar colectivos sociales",
    unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES || "HORAS_SEMANALES",
    cantHoras: 10,
    colectivo: "Asamblea Ambiental",
    modalidadesColaboracion: [ModalidadColaboracion.REMOTO || "REMOTO"],
    habilidadesRequeridas: ["JS", "Node"],
    estado: EstadoProyecto.PUBLICADO || "PUBLICADO"
  };

  describe("create", () => {
    test("crea y guarda un proyecto cuando el título no existe todavía", () => {
      const service = new ProyectoService(new ProyectoRepository());
      const proyectoCreado = service.create(dtoProyectoValido);

      expect(proyectoCreado.titulo).toBe(dtoProyectoValido.titulo);
      expect(proyectoCreado.descripcion).toBe(dtoProyectoValido.descripcion);
      expect(proyectoCreado.cantHoras).toBe(dtoProyectoValido.cantHoras);
      expect(service.getAll()).toEqual([proyectoCreado]);
    });

    test("tira ConflictError si ya existe un proyecto con el mismo título", () => {
      const service = new ProyectoService(new ProyectoRepository());
      service.create(dtoProyectoValido);

      const crearDuplicado = () =>
        service.create({
          ...dtoProyectoValido,
          descripcion: "Otra descripción"
        });

      expect(crearDuplicado).toThrow(ConflictError);
      expect(service.getAll()).toHaveLength(1);
    });
  });

  describe("getById", () => {
    test("devuelve el proyecto correspondiente cuando se encuentra por ID", () => {
      const service = new ProyectoService(new ProyectoRepository());
      const creado = service.create(dtoProyectoValido);

      const encontrado = service.getById(creado.id);

      expect(encontrado).toBeDefined();
      expect(encontrado.id).toBe(creado.id);
      expect(encontrado.titulo).toBe(dtoProyectoValido.titulo);
    });

    test("lanza NotFoundError si el proyecto no existe", () => {
      const service = new ProyectoService(new ProyectoRepository());

      expect(() => service.getById("id-inexistente")).toThrow(NotFoundError);
    });
  });

  describe("update", () => {
    test("actualiza un proyecto existente correctamente", () => {
      const service = new ProyectoService(new ProyectoRepository());
      const creado = service.create(dtoProyectoValido);

      const actualizado = service.update(creado.id, {
        titulo: "Nuevo Título",
        cantHoras: 20
      });

      expect(actualizado.titulo).toBe("Nuevo Título");
      expect(actualizado.cantHoras).toBe(20);
    });

    test("lanza NotFoundError si intenta actualizar un proyecto inexistente", () => {
      const service = new ProyectoService(new ProyectoRepository());

      expect(() =>
        service.update("id-inexistente", { titulo: "Nuevo" })
      ).toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    test("elimina el proyecto correctamente si existe", () => {
      const service = new ProyectoService(new ProyectoRepository());
      const creado = service.create(dtoProyectoValido);

      service.delete(creado.id);

      expect(service.getAll()).toHaveLength(0);
    });

    test("lanza NotFoundError al intentar eliminar un proyecto inexistente", () => {
      const service = new ProyectoService(new ProyectoRepository());

      expect(() => service.delete("id-inexistente")).toThrow(NotFoundError);
    });
  });
});