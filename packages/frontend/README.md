# Frontend de Código a Voluntad

Aplicación React hecha con Create React App. Usa `react-router-dom` para las rutas, `axios` para hablar con el backend, MUI para los componentes de interfaz, los íconos Lucide de `react-icons/lu` y CSS plano para ubicar las cosas en cada pantalla. El estilo visual se llama "Colectivo" y está explicado en [Estilo Colectivo](#estilo-colectivo).

## Levantar el frontend

1. Instalá las dependencias desde la raíz del repo con `npm install`.
2. Copiá `packages/frontend/.env.example` a `packages/frontend/.env`.
3. Levantá el backend (ver el README raíz).
4. Desde la raíz, corré `npm run start:frontend`. La app queda en http://localhost:3000.

Para ingresar, usá alguno de los usuarios de prueba. Están en la tabla de usuarios de prueba del README raíz. También podés crear una cuenta de persona colaboradora en http://localhost:3000/colaboradoras/nueva o la de un colectivo en http://localhost:3000/colectivos/nuevo. Después de registrarte, la app te lleva a tu perfil público o a la página de tu colectivo.

## Variables de entorno

| Variable            | Ejemplo                 | Para qué sirve                                 |
| ------------------- | ----------------------- | ---------------------------------------------- |
| `REACT_APP_API_URL` | `http://localhost:8000` | URL base del backend. La usa `service/api.js`. |

CRA lee el `.env` solo al arrancar. Si lo cambiás, reiniciá `npm run start:frontend`.

## Qué va en cada carpeta

```
src/
├── index.js          monta el tema, los avisos, el router y App
├── App.jsx           sesión y todas las rutas
├── index.css         variables CSS, base, foco visible y utilidades de layout
├── theme/            tema de MUI del estilo Colectivo (ver más abajo)
├── components/       piezas reutilizables, una carpeta por componente
├── features/         pantallas, una carpeta por tema (proyectos, auth, cuenta...)
├── service/          api.js y un <recurso>Service.js por recurso del backend
└── context/          la sesión (AuthContext) y los avisos (AvisosContext)
```

- `components/` tiene lo que usan varias pantallas. Están descriptos en [Componentes compartidos](#componentes-compartidos).
- `FilasTipoValor` edita una lista de pares tipo y valor, como las cuentas de código o los medios de contacto. Recibe las `filas` y avisa cada cambio con `alCambiar(nuevasFilas)`.
- `features/` tiene las pantallas. Un componente que solo usa una pantalla vive en la carpeta de esa pantalla, como `features/proyectos/PerfilRequerido.jsx`.
- `features/proyectos/PerfilRequerido.jsx` es la tarjeta de un perfil en la página del proyecto. La búsqueda de un perfil está abierta si el proyecto está publicado, el colectivo no la cerró (`busquedaAbierta`) y no pasó su fecha límite (`busquedaAbiertaHasta`). Abierta, muestra los cupos y, si tiene fecha límite, hasta cuándo. Cerrada o vencida, muestra "Búsqueda cerrada" y "Postularme" queda deshabilitado con el motivo abajo. Al colectivo dueño, mientras el proyecto no esté cerrado, le suma "Cerrar búsqueda" (pide confirmación con `ConfirmarAccion`), "Reabrir búsqueda" (si la fecha límite venció, también la quita), "Editar perfil" y "Quitar perfil" (también con confirmación, porque no se puede deshacer). Después de cada cambio muestra un aviso y llama a `alModificar()`, con la que `PaginaProyecto` vuelve a pedir el proyecto sin pasar por el esqueleto de carga.
- `features/proyectos/FormularioDePerfil.jsx` es el diálogo con los datos de un perfil: nombre, descripción, cantidad de horas y unidad de compromiso, modalidades de colaboración, habilidades requeridas y opcionales, límite de colaboraciones (vacío es sin límite) y fecha límite de búsqueda (vacía es sin fecha; viaja como el final de ese día en hora local). Sirve para las dos cosas: con `perfil` lo edita ("Editar perfil", en la tarjeta) y manda solo los campos que cambiaron. Sin `perfil` agrega uno nuevo ("Agregar un perfil", en la página del proyecto) y manda todos. La tabla `VALOR_PARA_EL_BACK` dice cómo viaja cada campo. Lo único que valida es que no falte lo obligatorio (tabla `MENSAJE_SI_FALTA`), y lo marca recién al intentar guardar. Las reglas del negocio las decide el backend y su mensaje se muestra dentro del diálogo, que queda abierto con los datos para corregir. Cuando el backend lo guardó avisa con `alGuardar(nombre)`.
- `features/proyectos/FormularioProyecto.jsx` tiene los datos de un proyecto (título, descripción y los dos enlaces opcionales) y no sabe si está creando o editando, igual que `FormularioColaboradora`. Recibe `datosIniciales` y devuelve con `alGuardar(datos)` los textos sin espacios de más y cada enlace vacío como `null`. Revisa que no falten el título ni la descripción y que los enlaces sean direcciones `http` o `https`, porque el backend rechaza un enlace mal escrito sin decir cuál es. Si algo no pasa la revisión, lo marca y le pasa el foco al primer campo con error. Muestra junto al botón el mensaje de `error` del backend y le pasa el foco para que se lea.
- `features/proyectos/NuevoProyecto.jsx` es la pantalla `/proyectos/nuevo`, solo para colectivos. Crea el proyecto publicado a nombre del colectivo de la sesión con `crearProyecto` y lleva a su página, donde se le agregan los perfiles. Se llega desde "Crear proyecto" en el inicio, que solo ve un colectivo con sesión.
- `features/proyectos/EditarProyecto.jsx` es la pantalla `/proyectos/:id/edicion`, solo para colectivos. Carga el proyecto, manda con `modificarProyecto` solo lo que cambió y vuelve a la página del proyecto con un aviso. A un colectivo que no es el dueño lo devuelve a la página del proyecto.
- `features/proyectos/GestionDelProyecto.jsx` son las acciones que el colectivo dueño ve en el encabezado de la página de su proyecto: "Editar proyecto", "Cerrar proyecto" (mientras esté publicado) y "Borrar proyecto". Cerrar y borrar piden confirmación con `ConfirmarAccion` y aclaran que no se pueden deshacer. Al cerrar, la página vuelve a pedir el proyecto. Al borrar, vuelve al inicio. Si el backend rechaza la acción, su mensaje queda debajo de los botones.
- `features/colaboradoras/FormularioColaboradora.jsx` tiene los datos de una persona colaboradora y no sabe si está creando o editando. Recibe `datosIniciales` y devuelve los datos con `alGuardar(datos)`. Lo que va arriba del formulario, como el email y la contraseña del registro, se pasa como `children`. Muestra junto al botón el mensaje de `error` o, si no hay error, el de `exito`, y le pasa el foco para que se lea.
- `features/colaboradoras/PaginaColaboradora.jsx` es el perfil público de una persona colaboradora, en `/colaboradoras/:id`. Al lado (o abajo, en pantallas chicas) muestra `DatosDeContacto`, la sección que pide los medios de contacto a una ruta protegida del backend. Sin sesión invita a ingresar y vuelve a la página después del login. Con sesión muestra lo que responde el backend: los medios, o el mensaje del `403` en un aviso informativo si la sesión no tiene acceso. Quién tiene acceso lo decide el backend, nunca el frontend. Desde `/mi-cuenta`, una persona colaboradora llega a su propio perfil. Si quien mira es la misma persona, la página muestra un link para editarlo.
- `features/colaboradoras/MiPerfil.jsx` es la pantalla `/mi-perfil`, donde una persona colaboradora edita su perfil. Carga el catálogo de habilidades y el perfil con `obtenerPerfilPropio(id)`, que trae también el valor de los medios de contacto, y guarda con `actualizarColaboradora(id, persona)`. Cada medio guardado viaja con su `id`, así el backend lo conserva. Al guardar recarga el perfil, para que un medio recién agregado tenga su `id` si se vuelve a guardar, y llama a `refrescarUsuario()` para que la navbar muestre el nombre nuevo. Se llega desde "Mi perfil" en la navbar, desde `/mi-cuenta` y desde el perfil público propio.
- `features/colectivos/FormularioColectivo.jsx` tiene los datos de un colectivo y no sabe si está creando o editando, igual que `FormularioColaboradora`. Recibe `datosIniciales`, los `catalogos` (`{ tipos, paises, provincias }`) y devuelve los datos con `alGuardar(datos)`. La ubicación es opcional. La provincia se habilita al elegir un país y se borra si el país cambia. Lo único que valida es lo que el navegador ya sabe (obligatorios y largo de la descripción). El resto lo dice el backend y su mensaje se muestra junto al botón.
- `features/colectivos/RegistroColectivo.jsx` es la pantalla pública `/colectivos/nuevo`. Suma el email y la contraseña al formulario, registra con `registrarColectivo`, inicia la sesión y lleva a la página pública del colectivo con un aviso de confirmación. Se llega desde "registrá tu colectivo" en el login.
- `features/colectivos/MiColectivo.jsx` es la pantalla `/mi-colectivo`, donde un colectivo edita sus datos (no el email ni la contraseña). Carga los catálogos y el colectivo con `obtenerColectivoPropio(id)` y guarda con `actualizarColectivo(id, colectivo)`. Al guardar llama a `refrescarUsuario()` para que la navbar muestre el nombre nuevo. Se llega desde "Mi colectivo" en el menú de la cuenta, desde `/mi-cuenta` y desde la página pública propia.
- `features/colectivos/PaginaColectivo.jsx` es la página pública de un colectivo, en `/colectivos/:id`: nombre, tipo, ubicación y descripción. Si quien mira es el colectivo dueño, muestra un link para editarla.
- `features/mensajes/PaginaMensajes.jsx` es la pantalla `/mensajes`, para cualquier sesión. Los mensajes internos van en un solo sentido, del colectivo a la persona: un colectivo ve los que envió (cada uno dice "Para …") y una persona colaboradora, los que recibió ("De …"). Cada mensaje muestra el proyecto con un link, el perfil, la fecha y el contenido. Se llega desde "Mensajes" en la navbar.
- `features/busqueda/BuscarProyectos.jsx` es la pantalla `/buscar`, solo para personas colaboradoras. Los filtros son las habilidades (arrancan con las del perfil de quien busca), la modalidad de colaboración y el orden por fecha de alta. Al tocar "Buscar" los filtros pasan a la URL y de ahí sale el pedido: por eso, al volver de la página de un proyecto, el listado sigue con los mismos filtros. Cada resultado es un perfil con su proyecto y colectivo, el compromiso, las modalidades, la coincidencia (`Coincidencia`), las habilidades requeridas que faltan si es parcial, los cupos (`Cupos`) y "Ver proyecto". Sin habilidades elegidas avisa y no busca. Una combinación sin resultados muestra un `EstadoVacio`, y un filtro que el backend rechaza muestra su mensaje. La coincidencia, los cupos y el orden los resuelve el backend: `service/perfilesService.js` solo los deja listos para mostrar.
- `features/contacto/PaginaCandidatas.jsx` es la pantalla `/proyectos/:id/perfiles/:perfilId/candidatas`, solo para colectivos. Lista las personas que tienen al menos una habilidad requerida del perfil, en el orden que decide el backend: primero las de coincidencia total y, a igual nivel, las que tienen más de las opcionales. Cada tarjeta (`Candidata`) muestra la presentación, el nivel de coincidencia con el componente `Coincidencia` y solo las habilidades que coinciden con el perfil. Nunca muestra medios de contacto. Se le puede escribir a una persona con "Enviar mensaje" o seleccionar varias y usar "Enviar mensaje a las seleccionadas". `FormularioDeContacto` manda el mismo mensaje una vez por destinataria y avisa a cuántas llegó. A quién se le puede escribir lo decide el backend: si rechaza a alguien, por ejemplo porque no acepta mensajería interna, su motivo queda a la vista con el nombre de la persona. Se llega desde "Ver candidatas" en cada perfil de la página del proyecto, que solo ve el colectivo dueño mientras el proyecto no esté cerrado.
- `features/postulaciones/PaginaPostulaciones.jsx` es la pantalla `/postulaciones` de una persona colaboradora, con sus postulaciones y su estado. En las aceptadas muestra "Darme de baja": antes pide confirmación con `ConfirmarAccion` avisando que es irreversible, y al confirmar actualiza la tarjeta sin recargar la lista y lo confirma con un aviso. Si el backend rechaza la baja, muestra su mensaje en un `Alert`. Las dadas de baja dicen quién la dio ("Te diste de baja" o "Te desanotó el colectivo"). Se llega desde "Mis postulaciones" en la navbar.
- `features/postulaciones/PostulacionesPerfil.jsx` es la pantalla `/proyectos/:proyectoId/perfiles/:perfilId/postulaciones`, donde el colectivo revisa las postulaciones de un perfil. Acepta o rechaza las pendientes y desanota las aceptadas ("Desanotar"), siempre con `ConfirmarAccion`. Las tres acciones están en la tabla `ACCIONES` (qué función del service llaman, qué dice el diálogo y qué dice el aviso). Después de cada una muestra el aviso y recarga la lista, porque cambian el estado, los cupos y los contactos. Si falla, cierra el diálogo y muestra el error en la tarjeta de esa postulación. Los datos de contacto y el nombre completo se ven solo en las aceptadas. Se llega desde "Revisar postulaciones" en cada perfil de la página del proyecto, que solo ve el colectivo dueño.
- `service/` es lo único que habla con el backend. Los componentes nunca importan `axios`.
- `service/proyectosService.js` tiene `buscarProyectos`, `obtenerProyecto`, `obtenerResumenDelPerfil` y `modificarPerfil(proyectoId, perfilId, cambios)`, que manda al backend solo los campos de `cambios`. Cada perfil de un proyecto trae sus habilidades como `{ id, titulo }`, `cantidadHoras`, `limiteColaboraciones` (`null` es sin límite), `busquedaAbierta` y `busquedaAbiertaHasta` (un `Date` o `null`). Para mostrar trae `compromiso` y `modalidades` como textos, y para editar, `unidadCompromiso` y `modalidadesColaboracion` con los valores del backend. Las escrituras, que el backend solo le acepta al colectivo dueño, son `crearProyecto(colectivoId, datos)` (devuelve el id), `modificarProyecto(id, cambios)`, `cerrarProyecto(id)`, `eliminarProyecto(id)`, `agregarPerfil(proyectoId, perfil)` y `eliminarPerfil(proyectoId, perfilId)`. `datos` y `cambios` de un proyecto usan los nombres del front (`enlaceSistema`, `enlaceRepositorio`) y el service los pasa a los del backend.
- `service/mensajesService.js` tiene `obtenerRecibidos(personaId)`, `obtenerEnviados(colectivoId)` y `enviarMensaje({ proyectoId, perfilId, personaId, contenido })`. Los dos listados devuelven mensajes con la forma `{ id, fecha, contenido, colectivo, destinataria, proyecto: { id, titulo }, perfil }`, donde `fecha` es un `Date`, `colectivo` y `perfil` son textos, y `destinataria` es el nombre de fantasía de la persona (solo en los enviados; en los recibidos es `null`). Si el proyecto, el perfil o el colectivo ya no existen, el texto lo dice ("Proyecto eliminado") y `proyecto.id` es `null`, así que no se muestra el link. Las candidatas de un perfil se piden con `buscarCandidatas(perfilId)`, de `colaboradorasService.js`.
- `service/postulacionesService.js` tiene los listados (`obtenerPostulacionesColaborador()` y `obtenerPostulacionesPerfil(proyectoId, perfilId)`), `crearPostulacion`, `aceptarPostulacion`, `rechazarPostulacion` y `darDeBajaPostulacion(postulacionId)`. Las postulaciones listadas traen `estado`, sus fechas y, si se dieron de baja, `fechaBaja` y `origenBaja`. `darDeBajaPostulacion` devuelve solo lo que cambia (`{ id, estado, fechaBaja, origenBaja }`), porque la respuesta del backend no trae el proyecto ni el perfil.
- `service/colectivosService.js` tiene `registrarColectivo({ email, contrasena, colectivo })`, `obtenerColectivo(id)` para la página pública (trae la `ubicacion` ya armada en un texto, o `null`), `obtenerColectivoPropio(id)` para el formulario (país y provincia como ids), `actualizarColectivo(id, colectivo)` y `obtenerCatalogosDeColectivo()`, que trae los tipos de colectivo, los países y las provincias. Al guardar, la ubicación que quedó vacía viaja como `null`.

`features/proyectos/PaginaProyecto.jsx` es la pantalla de ejemplo. Copiala cuando hagas una pantalla que carga datos.

## Agregar una pantalla nueva

El ejemplo agrega una pantalla que muestra un colectivo en `/colectivos/:id`.

1. En `src/service/colectivosService.js`, escribí una función que pida los datos y los convierta a la forma que usa la pantalla:

   ```js
   import api from "./api"

   const aColectivo = (colectivoBack) => ({
     id: colectivoBack.id,
     nombre: colectivoBack.nombre,
     descripcion: colectivoBack.descripcion,
   })

   export const obtenerColectivo = async (id) => {
     const response = await api.get(`/colectivos/${id}`)
     return aColectivo(response.data)
   }
   ```

2. Creá `src/features/colectivos/PaginaColectivo.jsx` y `PaginaColectivo.css`. Copiá la estructura de `PaginaProyecto.jsx`: estados `cargando`, `error` y los datos, un `useEffect` que llama al service, `<Cargando />` mientras carga y `<MensajeDeError />` si falla.
3. En `App.jsx`, agregá la ruta dentro de la ruta del `Layout`:

   ```jsx
   <Route path="/colectivos/:id" element={<PaginaColectivo />} />
   ```

4. Agregá un `Link` que lleve a la pantalla, en `Navbar.jsx`, en `Inicio.jsx` o en la pantalla desde donde se llega.
5. Escribí un test al lado de la pantalla, `PaginaColectivo.test.jsx` (ver más abajo).

### Cargar datos y reintentar

Cada pantalla que carga datos sigue este patrón:

```jsx
const [intento, setIntento] = useState(0)

useEffect(() => {
  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      setColectivo(await obtenerColectivo(id))
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }

  cargar()
}, [id, intento])
```

La función `cargar` vive dentro del `useEffect`, así el linter de hooks no pide agregarla a las dependencias. Para reintentar, pasale a `MensajeDeError` una función que sume uno a `intento`. El efecto depende de `intento`, así que vuelve a correr.

```jsx
<MensajeDeError mensaje={error} alReintentar={() => setIntento(intento + 1)} />
```

`mensajeDeError(error)`, de `service/api.js`, devuelve el `message` que manda el backend. Si no hubo respuesta, devuelve "No pudimos conectarnos con el servidor".

## Nombrar las rutas con sustantivos

Las URLs nombran cosas, nunca acciones.

| Bien                            | Mal                        |
| ------------------------------- | -------------------------- |
| `/proyectos/nuevo`              | `/crear-proyecto`          |
| `/proyectos/:id/edicion`        | `/proyectos/:id/editar`    |
| `/colectivos/:id/postulaciones` | `/colectivos/:id/postular` |

## Estilo Colectivo

Fondo crema, terracota como color principal, verde huerta como secundario, títulos en Fraunces y texto en Geist. Botones y chips con forma de píldora, tarjetas con bordes redondeados.

### De dónde sale cada valor

Los valores del diseño se escriben una sola vez, en `theme/tokens.js`, y de ahí llegan a MUI y al CSS plano:

```
theme/tokens.js  →  theme/theme.js (createTheme con cssVariables)
                 →  MUI publica --mui-palette-*, --mui-shape-*, --mui-shadows-*
                 →  index.css les pone nombre: --color-primario, --radio, --sombra...
                 →  el .css de cada componente usa esos nombres
```

Si cambiás un color en `tokens.js`, cambia en los componentes de MUI y en el CSS plano a la vez. En el CSS de los componentes no uses `--mui-*` ni colores sueltos: usá las variables de `index.css`.

| Grupo      | Variables de `index.css`                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Superficie | `--color-fondo`, `--color-superficie`, `--color-superficie-alt`, `--color-borde`, `--color-borde-control`                      |
| Texto      | `--color-texto`, `--color-texto-secundario`, `--color-texto-deshabilitado`, `--color-enlace`                                   |
| Marca      | `--color-primario`, `--color-primario-hover`, `--color-primario-fondo`, `--color-sobre-primario`, `--color-acento` (el verde)  |
| Estados    | `--color-exito`, `--color-advertencia`, `--color-error`, `--color-info`, cada uno con su `-fondo` suave                        |
| Tipografía | `--fuente-texto`, `--fuente-titulos`, `--texto-chico`, `--texto-mini`                                                          |
| Forma      | `--radio` (inputs, alertas), `--radio-grande` (tarjetas, diálogos), `--radio-pill`, `--borde`, `--sombra`, `--sombra-flotante` |
| Espacio    | `--espacio-1` a `--espacio-16`, en múltiplos de 4px (`--espacio-4` = 16px)                                                     |
| Layout     | `--ancho-maximo`, `--ancho-lectura`, `--ancho-formulario`, `--margen-pagina`, `--separacion-grilla`, `--alto-tactil`           |

`--color-primario-contraste`, `--color-resaltado` y `--espacio` son nombres viejos que se mantienen hasta que ninguna pantalla los use. En código nuevo usá `--color-sobre-primario`, `--color-superficie-alt` y `--espacio-2`.

### Los módulos del tema

| Archivo                  | Qué tiene                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `theme/tokens.js`        | colores, fuentes, radios y sombras. Es la fuente de verdad                                    |
| `theme/paleta.js`        | la paleta de MUI armada con los tokens, más las claves propias (`estado`, ...)                |
| `theme/tipografia.js`    | fuentes y tamaños de `h1` a `body2`                                                           |
| `theme/componentes/*.js` | cómo se ve cada componente de MUI, agrupados en base, formularios, navegación, datos y avisos |
| `theme/theme.js`         | solo junta lo anterior con `createTheme`                                                      |

Para cambiar cómo se ve un componente de MUI en toda la app, buscá su grupo en `theme/componentes/` (por ejemplo, `MuiChip` está en `datos.js`). Dentro de un override, `v(theme)` da las referencias `var(--mui-...)`.

El tema agrega estas variantes propias:

- `<Chip variant="suave" color="success | warning | error | info | default">`: fondo suave del estado y texto del color. La usan `EstadoChip`, `Cupos` y `ListaDeHabilidades`.
- `<Button variant="outlined" color="inherit">`: el botón neutro, con borde gris y fondo blanco.
- Los `Alert` `standard` usan el fondo suave de su `severity`, y `LinearProgress` es `determinate` y verde por defecto.

### Dónde va cada estilo

1. **Algo que se ve igual en toda la app** (el radio de los botones, el color de una alerta): en el tema, en `theme/componentes/`.
2. **Ubicar cosas en una pantalla** (grillas, columnas, separaciones): en el `.css` al lado del componente.
3. **Un ajuste puntual de un componente de MUI en una sola pantalla**: con una clase propia en el `.css` de la pantalla, por ejemplo `.pagina-colaboradora-avatar.MuiAvatar-root`. Gana sobre MUI sin `!important` porque `index.js` usa `StyledEngineProvider injectFirst`.

No uses `sx` ni `style` para estilos. La única excepción es un valor que sale del tema, como `sx={{ boxShadow: 8 }}`.

Reglas del CSS plano:

- Cada componente tiene su `.css` al lado: `Navbar.jsx` y `Navbar.css`. Importalo al principio del `.jsx`.
- Las clases van en kebab-case y empiezan con el nombre del componente: `pagina-proyecto`, `pagina-proyecto-estado`.
- Escribí primero el estilo para celular y agregá `@media (min-width: 768px)` o `(min-width: 1024px)` para pantallas más anchas. Son los mismos cortes que los breakpoints `md` y `lg` del tema. Usá Flexbox o Grid para ubicar las cosas.
- El estado nunca se comunica solo con color: va con texto y, si se puede, con un ícono (como en `EstadoChip`).

### Utilidades de `index.css`

| Clase                 | Para qué sirve                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `.contenedor`         | ancho máximo y márgenes laterales. Ya lo usa el `Layout`                                                                           |
| `.pagina`             | columna con separación y aire arriba y abajo, para el contenido de una pantalla                                                    |
| `.grilla-tarjetas`    | tarjetas en 1, 2 o 3 columnas según el ancho                                                                                       |
| `.layout-lateral`     | una columna en celular y, desde 1024px, barra de 280px a la izquierda. Con `.layout-lateral--derecha`, barra de 340px a la derecha |
| `.texto-lectura`      | limita un párrafo largo a un ancho cómodo de leer                                                                                  |
| `.visualmente-oculto` | texto que leen los lectores de pantalla pero no se ve                                                                              |

## Cómo cumple los lineamientos de UI

El enunciado pide justificar los requerimientos no funcionales de la interfaz. Esto es lo que hace la app para cada uno y dónde está.

**Interfaz intuitiva.** La barra de arriba muestra solo las secciones del rol que tiene la sesión, y lo de la cuenta está en un menú aparte (`components/navbar`). Las pantallas que cuelgan de un proyecto llevan migas para volver (`components/migas`). Desde el inicio se llega a un proyecto en un clic y a postularse en dos. Las URLs son sustantivos que se pueden compartir, y los filtros de la búsqueda viajan en la URL.

**Aprendizaje rápido.** Los patrones son los de cualquier tienda online: listado de tarjetas con paginado, filtros arriba de los resultados, detalle con pestañas y formularios con el botón principal al final. Cada pantalla abre con una línea que dice para qué sirve. Cuando no hay nada para mostrar, `EstadoVacio` explica qué falta y qué hacer. Los campos con reglas llevan una ayuda abajo, como "Vacío, el perfil no tiene límite".

**Feedback visual y notificaciones.** Mientras se pide algo al backend se ve un `Skeleton` con la forma de lo que va a llegar o `Cargando` con un texto. Lo que sale bien se confirma con un aviso abajo de la pantalla (`AvisosContext`). Lo que sale mal se muestra con el mensaje del backend al lado de la acción que falló, y no desaparece solo (`MensajeDeError`, con "Reintentar" cuando se puede). Los botones se deshabilitan mientras se envía y cambian el texto a "Guardando...". Lo que no se puede deshacer, como rechazar una postulación, darse de baja, cerrar o borrar un proyecto, pide confirmación con `ConfirmarAccion` y lo dice en el texto.

**Diseño responsive.** El CSS se escribe primero para el celular y se amplía en dos cortes, 768px y 1024px. En pantallas chicas la barra se reemplaza por un menú lateral, las grillas pasan a una columna y el formulario de perfil ocupa toda la pantalla. Los botones y los campos miden al menos 44px de alto (`--alto-tactil`) para poder tocarlos con el dedo.

**Accesibilidad.** El texto y los colores de estado tienen un contraste de 5,5 a 17 contra su fondo, por encima del 4,5 que pide WCAG AA. Todo lo que se puede enfocar muestra un anillo de foco (`:focus-visible` en `index.css`). Los campos tienen su `label`, los botones que son solo un ícono tienen `aria-label`, la barra y el menú son `nav` con nombre, la sección actual se marca con `aria-current` y los avisos y errores se anuncian con `role="status"` y `role="alert"`. Los menús y diálogos son los de MUI, que se manejan con teclado y se cierran con Escape. Los tests buscan los elementos por rol y por nombre accesible, así que un botón sin nombre rompe un test.

**Consistencia.** Colores, tipografías, radios y espacios salen de un solo lugar, `theme/tokens.js`, y llegan a MUI por el tema y al CSS por variables (ver [Estilo Colectivo](#estilo-colectivo)). Las pantallas reusan las mismas piezas de `components/`: estado de carga, error, estado vacío, confirmación, chips de estado, cupos y coincidencia. Los textos están todos en español y de vos.

## Componentes compartidos

Están en `components/`, uno por carpeta, cada uno con su `.css` y, si tiene lógica, su test.

| Componente              | Para qué sirve                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Navbar`                | barra de arriba y, en pantallas chicas, menú lateral. Muestra las secciones según el rol. El avatar y el nombre de quien tiene la sesión abren un menú con Mi perfil o Mi colectivo, Mi cuenta y Cerrar sesión |
| `Migas`                 | el camino en las pantallas de un perfil: Proyectos › proyecto › perfil › pantalla. Recibe los nombres de la pantalla, que ya pidió el proyecto                                                                 |
| `EstadoChip`            | el estado de un proyecto o una postulación (`estado` tal como lo manda el back), con color e ícono                                                                                                             |
| `Cupos`                 | los cupos de un perfil a partir de `limite` y `aceptadas`: sin límite, completo o cuántos quedan                                                                                                               |
| `Coincidencia`          | cuánto de lo que pide un perfil cubre una persona (`nivel` tal como lo manda el back: `TOTAL` o `PARCIAL`), con color e ícono                                                                                  |
| `ListaDeHabilidades`    | habilidades como chips. Con `opcionales`, con borde y sin relleno                                                                                                                                              |
| `EstadoVacio`           | lo que se muestra cuando una lista está vacía: `icono`, `titulo`, `texto` y una `accion` opcional (`{ etiqueta, a }`)                                                                                          |
| `ConfirmarAccion`       | diálogo de confirmación, a pantalla completa en celular. Usalo antes de cualquier acción permanente. Con `peligrosa={false}`, el botón no es rojo                                                              |
| `Cargando`              | spinner con texto, para cargas sin skeleton                                                                                                                                                                    |
| `MensajeDeError`        | error con botón "Reintentar"                                                                                                                                                                                   |
| `ValorDelMedio`         | el valor de un medio de contacto: el email como link y Telegram como "Conectado"                                                                                                                               |
| `FilasTipoValor`        | editor de una lista de pares tipo y valor                                                                                                                                                                      |
| `SelectorDeHabilidades` | las habilidades del catálogo como casillas, con `titulo`. Recibe los ids `elegidas` y avisa cada cambio con `alCambiar(nuevasElegidas)`                                                                        |

Las pantallas que cargan una lista muestran un `Skeleton` con la forma de las tarjetas mientras cargan, `EstadoVacio` si no hay nada y `MensajeDeError` si falla.

### Estado compartido con Context API

Dos contextos envuelven toda la app:

- `AuthContext` (`AuthProvider` en `App.jsx`, `useAuth()` en los componentes) guarda la sesión. Está explicado en [Marcar una ruta como privada](#marcar-una-ruta-como-privada).
- `AvisosContext` (`ProveedorDeAvisos` en `index.js`, `useAvisos()` en los componentes) muestra avisos abajo de la pantalla para confirmar que algo salió bien. El aviso sigue visible aunque la pantalla cambie o se recargue la lista:

  ```jsx
  const { mostrarAviso } = useAvisos()
  // después de que el back respondió bien
  mostrarAviso("Tu postulación fue enviada.")
  ```

  Los errores no van en un aviso: se muestran con un `Alert` al lado de la acción que falló, para que no desaparezcan solos.

## Marcar una ruta como privada

Poné la ruta dentro del `<Route element={<RutaPrivada />}>` de `App.jsx`:

```jsx
<Route element={<RutaPrivada />}>
  <Route path="/mi-cuenta" element={<MiCuenta />} />
  <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
</Route>
```

Si no hay sesión, `RutaPrivada` manda a `/login` y, después de ingresar, `Login` vuelve a la página que se había pedido.

Si la ruta es solo para un rol, pasale `rol` a `RutaPrivada`. Una sesión con otro rol vuelve al inicio:

```jsx
<Route element={<RutaPrivada rol="PERSONA_COLABORADORA" />}>
  <Route path="/mi-perfil" element={<MiPerfil />} />
</Route>
```

`RutaPrivada` es solo navegación. Lo que protege los datos es el backend, que responde `401` o `403`.

Para leer la sesión desde cualquier componente, usá `useAuth()`. Devuelve `{ usuario, login, logout, refrescarUsuario }`. `usuario` es `undefined` si no hay sesión, o `{ id, email, rol, entidad: { id, nombre } }`, con `rol` igual a `"COLECTIVO"` o `"PERSONA_COLABORADORA"`. `refrescarUsuario()` vuelve a pedir el usuario al backend y lo guarda en la sesión, con el mismo token. Usalo después de cambiar algo que se ve en la sesión, como el nombre de fantasía.

`service/api.js` agrega el token a cada pedido. Si el backend responde 401, la sesión se cierra sola y las rutas privadas mandan a `/login`.

## Escribir un test

Los tests van al lado del componente, con el nombre `<Componente>.test.jsx`. Para correrlos desde la raíz, usá `npm run test:frontend`.

- Mockeá el service con `jest.mock("../../service/proyectosService")` y definí qué devuelve con `mockResolvedValue` o `mockRejectedValue`.
- Si el service exporta también constantes, como `ESTADOS_DE_POSTULACION`, mockeá solo las funciones y conservá el resto con `jest.requireActual` (ver `features/postulaciones/PaginaPostulaciones.test.jsx`).
- Si la pantalla usa `useParams`, renderizala dentro de `MemoryRouter` con `initialEntries` y una `Route` con el mismo `path` que en `App.jsx`.
- Si la pantalla usa `useAuth`, envolvela en `AuthProvider`.
- Buscá los elementos como los encuentra quien usa la página: por rol y nombre (`getByRole("button", { name: "Reintentar" })`) o por texto visible. Usá `findBy...` para lo que aparece después de cargar.
- Interactuá con `userEvent.type` y `userEvent.click`.

`features/proyectos/PaginaProyecto.test.jsx` y `features/auth/Login.test.jsx` son los ejemplos.
