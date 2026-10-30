/// <reference types="@capacitor-firebase/authentication" />
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'gestor-despensa',
  webDir: 'dist',
  loggingBehavior: 'none',
  plugins: {
    FirebaseAuthentication: { skipNativeAuth: false, providers: ['google.com'] },
  },
  server: {
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
