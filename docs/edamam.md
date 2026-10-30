# Recetas con Edamam

Usa credenciales de **Recipe Search API** en `backend/.env`:

```dotenv
EDAMAM_APP_ID=
EDAMAM_APP_KEY=
```

Meal Planner y Food Database usan otras aplicaciones y permisos. El estado y el nombre del plan no se copian al archivo. Las claves no van en el frontend ni en variables `VITE_`. Reiniciar el servidor después de cambiar el `.env`.

La ruta autenticada `GET /api/recetas?q=chicken` consulta `https://api.edamam.com/api/recipes/v2` con `type=public`. Solo acepta texto de 2 a 120 caracteres. El backend devuelve hasta 20 resultados con campos permitidos, sin `_links`, URLs de paginación ni credenciales.

Desde Recetas se muestran todos los alimentos con cantidad disponible y fecha no vencida, incluidos los que no tienen fecha. Los próximos a su fecha aparecen primero; un selector permite ver solo los próximos dentro de la anticipación configurada. Los nombres repetidos se agrupan conservando el registro con fecha más próxima. No se incluyen preparaciones. Tocar un alimento llena el buscador; la consulta se realiza solo al pulsar Buscar recetas.

También permite escribir un ingrediente o platillo en español. Un vocabulario local en `backend/src/services/ingredientes.js` convierte alimentos comunes y frases específicas al inglés (por ejemplo, `pollo con arroz` → `chicken with rice`), reconoce acentos y mayúsculas y conserva las palabras desconocidas. No usa una API de traducción adicional. La respuesta incluye `consultaUsada`, visible en la app cuando cambia el texto de búsqueda. Los títulos e ingredientes de las recetas mantienen el idioma original; no se traducen párrafos o instrucciones. Se muestran las porciones y el tiempo solo si el proveedor los incluye. La preparación se abre en el sitio de la fuente original.

No se guardan resultados en MongoDB ni en almacenamiento local; las respuestas llevan `Cache-Control: no-store`. Incluye el distintivo oficial de atribución de Edamam. La app limita a una consulta cada 7 segundos por cuenta y 8 por minuto por proceso de servidor. Los límites del plan pueden ser menores; el servidor comunica los rechazos del proveedor. Antes de ejecutar varias instancias se necesita un limitador compartido.

Si el plan tiene Active User Tracking, configurar `EDAMAM_ACTIVE_USER_TRACKING=true`. En ese caso se envía un identificador opaco de la cuenta en `Edamam-Account-User`; por defecto no se envía. No activar esta opción si Edamam no la habilitó para la aplicación.

Referencias: [Recipe Search v2](https://developer.edamam.com/edamam-docs-recipe-api), [atribución](https://developer.edamam.com/attribution).
