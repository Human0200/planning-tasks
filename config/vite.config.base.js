import path from 'path';

export default {
  root: path.resolve(__dirname, '../src'), // Корень - src
  base: './', // Делаем пути относительными
  build: {
    outDir: path.resolve(__dirname, '../dist'), // Выходная папка для билда
    emptyOutDir: true, // Очищаем dist перед билдом
  },
  server: {
    port: 3000,
  },
};
