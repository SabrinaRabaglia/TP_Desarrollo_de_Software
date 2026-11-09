import nodemailer from "nodemailer"

export const ASUNTO = "Código a Voluntad: tenés un mensaje nuevo"

export const canalEmail = (transporte, from) => ({
  enviar: async (valor, contenido) => {
    await transporte.sendMail({
      from,
      to: valor,
      subject: ASUNTO,
      text: contenido,
    })
  },
})

export const opcionesSMTP = ({
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
}) => {
  if (SMTP_USER && !SMTP_PASS) {
    throw new Error("SMTP_USER está definido pero falta SMTP_PASS")
  }
  const port = Number(SMTP_PORT) || 587
  return {
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  }
}

export const canalEmailSMTP = (
  env,
  crearTransporte = nodemailer.createTransport,
) =>
  canalEmail(
    crearTransporte(opcionesSMTP(env)),
    env.EMAIL_FROM ?? env.SMTP_USER,
  )
