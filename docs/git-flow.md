# Git Flow del proyecto

Usamos una versión simplificada de Git Flow. La rama `main` contiene la versión estable y desde ahí se despliega el backend. En `develop` integramos los cambios del equipo.

Para cada tarea creamos una rama desde `develop`, con un nombre como `feature/carga-de-datos`, `fix/validaciones` o `chore/configurar-ci`. Cuando terminamos, abrimos un pull request (PR) hacia `develop` para que otro integrante revise el código. Antes de integrarlo, deben pasar los tests y el linter.

Cuando tenemos una versión lista para entregar, abrimos un PR de `develop` hacia `main`.
