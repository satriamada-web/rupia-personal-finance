import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.satriamada.rupia',
  appName: 'Rupia',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

export default config
