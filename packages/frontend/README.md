# Frontend de Código a Voluntad

Aplicación React hecha con Create React App. Usa `react-router-dom` para las rutas, `axios` para hablar con el backend, MUI para los inputs, botones y avisos, `react-icons` para los íconos y CSS plano para el resto.

## Levantar el frontend

1. Instalá las dependencias desde la raíz del repo con `npm install`.
2. Copiá `packages/frontend/.env.example` a `packages/frontend/.env`.
3. Levantá el backend (ver el README raíz).
4. Desde la raíz, corré `npm run start:frontend`. La app queda en http://localhost:3000.

Para ingresar, usá alguno de los usuarios de prueba. Están en la tabla de usuarios de prueba del README raíz.

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

- `components/` tiene lo que usan varias pantallas: `Navbar`, `Cargando`, `MensajeDeError` y `ConfirmarAccion`. Usá `ConfirmarAccion` antes de cualquier acción permanente, como desanotarse de un proyecto.
- `features/` tiene las pantallas. Un componente que solo usa una pantalla vive en la carpeta de esa pantalla, como `features/proyectos/PerfilRequerido.jsx`.
- `service/` es lo único que habla con el backend. Los componentes nunca importan `axios`.

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
- No escribas colores sueltos. La paleta está en `theme.js` y MUI la publica como variables CSS, por ejemplo `var(--mui-palette-primary-main)` o `var(--mui-palette-text-secondary)`. Si cambiás un color en `theme.js`, cambia en los componentes de MUI y en el CSS plano a la vez.
- `index.css` define `--ancho-maximo`, `--espacio` y `--borde` para medidas que se repiten.

## Marcar una ruta como privada

Poné la ruta dentro del `<Route element={<RutaPrivada />}>` de `App.jsx`:

```jsx
<Route element={<RutaPrivada />}>
  <Route path="/mi-cuenta" element={<MiCuenta />} />
  <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
</Route>
```

Si no hay sesión, `RutaPrivada` manda a `/login` y, después de ingresar, `Login` vuelve a la página que se había pedido.

Para leer la sesión desde cualquier componente, usá `useAuth()`. Devuelve `{ usuario, login, logout }`. `usuario` es `undefined` si no hay sesión, o `{ id, email, rol, entidad: { id, nombre } }`, con `rol` igual a `"COLECTIVO"` o `"PERSONA_COLABORADORA"`.

`service/api.js` agrega el token a cada pedido. Si el backend responde 401, la sesión se cierra sola y las rutas privadas mandan a `/login`.

## Escribir un test

Los tests van al lado del componente, con el nombre `<Componente>.test.jsx`. Para correrlos desde la raíz, usá `npm run test:frontend`.

- Mockeá el service con `jest.mock("../../service/proyectosService")` y definí qué devuelve con `mockResolvedValue` o `mockRejectedValue`.
- Si la pantalla usa `useParams`, renderizala dentro de `MemoryRouter` con `initialEntries` y una `Route` con el mismo `path` que en `App.jsx`.
- Si la pantalla usa `useAuth`, envolvela en `AuthProvider`.
- Buscá los elementos como los encuentra quien usa la página: por rol y nombre (`getByRole("button", { name: "Reintentar" })`) o por texto visible. Usá `findBy...` para lo que aparece después de cargar.
- Interactuá con `userEvent.type` y `userEvent.click`.

`features/proyectos/PaginaProyecto.test.jsx` y `features/auth/Login.test.jsx` son los ejemplos.
