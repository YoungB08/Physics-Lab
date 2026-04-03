import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envDir: '../../',
  envPrefix: ['VITE_', 'CHE_DO', 'URL_'],
  plugins: [react()]
});
