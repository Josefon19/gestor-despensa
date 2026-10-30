# Inicio de sesión con Google en Android

## Configuración

- Proyecto Firebase: el indicado en `FIREBASE_PROJECT_ID` de `backend/.env`.
- Android: `frontend/android/app/google-services.json`, con paquete `io.ionic.starter`, cliente OAuth web y huellas SHA del certificado que firma el APK.
- Google debe estar habilitado en Firebase Authentication.
- Plugin: `@capacitor-firebase/authentication` 8.5.2, compatible con Capacitor 8. Usa el proveedor nativo `google.com` y Credential Manager.
- Biblioteca del servidor: Firebase Admin 14.5.0. La verificación de ID tokens se inicializa con projectId y comprueba los certificados públicos de Firebase. No se utilizan operaciones administrativas con credenciales de una cuenta de servicio.
- El acceso por Google se presenta en Android. Web e iOS conservan el acceso por correo y contraseña; Google en esas plataformas requiere su configuración específica.

## Flujo

1. Android abre el selector nativo de Google mediante Firebase Authentication.
2. La app obtiene un Firebase ID token (no un token OAuth de Google) y lo envía a `POST /api/auth/google`.
3. Firebase Admin comprueba el token, incluido proyecto, emisor, firma y caducidad. El servicio exige proveedor `google.com` y correo verificado.
4. Si el UID ya está vinculado, se devuelve la misma cuenta de MongoDB.
5. Si el correo coincide con una cuenta local aún no vinculada, se solicita su contraseña actual. Tras comprobarla se agrega el UID a esa misma cuenta, conservando identificador, contraseña y registros.
6. Si es una cuenta nueva, se solicita aceptación expresa del aviso. Solo después se crea en MongoDB, sin una contraseña ficticia, con UID y consentimiento.
7. El servidor devuelve el JWT de la app. Las API de despensa continúan usando ese JWT y el identificador de MongoDB.

Cerrar sesión elimina el JWT local y cierra la sesión nativa de Firebase. Cancelar el consentimiento o la vinculación no crea ni modifica cuentas de MongoDB. Firebase puede haber creado ya su identidad durante la autenticación nativa; son procesos distintos.

## Contrato de la API

`POST /api/auth/google`

```json
{
  "idToken": "Firebase ID token",
  "aceptaAviso": true,
  "passwordActual": "solo al vincular una cuenta existente"
}
```

- 200: acceso a cuenta existente o vinculación completada.
- 201: cuenta creada.
- 428 + `AVISO_REQUERIDO`: falta aceptar el aviso para una cuenta nueva.
- 409 + `VINCULAR_PASSWORD`: debe comprobarse la contraseña de la cuenta existente.
- 401 + `VINCULAR_PASSWORD`: la contraseña de vinculación no coincide.
- Otros 401: identidad no válida, caducada, no verificada o de otro proveedor.
- 503: configuración incompleta o verificación temporalmente no disponible.

No se aceptan UID, correo o nombre proporcionados por el cliente como prueba de identidad. No se reemplaza una vinculación existente por otra identidad Google.

## Comprobaciones

- `npm test` desde backend: verificación de identidades, consentimiento, vinculación, preservación del identificador y acceso local.
- `npm run test.unit -- --run` y `npm run build` desde frontend.
- `npx cap sync android` después de compilar.
- Compilar y volver a instalar el APK: un servidor con recarga en vivo no agrega por sí solo el plugin nativo.
- La prueba final con una cuenta real requiere que el usuario complete personalmente el selector y acceso de Google en un emulador con Google Play Services o dispositivo compatible.

Referencias: [Google en Firebase Android](https://firebase.google.com/docs/auth/android/google-signin), [verificación de ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [plugin Capacitor Firebase Authentication](https://capawesome.io/docs/sdks/capacitor/firebase/authentication/).
