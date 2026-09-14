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
SERVER_PORT=3001
```

- **`ALLOWED_ORIGINS`**: Define los orígenes permitidos para las solicitudes CORS. Asegurate de incluir la URL donde se ejecuta tu frontend (por defecto, `http://localhost:3000` para Create React App). Cuando se haga el despliegue en nube acá se deberá incluir la URL donde se desplegó el frontend.
- **`SERVER_PORT`**: El puerto en el que se ejecutará el servidor backend (ej. `8000`).

### 3\. Ejecución de la Aplicación

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

## Tipo de colectivo y provincia

La creación y actualización de colectivos valida el tipo contra un catálogo en
memoria, precargado con `Fundación`, `Asociación barrial`, `ONG` y `Asamblea`.
El catálogo puede ampliarse desde el código con
`tipoColectivoRepository.save(new TipoColectivo("Cooperativa"))`, usando la misma
instancia inyectada en `ColectivoService`. No hay un endpoint de administración del catálogo.

La provincia es opcional y puede omitirse o ser `null`. Si se informa, debe ser
una de las 23 provincias argentinas o la Ciudad Autónoma de Buenos Aires.
Se aceptan los alias `CABA` y `Tierra del Fuego` para los nombres completos.
Las comparaciones de tipos y provincias ignoran mayúsculas, tildes y espacios
sobrantes; se conserva el texto recibido. Un valor desconocido devuelve `422`
sin guardar cambios, también en `PUT` y `PATCH`. La ciudad o barrio sigue siendo texto libre.
