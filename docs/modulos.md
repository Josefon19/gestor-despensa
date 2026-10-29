# Módulos del Gestor Inteligente de Despensa

Inventario y preparaciones ya utilizan la API autenticada y la conexión a MongoDB Atlas definida en `backend/.env`. No es necesario cambiar las credenciales ni configurar otra conexión.

| Módulo | Ruta | Disponible | Pendiente |
| --- | --- | --- | --- |
| Inventario | `/home/inventario` | Alta, edición, eliminación confirmada, búsqueda, ubicación y fechas manuales; persistencia en Atlas por usuario | Edición de fotografías avanzadas |
| Preparaciones | `/home/preparaciones` | Porciones, recipientes, fechas y ubicación; persistencia en Atlas por usuario | Motor de conservación con fuentes revisadas |
| Recetas | `/home/recetas` | Ingredientes guardados próximos a su fecha | Edamam mediante backend |
| Guías | `/home/recetas/guias` | Estructura para conservación y recalentado | Contenido revisado |
| Alertas | `/home/alertas` | Lista derivada de los registros de Atlas | FCM y avisos de stock bajo |
| Configuración | `/home/configuracion` | Perfil, privacidad, cierre de sesión y anticipación de avisos | Acceso con Google y sincronización de preferencias entre dispositivos |

## API de despensa

Todas las rutas exigen `Authorization: Bearer <token>` del login existente.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/despensa` | `{ registros: [...] }` de la cuenta actual |
| POST | `/api/despensa` | Crea y devuelve `{ registro: ... }` con estado 201 |
| PUT | `/api/despensa/:id` | Sustituye los campos editables y devuelve `{ registro: ... }` |
| DELETE | `/api/despensa/:id` | Elimina el registro propio y devuelve `{ ok: true }` |

Campos: `tipo`, `nombre`, `cantidad`, `unidad`, `lugar`, `fechaLimite`, `fechaElaboracion`, `notas`. Las fechas son cadenas de calendario `AAAA-MM-DD`; las opcionales pueden ser vacías. El identificador lo asigna MongoDB. El propietario siempre se toma del JWT; no se acepta el del cuerpo. Edición y eliminación filtran simultáneamente por identificador y propietario. Un registro ajeno responde 404.

Se validan tipos, longitud, cantidad positiva, unidades, ubicaciones, fechas reales y orden de fechas de preparación. No se propagan operadores del cuerpo a MongoDB. La colección utiliza un índice por propietario y fecha de creación.

El semáforo solo compara fechas registradas. No calcula periodos seguros de conservación.

## Formulario Android

El modal permanece montado y se controla mediante `isOpen`. El contenido usa un contenedor `div.ion-page`, sin el componente `IonPage`: un modal no debe registrarse como otra ruta en la pila de pestañas. Se comprobó en Android que `IonPage` heredaba esa pila y recibía `ion-page-invisible`, dejando el modal vacío. Guardar espera la respuesta del servidor y después solicita el cierre normal del modal, sin desmontarlo de golpe. Si falla la petición, conserva los datos y muestra el error. Durante el envío se bloquean el cierre y el envío repetido. No se utiliza `crypto.randomUUID` en el dispositivo.

## Archivos principales

- `backend/src/models/RegistroDespensa.js`: modelo de MongoDB.
- `backend/src/validation/despensa.js`: validación y lista de campos permitidos.
- `backend/src/controllers/despensa.controller.js`: operaciones privadas.
- `frontend/src/services/despensa.ts`: cliente de la API.
- `frontend/src/modules/despensa/DespensaProvider.tsx`: carga y estado compartido confirmado por el servidor.
- `frontend/src/components/FormularioRegistro.tsx`: formulario con guardado asíncrono.

## Verificación

- Backend: `npm test`.
- Frontend: `npm run build` y `npm run test.unit -- --run`.
- Atlas real (optativo, desde backend): `node scripts/verificar-despensa.cjs`. Usa el `.env` existente, crea registros bajo un propietario aleatorio de prueba, comprueba persistencia tras reconectar y limpia exclusivamente esos registros al terminar. No crea cuentas ni modifica registros existentes.
- Android: compilar frontend, ejecutar `npx cap copy android` y volver a ejecutar o instalar la app. Reiniciar el servidor si no se está ejecutando en modo de vigilancia.

## Fechas y foto opcional

- Los formularios usan campos de fecha con etiquetas separadas para evitar superposición en Android. Nuevos alimentos y preparaciones reciben una fecha planificada a tres días.
- En Ajustes se configuran los plazos: alimentos de 1 a 30 días y preparaciones de 1 a 4 días. Cambiar estas preferencias no modifica fechas existentes. Se guardan por cuenta en este dispositivo mediante Capacitor Preferences.
- La fecha de una preparación no puede superar cuatro días desde su elaboración; el límite también se valida en la API. Son plazos de organización, no una certificación de consumo seguro.
- La foto es opcional, muestra vista previa y admite JPG, PNG o WebP de hasta 5 MB. No se sube al seleccionar: se envía al guardar. Si falla el guardado del registro después de subir la imagen, el formulario reutiliza esa subida al reintentar.
- `POST /api/despensa/foto` recibe el archivo binario autenticado. El servidor comprueba tamaño y firma de archivo, firma la petición a Cloudinary y devuelve un comprobante ligado a la cuenta. El guardado del registro verifica ese comprobante; las URLs arbitrarias no se aceptan. MongoDB almacena URL y publicId, no las credenciales ni el comprobante.
- Configuración del servidor: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en `backend/.env`. Nunca usar el secreto en variables VITE. La plantilla está en `backend/.env.example`.
- Las imágenes reemplazadas o subidas cuyo registro finalmente no se guarde permanecen en Cloudinary; no se implementó borrado automático de recursos.
- Prueba real: generar `tmp/cloudinary-prueba.png` y ejecutar desde backend `node scripts/verificar-cloudinary.cjs`. Usa una cuenta técnica efímera (sin crear usuarios), sube la imagen, verifica la referencia en Atlas y limpia exclusivamente sus propios datos de prueba.
