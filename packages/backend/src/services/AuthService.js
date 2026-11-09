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
  ) {
    this.usuarioRepository = usuarioRepository
    this.entidades = {
      [RolUsuario.COLECTIVO]: {
        repositorio: colectivoRepository,
        nombre: (colectivo) => colectivo.nombre,
        noEncontrada: "Colectivo no encontrado",
      },
      [RolUsuario.PERSONA_COLABORADORA]: {
        repositorio: personaColaboradoraRepository,
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

  registrar = async ({ email, contrasena, rol, entidad }) => {
    const usuario = new Usuario(email, await hashear(contrasena), rol, entidad)
    if (!(await this.buscarEntidad(usuario.rol, usuario.entidad))) {
      throw new InvalidReference(this.entidades[usuario.rol].noEncontrada)
    }
    if (await this.usuarioRepository.findByEmail(usuario.email)) {
      throw new AlreadyExists("Ya existe un usuario con ese email")
    }
    return await this.usuarioPublico(await this.usuarioRepository.save(usuario))
  }

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
