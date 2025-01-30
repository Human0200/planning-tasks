import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import baseConfig from './config/vite.config.base.js';

export default defineConfig({
  ...baseConfig,
  plugins: [tailwindcss()],
});
