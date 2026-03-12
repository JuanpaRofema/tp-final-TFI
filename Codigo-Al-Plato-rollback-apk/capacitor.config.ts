import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'CodigoAlPlato',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '715192916995-d51mm43jn608ul829o7hprd74ejvlqf7.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;