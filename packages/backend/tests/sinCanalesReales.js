for (const variable of Object.keys(process.env)) {
  if (
    variable.startsWith("SMTP_") ||
    variable === "EMAIL_FROM" ||
    variable === "TELEGRAM_BOT_TOKEN"
  ) {
    delete process.env[variable]
  }
}
