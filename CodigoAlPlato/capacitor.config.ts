import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'CodigoAlPlato',
  webDir: 'www',
  plugins: {
    GoogleAuth: {
      clientId: '715192916995-d51mm43jn608ul829o7hprd74ejvlqf7.apps.googleusercontent.com', 
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true
    }
  }
};

export default config;