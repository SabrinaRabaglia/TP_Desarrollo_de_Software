Este repositorio es la base para el Trabajo Práctico de la materia **Desarrollo de Software (DDS)** de la carrera **Ingeniería en Sistemas de Información** de la **UTN FRBA**. Se trata de un **monorepo** que integra una aplicación frontend con Create React App y un backend con Express, facilitando el desarrollo y la gestión de ambos proyectos en un único entorno.

## 📦 Estructura del Proyecto

El monorepo está organizado de la siguiente manera:

```
.
├── packages/
│   ├── backend/        # Servidor Express.js
│   └── frontend/       # Aplicación React (Create React App)
├── package.json        # Configuración del monorepo (root)
├── README.md           # Este archivo
└── .env.example        # Ejemplo de configuración de variables de entorno
```

## ⚙️ Paquetes

Este monorepo utiliza **`npm workspaces`** para gestionar los diferentes paquetes.

### Backend (`packages/backend`)

El backend está construido con Express.js y utiliza las siguientes dependencias:

- **`express`**: El framework web para Node.js, utilizado para construir la API.
- **`cors`**: Middleware para Express que habilita Cross-Origin Resource Sharing (CORS), necesario para permitir que el frontend acceda al backend desde un origen diferente.
- **`dotenv`**: Carga variables de entorno desde un archivo `.env` en `process.env`. Es crucial para configurar el puerto del servidor y los orígenes permitidos.

La idea es dar lo mínimo para levantar el servidor, y que durante el desarrollo del TP se vayan agregando las dependencias necesarias.

### Frontend (`packages/frontend`)

El frontend es una aplicación de React generada con Create React App.

## 🚀 Inicio Rápido

Seguí estos pasos para poner en marcha el proyecto:

### 1\. Instalación de Dependencias

Desde la raíz del monorepo, ejecutá:

```bash
npm install
```

Esto instalará todas las dependencias para la raíz y para los paquetes `frontend` y `backend`.

### 2\. Configuración de Variables de Entorno

Crea un archivo `.env` en el directorio `packages/backend`. Puedes usar el archivo `.env.example` como plantilla.

```
# packages/backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SERVER_PORT=8000
MONGODB_URI=mongodb://root:secret@localhost:27017/?authSource=admin
MONGODB_DB_NAME=codigo-a-voluntad
```

- **`ALLOWED_ORIGINS`**: Define los orígenes permitidos para las solicitudes CORS. Asegurate de incluir la URL donde se ejecuta tu frontend (por defecto, `http://localhost:3000` para Create React App). Cuando se haga el despliegue en nube acá se deberá incluir la URL donde se desplegó el frontend.
- **`SERVER_PORT`**: El puerto en el que se ejecutará el servidor backend (ej. `8000`).
- **`MONGODB_URI`**: URI de conexión a MongoDB. El `authSource=admin` va dentro de la URI porque el usuario `root` del contenedor vive en la base `admin`.
- **`MONGODB_DB_NAME`**: Nombre de la base. Mongo la crea sola con el primer documento.

#### Notificaciones por medios externos

Cuando un colectivo contacta a una persona, la notificación interna se replica por sus medios de contacto. Email y Telegram se envían de verdad si están configurados; sin configuración, y también WhatsApp y SMS, el envío se simula con un `console.log` y el servidor avisa al arrancar cuáles medios quedaron simulados.

```
# Email por SMTP (sirve cualquier proveedor: Gmail con contraseña de aplicación, Brevo, Mailtrap)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=avisos@example.com
SMTP_PASS=la-contraseña
EMAIL_FROM=avisos@example.com

# Telegram por la Bot API. El token lo da @BotFather.
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
```

- **`SMTP_HOST`**, **`SMTP_PORT`**, **`SMTP_USER`**, **`SMTP_PASS`**: el servidor SMTP. El puerto 465 usa TLS implícito; en cualquier otro, 587 por defecto, se exige STARTTLS y el envío falla si el servidor no lo ofrece. Sin `SMTP_USER` se conecta sin autenticación; con `SMTP_USER` y sin `SMTP_PASS` el servidor no arranca. Cada etapa de la conexión tiene un timeout de 10 a 15 segundos, igual que el pedido a Telegram.
- **`EMAIL_FROM`**: remitente de los correos. Si falta, se usa `SMTP_USER`.
- **`TELEGRAM_BOT_TOKEN`**: token del bot. Cada persona carga como medio de contacto `TELEGRAM` el chat id numérico que obtiene al escribirle al bot, porque la Bot API solo puede iniciar conversaciones con quienes ya le hablaron.

El envío es asíncrono. Al contactar a una persona, la notificación se guarda con un envío `PENDIENTE` por cada medio de contacto y la respuesta vuelve enseguida con `pendienteDeEnvio: true` y `mediosExternosUtilizados` vacío. Un proceso dentro del servidor reclama las notificaciones pendientes, las envía por cada canal y, si un canal falla, lo reintenta en la próxima pasada hasta agotar los intentos, momento en que el envío queda `FALLIDO`. A medida que salen, `mediosExternosUtilizados` lista los tipos por los que se replicó.

- **`NOTIFICACIONES_INTERVALO_MS`**: cada cuánto corre la pasada de envíos y cuánto espera un envío fallido antes de reintentarse. Por defecto 30000.
- **`NOTIFICACIONES_MAXIMO_INTENTOS`**: intentos por medio antes de darlo por fallido. Por defecto 5.

En producción (Azure Container Apps) se configuran una sola vez y los deploys posteriores las conservan:

```bash
az containerapp secret set --name ca-ddso-backend --resource-group rg-ddso-backend --secrets smtp-pass=<contraseña> telegram-bot-token=<token>
```

```bash
az containerapp update --name ca-ddso-backend --resource-group rg-ddso-backend --set-env-vars SMTP_HOST=smtp.example.com SMTP_PORT=587 SMTP_USER=avisos@example.com EMAIL_FROM=avisos@example.com SMTP_PASS=secretref:smtp-pass TELEGRAM_BOT_TOKEN=secretref:telegram-bot-token
```

### 3\. Levantar MongoDB

El backend necesita MongoDB para arrancar. Con Docker:

```bash
docker compose up -d mongo
```

`docker compose up --build` levanta además el backend en un contenedor, igual que en producción.

### 4\. Ejecución de la Aplicación

Podés iniciar el frontend y el backend por separado o ambos a la vez:

#### Ejecutar el Backend

```bash
npm run start:backend
```

Para el desarrollo con reinicio automático:

```bash
npm run dev:backend
```

#### Ejecutar el Frontend

```bash
npm run start:frontend
```

#### Ejecutar Ambos (Desarrollo)

Para iniciar el backend en modo `dev` y el frontend simultáneamente, usá:

```bash
npm run start:dev
```

## Código de habilidades

En `POST /habilidades` y `PUT /habilidades/:id`, el campo `codigo` debe coincidir
con el título normalizado: minúsculas, sin tildes, con grupos de caracteres distintos
de `a-z` y `0-9` reemplazados por `_`, y sin guiones bajos al principio o al final.
El resultado debe contener al menos una letra o un número. Por ejemplo,
`Programación Web / React` corresponde a `programacion_web_react`.

Si no coincide, la API responde `422` sin guardar cambios. Al cambiar el título,
se debe enviar su código correspondiente; si ese código ya pertenece a otra
habilidad, la respuesta es `409`.

## Base de datos (MongoDB)

La persistencia usa MongoDB con Mongoose, siguiendo la guía de la cátedra. Cada capa tiene una responsabilidad:

- `src/domain/`: clases de dominio puras, sin dependencias de Mongoose.
- `src/schemas/`: un Schema por entidad, vinculado a su clase con `loadClass`.
- `src/repositories/`: la única capa que conoce a Mongoose.
- `src/config/database.js`: la conexión, que se abre en `src/server.js` antes de levantar el servidor.
- `src/validations/` y `src/middlewares/validar.js`: los schemas de zod de cada recurso. Las rutas validan el body o la query con `validar(schema)` antes de llegar al controller; si no pasa, responde `400`.
- La forma pública de cada entidad la define el `toJSON` de su schema, en `src/schemas/`. Los servicios devuelven documentos (porque otros servicios también los usan) y cada controller responde `res.json(documento)`. Las reglas de exposición viven ahí: un medio de contacto nunca muestra su `valor`, una notificación lista solo los tipos de los medios usados, una colaboración anónima oculta a la persona, y un colectivo trae sus proyectos por un populate virtual.
- `src/dependencias.js`: el único lugar donde se crean los repositorios, servicios y controllers. Las rutas de `src/routes/` solo mapean cada URL a un método del controller.

### Datos iniciales (seeds)

- Al arrancar, el servidor carga los catálogos: país, las 24 provincias, los tipos de colectivo y las habilidades iniciales.
- `npm run seed:backend` carga además los datos de prueba: colectivos, proyectos (con perfiles e hitos), personas y colaboraciones.

Los dos procesos son idempotentes. Insertan lo que falta por su clave natural, nunca borran y no modifican lo que ya existe, así que se pueden correr cualquier cantidad de veces, también en producción.

### Modelado: embebido o referencia

<!-- prettier-ignore -->
| Relación | Decisión | Por qué |
|---|---|---|
| Habilidad en Perfil y Persona | Referencia | Es un catálogo compartido. Si se corrige una habilidad, el cambio se ve en todos lados. No se puede borrar una habilidad que alguien usa (`409`). |
| País y provincia en Colectivo | Referencia | Catálogos precargados y compartidos. |
| Tipo de colectivo | Nombre del catálogo (`String`) | Se valida contra la colección `tiposColectivo` y no tiene más datos que el nombre. |
| Proyecto en Colectivo | Referencia en el proyecto (`proyecto.colectivo`) | Un colectivo puede tener muchos proyectos. La lista se arma con una consulta y no se guarda en el colectivo. No se puede borrar un colectivo con proyectos (`409`). |
| Perfil en Proyecto | Embebido (`proyecto.perfiles`) | Es parte del proyecto: no existe fuera de él, se consulta junto con él y son pocos por proyecto. Cada perfil tiene su propio `_id`, que usan las rutas `/proyectos/:id/perfiles/:perfilId`. Al borrar el proyecto se borran sus perfiles. |
| Cuentas en Persona | Embebido | Relación uno a pocos, sin existencia propia fuera de la persona. |
| Medios de contacto en Persona | Embebido | Relación uno a pocos, sin existencia propia fuera de la persona. Quedan registrados pero la API no los muestra. |
| Colaboración | Colección propia con referencias a persona y proyecto | Es una relación muchos a muchos que crece con el historial. Un índice único impide inscribir dos veces a la misma persona en el mismo proyecto. |
| Notificación | Colección propia con referencias a colectivo, persona y perfil | Crece sin límite con el tiempo y se consulta por persona (su bandeja), con un índice sobre `personaColaboradora`. El perfil se guarda por id porque vive embebido en el proyecto. Guarda un envío embebido por cada medio de contacto de la persona, con su estado (`PENDIENTE`, `ENVIADO`, `FALLIDO`), intentos y último error; un proceso periódico los despacha y reintenta. Se borran junto con la persona. |

### Ids

Los ids son ObjectId de Mongo: 24 caracteres hexadecimales. Un id con otro formato, en la URL o en el body, devuelve `400`.

### Base de datos en producción

En producción la base es un cluster gratuito (M0) de MongoDB Atlas. El workflow de deploy toma la URI del secret `MONGODB_URI` del repositorio, la guarda como secret del Container App (`mongodb-uri`) y se la pasa al backend como variable de entorno. Para configurarlo por primera vez:

1. Crear el cluster M0 en Atlas y un usuario de base de datos con permiso de lectura y escritura.
2. En **Network Access**, permitir `0.0.0.0/0`. Las IPs de salida de Azure Container Apps no son fijas.
3. Copiar la URI de conexión (`mongodb+srv://usuario:password@cluster.../?retryWrites=true&w=majority`) y guardarla en GitHub, en **Settings → Secrets and variables → Actions**, como `MONGODB_URI`.

Si falta el secret, el deploy falla con un error que lo indica, antes de tocar el Container App.

## Documentación de la API (Swagger)

Con el backend corriendo, la documentación está en [`/api-docs`](http://localhost:8000/api-docs). La spec vive en `packages/backend/src/docs/swaggerSpec.json`. Al agregar o cambiar un endpoint, actualizá ahí su path, sus schemas y sus respuestas.

## Tests

- `npm run test:backend` corre todos los tests. Los de integración necesitan MongoDB levantado (`docker compose up -d mongo`).
- `npm run test:unit --workspace=backend` corre solo los unitarios, sin base de datos. Los services se prueban con los repositorios falsos de `tests/fakes/`.

En CI, el workflow de tests levanta un MongoDB como servicio.

## Tipo de colectivo y provincia

El tipo de colectivo se valida contra la colección `tiposColectivo`, precargada con `Fundación`, `Asociación barrial`, `ONG` y `Asamblea`. La comparación ignora mayúsculas, tildes y espacios sobrantes. Para ampliar el catálogo, agregá el nombre en `src/seeds/catalogos.js`: se inserta en el próximo arranque.

País y provincia son opcionales y se envían por id (el de la colección `paises` o `provincias`). La API los devuelve como `{ id, nombre }`. La ciudad o barrio sigue siendo texto libre.
