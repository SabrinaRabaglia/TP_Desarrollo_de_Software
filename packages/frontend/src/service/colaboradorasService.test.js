import api from "./api"
import { buscarCandidatas } from "./colaboradorasService"

jest.mock("./api", () => ({ __esModule: true, default: { get: jest.fn() } }))

test("busca las candidatas del perfil en la respuesta paginada", async () => {
  api.get.mockResolvedValue({
    data: {
      metadata: { page: 1, limit: 1, total: 1 },
      data: [
        {
          id: "p1",
          nombreFantasia: "anag",
          nombre: "Ana",
          apellido: "Gómez",
          pronombres: ["ella"],
          presentacion: "Desarrolladora frontend",
          habilidades: [
            { id: "h1", titulo: "JavaScript" },
            { id: "h2", titulo: "Diseño UX/UI" },
          ],
          cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
          aceptaMensajeriaInterna: true,
          coincidencia: "PARCIAL",
          habilidadesCoincidentes: ["h1", "h1"],
          habilidadesRequeridasFaltantes: ["h3"],
          habilidadesOpcionalesCubiertas: 1,
        },
      ],
    },
  })

  const candidatas = await buscarCandidatas("perfil-1")

  expect(api.get).toHaveBeenCalledWith("/personas-colaboradoras", {
    params: { perfiles: "perfil-1" },
  })
  expect(candidatas).toEqual([
    {
      id: "p1",
      esAnonima: false,
      nombreFantasia: "anag",
      nombreCompleto: "Ana Gómez",
      pronombres: ["ella"],
      presentacion: "Desarrolladora frontend",
      habilidades: ["JavaScript", "Diseño UX/UI"],
      cuentas: [{ tipo: "GITHUB", usuario: "anagomez" }],
      aceptaMensajeriaInterna: true,
      coincidencia: "PARCIAL",
      habilidadesCoincidentes: ["JavaScript"],
      opcionalesCubiertas: 1,
    },
  ])
})
