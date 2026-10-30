# Alertas push de fechas

Android usa Firebase Cloud Messaging mediante `@capacitor-firebase/messaging` 8.5.2. MongoDB guarda un destino por token, vinculado a la cuenta, su anticipación y zona horaria. No se envían nombres de alimentos en la pantalla de bloqueo.

## Configuración

- Mantener `frontend/android/app/google-services.json` del mismo proyecto que el acceso con Google.
- Guardar la clave de cuenta de servicio en `backend/private/` (ignorado por Git).
- Configurar en `backend/.env`: `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS` (ruta relativa a backend), `CRON_SCHEDULE=0 8 * * *` y opcionalmente `CRON_TIMEZONE=America/Mexico_City`.
- Firebase Cloud Messaging API HTTP v1 debe estar habilitada en el proyecto y la cuenta de servicio debe poder enviar mensajes.

## Prueba en Android

1. Iniciar el servidor, abrir la app e iniciar sesión.
2. Ajustes → Activar avisos. Aceptar el permiso de Android.
3. Pulsar Enviar notificación de prueba. Hay un minuto de espera entre pruebas.
4. Con la app abierta, el listener publica inmediatamente el aviso en Android mediante `@capacitor/local-notifications`; en segundo plano, Android muestra directamente la notificación de Firebase. Al tocarla se abre Alertas de la cuenta actual. La respuesta de envío aceptado por Firebase no garantiza que el dispositivo ya lo haya recibido.
5. Guardar la anticipación deseada en Ajustes. Se actualiza el dispositivo registrado.

El servidor debe permanecer ejecutándose a la hora programada. Por defecto revisa diariamente a las 8:00 de Ciudad de México; compara las fechas usando el calendario del dispositivo. Envía un aviso si hay fechas vencidas o dentro de la anticipación, incluso el día actual. Los registros sin fecha no generan avisos. No ejecuta envíos automáticamente al arrancar el servidor.

Cada dispositivo recibe como máximo un resumen diario confirmado. Un bloqueo en MongoDB evita envíos simultáneos; si el proceso se detiene justo después de enviar y antes de guardar la confirmación, podría repetirse en una revisión posterior. Los fallos se reintentan en la siguiente revisión. El sistema operativo y la conexión determinan cuándo se entrega el mensaje.

Desactivar avisos o cerrar sesión elimina la asociación del servidor y el token nativo; si uno falla se usa el otro. Si ambos fallan, la app solicita conexión para poder desvincular el dispositivo. Las notificaciones recibidas se limpian al salir. Una cuenta nueva requiere activar sus propios avisos.

Los endpoints `/api/notificaciones/dispositivos` y `/api/notificaciones/prueba` requieren el JWT de la app. La prueba solo admite el dispositivo de esa cuenta y un mensaje fijo. Los tokens y la clave privada no se devuelven al cliente ni se registran en los logs.

Referencias: [plugin de mensajería](https://github.com/capawesome-team/capacitor-firebase/tree/main/packages/messaging), [envío con Firebase Admin](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk).
