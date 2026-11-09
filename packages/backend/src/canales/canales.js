import { TipoMedioContacto } from "../domain/enums/TipoMedioContacto.js"
import { canalesSimulados } from "./canalesSimulados.js"
import { canalEmailSMTP } from "./email.js"
import { canalTelegram } from "./telegram.js"

const canalesReales = {
  [TipoMedioContacto.EMAIL]: (env) =>
    env.SMTP_HOST && (env.EMAIL_FROM ?? env.SMTP_USER)
      ? canalEmailSMTP(env)
      : null,
  [TipoMedioContacto.TELEGRAM]: (env) =>
    env.TELEGRAM_BOT_TOKEN ? canalTelegram(env.TELEGRAM_BOT_TOKEN) : null,
}

export const crearCanales = (env) => {
  const canales = {}
  const simulados = []
  for (const tipo of Object.values(TipoMedioContacto)) {
    const real = canalesReales[tipo]?.(env)
    canales[tipo] = real ?? canalesSimulados[tipo]
    if (!real) {
      simulados.push(tipo)
    }
  }
  return { canales, simulados }
}
