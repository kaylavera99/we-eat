import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'we-eat',
  webDir: 'dist', 
  plugins: {
    Camera: {
      webUseInput: true,
      promptLabelHeader: "Select Source", 
      promptLabelPhoto: 'Photo Library',
      promptLabelPicture: 'Take Photo', 
      promptLabelCancel: 'Cancel'
    }
  }
};

export default config;
