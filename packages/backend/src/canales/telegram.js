export const canalTelegram = (token, enviarHttp = fetch) => ({
  enviar: async (valor, contenido) => {
    const respuesta = await enviarHttp(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: valor, text: contenido }),
        signal: AbortSignal.timeout(10_000),
      },
    )
    const cuerpo = await respuesta.json().catch(() => ({}))
    if (!respuesta.ok || !cuerpo.ok) {
      throw new Error(
        `Telegram respondió ${respuesta.status}: ${cuerpo.description ?? "sin detalle"}`,
      )
    }
  },
})
