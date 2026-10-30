jest.mock('firebase-admin/app', () => ({ getApps: jest.fn(() => []), initializeApp: jest.fn(() => ({})) }));
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
const { getAuth } = require('firebase-admin/auth');
const { verificarTokenGoogle } = require('../src/services/firebase');
beforeEach(() => { process.env.FIREBASE_PROJECT_ID = 'proyecto-prueba'; });
test.each([
  { uid: 'uid', email: 'a@b.com', email_verified: false, firebase: { sign_in_provider: 'google.com' } },
  { uid: 'uid', email: 'a@b.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
])('rechaza identidades no verificadas o de otro proveedor', async (datos) => {
  getAuth.mockReturnValue({ verifyIdToken: jest.fn().mockResolvedValue(datos) });
  await expect(verificarTokenGoogle('token')).rejects.toMatchObject({ status: 401 });
});
test('acepta Google únicamente después de verificar el token con Firebase Admin', async () => {
  const datos = { uid: 'uid', email: 'a@b.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
  const verificar = jest.fn().mockResolvedValue(datos);
  getAuth.mockReturnValue({ verifyIdToken: verificar });
  expect(await verificarTokenGoogle('token-firebase')).toEqual(datos);
  expect(verificar).toHaveBeenCalledWith('token-firebase');
});
