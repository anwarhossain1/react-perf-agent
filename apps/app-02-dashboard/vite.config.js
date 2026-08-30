import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
const here = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig({
  root: here,
  plugins: [react()],
  build: { outDir: path.join(here, 'dist'), emptyOutDir: true, sourcemap: false },
})
