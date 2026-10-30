const User = require('../src/models/User');
const datos = { nombre: 'Prueba Google', correo: 'prueba@gmail.com', consentimiento: { aceptado: true, fecha: new Date(), versionAviso: '1.0' } };
test('solo las cuentas con identidad Firebase pueden omitir la contraseña', async () => {
  await expect(new User({ ...datos, firebaseUid: 'uid-google' }).validate()).resolves.toBeUndefined();
  await expect(new User(datos).validate()).rejects.toMatchObject({ errors: { password: expect.anything() } });
});
test('la identidad Firebase es única y permite las cuentas antiguas sin ese campo', () => {
  const indice = User.schema.indexes().find(([campos]) => campos.firebaseUid === 1);
  expect(indice[1]).toMatchObject({ unique: true, sparse: true });
});
