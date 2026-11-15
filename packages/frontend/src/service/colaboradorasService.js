import api from "./api"

export const TIPOS_DE_CUENTA = {
  GITHUB: "GitHub",
  GITLAB: "GitLab",
}

export const TIPOS_DE_MEDIO = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  TELEGRAM: "Telegram",
}

// Telegram no se carga a mano: se conecta desde Mi perfil con un enlace al bot.
export const TIPOS_DE_MEDIO_MANUALES = Object.fromEntries(
  Object.entries(TIPOS_DE_MEDIO).filter(([tipo]) => tipo !== "TELEGRAM"),
)

const textoOpcional = (texto) => texto.trim() || undefined

const aPersonaBack = (persona) => ({
  nombreFantasia: persona.nombreFantasia,
  nombre: textoOpcional(persona.nombre),
  apellido: textoOpcional(persona.apellido),
  pronombres: persona.pronombres
    .split(",")
    .map((pronombre) => pronombre.trim())
    .filter((pronombre) => pronombre !== ""),
  presentacion: textoOpcional(persona.presentacion),
  habilidades: persona.habilidades,
  cuentas: persona.cuentas.map((cuenta) => ({
    tipo: cuenta.tipo,
    nombreUsuario: cuenta.valor,
  })),
  mediosDeContacto: persona.mediosDeContacto,
  aceptaMensajeriaInterna: persona.aceptaMensajeriaInterna,
})

const aColaboradora = (personaBack) => {
  if (personaBack.esAnonima) {
    return {
      esAnonima: true,
    }
  }

  return {
    id: personaBack.id,
    esAnonima: false,
    nombreFantasia: personaBack.nombreFantasia,
    nombreCompleto:
      [personaBack.nombre, personaBack.apellido].filter(Boolean).join(" ") ||
      null,
    pronombres: personaBack.pronombres ?? [],
    presentacion: personaBack.presentacion ?? null,
    habilidades: personaBack.habilidades.map((habilidad) => habilidad.titulo),
    cuentas: personaBack.cuentas.map((cuenta) => ({
      tipo: cuenta.tipo,
      usuario: cuenta.nombreUsuario,
    })),
  }
}

const aMedioDeContacto = (medioBack) => ({
  id: medioBack.id,
  tipo: medioBack.tipo,
  valor: medioBack.valor,
})

const aPersonaDelFormulario = (personaBack, mediosBack) => ({
  nombreFantasia: personaBack.nombreFantasia,
  nombre: personaBack.nombre ?? "",
  apellido: personaBack.apellido ?? "",
  pronombres: (personaBack.pronombres ?? []).join(", "),
  presentacion: personaBack.presentacion ?? "",
  habilidades: personaBack.habilidades.map((habilidad) => habilidad.id),
  cuentas: personaBack.cuentas.map((cuenta) => ({
    tipo: cuenta.tipo,
    valor: cuenta.nombreUsuario,
  })),
  mediosDeContacto: mediosBack.map(aMedioDeContacto),
  aceptaMensajeriaInterna: personaBack.aceptaMensajeriaInterna,
})

export const obtenerColaboradora = async (id) => {
  const response = await api.get(`/personas-colaboradoras/${id}`)
  return aColaboradora(response.data)
}

// Personas que encajan con el perfil, de la que más encaja a la que menos
// (el orden lo decide el back).
export const buscarCandidatas = async (perfilId) => {
  const response = await api.get("/personas-colaboradoras", {
    params: { perfiles: perfilId },
  })
  // Con `perfiles`, el backend devuelve todas las candidatas en una sola
  // página: { metadata, data }.
  return response.data.data.map((personaBack) => ({
    ...aColaboradora(personaBack),
    aceptaMensajeriaInterna: personaBack.aceptaMensajeriaInterna,
  }))
}

export const obtenerColaboradoresPerfil = async (proyectoId, perfilId) => {
  const response = await api.get(
    `/proyectos/${proyectoId}/perfiles/${perfilId}/colaboradores`,
  )
  return response.data.map((persona) => aColaboradora(persona))
}

export const obtenerMediosDeContacto = async (id) => {
  const response = await api.get(
    `/personas-colaboradoras/${id}/medios-de-contacto`,
  )
  return response.data.map(aMedioDeContacto)
}

export const registrarColaboradora = async ({ email, contrasena, persona }) => {
  const response = await api.post("/auth/registro/persona-colaboradora", {
    email,
    contrasena,
    persona: aPersonaBack(persona),
  })
  return response.data
}

export const obtenerPerfilPropio = async (id) => {
  const [persona, medios] = await Promise.all([
    api.get(`/personas-colaboradoras/${id}`),
    api.get(`/personas-colaboradoras/${id}/medios-de-contacto`),
  ])
  return aPersonaDelFormulario(persona.data, medios.data)
}

export const actualizarColaboradora = async (id, persona) => {
  await api.put(`/personas-colaboradoras/${id}`, aPersonaBack(persona))
}

export const crearEnlaceDeTelegram = async (id) => {
  const response = await api.post(
    `/personas-colaboradoras/${id}/telegram/enlace`,
  )
  return { enlace: response.data.enlace, venceEn: response.data.venceEn }
}

export const eliminarMedioDeContacto = async (id, medioId) => {
  await api.delete(
    `/personas-colaboradoras/${id}/medios-de-contacto/${medioId}`,
  )
}
