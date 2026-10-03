import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// `vite build`            → demo site (index.html hero demo + viewer.html) in dist/
// `vite build --mode lib` → one self-contained ES module (three.js bundled in) in dist-lib/,
//                           ready to drop into any website with <script type="module">.
export default defineConfig(({ mode }) =>
  mode === 'lib'
    ? {
        build: {
          outDir: 'dist-lib',
          chunkSizeWarningLimit: 900,
          // lib mode keeps ES output unminified by default; this file ships straight to websites
          rolldownOptions: { output: { minify: true } },
          lib: {
            entry: resolve(import.meta.dirname, 'src/index.js'),
            formats: ['es'],
            fileName: () => 'yukizo-hero.js',
          },
        },
      }
    : {
        build: {
          chunkSizeWarningLimit: 900,
          rollupOptions: {
            input: {
              index: resolve(import.meta.dirname, 'index.html'),
              viewer: resolve(import.meta.dirname, 'viewer.html'),
            },
          },
        },
      }
);
