import { jest } from "@jest/globals"
import express from "express"
import errorHandler from "../../../src/middlewares/errorHandler.js"
import NotificacionController from "../../../src/controllers/NotificacionController.js"
import NotificacionService from "../../../src/services/NotificacionService.js"
import PerfilService from "../../../src/services/PerfilService.js"
import ProyectoService from "../../../src/services/ProyectoService.js"
import ColectivoService from "../../../src/services/ColectivoService.js"
import HabilidadService from "../../../src/services/HabilidadService.js"
import PersonaColaboradoraService from "../../../src/services/PersonaColaboradoraService.js"
import NotificacionRepository from "../../fakes/NotificacionRepository.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import HabilidadRepository from "../../fakes/HabilidadRepository.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import PostulacionRepository from "../../fakes/PostulacionRepository.js"
import UsuarioRepository from "../../fakes/UsuarioRepository.js"
import TipoColectivoRepository from "../../fakes/TipoColectivoRepository.js"
import ProvinciaRepository from "../../fakes/ProvinciaRepository.js"
import PaisRepository from "../../fakes/PaisRepository.js"

// App de Express solo con las rutas de mensajería: controller y services
// reales, repositorios falsos (en memoria, sin Mongo).
export default async function buildApp() {
  const notificacionRepository = new NotificacionRepository()
  const proyectoRepository = new ProyectoRepository()
  const colectivoRepository = new ColectivoRepository()
  const habilidadRepository = new HabilidadRepository()
  const personaColaboradoraRepository = new PersonaColaboradoraRepository()
  const postulacionRepository = new PostulacionRepository()

  const habilidadService = new HabilidadService(
    habilidadRepository,
    personaColaboradoraRepository,
    proyectoRepository,
  )
  const colectivoService = new ColectivoService(
    colectivoRepository,
    new TipoColectivoRepository(),
    proyectoRepository,
    new ProvinciaRepository(),
    new PaisRepository(),
    new UsuarioRepository(),
  )
  const proyectoService = new ProyectoService(
    proyectoRepository,
    colectivoRepository,
  )
  const personaColaboradoraService = new PersonaColaboradoraService(
    proyectoRepository,
    personaColaboradoraRepository,
    habilidadService,
    postulacionRepository,
    notificacionRepository,
    new UsuarioRepository(),
  )
  const perfilService = new PerfilService(
    proyectoService,
    proyectoRepository,
    habilidadService,
  )
  // El envío por medios externos no es parte de estos tests: no se despierta nada.
  const envioDeNotificaciones = { despertar: () => {} }
  const notificacionService = new NotificacionService(
    notificacionRepository,
    perfilService,
    personaColaboradoraService,
    envioDeNotificaciones,
    proyectoRepository,
    colectivoRepository,
  )
  const notificacionController = new NotificacionController(notificacionService)

  // Las rutas toman el controller de dependencias.js (el que usa Mongo).
  // Se reemplaza ese módulo por uno con nuestro controller antes de importarlas.
  jest.unstable_mockModule("../../../src/dependencias.js", () => ({
    notificacionController,
  }))
  const { default: notificacionRoutes } = await import(
    "../../../src/routes/notificacionesRoutes.js"
  )

  const app = express()
  app.use(express.json())
  app.use(notificacionRoutes)
  app.use(errorHandler)

  // Los falsos guardan en memoria (algunos en arrays estáticos): se vacían entre tests.
  const vaciarRepositorios = () => {
    notificacionRepository.notificaciones.length = 0
    proyectoRepository.deleteAll()
    colectivoRepository.deleteAll()
    habilidadRepository.deleteAll()
    personaColaboradoraRepository.deleteAll()
  }

  return {
    app,
    vaciarRepositorios,
    services: {
      colectivoService,
      proyectoService,
      perfilService,
      habilidadService,
      personaColaboradoraService,
    },
  }
}
