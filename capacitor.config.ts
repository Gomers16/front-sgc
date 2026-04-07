import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.activautossgc.app',
  appName: 'Activautos',
  webDir: 'dist',
  server: {
    url: 'https://activautossgc.org',
    cleartext: false
  }
};

export default config;
