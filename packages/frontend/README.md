# Frontend de Código a Voluntad

Aplicación React hecha con Create React App. Usa `react-router-dom` para las rutas, `axios` para hablar con el backend, MUI para los inputs, botones y avisos, `react-icons` para los íconos y CSS plano para el resto.

## Levantar el frontend

1. Instalá las dependencias desde la raíz del repo con `npm install`.
2. Copiá `packages/frontend/.env.example` a `packages/frontend/.env`.
3. Levantá el backend (ver el README raíz).
4. Desde la raíz, corré `npm run start:frontend`. La app queda en http://localhost:3000.

Para ingresar, usá alguno de los usuarios de prueba. Están en la tabla de usuarios de prueba del README raíz. También podés crear una cuenta de persona colaboradora en http://localhost:3000/colaboradoras/nueva. Después de registrarte, la app te lleva a tu perfil público.

## Variables de entorno

| Variable            | Ejemplo                 | Para qué sirve                                 |
| ------------------- | ----------------------- | ---------------------------------------------- |
| `REACT_APP_API_URL` | `http://localhost:8000` | URL base del backend. La usa `service/api.js`. |

CRA lee el `.env` solo al arrancar. Si lo cambiás, reiniciá `npm run start:frontend`.

## Qué va en cada carpeta

```
src/
├── index.js          monta App dentro de BrowserRouter
├── App.jsx           tema, sesión y todas las rutas
├── index.css         reset, fuente, variables CSS y foco visible
├── theme.js          paleta y tipografía del tema de MUI
├── components/       piezas reutilizables, una carpeta por componente
├── features/         pantallas, una carpeta por tema (proyectos, auth, cuenta...)
├── service/          api.js y un <recurso>Service.js por recurso del backend
└── context/          AuthContext.jsx con AuthProvider y useAuth
```

- `components/` tiene lo que usan varias pantallas: `Navbar`, `Cargando`, `MensajeDeError`, `ConfirmarAccion`, `FilasTipoValor` y `ListaDeHabilidades`. Usá `ConfirmarAccion` antes de cualquier acción permanente, como desanotarse de un proyecto.
- `ListaDeHabilidades` muestra los títulos de una lista de habilidades como etiquetas. La usan los perfiles de un proyecto y el perfil de una colaboradora.
- `FilasTipoValor` edita una lista de pares tipo y valor, como las cuentas de código o los medios de contacto. Recibe las `filas` y avisa cada cambio con `alCambiar(nuevasFilas)`.
- `features/` tiene las pantallas. Un componente que solo usa una pantalla vive en la carpeta de esa pantalla, como `features/proyectos/PerfilRequerido.jsx`.
- `features/colaboradoras/FormularioColaboradora.jsx` tiene los datos de una persona colaboradora y no sabe si está creando o editando. Recibe `datosIniciales` y devuelve los datos con `alGuardar(datos)`. Lo que va arriba del formulario, como el email y la contraseña del registro, se pasa como `children`. Muestra junto al botón el mensaje de `error` o, si no hay error, el de `exito`, y le pasa el foco para que se lea.
- `features/colaboradoras/PaginaColaboradora.jsx` es el perfil público de una persona colaboradora, en `/colaboradoras/:id`. Abajo muestra `DatosDeContacto`, la sección que pide los medios de contacto a una ruta protegida del backend. Sin sesión invita a ingresar y vuelve a la página después del login. Con sesión muestra lo que responde el backend: los medios, o el mensaje del `403` en un aviso informativo si la sesión no tiene acceso. Quién tiene acceso lo decide el backend, nunca el frontend. Desde `/mi-cuenta`, una persona colaboradora llega a su propio perfil. Si quien mira es la misma persona, la página muestra un link para editarlo.
- `features/colaboradoras/MiPerfil.jsx` es la pantalla `/mi-perfil`, donde una persona colaboradora edita su perfil. Carga el catálogo de habilidades y el perfil con `obtenerPerfilPropio(id)`, que trae también el valor de los medios de contacto, y guarda con `actualizarColaboradora(id, persona)`. Cada medio guardado viaja con su `id`, así el backend lo conserva. Al guardar recarga el perfil, para que un medio recién agregado tenga su `id` si se vuelve a guardar, y llama a `refrescarUsuario()` para que la navbar muestre el nombre nuevo. Se llega desde "Mi perfil" en la navbar, desde `/mi-cuenta` y desde el perfil público propio.
- `features/mensajes/PaginaMensajes.jsx` es la pantalla `/mensajes`, para cualquier sesión. Los mensajes internos van en un solo sentido, del colectivo a la persona: un colectivo ve los que envió (cada uno dice "Para …") y una persona colaboradora, los que recibió ("De …"). Cada mensaje muestra el proyecto con un link, el perfil, la fecha y el contenido. Se llega desde "Mensajes" en la navbar.
- `features/contacto/PaginaCandidatas.jsx` es la pantalla `/proyectos/:id/perfiles/:perfilId/candidatas`, solo para colectivos. Lista las personas que tienen todas las habilidades requeridas del perfil, primero las que tienen más de las opcionales. "Contactar" abre `FormularioDeContacto`, un diálogo que envía el mensaje y, si sale bien, se cierra y deja un aviso en la página. Para quien no acepta mensajería interna el botón queda deshabilitado, con la explicación abajo. Se llega desde "Ver candidatas" en cada perfil de la página del proyecto, que solo ve el colectivo dueño mientras el proyecto no esté cerrado.
- `features/postulaciones/PaginaPostulaciones.jsx` es la pantalla `/postulaciones` de una persona colaboradora, con sus postulaciones y su estado. En las aceptadas muestra "Darme de baja": antes pide confirmación con `ConfirmarAccion` avisando que es irreversible, y al confirmar actualiza la tarjeta sin recargar la lista. Si el backend rechaza la baja, muestra su mensaje en un `Alert`. Las dadas de baja dicen quién la dio ("Te diste de baja" o "Te desanotó el colectivo"). Se llega desde "Mis postulaciones" en la navbar.
- `features/postulaciones/PostulacionesPerfil.jsx` es la pantalla `/proyectos/:proyectoId/perfiles/:perfilId/postulaciones`, donde el colectivo revisa las postulaciones de un perfil. Acepta o rechaza las pendientes y desanota las aceptadas ("Desanotar"), siempre con `ConfirmarAccion`. Las tres acciones están en la tabla `ACCIONES` (qué función del service llaman y qué dice el diálogo). Después de cada una recarga la lista; si falla, cierra el diálogo y muestra el error. Se llega desde "Revisar Postulaciones" en cada perfil de la página del proyecto.
- `service/` es lo único que habla con el backend. Los componentes nunca importan `axios`.
- `service/mensajesService.js` tiene `obtenerRecibidos(personaId)`, `obtenerEnviados(colectivoId)` y `enviarMensaje({ proyectoId, perfilId, personaId, contenido })`. Los dos listados devuelven mensajes con la forma `{ id, fecha, contenido, colectivo, destinataria, proyecto: { id, titulo }, perfil }`, donde `fecha` es un `Date`, `colectivo` y `perfil` son textos, y `destinataria` es el nombre de fantasía de la persona (solo en los enviados; en los recibidos es `null`). Si el proyecto, el perfil o el colectivo ya no existen, el texto lo dice ("Proyecto eliminado") y `proyecto.id` es `null`, así que no se muestra el link. Las candidatas de un perfil se piden con `buscarCandidatas(perfilId)`, de `colaboradorasService.js`.
- `service/postulacionesService.js` tiene los listados (`obtenerPostulacionesColaborador()` y `obtenerPostulacionesPerfil(proyectoId, perfilId)`), `crearPostulacion`, `aceptarPostulacion`, `rechazarPostulacion` y `darDeBajaPostulacion(postulacionId)`. Las postulaciones listadas traen `estado`, sus fechas y, si se dieron de baja, `fechaBaja` y `origenBaja`. `darDeBajaPostulacion` devuelve solo lo que cambia (`{ id, estado, fechaBaja, origenBaja }`), porque la respuesta del backend no trae el proyecto ni el perfil.

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

## Escribir el CSS

- Cada componente tiene su `.css` al lado: `Navbar.jsx` y `Navbar.css`. Importalo al principio del `.jsx`.
- Las clases van en kebab-case y empiezan con el nombre del componente: `pagina-proyecto`, `pagina-proyecto-estado`.
- Escribí primero el estilo para celular y agregá `@media (min-width: 768px)` para pantallas más anchas. Usá Flexbox o Grid para ubicar las cosas.
- No escribas colores ni medidas sueltas. Usá las variables de `index.css`: `--color-primario`, `--color-primario-contraste`, `--color-acento`, `--color-texto`, `--color-texto-secundario`, `--color-fondo`, `--color-superficie`, `--color-resaltado`, `--color-borde`, `--fuente`, `--radio`, `--espacio`, `--ancho-maximo`, `--ancho-formulario` y `--borde`. Si falta una, agregala ahí.
- Los colores de esas variables salen de `theme.js`: MUI los publica como `--mui-palette-*` y `index.css` les pone nombre. Si cambiás un color en `theme.js`, cambia en los componentes de MUI y en el CSS plano a la vez. No uses `--mui-*` directamente en los componentes.

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
