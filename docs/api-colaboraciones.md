# API de colaboraciones

Las colaboraciones se mantienen en memoria, al igual que el resto de las entidades
de la entrega 1. Se pierden al reiniciar el backend.

## Inscribir a una persona

`POST /colaboraciones`, con `Content-Type: application/json`.

```json
{
  "personaColaboradoraId": "b8c65bfd-1234-4a12-8b12-abcdef123456",
  "proyectoId": "c8c65bfd-1234-4a12-8b12-abcdef123456"
}
```

Los IDs deben ser UUID de una persona y un proyecto previamente creados. La
persona debe tener al menos una de las habilidades requeridas por el proyecto;
no necesita tenerlas todas. Si el proyecto no requiere ninguna habilidad, no se
pueden registrar colaboraciones hasta que se le asigne alguna.

No se permite inscribir dos veces a la misma persona en un proyecto ni inscribir
personas en proyectos con estado `CERRADO`. Si se rechaza la inscripción, no se
guarda ni se vincula ninguna colaboración.

La respuesta exitosa es `201 Created`:

```json
{
  "fechaInscripcion": "2026-09-14T18:00:00.000Z",
  "personaColaboradora": {
    "id": "b8c65bfd-1234-4a12-8b12-abcdef123456",
    "nombreFantasia": "Ana"
  },
  "proyecto": {
    "id": "c8c65bfd-1234-4a12-8b12-abcdef123456",
    "titulo": "Plataforma comunitaria"
  }
}
```

La fecha se genera en el servidor. Las referencias a la persona y al proyecto se
resumen como en el ejemplo; no se incluyen sus listas de colaboraciones dentro
de esas referencias.

| Estado | Motivo                                                                      |
| ------ | --------------------------------------------------------------------------- |
| `400`  | Body inválido, UUID inválido, campos extra o ninguna habilidad coincidente. |
| `404`  | No existe la persona o el proyecto.                                         |
| `409`  | La persona ya colabora en ese proyecto.                                     |
| `422`  | El proyecto está cerrado.                                                   |

## Consultar colaboraciones

`GET /colaboraciones` responde `200 OK` con una lista de objetos del mismo formato
que el `POST`. Si no hay inscripciones, devuelve `[]`.

Las respuestas de personas y proyectos incluyen su lista `colaboraciones` con
este mismo formato. Los colectivos incluyen esas colaboraciones dentro de sus
proyectos. Esto permite consultar las relaciones sin referencias circulares en
el JSON.

## Cierre del proyecto

Con los endpoints actuales de `develop`, se puede actualizar un proyecto mediante
`PUT /proyectos/:id`, enviando su body completo con `estado: "CERRADO"` y la
`fechaCierre` correspondiente. Desde ese momento, las nuevas inscripciones se
rechazan; las colaboraciones existentes se conservan.
