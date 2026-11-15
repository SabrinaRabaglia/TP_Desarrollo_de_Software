// Vacías y no borradas: dotenv no pisa una variable que ya existe, así que
// cargar el .env después (lo hace tests/integration/mongo.js) no las repone.
for (const variable of [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "TELEGRAM_BOT_TOKEN",
]) {
  process.env[variable] = ""
}
