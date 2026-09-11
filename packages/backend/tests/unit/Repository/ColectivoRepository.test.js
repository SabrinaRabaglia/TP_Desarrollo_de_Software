import { describe, expect, test } from "@jest/globals"
import ColectivoRepository from "../../../src/repositories/ColectivoRepository.js";

describe("ColectivoRepository", () => {
  test("findAll devuelve un array vacío si no se guardó nada", () => {
    const repository = new ColectivoRepository();
    const colectivos = repository.findAll();

    expect(colectivos).toEqual([]);
  });

  test("save agrega un colectivo nuevo si su id no existe todavía", () => {
    const repository = new ColectivoRepository();
    const colectivo = { id: "1", nombre: "Asamblea Ambiental", tipo: "asamblea" };
    const guardado = repository.save(colectivo);

    expect(guardado).toBe(colectivo);
    expect(repository.findAll()).toEqual([colectivo]);
  });

  test("save pisa el colectivo existente si el id ya está guardado (upsert)", () => {
    const repository = new ColectivoRepository();
    const colectivoOriginal = { id: "1", nombre: "Asamblea Ambiental", tipo: "asamblea" };
    repository.save(colectivoOriginal);
    const colectivoActualizado = { id: "1", nombre: "Asamblea Ambiental del Sur", tipo: "asamblea" };
    repository.save(colectivoActualizado);

    expect(repository.findAll()).toHaveLength(1);
    expect(repository.findAll()[0].nombre).toBe("Asamblea Ambiental del Sur");
  });

  test("findById encuentra el colectivo correcto por id", () => {
    const repository = new ColectivoRepository();
    const colectivo1 = { id: "1", nombre: "Asamblea Ambiental" };
    const colectivo2 = { id: "2", nombre: "Colectivo Comunitario" };
    repository.save(colectivo1);
    repository.save(colectivo2);
    const encontrado = repository.findById("2");

    expect(encontrado).toBe(colectivo2);
  });

  test("findById devuelve undefined si no existe ninguno con ese id", () => {
    const repository = new ColectivoRepository();
    const encontrado = repository.findById("id-inexistente");

    expect(encontrado).toBeUndefined();
  });

  test("findByNombre encuentra el colectivo correcto por nombre", () => {
    const repository = new ColectivoRepository();
    const colectivo = { id: "1", nombre: "Asamblea Ambiental" };
    repository.save(colectivo);
    const encontrado = repository.findByNombre("Asamblea Ambiental");

    expect(encontrado).toBe(colectivo);
  });

  test("findByNombre devuelve undefined si no existe ninguno con ese nombre", () => {
    const repository = new ColectivoRepository();
    const encontrado = repository.findByNombre("no-existe");

    expect(encontrado).toBeUndefined();
  });

  test("delete borra el colectivo de la colección", () => {
    const repository = new ColectivoRepository();
    const colectivo = { id: "1", nombre: "Asamblea Ambiental" };
    repository.save(colectivo);
    repository.delete("1");

    expect(repository.findAll()).toEqual([]);
  });

  test("delete no modifica la colección si el id no existe", () => {
    const repository = new ColectivoRepository();
    const colectivo = { id: "1", nombre: "Asamblea Ambiental" };
    repository.save(colectivo);
    repository.delete("id-inexistente");

    expect(repository.findAll()).toEqual([colectivo]);
  });
});