# Revisión de seguridad — 29 de octubre de 2026

## Resultado y alcance

Revisión de rutas, controladores, validadores, modelos, integración Firebase/Cloudinary/Edamam, formularios, presentación React, manejo de sesión y configuración Android. No hay motor SQL, consultas SQL ni ejecución de comandos construidos desde entradas de usuario. El riesgo equivalente es la inyección NoSQL y el acceso a registros ajenos.

Las pruebas ofensivas se ejecutan contra modelos simulados, sin conectar a Atlas, sin borrar datos reales y sin llamar a servicios externos. Se consultaron únicamente los privilegios de la conexión real de Atlas, mediante `connectionStatus` (lectura de permisos). No se cambiaron permisos ni datos remotos. El resultado no es una garantía absoluta de invulnerabilidad ni una prueba de penetración de toda la infraestructura.

## Defensas verificadas o reforzadas

- Consultas con campos permitidos construidos por el servidor; nunca `find(req.body)`, `eval`, SQL concatenado o `$where` ejecutable procedente del cliente.
- Rechazo recursivo de operadores `$`, claves con puntos/corchetes y `__proto__`, `constructor` y `prototype`, incluido JSON anidado y query strings. Profundidad máxima de 10 niveles; JSON hasta 32 KiB, sin descompresión automática. No se borra silenciosamente un operador y se continúa con un filtro vacío.
- Los textos que contienen SQL se tratan como textos literales; no se intenta prohibir apóstrofes en nombres legítimos. Se prueba que `DROP DATABASE` en un nombre no se convierte en una instrucción.
- Validación de tipos, longitudes, cantidades, enumeraciones, fechas reales y de los identificadores de registro. Los campos de propietario enviados por el cliente no se usan.
- Todas las rutas de despensa, recetas y notificaciones requieren JWT válido. Se exige HS256, firma, expiración y un ID escalar de 24 caracteres hexadecimales. Se rechazan objetos, arrays, tokens sin vencimiento y otros algoritmos.
- Edición y borrado de un registro usan simultáneamente `_id` y `usuario` de la sesión; no existe una ruta de borrado de base o de todos los registros. Las bajas de dispositivos también están limitadas al propietario y a la instalación.
- Correo y nombre validados antes de consultar o calcular hashes; contraseñas de hasta 72 bytes UTF-8 para evitar truncamiento de bcrypt. La contraseña local nunca se almacena ni devuelve en claro. Login usa una comparación de coste equivalente para correos inexistentes.
- Límites por IP: API 300/minuto; login y Google comparten 40/15 minutos; registro 20/hora; fotos 20/15 minutos. No se confía en `X-Forwarded-For` recibido directamente del cliente.
- Helmet, respuestas JSON genéricas sin stack ni contenido de solicitud reflejado, respuestas de API sin caché y orígenes CORS permitidos. CORS no sustituye la autenticación: clientes como curl pueden omitir o falsificar Origin.
- Las fotos requieren autenticación, máximo 5 MiB, tipo permitido y firma binaria coherente. Para guardarlas se valida un comprobante HMAC ligado a la cuenta. No se aceptan SVG ni URLs arbitrarias como fotos del inventario.
- Edamam y Cloudinary se llaman a destinos HTTPS fijos; las credenciales del servidor no se envían al frontend. Los enlaces de recetas solo permiten HTTP/HTTPS, sin credenciales en la URL; las imágenes externas requieren HTTPS.
- El contenido de registros se presenta mediante texto escapado de React; se prueba que `<script>` y `<img onerror>` no se convierten en elementos ejecutables. Las navegaciones desde push usan una ruta fija y validan la cuenta del aviso.
- Android desactiva el backup automático de los datos de la app. No se habilitan logs del puente con tokens. La clave de Firebase Admin y el `.env` del backend están ignorados por Git; el `.env` público del frontend solo contiene la dirección de la API.

## Pendiente prioritario: permisos de Atlas

La conexión actual usa **atlasAdmin sobre admin**. Se comprobó que permite `dropDatabase` y `dropCollection`. No es necesario para esta app. Aunque una entrada de formulario no se ejecuta como comando, el robo de esta credencial permitiría daños mucho mayores.

En el proyecto de Atlas, usar **Database Access → Custom Roles** para preparar un rol de aplicación limitado a la base de este proyecto. Después, en **Database Users → Edit**, sustituir el rol administrativo del usuario usado en `DB_URI` por ese rol. No otorgar simultáneamente atlasAdmin u otro rol amplio, porque los permisos se suman. Conservar un usuario administrador separado para gestionar Atlas.

Permisos necesarios por colección real:

| Colección | Acciones de la app |
| --- | --- |
| `users` | `find`, `insert`, `update` |
| `registrodespensas` | `find`, `insert`, `update`, `remove` |
| `dispositivopushes` | `find`, `insert`, `update`, `remove` |

Para la creación automática de colecciones e índices de Mongoose, añadir `createCollection`, `createIndex` y `listIndexes` sobre esas colecciones y `listCollections` sobre la base. Si los índices y colecciones ya están provisionados, un administrador puede gestionarlos por separado y retirar los permisos de creación de la cuenta de ejecución.

No conceder `dropDatabase`, `dropCollection`, administración de usuarios/roles ni acceso a otras bases. El rol integrado **readWrite también permite eliminar colecciones**, por lo que un rol personalizado ofrece mejor ajuste. No se aplicaron cambios de acceso remotos durante esta revisión.

Un permiso `remove` permite borrar documentos de la colección autorizada si la credencial se filtra. El aislamiento por usuario lo aplica la API; este rol no convierte MongoDB en una base con permisos por cada usuario final. Proteger `.env`, mantener copias de seguridad y no compartir las credenciales con quien pruebe la app.

## Límites y pendientes adicionales

- La API del emulador usa HTTP para desarrollo. Antes de usarla en una red no confiable o publicar, desplegar detrás de HTTPS: un JWT o contraseña interceptados pueden utilizarse sin necesidad de inyección. No se cambió la dirección actual para no romper el emulador.
- CORS permite los orígenes locales de Capacitor y los servidores locales 8100/5173. Para desarrollo por IP de LAN, añadir el origen exacto (protocolo, IP y puerto) a `CORS_ORIGINS`, separado por comas, y reiniciar backend. No usar comodines. Detrás de un proxy, configurar `trust proxy` solo para el proxy real; no aceptar cualquier cabecera del cliente.
- Los limitadores usan memoria de un proceso; se reinician al reiniciar el servidor. Una instalación con múltiples servidores necesita un almacén compartido y límites en el proxy.
- El JWT dura hasta su expiración y actualmente no existe una lista de revocación del servidor. Cerrar sesión borra la copia del dispositivo; una copia previamente robada conserva su validez hasta vencer. Capacitor Preferences no equivale a un almacén cifrado para dispositivos comprometidos.
- No se verificaron configuraciones de red/IP de Atlas, backups, reglas de Firebase ni una compilación de distribución firmada. No entregar `.env`, JSON de cuenta de servicio o directorios privados en la entrega académica.

## Dependencias

Se corrigió el aviso alto de body-parser y el crítico de Vitest actualizando versiones compatibles. También se actualizaron gRPC, qs y Capacitor CLI. gRPC y qs usan overrides explícitos dentro de su versión principal; se conserva Firebase y el router de la app. `express-mongo-sanitize`, que ya no se utilizaba, se retiró: su sustituto valida sin mutar los getters de Express 5.

El último audit del backend sin dependencias de desarrollo reportó **0 vulnerabilidades conocidas**. Permanecen avisos bajos de deepmerge/Jest de pruebas y avisos de Cypress/extract-zip/uuid y React Router/Ionic en el frontend. El router usa enlaces internos constantes, no usa SSR y no recibe destinos de navegación desde formularios o push, lo que limita las rutas afectadas en esta implementación; no elimina el aviso del paquete. Cypress es una herramienta de desarrollo, no se incluye en el APK.

No se ejecutó `npm audit fix --force`, que proponía retroceder Firebase o cambiar versiones principales del router. Esos cambios requieren una migración aparte. No exponer los servidores de pruebas o desarrollo a internet. El informe de paquetes debe reevaluarse al actualizar o publicar.

## Repetir las comprobaciones

```text
cd backend
npm test -- --silent
npm audit --omit=dev

cd ../frontend
npm run test.unit -- --run
npm run build
npm audit
```

Las pruebas de `backend/tests/seguridad.test.js` incluyen operadores NoSQL, campos reservados y anidados, consultas manipuladas, IDs inválidos, SQL literal, intentos de ampliar el propietario, firma/algoritmo/claims inválidos, JSON excesivo y mal formado, fuerza bruta, suplantación de X-Forwarded-For, imágenes disfrazadas, rutas inexistentes y cabeceras. Los tests de despensa y dispositivos cubren además los filtros de propietario. El frontend comprueba presentación de texto malicioso sin HTML ejecutable.

Referencias: [seguridad de Express](https://expressjs.com/advanced/best-practice-security/), [consultas de Mongoose](https://mongoosejs.com/docs/guide.html#strictQuery), [roles integrados de MongoDB](https://www.mongodb.com/docs/manual/reference/built-in-roles/).
