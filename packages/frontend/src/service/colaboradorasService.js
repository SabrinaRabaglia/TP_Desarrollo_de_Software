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

const aColaboradora = (personaBack) => ({
  id: personaBack.id,
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
})

const aMedioDeContacto = (medioBack) => ({
  id: medioBack.id,
  tipo: medioBack.tipo,
  valor: medioBack.valor,
})

export const obtenerColaboradora = async (id) => {
  const response = await api.get(`/personas-colaboradoras/${id}`)
  return aColaboradora(response.data)
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
