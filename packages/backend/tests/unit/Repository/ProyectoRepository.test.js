import { describe, expect, test } from "@jest/globals";
import ProyectoRepository from "../../../src/repositories/ProyectoRepository.js";

describe("ProyectoRepository", () => {
  test("findAll devuelve un array vacío si no se guardó nada", () => {
    const repository = new ProyectoRepository();
    const proyectos = repository.findAll();

    expect(proyectos).toEqual([]);
  });

  test("save agrega un proyecto nuevo si su id no existe todavía", () => {
    const repository = new ProyectoRepository();
    const proyecto = { id: "1", titulo: "Plataforma de Colaboración", cantHoras: 10 };
    const guardado = repository.save(proyecto);

    expect(guardado).toBe(proyecto);
    expect(repository.findAll()).toEqual([proyecto]);
  });

  test("save pisa el proyecto existente si el id ya está guardado (upsert)", () => {
    const repository = new ProyectoRepository();
    const proyectoOriginal = { id: "1", titulo: "Plataforma V1", cantHoras: 10 };
    repository.save(proyectoOriginal);
    const proyectoActualizado = { id: "1", titulo: "Plataforma V2", cantHoras: 15 };
    repository.save(proyectoActualizado);

    expect(repository.findAll()).toHaveLength(1);
    expect(repository.findAll()[0].titulo).toBe("Plataforma V2");
  });

  test("findById encuentra el proyecto correcto por id", () => {
    const repository = new ProyectoRepository();
    const proyecto1 = { id: "1", titulo: "Proyecto 1" };
    const proyecto2 = { id: "2", titulo: "Proyecto 2" };
    repository.save(proyecto1);
    repository.save(proyecto2);
    const encontrado = repository.findById("2");

    expect(encontrado).toBe(proyecto2);
  });

  test("findById devuelve undefined si no existe ninguno con ese id", () => {
    const repository = new ProyectoRepository();
    const encontrado = repository.findById("id-inexistente");

    expect(encontrado).toBeUndefined();
  });

  test("findByTitulo encuentra el proyecto correcto por título", () => {
    const repository = new ProyectoRepository();
    const proyecto = { id: "1", titulo: "Plataforma de Colaboración" };
    repository.save(proyecto);
    const encontrado = repository.findByTitulo("Plataforma de Colaboración");

    expect(encontrado).toBe(proyecto);
  });

  test("findByTitulo devuelve undefined si no existe ninguno con ese título", () => {
    const repository = new ProyectoRepository();
    const encontrado = repository.findByTitulo("no-existe");

    expect(encontrado).toBeUndefined();
  });

  test("delete borra el proyecto de la colección", () => {
    const repository = new ProyectoRepository();
    const proyecto = { id: "1", titulo: "Plataforma de Colaboración" };
    repository.save(proyecto);
    repository.delete("1");

    expect(repository.findAll()).toEqual([]);
  });

  test("delete no modifica la colección si el id no existe", () => {
    const repository = new ProyectoRepository();
    const proyecto = { id: "1", titulo: "Plataforma de Colaboración" };
    repository.save(proyecto);
    repository.delete("id-inexistente");

    expect(repository.findAll()).toEqual([proyecto]);
  });
});