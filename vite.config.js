import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: path.resolve(__dirname, 'src'), // Корневая папка для разработки
  base: './', // Делаем пути относительными, чтобы работало на сервере
  build: {
    outDir: path.resolve(__dirname, 'dist'), // Ставим выходную папку ВНЕ src
    emptyOutDir: true, // Чистим dist перед билдом
  },
  server: {
    port: 3000,
  },
});
