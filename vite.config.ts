import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      name: 'VueProjectTree',
      entry: fileURLToPath(new URL('./index.ts', import.meta.url)),
      formats: ['es', 'cjs', 'umd', 'iife'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        entryFileNames: `${packageJson.name}_${packageJson.version}.[format].min.js`,
        assetFileNames: `${packageJson.name}_${packageJson.version}.[ext]`,
      },
    },
  },
})
