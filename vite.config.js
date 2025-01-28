import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'src'), // Указываем папку src как корневую
  server: {
    port: 3000, // Порт для локального сервера
  },
});