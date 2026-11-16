import api from "./api"
import {
  actualizarColectivo,
  obtenerCatalogosDeColectivo,
  obtenerColectivo,
  obtenerColectivoPropio,
  registrarColectivo,
} from "./colectivosService"

jest.mock("./api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}))

const colectivoBack = {
  id: "c1",
  nombre: "Huerta Comunitaria Sur",
  descripcion: "Huerta barrial",
  tipo: "Asociación barrial",
  pais: { id: "pais-1", nombre: "Argentina" },
  provincia: { id: "prov-1", nombre: "Buenos Aires" },
  ciudad: "Lanús",
}

const sinUbicacion = { ...colectivoBack, pais: null, provincia: null }

test("registra el colectivo con su cuenta y manda null en la ubicación que quedó vacía", async () => {
  api.post.mockResolvedValue({ data: { id: "u1" } })

  await registrarColectivo({
    email: "huerta@colectivo.test",
    contrasena: "secreto123",
    colectivo: {
      nombre: " Huerta Comunitaria Sur ",
      descripcion: "Huerta barrial\n",
      tipo: "ONG",
      pais: "",
      provincia: "",
      ciudad: "  ",
    },
  })

  expect(api.post).toHaveBeenCalledWith("/auth/registro/colectivo", {
    email: "huerta@colectivo.test",
    contrasena: "secreto123",
    colectivo: {
      nombre: "Huerta Comunitaria Sur",
      descripcion: "Huerta barrial",
      tipo: "ONG",
      pais: null,
      provincia: null,
      ciudad: null,
    },
  })
})

test("actualiza el colectivo con los ids del país y la provincia elegidos", async () => {
  api.put.mockResolvedValue({ data: colectivoBack })

  await actualizarColectivo("c1", {
    nombre: "Huerta Comunitaria Sur",
    descripcion: "Huerta barrial",
    tipo: "ONG",
    pais: "pais-1",
    provincia: "prov-1",
    ciudad: "Lanús",
  })

  expect(api.put).toHaveBeenCalledWith("/colectivos/c1", {
    nombre: "Huerta Comunitaria Sur",
    descripcion: "Huerta barrial",
    tipo: "ONG",
    pais: "pais-1",
    provincia: "prov-1",
    ciudad: "Lanús",
  })
})

test("la página pública recibe la ubicación en un solo texto, de lo más chico a lo más grande", async () => {
  api.get.mockResolvedValue({ data: colectivoBack })

  expect(await obtenerColectivo("c1")).toEqual({
    id: "c1",
    nombre: "Huerta Comunitaria Sur",
    descripcion: "Huerta barrial",
    tipo: "Asociación barrial",
    ubicacion: "Lanús, Buenos Aires, Argentina",
  })
  expect(api.get).toHaveBeenCalledWith("/colectivos/c1")
})

test("sin ningún dato de ubicación, la página pública recibe null", async () => {
  api.get.mockResolvedValue({ data: { ...sinUbicacion, ciudad: null } })

  expect((await obtenerColectivo("c1")).ubicacion).toBeNull()
})

test("el formulario de edición recibe los ids de la ubicación y texto vacío donde no hay dato", async () => {
  api.get.mockResolvedValueOnce({ data: colectivoBack })
  expect(await obtenerColectivoPropio("c1")).toEqual({
    nombre: "Huerta Comunitaria Sur",
    descripcion: "Huerta barrial",
    tipo: "Asociación barrial",
    pais: "pais-1",
    provincia: "prov-1",
    ciudad: "Lanús",
  })

  api.get.mockResolvedValueOnce({ data: { ...sinUbicacion, ciudad: null } })
  expect(await obtenerColectivoPropio("c1")).toMatchObject({
    pais: "",
    provincia: "",
    ciudad: "",
  })
})

test("trae los tres catálogos del formulario", async () => {
  const respuestas = {
    "/tipos-de-colectivo": [{ id: "t1", nombre: "ONG", createdAt: "hoy" }],
    "/paises": [{ id: "pais-1", nombre: "Argentina" }],
    "/provincias": [{ id: "prov-1", nombre: "Buenos Aires" }],
  }
  api.get.mockImplementation(async (ruta) => ({ data: respuestas[ruta] }))

  expect(await obtenerCatalogosDeColectivo()).toEqual({
    tipos: [{ id: "t1", nombre: "ONG" }],
    paises: [{ id: "pais-1", nombre: "Argentina" }],
    provincias: [{ id: "prov-1", nombre: "Buenos Aires" }],
  })
})
