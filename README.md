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

El frontend es una aplicación de React generada con Create React App. Usa `react-router-dom`, `axios`, MUI y `react-icons`. Las convenciones, la estructura de carpetas y los pasos para agregar una pantalla están en [`packages/frontend/README.md`](packages/frontend/README.md).

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
JWT_SECRET=cambiame-por-un-secreto-largo-y-aleatorio
JWT_EXPIRA_EN=8h
```

- **`ALLOWED_ORIGINS`**: Define los orígenes permitidos para las solicitudes CORS. Asegurate de incluir la URL donde se ejecuta tu frontend (por defecto, `http://localhost:3000` para Create React App). Cuando se haga el despliegue en nube acá se deberá incluir la URL donde se desplegó el frontend.
- **`SERVER_PORT`**: El puerto en el que se ejecutará el servidor backend (ej. `8000`).
- **`MONGODB_URI`**: URI de conexión a MongoDB. El `authSource=admin` va dentro de la URI porque el usuario `root` del contenedor vive en la base `admin`.
- **`MONGODB_DB_NAME`**: Nombre de la base. Mongo la crea sola con el primer documento.
- **`JWT_SECRET`**: secreto con el que se firman los tokens de sesión. Sin él, fuera de producción se usa un secreto fijo de desarrollo y el servidor lo avisa al arrancar. En producción (`NODE_ENV=production`, como en la imagen de Docker) el servidor no arranca sin él.
- **`JWT_EXPIRA_EN`**: cuánto dura un token, en el formato de [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken#usage) (`8h`, `30m`, `7d`). Por defecto `8h`.

En producción el workflow de deploy toma el secreto del secret `JWT_SECRET` del repositorio de GitHub, igual que hace con `MONGODB_URI`, y falla con un error claro si falta. Con `docker compose` se puede fijar con la variable `JWT_SECRET` del entorno; si no está, el compose usa un valor de desarrollo.

Para el frontend, copiá `packages/frontend/.env.example` a `packages/frontend/.env`:

```
# packages/frontend/.env
REACT_APP_API_URL=http://localhost:8000
```

- **`REACT_APP_API_URL`**: URL base del backend. Create React App la lee solo al arrancar, así que después de cambiarla reiniciá `npm run start:frontend`.

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
- **`TELEGRAM_BOT_TOKEN`**: token del bot. Con él configurado, el servidor también escucha los mensajes que recibe el bot para conectar cuentas (ver más abajo).
- **`FRONTEND_URL`**: URL pública del frontend, sin barra final (por ejemplo `http://localhost:3000`). Es opcional: si está, el aviso termina con un enlace a `<FRONTEND_URL>/mensajes`.

El aviso externo no es el texto pelado del mensaje. Dice qué colectivo escribió y por qué perfil y proyecto, copia el mensaje y aclara que por ese medio no se responde, que hay que entrar a la plataforma. El mismo texto va como cuerpo del mail y como mensaje de Telegram. Si el colectivo o el perfil ya no existen, el encabezado queda genérico ("Un colectivo te escribió en Código a Voluntad"). Lo arma `RedaccionDeAvisos`; si falla, se envía el contenido solo.

**Conectar Telegram.** La Bot API solo puede escribirle a quien ya le habló al bot, así que la persona no carga su chat id a mano. En "Mi perfil" toca "Conectar Telegram"; el frontend pide `POST /personas-colaboradoras/:id/telegram/enlace` (solo la propia persona) y recibe `{ enlace, venceEn }`, un enlace `https://t.me/<bot>?start=<código>`. La persona lo abre, toca Iniciar y el bot guarda su chat id como medio de contacto `TELEGRAM`, en reemplazo del anterior si había uno. El código está firmado con `JWT_SECRET` y vence a los 15 minutos. Para desconectarse se borra ese medio con `DELETE /personas-colaboradoras/:id/medios-de-contacto/:contactoId`. Sin `TELEGRAM_BOT_TOKEN` el enlace responde `503`.

El servidor lee los mensajes del bot con long polling (`getUpdates`), y Telegram deja que un solo proceso por bot lo haga a la vez: si dos servidores usan el mismo token, se cortan entre sí con un `409`, cada uno lo registra y reintenta a los 5 segundos, y cada mensaje lo atiende el que llegue a leerlo. Por eso usamos dos bots, cada uno con su token: uno para producción y otro para desarrollo local. Sin token, Telegram sale simulado por consola.

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

La app queda en http://localhost:3000 y le pide los datos al backend de `REACT_APP_API_URL`.

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
- La forma pública de cada entidad la define el `toJSON` de su schema, en `src/schemas/`. Los servicios devuelven documentos (porque otros servicios también los usan) y cada controller responde `res.json(documento)`. Las reglas de exposición viven ahí: un medio de contacto no muestra su `valor` (solo lo devuelve la ruta de [datos de contacto](#datos-de-contacto)), una notificación lista solo los tipos de los medios usados, una postulación anónima oculta a la persona, y un colectivo trae sus proyectos por un populate virtual.
- `src/dependencias.js`: el único lugar donde se crean los repositorios, servicios y controllers. Las rutas de `src/routes/` solo mapean cada URL a un método del controller.

### Datos iniciales (seeds)

- Al arrancar, el servidor carga los catálogos: país, las 24 provincias, los tipos de colectivo y las habilidades iniciales.
- `npm run seed:backend` carga además los datos de prueba: colectivos, proyectos (con perfiles e hitos), personas, postulaciones aceptadas, una postulación dada de baja por el colectivo y un usuario por cada colectivo y persona (ver [Usuarios de prueba](#usuarios-de-prueba)).
- Los datos de prueba incluyen el punto de partida del flujo de postulación: el proyecto "Mapa de comedores comunitarios" de Red Solidaria Sur, con el perfil Tester (requiere Testing E2E con Cypress, un solo lugar), la postulación pendiente de Pampa y a Nube, que cumple la habilidad pero todavía no se postuló.

Los dos procesos son idempotentes. Insertan lo que falta por su clave natural, nunca borran y no modifican lo que ya existe, así que se pueden correr cualquier cantidad de veces, también en producción.

Para repetir una demo del flujo de postulación, `npm run reiniciar:postulacion` lo vuelve al punto de partida: borra la postulación de Nube, deja la de Pampa pendiente y deja el perfil Tester sin lugares ocupados, con límite 1 y la búsqueda abierta. Es el único comando que borra algo, y no toca ningún otro dato.

### Migraciones

Como los seeds no modifican lo que ya existe, un cambio de schema no llega solo a los documentos viejos. Cuando hace falta, la reparación va en `src/migraciones/` y el servidor la corre al arrancar, después de los catálogos. Tienen que ser idempotentes: si no hay nada que reparar, no hacen nada.

Hoy hay una. Hasta el 8/11/2026 los medios de contacto se guardaban sin `_id`, y a las personas creadas antes de esa fecha Mongoose les inventaba uno distinto en cada lectura, así que no se les podía borrar un medio. `asignarIdsAMediosDeContacto` les asigna un id definitivo y el servidor avisa por consola cuántos reparó.

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
| Medios de contacto en Persona | Embebido | Relación uno a pocos, sin existencia propia fuera de la persona. El valor solo lo ven quienes tienen acceso (ver [Datos de contacto](#datos-de-contacto)). |
| Postulación | Colección propia con referencias a persona y perfil | Es una relación muchos a muchos que crece con el historial. El perfil se guarda por id porque vive embebido en el proyecto; al aceptarla, el perfil anota su id en `postulacionesAceptadas`, y al darla de baja lo quita. Un índice único impide que la misma persona se postule dos veces al mismo perfil, también después de una baja. |
| Notificación | Colección propia con referencias a colectivo, persona y perfil | Crece sin límite con el tiempo y se consulta por persona (su bandeja), con un índice sobre `personaColaboradora`. El perfil se guarda por id porque vive embebido en el proyecto. Guarda un envío embebido por cada medio de contacto de la persona, con su estado (`PENDIENTE`, `ENVIADO`, `FALLIDO`), intentos y último error; un proceso periódico los despacha y reintenta. Se borran junto con la persona. |

### Ids

Los ids son ObjectId de Mongo: 24 caracteres hexadecimales. Un id con otro formato, en la URL o en el body, devuelve `400`.

### Base de datos en producción

En producción la base es un cluster gratuito (M0) de MongoDB Atlas. El workflow de deploy toma la URI del secret `MONGODB_URI` del repositorio, la guarda como secret del Container App (`mongodb-uri`) y se la pasa al backend como variable de entorno. Para configurarlo por primera vez:

1. Crear el cluster M0 en Atlas y un usuario de base de datos con permiso de lectura y escritura.
2. En **Network Access**, permitir `0.0.0.0/0`. Las IPs de salida de Azure Container Apps no son fijas.
3. Copiar la URI de conexión (`mongodb+srv://usuario:password@cluster.../?retryWrites=true&w=majority`) y guardarla en GitHub, en **Settings → Secrets and variables → Actions**, como `MONGODB_URI`.

Si falta el secret, el deploy falla con un error que lo indica, antes de tocar el Container App.

## Frontend en producción

El frontend se publica en una Azure Static Web App. Con cada push a `main`, el workflow `deploy-frontend.yml` compila `packages/frontend` y sube la carpeta `build`. La URL del backend no se configura a mano: el workflow le pregunta a Azure el dominio del Container App y la pasa al build como `REACT_APP_API_URL`.

Para configurarlo por primera vez:

1. Crear la Static Web App en el portal de Azure, con plan Free y origen de despliegue **Other**.
2. Copiar su token desde **Manage deployment token** y guardarlo como secret `AZURE_STATIC_WEB_APPS_API_TOKEN` del repositorio.

Si falta el secret, el deploy falla con un error que lo indica.

Las rutas las resuelve React Router en el navegador. `packages/frontend/public/staticwebapp.config.json` le dice a Azure que devuelva `index.html` para cualquier ruta que no sea un archivo, así un enlace directo a `/mensajes` o recargar la página no dan 404.

## Autenticación

Los usuarios del sistema son colectivos o personas colaboradoras. Cada usuario tiene un email, una contraseña, un `rol` (`COLECTIVO` o `PERSONA_COLABORADORA`) y la `entidad` a la que representa. La colección es `usuarios` y la contraseña se guarda como hash scrypt; la API nunca la devuelve.

- `POST /auth/login` recibe `{ email, contrasena }` y devuelve `{ token, usuario }`. Un email inexistente y una contraseña incorrecta responden el mismo `401`.
- `POST /auth/registro/persona-colaboradora` recibe `{ email, contrasena, persona }`, donde `persona` tiene la misma forma que el body de `POST /personas-colaboradoras`. Crea la persona y su usuario y responde `201` con el usuario público, sin token. Si el email ya está usado responde `409` y no crea la persona.
- `GET /auth/me` devuelve el usuario del token enviado en `Authorization: Bearer <token>`.

El usuario público tiene esta forma, donde `nombre` es el nombre del colectivo o el nombre de fantasía de la persona:

```json
{
  "id": "…",
  "email": "huerta@colectivo.test",
  "rol": "COLECTIVO",
  "entidad": { "id": "…", "nombre": "Huerta Comunitaria Sur" }
}
```

### Proteger una ruta

Las rutas son públicas salvo las que se protegen a propósito, como la de [datos de contacto](#datos-de-contacto) y las que editan o borran a una persona colaboradora. Cada feature decide cuáles lo son con los middlewares de `src/middlewares/autenticar.js`. `autenticar` exige un token válido y deja `req.usuario = { id, rol, entidad }`; sin token o con uno inválido o vencido responde `401`. `autorizar(...roles)` va después de `autenticar` y responde `403` si el rol del usuario no está en la lista.

```js
import { autenticar, autorizar } from "../middlewares/autenticar.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"

routes.post(
  "/proyectos",
  autenticar,
  autorizar(RolUsuario.COLECTIVO),
  validar(proyectoSchema),
  proyectoController.create,
)
```

En el controller, `req.usuario.entidad` es el id del colectivo o de la persona que hace el pedido.

`autorizarEntidad(rol, parametro = "id")` también va después de `autenticar`, y deja pasar solo a la entidad dueña del recurso: el usuario tiene que tener ese rol y su `entidad` tiene que ser el id que llega en `req.params[parametro]`. Si no, responde `403`. Así solo la propia persona puede editar o borrar su perfil y sus medios de contacto:

```js
routes.put(
  "/personas-colaboradoras/:id",
  autenticar,
  validateId,
  autorizarEntidad(RolUsuario.PERSONA_COLABORADORA),
  validar(personaColaboradoraSchema),
  personaColaboradoraController.update,
)
```

Para un colectivo sería `autorizarEntidad(RolUsuario.COLECTIVO)` en `/colectivos/:id`. Al borrar una persona colaboradora también se borra su usuario, así que después no puede iniciar sesión.

### Datos de contacto

El perfil de una persona es público, pero el valor de sus medios de contacto no. `GET /personas-colaboradoras/:id/medios-de-contacto` exige token y devuelve `[{ id, tipo, valor }]` solo a la propia persona y a los colectivos con algún proyecto en el que la persona colabora (tiene una postulación aceptada), aunque la postulación sea anónima: el anonimato es hacia el público, no hacia el colectivo. Cualquier otro usuario recibe `403`, y una persona inexistente, `404`. La regla vive en `PersonaColaboradoraService.puedeVerContactoDe`.

### Búsqueda y límite de un perfil

Cada perfil tiene su propia búsqueda de colaboraciones. Nace abierta y se cierra de dos formas: el colectivo la cierra a mano (`busquedaAbierta: false`) o pasa su fecha límite (`busquedaAbiertaHasta`). Sin fecha límite queda abierta hasta que el colectivo la cierre.

- Postularse a un perfil con la búsqueda cerrada o vencida responde `409` y no crea la postulación. Lo mismo si el proyecto está cerrado.
- `limiteColaboraciones` es cuántas colaboraciones aceptadas admite el perfil. En `null` no hay límite.
- `PUT /proyectos/:id/perfiles/:perfilId` reemplaza los datos del perfil y `PATCH` cambia solo los que llegan. Ninguno de los dos toca las colaboraciones ya aceptadas.
- El límite no puede quedar por debajo de las colaboraciones aceptadas: responde `409` y dice cuántas hay. Subirlo o quitarlo siempre se puede.
- Una fecha límite nueva tiene que ser futura: si no, `422`. Un perfil con la búsqueda ya vencida se puede seguir editando mientras no se le cambie la fecha.
- Al aceptar una postulación primero se mira su estado y después el lugar. Aceptar una que ya fue rechazada responde `409` por su estado, esté o no lleno el perfil.

Las reglas viven en `Perfil` (`tieneBusquedaAbierta`, `reemplazarDatos`) y en `Postulacion.assertPendiente`.

### Desanotaciones

Una persona deja de colaborar en un perfil cuando se da de baja ella misma o cuando el colectivo del proyecto la desanota. Las dos cosas son la misma ruta, `PATCH /postulaciones/:id/baja`, sin body y con token:

<!-- prettier-ignore -->
| Quién la usa | Sobre qué postulaciones | `origenBaja` |
|---|---|---|
| La persona colaboradora | Las propias | `PERSONA_COLABORADORA` |
| El colectivo | Las de los perfiles de sus proyectos | `COLECTIVO` |

- Responde `200` con la postulación en estado `BAJA`, con su `fechaBaja` y su `origenBaja`. El perfil la quita de `postulacionesAceptadas`, así que el lugar queda libre para otra persona.
- Solo se da de baja una postulación aceptada: una pendiente, rechazada o ya dada de baja responde `409`. Un id inválido responde `400`, un pedido sin token `401`, cualquier otro usuario `403` y una postulación inexistente `404`.
- La baja es permanente: no se puede deshacer ni volver a aceptar, y la persona no puede volver a postularse a ese perfil (`409`). Puede postularse a otros perfiles del mismo proyecto.
- Al dejar de colaborar, el colectivo deja de ver sus [datos de contacto](#datos-de-contacto) (si no colabora en otro de sus proyectos) y la persona ya no figura en `GET /proyectos/:id/perfiles/:perfilId/colaboradores`.
- Los listados de postulaciones, el de la persona y el del colectivo por perfil, traen `fechaBaja` y `origenBaja` (en `null` si no hubo baja).

En el frontend, la persona se da de baja desde "Mis postulaciones" y el colectivo desanota desde "Revisar Postulaciones" de cada perfil; las dos pantallas avisan antes que es irreversible (ver [`packages/frontend/README.md`](packages/frontend/README.md)). La regla de quién puede dar la baja vive en `PostulacionService.origenDeBaja`.

### Mensajería interna

Un mensaje interno es una notificación que un colectivo le envía a una persona colaboradora por uno de los perfiles de sus proyectos. Va en un solo sentido, del colectivo a la persona, y además se replica por los medios de contacto de la persona (ver [Notificaciones por medios externos](#notificaciones-por-medios-externos)). Todas las rutas exigen token.

<!-- prettier-ignore -->
| Endpoint | Quién puede usarlo | Qué hace |
|---|---|---|
| `POST /proyectos/:id/perfiles/:perfilId/notificaciones` | El colectivo dueño del proyecto | Envía el mensaje. El body es `{ personaColaboradora, contenido }`, con hasta 4096 caracteres. Responde `201` con la notificación con ids. |
| `GET /personas-colaboradoras/:id/notificaciones` | La propia persona | Su bandeja, del más nuevo al más viejo. |
| `GET /colectivos/:id/notificaciones` | El propio colectivo | Los mensajes que envió, del más nuevo al más viejo. |

- Cualquier otro usuario recibe `403`, y un pedido sin token, `401`. Una persona colaboradora no puede enviar mensajes.
- Enviar responde `409` si la persona no acepta mensajería interna (`aceptaMensajeriaInterna`) o si el proyecto está cerrado, y `404` si el proyecto, el perfil o la persona no existen.
- Los listados devuelven nombres en lugar de ids: `colectivo: { id, nombre }`, `proyecto: { id, titulo }` y `perfil: { id, nombre }`. Si el proyecto o el perfil se borraron, ese dato viene en `null` y el mensaje se lista igual. Los enviados traen además `personaColaboradora: { id, nombreFantasia }`, sin sus medios de contacto.
- Para elegir a quién escribirle, `GET /personas-colaboradoras?perfiles=<perfilId>` devuelve las personas que encajan con el perfil, con su `aceptaMensajeriaInterna`.

En el frontend, el colectivo llega a las candidatas desde "Ver candidatas" en cada perfil de su proyecto, y cualquier sesión ve sus mensajes en `/mensajes` (ver [`packages/frontend/README.md`](packages/frontend/README.md)).

### Usuarios de prueba

`npm run seed:backend` crea un usuario por cada colectivo y cada persona de los datos de prueba. Todos tienen la contraseña `secreto123`, así que no hay que correr este seed contra una base que use gente real.

<!-- prettier-ignore -->
| Email | Rol | Entidad | Contraseña |
|---|---|---|---|
| `huerta@colectivo.test` | `COLECTIVO` | Huerta Comunitaria Sur | `secreto123` |
| `codigoabierto@colectivo.test` | `COLECTIVO` | Fundación Código Abierto | `secreto123` |
| `litoral@colectivo.test` | `COLECTIVO` | Asamblea Ambiental del Litoral | `secreto123` |
| `redsolidariasur@colectivo.test` | `COLECTIVO` | Red Solidaria Sur | `secreto123` |
| `losceibos@colectivo.test` | `COLECTIVO` | Asamblea Barrial Los Ceibos | `secreto123` |
| `raices@colectivo.test` | `COLECTIVO` | Fundación Raíces | `secreto123` |
| `anag@persona.test` | `PERSONA_COLABORADORA` | anag | `secreto123` |
| `lucho_dev@persona.test` | `PERSONA_COLABORADORA` | lucho_dev | `secreto123` |
| `sol.datos@persona.test` | `PERSONA_COLABORADORA` | sol.datos | `secreto123` |
| `anon123@persona.test` | `PERSONA_COLABORADORA` | anon123 | `secreto123` |
| `nube@persona.test` | `PERSONA_COLABORADORA` | Nube | `secreto123` |
| `pampa@persona.test` | `PERSONA_COLABORADORA` | Pampa | `secreto123` |
| `ceibo@persona.test` | `PERSONA_COLABORADORA` | Ceibo | `secreto123` |
| `hornero@persona.test` | `PERSONA_COLABORADORA` | Hornero | `secreto123` |
| `yacare@persona.test` | `PERSONA_COLABORADORA` | Yacaré | `secreto123` |
| `calden@persona.test` | `PERSONA_COLABORADORA` | Calden | `secreto123` |
| `tero@persona.test` | `PERSONA_COLABORADORA` | Tero | `secreto123` |
| `zorzal@persona.test` | `PERSONA_COLABORADORA` | Zorzal | `secreto123` |

### Obtener un token sin pasar por el front

El script `token` busca el usuario por email en la base del `.env` y escribe su token por stdout:

```bash
npm run token --workspace=backend -- huerta@colectivo.test
```

Con `-s` npm no imprime su encabezado, y la salida es solo el token:

```bash
TOKEN=$(npm run -s token --workspace=backend -- huerta@colectivo.test)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/auth/me
```

En [`/api-docs`](http://localhost:8000/api-docs), el botón **Authorize** recibe el mismo token y lo manda en las rutas protegidas.

## Documentación de la API (Swagger)

Con el backend corriendo, la documentación está en [`/api-docs`](http://localhost:8000/api-docs). La spec vive en `packages/backend/src/docs/swaggerSpec.json`. Al agregar o cambiar un endpoint, actualizá ahí su path, sus schemas y sus respuestas.

## Tests

- `npm run test:backend` corre todos los tests. Los de integración necesitan MongoDB levantado (`docker compose up -d mongo`).
- `npm run test:unit --workspace=backend` corre solo los unitarios, sin base de datos. Los services se prueban con los repositorios falsos de `tests/fakes/`.
- `npm run test:frontend` corre los tests del frontend, sin backend ni base de datos.
- `npm test` corre los del backend y después los del frontend.

En CI, el workflow de tests levanta un MongoDB como servicio.

## Tipo de colectivo y provincia

El tipo de colectivo se valida contra la colección `tiposColectivo`, precargada con `Fundación`, `Asociación barrial`, `ONG` y `Asamblea`. La comparación ignora mayúsculas, tildes y espacios sobrantes. Para ampliar el catálogo, agregá el nombre en `src/seeds/catalogos.js`: se inserta en el próximo arranque.

País y provincia son opcionales y se envían por id (el de la colección `paises` o `provincias`). La API los devuelve como `{ id, nombre }`. La ciudad o barrio sigue siendo texto libre.
