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

export const registrarColaboradora = async ({ email, contrasena, persona }) => {
  const response = await api.post("/auth/registro/persona-colaboradora", {
    email,
    contrasena,
    persona: aPersonaBack(persona),
  })
  return response.data
}
