const TIMEOUT_MS = 10_000

export const clienteTelegram = (token, enviarHttp = fetch) => {
  const llamar = async (metodo, parametros, timeoutMs = TIMEOUT_MS) => {
    const respuesta = await enviarHttp(
      `https://api.telegram.org/bot${token}/${metodo}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parametros),
        signal: AbortSignal.timeout(timeoutMs),
      },
    )
    const cuerpo = await respuesta.json().catch(() => ({}))
    if (!respuesta.ok || !cuerpo.ok) {
      throw new Error(
        `Telegram respondió ${respuesta.status}: ${cuerpo.description ?? "sin detalle"}`,
      )
    }
    return cuerpo.result
  }

  return {
    enviarMensaje: async (chatId, texto) => {
      await llamar("sendMessage", { chat_id: chatId, text: texto })
    },
    obtenerNovedades: ({ desde, esperaSeg }) =>
      llamar(
        "getUpdates",
        { offset: desde, timeout: esperaSeg, allowed_updates: ["message"] },
        esperaSeg * 1000 + TIMEOUT_MS,
      ),
    obtenerBot: () => llamar("getMe", {}),
  }
}

export const canalTelegram = (token, enviarHttp = fetch) => {
  const cliente = clienteTelegram(token, enviarHttp)
  return {
    enviar: (valor, contenido) => cliente.enviarMensaje(valor, contenido),
  }
}
