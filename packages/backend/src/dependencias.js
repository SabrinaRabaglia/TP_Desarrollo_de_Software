import CatalogoController from "./controllers/CatalogoController.js"
import ColaboracionController from "./controllers/ColaboracionController.js"
import ColectivoController from "./controllers/ColectivoController.js"
import HabilidadController from "./controllers/HabilidadController.js"
import NotificacionController from "./controllers/NotificacionController.js"
import PerfilController from "./controllers/PerfilController.js"
import PersonaColaboradoraController from "./controllers/PersonaColaboradoraController.js"
import ProyectoController from "./controllers/ProyectoController.js"
import HitoController from "./controllers/HitoController.js"

import ColaboracionRepository from "./repositories/ColaboracionRepository.js"
import ColectivoRepository from "./repositories/ColectivoRepository.js"
import HabilidadRepository from "./repositories/HabilidadRepository.js"
import NotificacionRepository from "./repositories/NotificacionRepository.js"
import PaisRepository from "./repositories/PaisRepository.js"
import PersonaColaboradoraRepository from "./repositories/PersonaColaboradoraRepository.js"
import ProvinciaRepository from "./repositories/ProvinciaRepository.js"
import ProyectoRepository from "./repositories/ProyectoRepository.js"
import TipoColectivoRepository from "./repositories/TipoColectivoRepository.js"

import CatalogoService from "./services/CatalogoService.js"
import ColaboracionService from "./services/ColaboracionService.js"
import ColectivoService from "./services/ColectivoService.js"
import HabilidadService from "./services/HabilidadService.js"
import NotificacionService from "./services/NotificacionService.js"
import HitoService from "./services/HitoService.js"

import EnvioDeNotificaciones from "./services/EnvioDeNotificaciones.js"
import { crearCanales } from "./canales/canales.js"
import PerfilService from "./services/PerfilService.js"
import PersonaColaboradoraService from "./services/PersonaColaboradoraService.js"
import ProyectoService from "./services/ProyectoService.js"

// Único lugar donde se arman las dependencias (repositorio → servicio →
// controller). Las rutas solo conocen a los controllers.

const colaboracionRepository = new ColaboracionRepository()
const colectivoRepository = new ColectivoRepository()
const habilidadRepository = new HabilidadRepository()
const notificacionRepository = new NotificacionRepository()
const paisRepository = new PaisRepository()
const personaColaboradoraRepository = new PersonaColaboradoraRepository()
const provinciaRepository = new ProvinciaRepository()
const { canales, simulados } = crearCanales(process.env)
export const mediosSimulados = simulados

const proyectoRepository = new ProyectoRepository()
const tipoColectivoRepository = new TipoColectivoRepository()

const catalogoService = new CatalogoService(paisRepository, provinciaRepository)
const habilidadService = new HabilidadService(
  habilidadRepository,
  personaColaboradoraRepository,
  proyectoRepository,
)
const colectivoService = new ColectivoService(
  colectivoRepository,
  tipoColectivoRepository,
  proyectoRepository,
  provinciaRepository,
  paisRepository,
)
const proyectoService = new ProyectoService(
  proyectoRepository,
  colectivoRepository,
  colaboracionRepository,
)
const personaColaboradoraService = new PersonaColaboradoraService(
  proyectoRepository,
  personaColaboradoraRepository,
  habilidadService,
  colaboracionRepository,
  notificacionRepository,
)
const perfilService = new PerfilService(
  proyectoService,
  proyectoRepository,
  habilidadService,
)
const colaboracionService = new ColaboracionService(
  colaboracionRepository,
  proyectoRepository,
  personaColaboradoraRepository,
)
export const envioDeNotificaciones = new EnvioDeNotificaciones(
  notificacionRepository,
  canales,
  {
    maximoDeIntentos: Number(process.env.NOTIFICACIONES_MAXIMO_INTENTOS) || 5,
    esperaEntreIntentosMs:
      Number(process.env.NOTIFICACIONES_INTERVALO_MS) || 30_000,
  },
)
const notificacionService = new NotificacionService(
  notificacionRepository,
  perfilService,
  personaColaboradoraService,
  envioDeNotificaciones,
)
const hitoService = new HitoService(proyectoService, proyectoRepository)

export const catalogoController = new CatalogoController(catalogoService)
export const colaboracionController = new ColaboracionController(
  colaboracionService,
)
export const colectivoController = new ColectivoController(colectivoService)
export const habilidadController = new HabilidadController(habilidadService)
export const notificacionController = new NotificacionController(
  notificacionService,
)
export const perfilController = new PerfilController(perfilService)
export const personaColaboradoraController = new PersonaColaboradoraController(
  personaColaboradoraService,
)
export const proyectoController = new ProyectoController(proyectoService)
export const hitoController = new HitoController(hitoService)
