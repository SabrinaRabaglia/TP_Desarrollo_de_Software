import Usuario from "../domain/Usuario.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"
import { coincide, hashear } from "../auth/contrasenas.js"
import { firmar } from "../auth/tokens.js"
import {
  AlreadyExists,
  CredencialesInvalidas,
  EntityNotFound,
  InvalidReference,
} from "../errors/ApplicationErrors.js"

export default class AuthService {
  constructor(
    usuarioRepository,
    colectivoRepository,
    personaColaboradoraRepository,
    colectivoService,
    personaColaboradoraService,
  ) {
    this.usuarioRepository = usuarioRepository
    this.entidades = {
      [RolUsuario.COLECTIVO]: {
        repositorio: colectivoRepository,
        servicio: colectivoService,
        nombre: (colectivo) => colectivo.nombre,
        noEncontrada: "Colectivo no encontrado",
      },
      [RolUsuario.PERSONA_COLABORADORA]: {
        repositorio: personaColaboradoraRepository,
        servicio: personaColaboradoraService,
        nombre: (persona) => persona.nombreFantasia,
        noEncontrada: "Persona colaboradora no encontrada",
      },
    }
  }

  buscarEntidad = async (rol, id) => {
    const { repositorio, nombre } = this.entidades[rol]
    const entidad = await repositorio.findById(id)
    return entidad && { id: entidad.id, nombre: nombre(entidad) }
  }

  usuarioPublico = async (usuario) => ({
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    entidad: await this.buscarEntidad(usuario.rol, String(usuario.entidad)),
  })

  validarEmailDisponible = async (email) => {
    if (
      await this.usuarioRepository.findByEmail(Usuario.normalizarEmail(email))
    ) {
      throw new AlreadyExists("Ya existe un usuario con ese email")
    }
  }

  registrar = async ({ email, contrasena, rol, entidad }) => {
    const usuario = new Usuario(email, await hashear(contrasena), rol, entidad)
    if (!(await this.buscarEntidad(usuario.rol, usuario.entidad))) {
      throw new InvalidReference(this.entidades[usuario.rol].noEncontrada)
    }
    await this.validarEmailDisponible(usuario.email)
    return await this.usuarioPublico(await this.usuarioRepository.save(usuario))
  }

  registrarConEntidad = async (rol, credenciales, datos) => {
    const { servicio } = this.entidades[rol]
    await this.validarEmailDisponible(credenciales.email)
    const creada = await servicio.create(datos)
    try {
      return await this.registrar({ ...credenciales, rol, entidad: creada.id })
    } catch (error) {
      // Mongo corre sin réplica, así que no hay transacciones: si el usuario
      // no se guarda, borramos la entidad para no dejarla huérfana.
      await servicio.delete(creada.id)
      throw error
    }
  }

  registrarPersonaColaboradora = ({ persona, ...credenciales }) =>
    this.registrarConEntidad(
      RolUsuario.PERSONA_COLABORADORA,
      credenciales,
      persona,
    )

  registrarColectivo = ({ colectivo, ...credenciales }) =>
    this.registrarConEntidad(RolUsuario.COLECTIVO, credenciales, colectivo)

  login = async (email, contrasena) => {
    const usuario = await this.usuarioRepository.findByEmail(
      Usuario.normalizarEmail(email),
    )
    if (!usuario || !(await coincide(contrasena, usuario.hashContrasena))) {
      throw new CredencialesInvalidas("Email o contraseña incorrectos")
    }
    return {
      token: firmar(usuario),
      usuario: await this.usuarioPublico(usuario),
    }
  }

  usuarioActual = async (id) => {
    const usuario = await this.usuarioRepository.findById(id)
    if (!usuario) {
      throw new EntityNotFound("Usuario no encontrado")
    }
    return await this.usuarioPublico(usuario)
  }
}
